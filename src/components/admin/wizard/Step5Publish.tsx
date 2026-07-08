import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  pageAuthoringToBlocks,
  useWizard,
  type IntakeFileRef,
} from "@/contexts/WizardContext";
import type { ReportBlock } from "@/components/wysiwyg/types";
import {
  buildExecutiveSummaryBlocks,
  buildPagePhotoPublish,
  buildStructuredPagePayload,
  type PublishPagePhoto,
  type StructuredPageColumns,
} from "@/lib/wizardPublishMapping";
import type { Database } from "@/integrations/supabase/types";

type ReportPageInsert = Database["public"]["Tables"]["report_pages"]["Insert"];
import { AIQualityGate } from "./AIQualityGate";
import { IntakeUploadCard } from "./IntakeUploadCard";
import { WizardStepHeader } from "./WizardShell";

// Step 5 — Publish, prototype screen 20. Renders three stat cards
// (pages authored / vision projects / systems documented), the AI quality
// gate, the "Final preview before publish" band with the rust publish CTA
// named after the client, and the "What happens when you publish" inset.
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

interface Step5PublishProps {
  /** Dev-only (QA harness): suppress the quality gate's on-mount AI call. */
  qaMode?: boolean;
}

export function Step5Publish({ qaMode = false }: Step5PublishProps) {
  const navigate = useNavigate();
  const { state, goToStep, markPublished, setIntakeUploads } = useWizard();
  const [highsOk, setHighsOk] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishedAt, setPublishedAt] = useState<string | null>(state.publishedAt);
  const [photoBannerDismissed, setPhotoBannerDismissed] = useState(false);

  const summary = useMemo(() => {
    const allPages = state.tocSections.flatMap((s) => s.pages.filter((p) => p.selected));
    const counts = { draft: 0, reviewed: 0, complete: 0 };
    let missingPhotos = 0;
    for (const page of allPages) {
      const status = state.authoring[page.page_key]?.status ?? "draft";
      counts[status] = (counts[status] ?? 0) + 1;
      const authoring = state.authoring[page.page_key];
      const content = authoring?.content ?? [];
      const hasImageBlock = content.some(
        (b: unknown) =>
          b != null &&
          typeof b === "object" &&
          "type" in b &&
          ((b as { type: string }).type === "image" ||
            (b as { type: string }).type === "photo_grid"),
      );
      // Phase 4 — Step 3 photo assignments (page images + system slots)
      // count as photos too.
      const hasAssignedPhotos =
        (authoring?.images?.length ?? 0) > 0 ||
        Object.values(authoring?.structured?.photoSlots ?? {}).some(Boolean);
      if (!hasImageBlock && !hasAssignedPhotos) missingPhotos++;
    }
    const featured = allPages.filter(
      (p) => p.is_featured || state.authoring[p.page_key]?.is_featured,
    );
    // Prototype-screen-20 stat cards: vision projects (any selected page
    // whose key reads as a vision/project page) + systems documented
    // (selected pages in the systems_appliances section).
    const visionProjects = allPages.filter(
      (p) =>
        p.page_key.toLowerCase().includes("vision") ||
        p.page_key.toLowerCase().includes("project"),
    ).length;
    const systemsDocumented = state.tocSections
      .filter((s) => s.key === "systems_appliances")
      .flatMap((s) => s.pages.filter((p) => p.selected)).length;
    return {
      totalPages: allPages.length,
      counts,
      featured,
      missingPhotos,
      visionProjects,
      systemsDocumented,
    };
  }, [state.tocSections, state.authoring]);

  // "Publish to the Caldwells"-style CTA using the real client's family
  // name (last word of the full name). Falls back to a plain label.
  const familyName = state.client.fullName.trim().split(/\s+/).pop() ?? "";
  const publishLabel = familyName
    ? `Publish to the ${familyName}${familyName.toLowerCase().endsWith("s") ? "" : "s"}`
    : "Publish report";
  const clientLabel = familyName ? `The ${familyName}s` : "Your client";

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

      // Phase 4 — migrate intake files (photos, Hover/iGUIDE PDFs) from the
      // private wizard-uploads bucket into the public report-images bucket +
      // client_files BEFORE the page loop, so the photos the consultant
      // assigned to pages in Step 3 resolve to public URLs and publish into
      // report_pages.images below. Per-file failures are non-blocking.
      const publicUrlByFileId: Record<string, string> = {};
      const photoUrlEntries: { fileId: string; url: string }[] = [];
      if (state.propertyId) {
        const allIntakeFiles = [
          ...state.intakeUploads.photos,
          ...state.intakeUploads.hover,
          ...state.intakeUploads.iguide,
        ].filter((f) => f.storage_path && f.bucket);

        for (const file of allIntakeFiles) {
          try {
            const { data: blob, error: dlErr } = await supabase.storage
              .from(file.bucket!)
              .download(file.storage_path!);
            if (dlErr || !blob) continue;

            const newPath = `${state.propertyId}/documents/${Date.now()}-${file.name}`;
            const { error: upErr } = await supabase.storage
              .from("report-images")
              .upload(newPath, blob, {
                contentType: file.mime,
                upsert: false,
              });
            if (upErr) continue;

            // Track public URLs for photos: manual Step 3 assignments
            // resolve through publicUrlByFileId; anything unassigned goes
            // to the AI auto-router after publish.
            if (file.mime.startsWith("image/")) {
              const { data: urlData } = supabase.storage
                .from("report-images")
                .getPublicUrl(newPath);
              if (urlData?.publicUrl) {
                publicUrlByFileId[file.id] = urlData.publicUrl;
                photoUrlEntries.push({ fileId: file.id, url: urlData.publicUrl });
              }
            }

            const lcName = file.name.toLowerCase();
            let category = "General";
            if (lcName.includes("hover")) category = "hover.to";
            else if (lcName.includes("iguide")) category = "iGUIDE";
            else if (file.mime.startsWith("image/")) category = "Interior Photos";

            const fileType = file.mime.startsWith("image/")
              ? "image"
              : file.mime.startsWith("audio/")
                ? "audio"
                : file.mime === "application/pdf"
                  ? "pdf"
                  : "document";

            const sizeStr =
              file.size < 1024
                ? `${file.size} B`
                : file.size < 1048576
                  ? `${(file.size / 1024).toFixed(1)} KB`
                  : `${(file.size / 1048576).toFixed(1)} MB`;

            await supabase.from("client_files").insert({
              property_id: state.propertyId,
              file_name: file.name,
              category,
              storage_path: newPath,
              file_type: fileType,
              file_size: sizeStr,
            });
          } catch (err) {
            console.warn("[Step5Publish] intake file migration failed for", file.name, err);
          }
        }
      }

      // Photos explicitly assigned in Step 3 (page images + system slots).
      // The AI auto-router only ever touches photos outside this set, and
      // never overwrites a page that carries manual assignments.
      const assignedFileIds = new Set<string>();
      for (const a of Object.values(state.authoring)) {
        for (const ref of a.images ?? []) assignedFileIds.add(ref.id);
        for (const ref of Object.values(a.structured?.photoSlots ?? {})) {
          if (ref) assignedFileIds.add(ref.id);
        }
      }
      const manuallyAssignedPageKeys = new Set<string>();

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
          const pageSeed = state.pageSeeds.find(
            (s) => s.page_key === page.page_key,
          );

          // Phase 1 structured contract: room / system / appliance / vision
          // pages publish typed blocks (room_record, system_record +
          // replacement_briefing, vision_project) plus structured columns,
          // validated through src/lib/reportPageSchemas. Generic pages
          // (information + strategy standing pages) keep the block path.
          const structuredPayload = buildStructuredPagePayload({
            page,
            sectionKey: section.key,
            sectionLabel: section.label,
            authoring,
            seed: pageSeed,
            now,
          });
          const structured: StructuredPageColumns | null =
            structuredPayload?.columns ?? null;
          // Executive Summary (generic type) still publishes structured
          // content: welcome note paragraphs + ordered top-themes list
          // from the Step 3 exec editor (Phase 5b).
          const execBlocks =
            page.page_key === "executive-summary"
              ? buildExecutiveSummaryBlocks(authoring, now)
              : null;
          const pageBlocks = structuredPayload
            ? structuredPayload.blocks
            : execBlocks && execBlocks.length > 0
              ? execBlocks
              : pageAuthoringToBlocks(authoring);

          // Inject structured strategy blocks for matching pages
          const makeId = () =>
            typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
              ? crypto.randomUUID()
              : `sb-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

          if (page.page_key === "recurring-services" && state.recurringServicesPreview.length > 0) {
            pageBlocks.push({
              id: makeId(),
              type: "recurring_services_register",
              content: {
                title: "Recurring Services Register",
                services: state.recurringServicesPreview.map((s) => ({
                  category: s.category,
                  serviceName: s.service_name,
                  vendorName: s.vendor_name || undefined,
                  frequency: s.frequency,
                  costPerVisit: s.cost_per_visit || undefined,
                  annualCost: s.annual_cost || undefined,
                  monthlyCost: s.annual_cost ? Math.round(s.annual_cost / 12) : undefined,
                  hbcManaged: s.hbc_managed,
                  status: "current" as const,
                })),
              } as never,
              colSpan: 12,
              order: pageBlocks.length,
              createdAt: now,
              updatedAt: now,
            });
          }

          if (page.page_key === "capital-plan-10yr" && state.capitalPlan?.years?.length) {
            pageBlocks.push({
              id: makeId(),
              type: "capital_plan",
              content: {
                eyebrow: "Strategic Roadmap",
                title: "10-Year Capital Plan",
                startYear: new Date().getFullYear(),
                items: state.capitalPlan.years.map((y, idx) => ({
                  projectName: y.project,
                  phase: y.phase,
                  yearStart: y.year,
                  yearEnd: y.year,
                  costLow: y.ballpark_low,
                  costHigh: y.ballpark_high,
                  displayOrder: idx,
                })),
              } as never,
              colSpan: 12,
              order: pageBlocks.length,
              createdAt: now,
              updatedAt: now,
            });
          }

          if (page.page_key === "maintenance-calendar" && state.maintenanceCalendar) {
            const mc = state.maintenanceCalendar;
            pageBlocks.push({
              id: makeId(),
              type: "maintenance_calendar",
              content: {
                eyebrow: "The annual cadence",
                title: "Maintenance Calendar",
                spring: mc.spring.map((t) => ({ description: `${t.task} (${t.system})` })),
                summer: mc.summer.map((t) => ({ description: `${t.task} (${t.system})` })),
                fall: mc.fall.map((t) => ({ description: `${t.task} (${t.system})` })),
                winter: mc.winter.map((t) => ({ description: `${t.task} (${t.system})` })),
              } as never,
              colSpan: 12,
              order: pageBlocks.length,
              createdAt: now,
              updatedAt: now,
            });
          }

          // Phase 4 — page-assigned photos → ordered images (hero first;
          // unit photo for systems) + a photo_gallery block when 2+.
          const toPublishPhoto = (
            ref: IntakeFileRef | undefined,
          ): PublishPagePhoto | undefined => {
            const url = ref ? publicUrlByFileId[ref.id] : undefined;
            return url ? { url } : undefined;
          };
          const slotRefs = authoring.structured?.photoSlots;
          const photoPublish = buildPagePhotoPublish({
            photos: (authoring.images ?? [])
              .map((ref) => toPublishPhoto(ref))
              .filter((p): p is PublishPagePhoto => Boolean(p)),
            slots: slotRefs
              ? {
                  unit: toPublishPhoto(slotRefs.unit),
                  serialPlate: toPublishPhoto(slotRefs.serialPlate),
                  installLocation: toPublishPhoto(slotRefs.installLocation),
                }
              : undefined,
            order: pageBlocks.length,
            now,
          });
          if (photoPublish.galleryBlock) {
            pageBlocks.push(photoPublish.galleryBlock);
          }
          if (photoPublish.images.length > 0) {
            manuallyAssignedPageKeys.add(page.page_key);
          }

          const sortOrder = sectionIndex * 100 + pageIndex;

          // Column values: structured pages come from the validated payload;
          // generic pages fall back to the raw AI seed hints as before.
          const conditionRating = structured
            ? structured.condition_rating
            : pageSeed?.suggested_condition || null;
          const specs = structured
            ? structured.specs
            : pageSeed?.specs_seed && pageSeed.specs_seed.length > 0
              ? pageSeed.specs_seed
              : null;
          const keyObservations = structured
            ? structured.key_observations
            : pageSeed?.key_observations && pageSeed.key_observations.length > 0
              ? pageSeed.key_observations
              : null;

          // Step 1 — upsert the row. onConflict on (report_id, page_key)
          // means re-publishing the same wizard run updates in place.
          // Optional structured columns (tiers, lifecycle, maintenance,
          // images) are only written when the wizard actually captured
          // them so a republish never wipes data filled by other flows
          // (e.g. photo auto-routing writes images after this).
          const upsertRow: ReportPageInsert = {
            report_id: state.reportId,
            page_key: page.page_key,
            title: page.title,
            group_name: section.label,
            narrative: pageBlocks as never,
            condition_rating: conditionRating,
            specs: specs as never,
            key_observations: keyObservations as never,
            status: authoring.status,
            sort_order: sortOrder,
            is_complete: authoring.status === "complete",
            updated_at: now,
          };
          if (structured) {
            if (structured.tiers) upsertRow.tiers = structured.tiers as never;
            if (structured.current_age_years !== null) {
              upsertRow.current_age_years = structured.current_age_years;
            }
            if (structured.expected_lifespan_years !== null) {
              upsertRow.expected_lifespan_years =
                structured.expected_lifespan_years;
            }
            if (structured.maintenance) {
              upsertRow.maintenance = structured.maintenance as never;
            }
            if (structured.images) {
              upsertRow.images = structured.images as never;
            }
          }
          // Manual Step 3 photo assignments always win over anything the
          // structured payload carried.
          if (photoPublish.images.length > 0) {
            upsertRow.images = photoPublish.images as never;
          }
          const { error: upErr } = await supabase
            .from("report_pages")
            .upsert(upsertRow, { onConflict: "report_id,page_key" });
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

      // Persist Hover / iGUIDE URLs onto the property row so the existing
      // EmbedBlocks (HoverEmbedBlock / IGuideEmbedBlock) render them in
      // the report and portal.
      if (state.propertyId && (state.hoverUrl || state.iguideUrl)) {
        const propertyPatch: { hover_url?: string; iguide_url?: string } = {};
        if (state.hoverUrl) propertyPatch.hover_url = state.hoverUrl.trim();
        if (state.iguideUrl) propertyPatch.iguide_url = state.iguideUrl.trim();
        const { error: urlErr } = await supabase
          .from("properties")
          .update(propertyPatch)
          .eq("id", state.propertyId);
        if (urlErr) console.warn("[Step5Publish] hover/iguide URL persist failed", urlErr);
      }

      // W7 — Auto-route photos to report pages via AI categorization.
      // Phase 4: only photos the consultant did NOT assign in Step 3 are
      // eligible, and pages that carry manual assignments are never
      // overwritten. Non-blocking: failures are logged but don't prevent
      // publish.
      const unassignedPhotoUrls = photoUrlEntries
        .filter((e) => !assignedFileIds.has(e.fileId))
        .map((e) => e.url);
      if (unassignedPhotoUrls.length > 0 && state.reportId) {
        try {
          const availablePages = state.tocSections
            .flatMap((s) => s.pages.filter((p) => p.selected))
            .map((p) => ({ slug: p.page_key, name: p.title }));

          const assignments: Record<string, string[]> = {};
          const PHOTO_BATCH = 3;
          for (let i = 0; i < unassignedPhotoUrls.length; i += PHOTO_BATCH) {
            const batch = unassignedPhotoUrls.slice(i, i + PHOTO_BATCH);
            const results = await Promise.allSettled(
              batch.map((url) =>
                supabase.functions.invoke("categorize-photo", {
                  body: { imageUrl: url, availablePages },
                }).then(({ data }) => ({ url, pageSlug: (data as { pageSlug?: string })?.pageSlug }))
              )
            );
            for (const r of results) {
              if (r.status === "fulfilled" && r.value.pageSlug) {
                const slug = r.value.pageSlug;
                if (!assignments[slug]) assignments[slug] = [];
                assignments[slug].push(r.value.url);
              }
            }
          }

          // Write images to report_pages, skipping manually-assigned pages.
          for (const [pageKey, urls] of Object.entries(assignments)) {
            if (manuallyAssignedPageKeys.has(pageKey)) continue;
            await supabase
              .from("report_pages")
              .update({ images: urls as never })
              .eq("report_id", state.reportId)
              .eq("page_key", pageKey);
          }
        } catch (photoErr) {
          console.warn("[Step5Publish] photo auto-routing failed (non-blocking):", photoErr);
        }
      }

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

      if (state.propertyId) {
        setTimeout(() => {
          navigate(`/portal/${state.propertyId}?tab=report&preview=admin`);
        }, 800);
      }
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
    <div className="space-y-6">
      <WizardStepHeader
        step={5}
        title="Review & Publish"
        description="Last step. Preview the full client experience, confirm the AI quality gate clears, then publish. The client gets a magic-link email after publish."
      />

      {/* Stat cards, prototype screen 20 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryStat
          label="Pages Authored"
          value={String(summary.totalPages)}
          caption={`${(summary.counts.reviewed ?? 0) + (summary.counts.complete ?? 0)} of ${summary.totalPages} reviewed`}
        />
        <SummaryStat
          label="Vision Projects"
          value={String(summary.visionProjects)}
          caption="from the strategy pages"
        />
        <SummaryStat
          label="Systems Documented"
          value={String(summary.systemsDocumented)}
          caption="systems & appliances pages"
        />
      </div>

      {summary.featured.length > 0 && (
        <div className="rounded-lg border border-hbc-border bg-white p-5">
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-hbc-gold-readable">
            Featured
          </div>
          <ul className="text-xs font-sans text-foreground mt-2 space-y-1">
            {summary.featured.map((p) => (
              <li key={p.page_key} className="flex gap-2">
                <span aria-hidden className="text-hbc-gold-readable">·</span>
                <span>{p.title}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <AIQualityGate onAllHighsAcknowledged={setHighsOk} qaMode={qaMode} />

      {!publishedAt && (
        <IntakeUploadCard
          title="Last chance to add anything"
          description="Drop photos, PDFs, or notes here. They will be auto-routed to the correct pages."
          cardKey="photos"
          files={state.intakeUploads.photos}
          onChange={(files) => setIntakeUploads("photos", files)}
        />
      )}

      {!publishedAt && summary.missingPhotos > 0 && !photoBannerDismissed && (
        <Card className="p-4 flex items-start gap-3 border-amber-500/30 bg-amber-50/30">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" aria-hidden />
          <div className="flex-1">
            <p className="text-sm font-sans text-foreground">
              {summary.missingPhotos} {summary.missingPhotos === 1 ? "page doesn't" : "pages don't"} have photos yet.
            </p>
            <p className="text-xs font-sans text-muted-foreground mt-0.5">
              They will show clean placeholder hero images.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="min-h-[36px] text-xs"
              onClick={() => goToStep("authoring")}
            >
              Add photos
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="min-h-[36px] text-xs"
              onClick={() => setPhotoBannerDismissed(true)}
            >
              Continue
            </Button>
          </div>
        </Card>
      )}

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
        <div className="rounded-lg border border-hbc-border bg-white p-6 space-y-4">
          <h3 className="font-display text-2xl text-hbc-navy">
            Final preview before publish
          </h3>
          <p className="text-sm font-sans text-hbc-grey">
            Open the client portal preview to walk through exactly what{" "}
            {clientLabel.toLowerCase() === "your client"
              ? "your client"
              : clientLabel.replace(/^The/, "the")}{" "}
            will see. When you're satisfied, come back here and publish.
          </p>
          <div className="flex items-center justify-between gap-3 flex-wrap pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => goToStep("strategy")}
              className="min-h-[44px] border-hbc-border bg-white text-hbc-navy"
            >
              ← Back to Strategy
            </Button>
            <Button
              type="button"
              onClick={handlePublish}
              disabled={!canPublish}
              className="min-h-[44px] bg-hbc-rust text-white hover:bg-[hsl(var(--hbc-rust)/0.92)]"
            >
              {publishing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden />
              ) : null}
              {publishLabel}
            </Button>
          </div>
          {!highsOk && (
            <p className="text-xs font-sans text-hbc-grey">
              Resolve all blocking pre-publish questions to enable Publish.
            </p>
          )}
        </div>
      )}

      {/* What happens when you publish — honest list matching the actual
          publish sequence in handlePublish. */}
      <div className="rounded-lg bg-hbc-surface p-6">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-hbc-gold-readable">
          What Happens When You Publish
        </div>
        <ol className="mt-3 space-y-1.5 text-sm font-sans text-foreground list-decimal list-inside">
          <li>
            The report flips to published and every page becomes visible in
            the client portal
          </li>
          <li>{clientLabel} receive an email with their portal link</li>
          <li>
            Uploaded photos and documents are routed to their matching
            report pages
          </li>
          <li>
            Hover and iGUIDE links attach to the property so the 3D tours
            render in the portal
          </li>
        </ol>
      </div>

      {publishedAt && (
        <p className="text-xs font-sans text-hbc-grey">
          Report is live. You can leave this page.
        </p>
      )}
    </div>
  );
}

interface SummaryStatProps {
  label: string;
  value: string;
  caption?: string;
}

function SummaryStat({ label, value, caption }: SummaryStatProps) {
  return (
    <div className="rounded-lg border border-hbc-border bg-white p-5">
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-hbc-gold-readable">
        {label}
      </div>
      <div className="font-display text-5xl text-hbc-navy mt-2 leading-none">
        {value}
      </div>
      {caption && (
        <div className="text-[11px] font-sans text-hbc-grey mt-2">{caption}</div>
      )}
    </div>
  );
}
