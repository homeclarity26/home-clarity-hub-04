import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, Loader2, CheckCircle2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  useWizard,
  type IntakeFileRef,
  type PageAuthoring,
  type PageAuthoringStatus,
  type PageStructuredData,
  type SystemPhotoSlotKey,
  type TocPage,
  type WizardPhotoSlots,
} from "@/contexts/WizardContext";
import { suggestPhotoAssignments } from "@/lib/photoRouting";
import { useAuth } from "@/contexts/AuthContext";
import { SideBySideEditor } from "./SideBySideEditor";
import { AICoPilotPanel } from "./AICoPilotPanel";
import {
  ExecutiveSummaryEditor,
  FieldGroup,
  RoomStructuredEditor,
  SystemStructuredEditor,
  VisionStructuredEditor,
  type VisionLinkOption,
} from "./StructuredPageEditors";
import {
  ExecutiveSummaryPreview,
  StructuredPagePreview,
} from "./StructuredPagePreview";
import { PhotosFieldGroup } from "./PhotosFieldGroup";
import { seedStructuredForType } from "@/lib/wizardStructuredSeeds";

// "Mark and Jennifer Caldwell" → "Caldwell" for the exec-summary hero.
const deriveFamilyName = (fullName: string): string => {
  const parts = fullName.trim().split(/\s+/);
  return parts.length > 0 ? parts[parts.length - 1] : "";
};

// Step 3 — Authoring, prototype screens 8-15. Full-bleed layout:
//   left: white pages rail (PAGES eyebrow, grouped list w/ status dots)
//   top: white bar with STEP 3 · SECTION eyebrow, Cormorant page title,
//        "N of M reviewed", review-status button, Back + Continue
//   main: ADMIN VIEW / CLIENT PREVIEW split (SideBySideEditor) with the
//        dark AI Co-Pilot panel at the bottom of the admin column
//
// First-draft strategy: the admin form renders grouped field cards
// (narrative / observations / lifecycle / admin notes) for every page
// type; the preview pane renders the same fields as a styled, read-only
// mock of what the client will see. Page-type-specific editors (Room /
// System / Vision / Exec Summary) come behind this scaffold.

type PageType = "room" | "system" | "vision" | "executive_summary" | "generic";

const inferPageType = (page: TocPage): PageType => {
  const k = page.page_key.toLowerCase();
  const g = (page.group || "").toLowerCase();
  if (k === "executive-summary") return "executive_summary";
  if (g.startsWith("system") || g.startsWith("appliance") || g.startsWith("safety")) {
    return "system";
  }
  if (k.includes("vision") || k.includes("project")) return "vision";
  if (g === "spaces" || g === "exterior" || g === "interior") return "room";
  return "generic";
};

const STATUS_LABEL: Record<PageAuthoringStatus, string> = {
  draft: "AI drafted",
  reviewed: "Reviewed",
  complete: "Complete",
};

const STATUS_DOT_CLASS: Record<PageAuthoringStatus, string> = {
  draft: "bg-[hsl(var(--hbc-gold-readable))]",
  reviewed: "bg-primary",
  complete: "bg-emerald-600",
};

const CONDITION_OPTIONS = ["Excellent", "Good", "Fair", "Poor", "Critical"];

// Dev-only (qaMode): canned co-pilot replies per page type so the RESULT
// area renders in /dev/prototype-qa without a live edge-function call
// (prototype screen 12). Admin-facing copy, never published to a client.
const QA_COPILOT_RESULTS: Partial<Record<PageType, string>> = {
  system:
    "Replacement Briefing scope, drafted from this page: 90,000 BTU input two-stage gas furnace at 96% AFUE with a variable-speed blower, sized to the existing 16x8 supply trunk and 18x10 return. Reuse the 3/4 inch gas line and the floor-drain condensate route; confirm the adjacent 240V circuit if a heat pump coil is added later. Access through the garage mechanical room is clear.",
  room: "Suggested observation: the 2017 remodel is holding up well. Note the quartz edge wear at the sink and the intermittent Sub-Zero water dispenser so the annual review tracks both.",
  vision:
    "Tier language check: Essential reads as the pragmatic fix, Enhanced carries the recommendation, and Signature is the fully realized vision. Pricing bands are internally consistent with the design-first callout.",
};

interface SelectedPage extends TocPage {
  sectionKey: string;
  sectionLabel: string;
}

// Maps Step 3's local PageType onto the seed helper's argument. Appliance
// pages read as "system" here; the seed shape is shared.
const seedTypeFor = (pageType: PageType) =>
  pageType === "room" || pageType === "system" || pageType === "vision"
    ? pageType
    : pageType === "executive_summary"
      ? ("executive_summary" as const)
      : null;

interface Step3AuthoringProps {
  /** Dev-only (QA harness): suppress the on-mount bulk auto-draft pass. */
  qaMode?: boolean;
}

