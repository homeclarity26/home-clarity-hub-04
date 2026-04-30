import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { pageAuthoringToBlocks, useWizard } from "@/contexts/WizardContext";
import type { ReportBlock } from "@/components/wysiwyg/types";
import { WizardNavigation } from "./WizardNavigation";
import { AIQualityGate } from "./AIQualityGate";

// Step 5 — Publish. Renders summary, the AI quality gate, and the publish
// CTA.
//
// W2.5 publish sequence:
//   1. Materialize each authored page's content into a ReportBlock[] and
//      upsert it into `report_pages.narrative` (jsonb) along with title,
//      group_name, sort_order, and the wizard's authoring status.
//   2. Build the union of every page's blocks and write it to
//      `reports.blocks_json` so PortalBlockViewer can render the full
//      report through SharedBlockRenderer.
//   3. Flip `reports.status='published'`.
//   4. Promote any pages marked "complete" to `report_pages.status='published'`.
//      This step runs AFTER step 1's upsert so the UPDATE actually matches
//      rows.
//
// Pre-W2.5 the publish handler skipped step 1 entirely, which is why
// brand-new wizard reports landed in the portal as empty.

export function Step5Publish() {
  const { state, goToStep, markPublished } = useWizard();
  const [highsOk, setHighsOk] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishedAt, setPublishedAt] = useState<string | null>(state.publishedAt);

  const summary = useMemo(() => {
    const allPages = state.tocSections.flatMap((s) => s.pages.filter((p) => p.selected));
    const counts = { draft: 0, reviewed: 0, complete: 0 };
    for (const page of allPages) {
      const status = state.authoring[page.page_key]?.status ?? "draft";
      counts[status] = (counts[status] ?? 0) + 1;
    }
    const featured = allPages.filter(
      (p) => p.is_featured || state.authoring[p.page_key]?.is_featured,
    );
    return { totalPages: allPages.length, counts, featured };
  }, [state.tocSections, state.authoring]);

  const canPublish =
    !publishing &&
    !publishedAt &&
    state.tocSections.length > 0 &&
    summary.totalPages > 0 &&
    highsOk;

  const handlePublish = async () => {
    if (!state.reportId) {
      toast({
        title: "No report yet",
        description:
          "Save earlier wizard steps before publishing. Step 1 creates the report.",
        variant: "destructive",
      });
      return;
    }
    setPublishing(true);
    try {
      const now = new Date().toISOString();
      const reportBlocks: ReportBlock[] = [];
      let blockOrder = 0;

      // Walk every selected page in TOC order. For each, build the per-page
      // ReportBlock array, upsert the report_pages row, and append the
      // page's blocks (with a heading break) to the whole-report union.
      let sectionIndex = 0;
      for (const section of state.tocSections) {
        let pageIndex = 0;
        const selectedInSection = section.pages.filter((p) => p.selected);
        if (selectedInSection.length === 0) {
          sectionIndex += 1;
          continue;
        }
        for (const page of selectedInSection) {
          const authoring =
            state.authoring[page.page_key] ?? {
              page_key: page.page_key,
              status: "draft" as const,
              is_featured: false,
              content: [],
            };
          const pageBlocks = pageAuthoringToBlocks(authoring);

          const sortOrder = sectionIndex * 100 + pageIndex;
          // Step 1 — upsert the row. onConflict on (report_id, page_key)
          // means re-publishing the same wizard run updates in place.
          const { error: upErr } = await supabase
            .from("report_pages")
            .upsert(
              {
                report_id: state.reportId,
                page_key: page.page_key,
                title: page.title,
                group_name: section.label,
                narrative: pageBlocks as never,
                status: authoring.status,
                sort_order: sortOrder,
                is_complete: authoring.status === "complete",
                updated_at: now,
              },
              { onConflict: "report_id,page_key" },
            );
          if (upErr) throw upErr;

          // Step 2 (running) — append a chapter_header + the page's blocks
          // to the union for reports.blocks_json. The header gives the
          // PortalBlockViewer all-in-one view visible page boundaries.
          reportBlocks.push({
            id:
              typeof crypto !== "undefined" &&
              typeof crypto.randomUUID === "function"
                ? crypto.randomUUID()
                : `h-${Date.now().toString(36)}-${blockOrder}`,
            type: "chapter_header",
            content: {
              title: page.title,
              chapterId: page.page_key,
            } as never,
            colSpan: 12,
            order: blockOrder++,
            createdAt: now,
            updatedAt: now,
          });
          for (const b of pageBlocks) {
            reportBlocks.push({ ...b, order: blockOrder++ });
          }

          pageIndex += 1;
        }
        sectionIndex += 1;
      }

      // Step 2 (commit) — write the whole-report blocks_json union.
      {
        const { error: rJsonErr } = await supabase
          .from("reports")
          .update({ blocks_json: reportBlocks as never, updated_at: now })
          .eq("id", state.reportId);
        if (rJsonErr) throw rJsonErr;
      }

      // Step 3 — flip the report row to published.
      {
        const { error: rErr } = await supabase
          .from("reports")
          .update({ status: "published", updated_at: now })
          .eq("id", state.reportId);
        if (rErr) throw rErr;
      }

      // Step 4 — promote complete pages to published. Runs AFTER the
      // upserts above so the UPDATE actually matches rows.
      const completePageKeys = Object.values(state.authoring)
        .filter((a) => a.status === "complete")
        .map((a) => a.page_key);
      if (completePageKeys.length > 0) {
        const { error: pErr } = await supabase
          .from("report_pages")
          .update({ status: "published", updated_at: now })
          .eq("report_id", state.reportId)
          .in("page_key", completePageKeys);
        if (pErr) throw pErr;
      }

      setPublishedAt(now);
      // Flip the wizard_drafts row to "published" so the next visit
      // doesn't surface this draft as resumable.
      void markPublished();

      if (state.propertyId) {
        const { data: prop } = await supabase
          .from("properties")
          .select("client_user_id")
          .eq("id", state.propertyId)
          .maybeSingle();
        const clientUserId = prop?.client_user_id;
        if (clientUserId) {
          const { data: clientProfile } = await supabase
            .from("profiles")
            .select("email, full_name")
            .eq("id", clientUserId)
            .maybeSingle();
          const clientEmail = clientProfile?.email;
          if (clientEmail) {
            const portalUrl = `https://homeclarityhub.com/portal/${state.propertyId}`;
            const greeting = clientProfile?.full_name ? `Hi ${clientProfile.full_name},` : "Hi,";
            void supabase.functions.invoke("send-email", {
              body: {
                to: clientEmail,
                subject: "Your Home Clarity Report is ready",
                body: `${greeting}\n\nYour Home Clarity Report is ready: ${portalUrl}\n\nLog in to your portal to review the full report.\n\nLet me know if you have any questions.\n\nAdam`,
              },
            }).catch((err) => {
              console.warn("[Step5Publish] auto-email failed", err);
            });
          }
        }
      }

      toast({
        title: "Report published",
        description:
          "Your client can see the report once they receive their invite.",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast({
        title: "Publish failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="space-y-5">
      <Card className="p-6 space-y-3">
        <div>
          <h3 className="text-base font-sans font-semibold text-foreground">
            Final review and publish
          </h3>
          <p className="text-xs font-sans text-muted-foreground mt-1">
            Confirm the AI quality gate clears, then publish. The client gets
            a magic-link email after publish.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          <SummaryStat label="Pages" value={String(summary.totalPages)} />
          <SummaryStat label="Complete" value={String(summary.counts.complete ?? 0)} />
          <SummaryStat label="Reviewed" value={String(summary.counts.reviewed ?? 0)} />
          <SummaryStat label="Draft" value={String(summary.counts.draft ?? 0)} />
        </div>
        {summary.featured.length > 0 && (
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Featured
            </div>
            <ul className="text-xs font-sans text-foreground mt-1 space-y-0.5">
              {summary.featured.map((p) => (
                <li key={p.page_key}>• {p.title}</li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      <AIQualityGate onAllHighsAcknowledged={setHighsOk} />

      {publishedAt ? (
        <Card className="p-6 flex items-start gap-3 border-emerald-600/30 bg-emerald-50/30">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" aria-hidden />
          <div>
            <h4 className="text-sm font-sans font-semibold text-foreground">
              Published
            </h4>
            <p className="text-xs font-sans text-muted-foreground mt-1">
              Report flipped to published at {new Date(publishedAt).toLocaleString()}.
            </p>
          </div>
        </Card>
      ) : (
        <div className="flex justify-end">
          <Button
            type="button"
            onClick={handlePublish}
            disabled={!canPublish}
            className="min-h-[44px]"
          >
            {publishing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden />
            ) : null}
            Publish report
          </Button>
        </div>
      )}

      <WizardNavigation
        onBack={() => goToStep("strategy")}
        helperText={
          publishedAt
            ? "Report is live. You can leave this page."
            : !highsOk
              ? "Resolve all blocking pre-publish questions to enable Publish."
              : null
        }
      />
    </div>
  );
}

interface SummaryStatProps {
  label: string;
  value: string;
}

function SummaryStat({ label, value }: SummaryStatProps) {
  return (
    <div className="rounded-md border border-border bg-background p-3">
      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="text-xl font-display text-foreground">{value}</div>
    </div>
  );
}
