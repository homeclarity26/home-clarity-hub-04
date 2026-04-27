import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useWizard } from "@/contexts/WizardContext";
import { WizardNavigation } from "./WizardNavigation";
import { AIQualityGate } from "./AIQualityGate";

// Step 5 — Publish. Renders summary, the AI quality gate, and the publish
// CTA. Publishing flips reports.status='published' and every authoring
// page that is "complete" → report_pages.status='published'.

export function Step5Publish() {
  const { state, goToStep } = useWizard();
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
      // Flip the report row.
      const { error: rErr } = await supabase
        .from("reports")
        .update({ status: "published", updated_at: now })
        .eq("id", state.reportId);
      if (rErr) throw rErr;

      // Flip every "complete" report_pages row to published. Pages that are
      // still draft or reviewed stay where they are.
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
      toast({
        title: "Report published",
        description: "Your client can see the report once they receive their invite.",
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