export function Step3Authoring({ qaMode = false }: Step3AuthoringProps) {
  const { user } = useAuth();
  const {
    state,
    goToStep,
    setActivePageKey,
    upsertAuthoring,
    setPageSeeds,
    setTocSections,
  } = useWizard();
  const [savingNotes, setSavingNotes] = useState(false);

  const selectedPages = useMemo<SelectedPage[]>(() => {
    const out: SelectedPage[] = [];
    for (const section of state.tocSections) {
      for (const page of section.pages) {
        if (!page.selected) continue;
        out.push({ ...page, sectionKey: section.key, sectionLabel: section.label });
      }
    }
    return out;
  }, [state.tocSections]);

  // Vision pages available to the room editor's LINKED VISION PROJECT
  // select: every selected TOC page that reads as a vision page, plus its
  // authored priority window when the vision editor captured one.
  const visionLinkOptions = useMemo<VisionLinkOption[]>(() => {
    const out: VisionLinkOption[] = [];
    for (const section of state.tocSections) {
      for (const page of section.pages) {
        if (!page.selected) continue;
        if (inferPageType(page) !== "vision") continue;
        const priority =
          state.authoring[page.page_key]?.structured?.vision?.priorityWindow;
        out.push({
          pageKey: page.page_key,
          title: page.title,
          priority: priority?.trim() || undefined,
        });
      }
    }
    return out;
  }, [state.tocSections, state.authoring]);

  // Pick a default active page when none is set, or when the active page
  // is no longer in the selected list.
  useEffect(() => {
    if (selectedPages.length === 0) return;
    const stillSelected =
      state.activePageKey &&
      selectedPages.some((p) => p.page_key === state.activePageKey);
    if (!stillSelected) {
      setActivePageKey(selectedPages[0].page_key);
    }
  }, [selectedPages, state.activePageKey, setActivePageKey]);

  // Auto-draft progress for the bulk draft-page-narrative pass below.
  // total > 0 means we kicked off the pass; active=true while batches
  // are still running. Failed page titles bubble up so the consultant
  // sees which ones need a retry via per-page Co-Pilot.
  const [autoDraftStatus, setAutoDraftStatus] = useState<{
    active: boolean;
    current: number;
    total: number;
    failed: string[];
  }>({ active: false, current: 0, total: 0, failed: [] });
  // useRef so we only fire the auto-draft pass once per Step 3 mount —
  // navigating away and back doesn't re-fire.
  const autoDraftFiredRef = useRef(false);

  // Hydrate any selected page that lacks authoring content from a
  // matching seed produced by Step 1's stage-2 AI run. Runs once per
  // (selectedPages, pageSeeds) change. Pages already touched by the
  // consultant are skipped — never overwrite typed content. Pages
  // without a matching seed stay empty (no seed available; consultant
  // uses AI Co-Pilot per page).
  useEffect(() => {
    if (selectedPages.length === 0 || state.pageSeeds.length === 0) return;
    const seedByKey = new Map<string, typeof state.pageSeeds[number]>();
    for (const s of state.pageSeeds) {
      if (s.page_key) seedByKey.set(s.page_key, s);
    }
    for (const page of selectedPages) {
      const existing = state.authoring[page.page_key];
      const hasContent =
        Array.isArray(existing?.content) && existing!.content.length > 0;
      if (hasContent) continue;
      const seed = seedByKey.get(page.page_key);
      if (!seed) continue;
      const content: Array<{ type: string; value: string }> = [];
      if (seed.narrative_seed && seed.narrative_seed.trim().length > 0) {
        content.push({ type: "narrative", value: seed.narrative_seed.trim() });
      }
      const obs = (seed.key_observations || []).filter((o) => o && o.trim().length > 0);
      if (obs.length > 0) {
        content.push({ type: "observations", value: obs.join("\n") });
      }
      if (content.length > 0) {
        upsertAuthoring(page.page_key, { content, status: "draft" });
      }
    }
    // upsertAuthoring is stable from useCallback; only re-run when seeds or
    // selected pages actually change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPages, state.pageSeeds]);

  // Bulk auto-draft: fires draft-page-narrative for every selected page
  // that's still empty after seed hydration. Runs once per session
  // (gated by autoDraftFiredRef). Batches of 5 in parallel to stay
  // under Anthropic's tier-based concurrency limits. Pages the
  // consultant has already touched are skipped. Failed pages bubble
  // up in the progress banner so the consultant can retry per-page
  // via AI Co-Pilot. The 600ms delay lets the seed-hydration effect
  // above settle so we don't double-draft pages that have a seed.
  useEffect(() => {
    if (qaMode) return;
    if (autoDraftFiredRef.current) return;
    if (selectedPages.length === 0) return;
    if (state.currentStep !== "authoring") return;

    const timer = setTimeout(async () => {
      if (autoDraftFiredRef.current) return;

      const empties = selectedPages.filter((p) => {
        const auth = state.authoring[p.page_key];
        const blocks = auth?.content;
        return !Array.isArray(blocks) || blocks.length === 0;
      });
      if (empties.length === 0) {
        autoDraftFiredRef.current = true;
        return;
      }

      autoDraftFiredRef.current = true;
      setAutoDraftStatus({ active: true, current: 0, total: empties.length, failed: [] });

      const BATCH_SIZE = 5;
      let completed = 0;
      const failed: string[] = [];

      for (let i = 0; i < empties.length; i += BATCH_SIZE) {
        const batch = empties.slice(i, i + BATCH_SIZE);
        const results = await Promise.allSettled(batch.map(async (page) => {
          const { data, error } = await supabase.functions.invoke(
            "draft-page-narrative",
            {
              body: {
                pageSlug: page.page_key,
                pageName: page.title,
                propertyAddress: state.client.address,
                yearBuilt: state.client.yearBuilt,
                sqft: state.client.sqft,
                bedrooms: state.client.bedrooms,
                bathrooms: state.client.bathrooms,
                propertyType: state.client.propertyType,
                relationshipType: state.client.relationshipType,
                clientIntelligenceSummary: state.client.discoveryNotes,
              },
            },
          );
          if (error) throw error;
          return { page, data };
        }));

        for (let j = 0; j < results.length; j++) {
          const r = results[j];
          const page = batch[j];
          completed += 1;
          if (r.status === "fulfilled") {
            const data = (r.value as { data: unknown }).data as {
              narrative?: string[] | string;
              key_observations?: string[];
              suggested_condition?: string;
              specs?: { label: string; value: string }[];
            } | null;
            const narrative = Array.isArray(data?.narrative)
              ? data!.narrative.filter((p) => typeof p === "string" && p.trim()).join("\n\n")
              : (typeof data?.narrative === "string" ? data!.narrative.trim() : "");
            const observations = Array.isArray(data?.key_observations)
              ? data!.key_observations.filter((o) => typeof o === "string" && o.trim()).join("\n")
              : "";
            if (narrative) {
              const content: Array<{ type: string; value: string }> = [
                { type: "narrative", value: narrative },
              ];
              if (observations) {
                content.push({ type: "observations", value: observations });
              }
              upsertAuthoring(page.page_key, { content, status: "draft" });

              // Merge AI-returned specs/condition into pageSeeds
              if (data?.suggested_condition || data?.specs) {
                setPageSeeds(state.pageSeeds.map((s) =>
                  s.page_key === page.page_key
                    ? {
                        ...s,
                        suggested_condition: data.suggested_condition || s.suggested_condition,
                        specs_seed: data.specs || s.specs_seed,
                        key_observations: data.key_observations || s.key_observations,
                      }
                    : s
                ).concat(
                  state.pageSeeds.some((s) => s.page_key === page.page_key)
                    ? []
                    : [{
                        page_key: page.page_key,
                        title: page.title,
                        suggested_condition: data.suggested_condition,
                        specs_seed: data.specs,
                        key_observations: data.key_observations,
                      }]
                ));
              }
            } else {
              failed.push(page.title);
            }
          } else {
            failed.push(page.title);
          }
        }
        setAutoDraftStatus((s) => ({ ...s, current: completed, failed: [...failed] }));
      }

      setAutoDraftStatus((s) => ({ ...s, active: false }));
    }, 600);

    return () => clearTimeout(timer);
    // Deliberately narrow deps so changes to authoring (from upsert)
    // don't re-trigger the effect. autoDraftFiredRef gates the body.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPages.length, state.currentStep, qaMode]);

  const activePage = selectedPages.find(
    (p) => p.page_key === state.activePageKey,
  );
  const activeAuthoring: PageAuthoring | undefined = state.activePageKey
    ? state.authoring[state.activePageKey]
    : undefined;

  const pageType: PageType = activePage ? inferPageType(activePage) : "generic";

  const updateAuthoring = (patch: Partial<PageAuthoring>) => {
    if (!state.activePageKey) return;
    upsertAuthoring(state.activePageKey, patch);
  };

  // Phase 5b — lazily seed the structured payload the first time a
  // room / system / vision / exec-summary page becomes active. Initial
  // values come from the Step 1 seed (specs_seed, replacement_briefing_stub,
  // suggested_condition); pages the consultant already structured are
  // never overwritten. Persists through the normal authoring autosave.
  useEffect(() => {
    if (!activePage || !state.activePageKey) return;
    const seedType = seedTypeFor(inferPageType(activePage));
    if (!seedType) return;
    const existing = state.authoring[state.activePageKey];
    if (existing?.structured) return;
    const seed = state.pageSeeds.find(
      (s) => s.page_key === state.activePageKey,
    );
    upsertAuthoring(state.activePageKey, {
      structured: seedStructuredForType(seedType, seed),
    });
    // Only reseed when the active page changes; authoring updates from the
    // seeding itself must not re-trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.activePageKey, activePage?.page_key]);

  const updateStructured = (patch: Partial<PageStructuredData>) => {
    if (!state.activePageKey) return;
    const existing = state.authoring[state.activePageKey]?.structured ?? {};
    updateAuthoring({ structured: { ...existing, ...patch } });
  };

  // Room Name edits rename the page across the wizard (rail, TOC, publish).
  const renameActivePage = (title: string) => {
    if (!state.activePageKey) return;
    setTocSections(
      state.tocSections.map((s) => ({
        ...s,
        pages: s.pages.map((p) =>
          p.page_key === state.activePageKey ? { ...p, title } : p,
        ),
      })),
    );
  };

  const activeBlocks = useMemo(
    () => (activeAuthoring?.content ?? []) as Array<Record<string, unknown>>,
    [activeAuthoring],
  );
  const activeNarrative = useMemo(() => {
    const block = activeBlocks.find(
      (b) => typeof b.type === "string" && b.type === "narrative",
    );
    return (block?.value as string | undefined) ?? "";
  }, [activeBlocks]);
  const activeObservations = useMemo(() => {
    const block = activeBlocks.find(
      (b) => typeof b.type === "string" && b.type === "observations",
    );
    return (block?.value as string | undefined) ?? "";
  }, [activeBlocks]);

  const updateActiveBlock = (type: string, value: string) => {
    const next = activeBlocks.filter(
      (b) => !(typeof b.type === "string" && b.type === type),
    );
    next.push({ type, value });
    updateAuthoring({ content: next });
  };

  // Condition rating lives on the page's seed (pageSeeds.suggested_condition)
  // which is exactly what Step 5 publishes into report_pages.condition_rating
  // for non-structured pages, and what buildStructuredPagePayload reads for
  // structured ones.
  const activeSeed = state.pageSeeds.find(
    (s) => s.page_key === state.activePageKey,
  );
  const activeCondition = activeSeed?.suggested_condition ?? "";
  const setActiveCondition = (rating: string) => {
    if (!state.activePageKey || !activePage) return;
    const exists = state.pageSeeds.some(
      (s) => s.page_key === state.activePageKey,
    );
    setPageSeeds(
      exists
        ? state.pageSeeds.map((s) =>
            s.page_key === state.activePageKey
              ? { ...s, suggested_condition: rating }
              : s,
          )
        : [
            ...state.pageSeeds,
            {
              page_key: activePage.page_key,
              title: activePage.title,
              suggested_condition: rating,
            },
          ],
    );
  };

  // Phase 4 — "Suggest assignments" in the Step 3 photo picker. Pure
  // filename-token routing (src/lib/photoRouting); no network calls. Photos
  // suggested for the ACTIVE page get checked in the picker draft; system
  // pages also get slot suggestions (first suggestion per slot wins,
  // existing picks are never overwritten).
  const suggestForActivePage = (
    current: Record<string, SystemPhotoSlotKey | null>,
  ): Record<string, SystemPhotoSlotKey | null> => {
    if (!activePage) return current;
    const suggestions = suggestPhotoAssignments(
      state.intakeUploads.photos.map((f) => ({ url: f.id, filename: f.name })),
      selectedPages.map((p) => ({
        page_key: p.page_key,
        title: p.title,
        group: p.group,
      })),
    );
    const next = { ...current };
    const usedSlots = new Set(
      Object.values(next).filter((s): s is SystemPhotoSlotKey => s !== null),
    );
    for (const s of suggestions) {
      if (s.page_key !== activePage.page_key) continue;
      const alreadyPicked = s.url in next;
      if (!alreadyPicked) next[s.url] = null;
      if (
        pageType === "system" &&
        s.slot &&
        next[s.url] === null &&
        !usedSlots.has(s.slot)
      ) {
        next[s.url] = s.slot;
        usedSlots.add(s.slot);
      }
    }
    return next;
  };

  const persistNotesForNextVisit = async (notes: string) => {
    if (!state.propertyId || !state.activePageKey || !user) return;
    setSavingNotes(true);
    try {
      const { error } = await supabase.from("annual_review_notes").upsert(
        {
          property_id: state.propertyId,
          page_key: state.activePageKey,
          notes_html: notes,
          visit_year: new Date().getFullYear(),
          created_by_user_id: user.id,
        },
        { onConflict: "property_id,page_key,visit_year" },
      );
      if (error) throw error;
    } catch (err) {
      // Non-fatal — wizard envelope still has a copy in state.authoring.
      const message = err instanceof Error ? err.message : "Unknown error";
      toast({
        title: "Could not save notes",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSavingNotes(false);
    }
  };

  const reviewedCount = selectedPages.filter((p) => {
    const s = state.authoring[p.page_key]?.status ?? "draft";
    return s === "reviewed" || s === "complete";
  }).length;

  const activeStatus: PageAuthoringStatus = activeAuthoring?.status ?? "draft";
  // Single review button cycles draft → reviewed → complete → draft so all
  // three persisted statuses stay reachable from the prototype's one-button
  // top bar.
  const reviewButtonLabel =
    activeStatus === "draft"
      ? "Mark Reviewed"
      : activeStatus === "reviewed"
        ? "Mark Complete"
        : "Complete ✓";
  const cycleReviewStatus = () => {
    const next: PageAuthoringStatus =
      activeStatus === "draft"
        ? "reviewed"
        : activeStatus === "reviewed"
          ? "complete"
          : "draft";
    updateAuthoring({ status: next });
  };

  if (selectedPages.length === 0) {
    return (
      <div className="px-6 md:px-10 py-8 space-y-4">
        <div className="rounded-lg border border-hbc-border bg-white p-6">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-hbc-gold-readable">
            Step 3 of 5
          </div>
          <h3 className="font-display text-2xl text-hbc-navy mt-1">
            Page Authoring
          </h3>
          <p className="text-xs font-sans text-hbc-grey mt-2">
            No pages selected yet. Go back to Step 2 and pick at least one page.
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => goToStep("toc")}
            className="min-h-[44px] mt-4 border-hbc-border bg-white"
          >
            ← Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full items-stretch">
      {/* Left — Pages rail */}
      <aside className="w-[230px] shrink-0 bg-white border-r border-hbc-border">
        <div className="px-4 pt-5 pb-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-hbc-gold-readable">
            Pages
          </div>
          <div className="text-[11px] font-sans text-hbc-grey mt-1">
            {selectedPages.length} page{selectedPages.length === 1 ? "" : "s"} included
          </div>
        </div>
        <nav>
          {state.tocSections.map((section) => {
            const pages = section.pages.filter((p) => p.selected);
            if (pages.length === 0) return null;
            return (
              <div key={section.key} className="pb-2">
                <div className="px-4 pt-2 pb-1 text-[11px] font-sans text-hbc-grey">
                  {section.label}
                </div>
                <ul>
                  {pages.map((page) => {
                    const authoring = state.authoring[page.page_key];
                    const status: PageAuthoringStatus =
                      authoring?.status ?? "draft";
                    const isActive = state.activePageKey === page.page_key;
                    return (
                      <li key={page.page_key}>
                        <button
                          type="button"
                          onClick={() => setActivePageKey(page.page_key)}
                          className={`w-full text-left flex items-center gap-2 px-4 py-2.5 min-h-[44px] border-l-2 transition-colors ${
                            isActive
                              ? "border-hbc-gold bg-hbc-surface"
                              : "border-transparent hover:bg-hbc-surface/60"
                          }`}
                          aria-current={isActive ? "page" : undefined}
                        >
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT_CLASS[status]}`}
                            aria-label={STATUS_LABEL[status]}
                          />
                          <span
                            className={`flex-1 min-w-0 truncate text-[13px] font-sans ${
                              isActive
                                ? "font-semibold text-hbc-navy"
                                : "text-foreground"
                            }`}
                          >
                            {page.title}
                          </span>
                          {(page.is_featured || authoring?.is_featured) && (
                            <Star
                              className="w-3.5 h-3.5 fill-hbc-gold text-hbc-gold shrink-0"
                              aria-hidden
                            />
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Right — top bar + split editor */}
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="bg-white border-b border-hbc-border px-6 py-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-hbc-gold-readable">
                Step 3 · {activePage?.sectionLabel ?? "Authoring"}
              </div>
              <h3 className="font-display text-2xl text-hbc-navy mt-0.5">
                {activePage?.title ?? "Pick a page"}
              </h3>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-sans text-hbc-grey mr-1">
                {reviewedCount} of {selectedPages.length} reviewed
              </span>
              <Button
                type="button"
                variant="outline"
                onClick={cycleReviewStatus}
                disabled={!activePage}
                className="min-h-[44px] border-hbc-border bg-white text-hbc-navy"
                title="Cycles draft, reviewed, complete"
              >
                {reviewButtonLabel}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => goToStep("toc")}
                className="min-h-[44px] border-hbc-border bg-white text-hbc-navy"
              >
                ← Back
              </Button>
              <Button
                type="button"
                onClick={() => goToStep("strategy")}
                className="min-h-[44px] bg-hbc-navy text-white hover:bg-[hsl(var(--hbc-navy)/0.92)]"
              >
                Continue →
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 px-5 py-5 space-y-4">
          {autoDraftStatus.total > 0 && (
            <div className={`rounded-lg border bg-white p-3 flex items-start gap-3 ${
              autoDraftStatus.active
                ? "border-hbc-gold/60"
                : autoDraftStatus.failed.length > 0
                  ? "border-amber-300"
                  : "border-emerald-600/40"
            }`}>
              {autoDraftStatus.active ? (
                <Loader2 className="w-4 h-4 mt-0.5 animate-spin text-hbc-gold-readable shrink-0" aria-hidden />
              ) : autoDraftStatus.failed.length > 0 ? (
                <Sparkles className="w-4 h-4 mt-0.5 text-amber-700 shrink-0" aria-hidden />
              ) : (
                <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-600 shrink-0" aria-hidden />
              )}
              <div className="flex-1 min-w-0">
                <div className="text-xs font-sans font-medium text-foreground">
                  {autoDraftStatus.active
                    ? `AI is drafting page narratives: ${autoDraftStatus.current} of ${autoDraftStatus.total} done`
                    : autoDraftStatus.failed.length > 0
                      ? `${autoDraftStatus.total - autoDraftStatus.failed.length} of ${autoDraftStatus.total} pages drafted (${autoDraftStatus.failed.length} need a manual retry)`
                      : `All ${autoDraftStatus.total} empty pages drafted by AI`}
                </div>
                <div className="text-[10px] font-mono text-muted-foreground mt-0.5">
                  {autoDraftStatus.active
                    ? "Pages already drafted are ready to edit while the rest finish in the background."
                    : autoDraftStatus.failed.length > 0
                      ? `Failed: ${autoDraftStatus.failed.slice(0, 3).join(" · ")}${autoDraftStatus.failed.length > 3 ? ` · +${autoDraftStatus.failed.length - 3} more` : ""}. Open each and use AI Co-Pilot to retry.`
                      : "Edit + refine using the AI Co-Pilot panel on each page."}
                </div>
              </div>
            </div>
          )}

          {activePage ? (
            <SideBySideEditor
              admin={
                <div className="space-y-4">
                  <PageAdminEditor
                    pageType={pageType}
                    isAppliance={(activePage.group || "")
                      .toLowerCase()
                      .startsWith("appliance")}
                    structured={activeAuthoring?.structured}
                    onChangeStructured={updateStructured}
                    visionLinkOptions={visionLinkOptions}
                    pageTitle={activePage.title}
                    onRenamePage={renameActivePage}
                    assignedPhotos={activeAuthoring?.images ?? []}
                    onChangeAssignedPhotos={(images) =>
                      updateAuthoring({ images })
                    }
                    photoSlots={activeAuthoring?.structured?.photoSlots}
                    onChangePhotoSlots={(photoSlots) =>
                      updateStructured({ photoSlots })
                    }
                    allIntakePhotos={state.intakeUploads.photos}
                    onSuggestPhotos={suggestForActivePage}
                    narrative={activeNarrative}
                    observations={activeObservations}
                    onUpdateBlock={updateActiveBlock}
                    condition={activeCondition}
                    onChangeCondition={setActiveCondition}
                    notesForNextVisit={activeAuthoring?.notes_for_next_visit ?? ""}
                    onChangeNotes={(v) =>
                      updateAuthoring({ notes_for_next_visit: v })
                    }
                    onPersistNotes={persistNotesForNextVisit}
                    savingNotes={savingNotes}
                  />
                  <AICoPilotPanel
                    pageType={pageType}
                    pageTitle={activePage.title}
                    pageKey={activePage.page_key}
                    narrative={activeNarrative}
                    observations={activeObservations}
                    onUpdateNarrative={(next) => updateActiveBlock("narrative", next)}
                    propertyId={state.propertyId}
                    initialReply={
                      qaMode ? QA_COPILOT_RESULTS[pageType] : undefined
                    }
                  />
                </div>
              }
              preview={
                pageType === "executive_summary" ? (
                  <ExecutiveSummaryPreview
                    familyName={deriveFamilyName(state.client.fullName)}
                    addressLine={
                      state.client.city &&
                      !state.client.address
                        .toLowerCase()
                        .includes(state.client.city.toLowerCase())
                        ? `${state.client.address} · ${state.client.city}`
                        : state.client.address
                    }
                    personalNote={activeNarrative}
                    topThemes={
                      activeAuthoring?.structured?.executiveSummary
                        ?.topThemes ?? ""
                    }
                  />
                ) : pageType === "room" ||
                  pageType === "system" ||
                  pageType === "vision" ? (
                  <StructuredPagePreview
                    pageKey={activePage.page_key}
                    title={activePage.title}
                    group={activePage.group}
                    sectionKey={activePage.sectionKey}
                    sectionLabel={activePage.sectionLabel}
                    authoring={activeAuthoring}
                    seed={activeSeed}
                    fallback={
                      <PageClientPreview
                        pageTitle={activePage.title}
                        sectionLabel={activePage.sectionLabel}
                        condition={activeCondition}
                        authoring={activeAuthoring}
                      />
                    }
                  />
                ) : (
                  <PageClientPreview
                    pageTitle={activePage.title}
                    sectionLabel={activePage.sectionLabel}
                    condition={activeCondition}
                    authoring={activeAuthoring}
                  />
                )
              }
            />
          ) : (
            <div className="rounded-lg border border-hbc-border bg-white p-6 text-xs font-sans text-hbc-grey">
              Pick a page from the sidebar to start authoring.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Inner pieces ───────────────────────────────────────────────────────

interface PageAdminEditorProps {
  pageType: PageType;
  isAppliance: boolean;
  structured: PageStructuredData | undefined;
  onChangeStructured: (patch: Partial<PageStructuredData>) => void;
  visionLinkOptions: VisionLinkOption[];
  pageTitle: string;
  onRenamePage: (title: string) => void;
  assignedPhotos: IntakeFileRef[];
  onChangeAssignedPhotos: (next: IntakeFileRef[]) => void;
  photoSlots: WizardPhotoSlots | undefined;
  onChangePhotoSlots: (next: WizardPhotoSlots) => void;
  allIntakePhotos: IntakeFileRef[];
  onSuggestPhotos: (
    current: Record<string, SystemPhotoSlotKey | null>,
  ) => Record<string, SystemPhotoSlotKey | null>;
  narrative: string;
  observations: string;
  onUpdateBlock: (type: string, value: string) => void;
  condition: string;
  onChangeCondition: (rating: string) => void;
  notesForNextVisit: string;
  onChangeNotes: (value: string) => void;
  onPersistNotes: (notes: string) => Promise<void>;
  savingNotes: boolean;
}

// The shared condition segmented control (word ratings only). Rooms show
// it in a standalone LIFECYCLE group; systems embed it inside the
// structured LIFECYCLE group next to lifespan + computed EOL.
function ConditionControl({
  condition,
  onChangeCondition,
}: {
  condition: string;
  onChangeCondition: (rating: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-sans text-hbc-grey">
        Condition rating
      </Label>
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Condition rating">
        {CONDITION_OPTIONS.map((opt) => {
          const isActive = condition.toLowerCase() === opt.toLowerCase();
          return (
            <button
              key={opt}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => onChangeCondition(opt)}
              className={`rounded-sm border px-3 py-2 text-xs font-sans min-h-[36px] transition-colors ${
                isActive
                  ? "border-hbc-navy bg-hbc-navy text-white"
                  : "border-hbc-border bg-white text-foreground hover:bg-hbc-surface"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Grouped-field admin editor: gold mono group labels above white field
// cards, prototype screens 8-15. Per-page-type structured editors (Room /
// System / Vision / Exec Summary) render first, followed by the shared
// narrative / observations / notes scaffold. Auto-save lives at the
// WizardContext level — content updates flow through onUpdateBlock and
// onChangeStructured.
function PageAdminEditor({
  pageType,
  isAppliance,
  structured,
  onChangeStructured,
  visionLinkOptions,
  pageTitle,
  onRenamePage,
  assignedPhotos,
  onChangeAssignedPhotos,
  photoSlots,
  onChangePhotoSlots,
  allIntakePhotos,
  onSuggestPhotos,
  narrative,
  observations,
  onUpdateBlock,
  condition,
  onChangeCondition,
  notesForNextVisit,
  onChangeNotes,
  onPersistNotes,
  savingNotes,
}: PageAdminEditorProps) {
  const isExec = pageType === "executive_summary";

  return (
    <div className="space-y-5">
      {pageType === "room" && structured?.room && (
        <RoomStructuredEditor
          value={structured.room}
          onChange={(room) => onChangeStructured({ room })}
          roomName={pageTitle}
          onRenameRoom={onRenamePage}
          visionOptions={visionLinkOptions}
        />
      )}

      {pageType === "system" && structured?.system && (
        <SystemStructuredEditor
          value={structured.system}
          onChange={(system) => onChangeStructured({ system })}
          showBriefing={!isAppliance}
          conditionControl={
            <ConditionControl
              condition={condition}
              onChangeCondition={onChangeCondition}
            />
          }
          photosGroup={
            <PhotosFieldGroup
              isSystem
              assigned={assignedPhotos}
              onChangeAssigned={onChangeAssignedPhotos}
              slots={photoSlots}
              onChangeSlots={onChangePhotoSlots}
              allPhotos={allIntakePhotos}
              onSuggest={onSuggestPhotos}
            />
          }
        />
      )}

      {isExec && (
        <ExecutiveSummaryEditor
          personalNote={narrative}
          onChangeNote={(v) => onUpdateBlock("narrative", v)}
          topThemes={structured?.executiveSummary?.topThemes ?? ""}
          onChangeThemes={(v) =>
            onChangeStructured({
              executiveSummary: {
                ...(structured?.executiveSummary ?? {}),
                topThemes: v,
              },
            })
          }
        />
      )}

      {!isExec && (
        <FieldGroup label={pageType === "vision" ? "The Vision" : "Narrative"}>
          <div className="space-y-1.5">
            <Label className="text-xs font-sans text-hbc-grey">
              {pageType === "vision"
                ? "The aspirational story of this project"
                : "Page narrative"}
            </Label>
            <Textarea
              value={narrative}
              onChange={(e) => onUpdateBlock("narrative", e.target.value)}
              rows={6}
              placeholder="The big-picture summary the client reads first."
              className="text-xs bg-white"
            />
          </div>
        </FieldGroup>
      )}

      {pageType === "vision" && structured?.vision && (
        <VisionStructuredEditor
          value={structured.vision}
          onChange={(vision) => onChangeStructured({ vision })}
        />
      )}

      {!isExec && (
        <FieldGroup label="Observations">
          <div className="space-y-1.5">
            <Label className="text-xs font-sans text-hbc-grey">
              What you saw on the walkthrough
            </Label>
            <Textarea
              value={observations}
              onChange={(e) => onUpdateBlock("observations", e.target.value)}
              rows={5}
              placeholder="Bullets are fine."
              className="text-xs bg-white"
            />
          </div>
        </FieldGroup>
      )}

      {!isExec && pageType !== "system" && (
        <FieldGroup label="Lifecycle">
          <ConditionControl
            condition={condition}
            onChangeCondition={onChangeCondition}
          />
        </FieldGroup>
      )}

      {!isExec && pageType !== "system" && (
        <PhotosFieldGroup
          isSystem={false}
          assigned={assignedPhotos}
          onChangeAssigned={onChangeAssignedPhotos}
          slots={photoSlots}
          onChangeSlots={onChangePhotoSlots}
          allPhotos={allIntakePhotos}
          onSuggest={onSuggestPhotos}
        />
      )}

      <FieldGroup label="Admin Notes (Hidden From Client)">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <Label className="text-xs font-sans text-hbc-grey">
              Notes for next visit
            </Label>
            {savingNotes && (
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                Saving...
              </span>
            )}
          </div>
          <Textarea
            value={notesForNextVisit}
            onChange={(e) => onChangeNotes(e.target.value)}
            onBlur={(e) => {
              const v = e.target.value;
              void onPersistNotes(v);
            }}
            rows={3}
            placeholder="What to confirm or revisit at the next annual review. Hidden from the client."
            className="text-xs bg-white"
          />
          <p className="text-[10px] font-sans text-muted-foreground">
            Saved to annual_review_notes. Hidden from the client portal.
          </p>
        </div>
      </FieldGroup>
    </div>
  );
}

interface PageClientPreviewProps {
  pageTitle: string;
  sectionLabel: string;
  condition: string;
  authoring: PageAuthoring | undefined;
}

const CONDITION_DOT: Record<string, string> = {
  excellent: "bg-emerald-600",
  good: "bg-emerald-600",
  fair: "bg-[hsl(var(--hbc-gold-readable))]",
  poor: "bg-destructive",
  critical: "bg-destructive",
};

// A read-only mock of the client-facing render. The real renderer is
// SharedBlockRenderer; we reuse the same content[] shape so wiring it
// in is a swap, not a rewrite.
function PageClientPreview({
  pageTitle,
  sectionLabel,
  condition,
  authoring,
}: PageClientPreviewProps) {
  const blocks = (authoring?.content ?? []) as Array<Record<string, unknown>>;
  const narrativeBlock = blocks.find(
    (b) => typeof b.type === "string" && b.type === "narrative",
  );
  const observationsBlock = blocks.find(
    (b) => typeof b.type === "string" && b.type === "observations",
  );
  const narrative = (narrativeBlock?.value as string | undefined) ?? "";
  const observations = (observationsBlock?.value as string | undefined) ?? "";
  const conditionKey = condition.trim().toLowerCase();

  return (
    <div className="rounded-lg bg-white shadow-hbc-sm overflow-hidden">
      <div className="px-6 pt-6 pb-5 border-b border-hbc-border">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-hbc-gold-readable">
          {sectionLabel}
        </div>
        <h2 className="font-display text-3xl text-hbc-navy mt-1.5">
          {pageTitle}
        </h2>
        {conditionKey && (
          <div className="flex items-center gap-1.5 mt-3">
            <span
              className={`h-2 w-2 rounded-full ${CONDITION_DOT[conditionKey] ?? "bg-hbc-grey-500"}`}
              aria-hidden
            />
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-hbc-grey">
              {condition}
            </span>
          </div>
        )}
      </div>
      <div className="px-6 py-5 space-y-4">
        {narrative ? (
          <p className="text-sm font-sans text-foreground whitespace-pre-line leading-relaxed">
            {narrative}
          </p>
        ) : (
          <p className="text-xs font-sans text-hbc-grey italic">
            The narrative will appear here as you write.
          </p>
        )}
        {observations && (
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-hbc-gold-readable mb-1.5">
              Observations
            </div>
            <p className="text-sm font-sans text-foreground whitespace-pre-line leading-relaxed">
              {observations}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
