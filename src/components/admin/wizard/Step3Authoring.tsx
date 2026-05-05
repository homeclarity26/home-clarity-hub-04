import { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Star, Loader2, CheckCircle2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  useWizard,
  type PageAuthoring,
  type PageAuthoringStatus,
  type TocPage,
} from "@/contexts/WizardContext";
import { useAuth } from "@/contexts/AuthContext";
import { WizardNavigation } from "./WizardNavigation";
import { SideBySideEditor } from "./SideBySideEditor";
import { AICoPilotPanel } from "./AICoPilotPanel";

// Step 3 — Authoring. Three columns on desktop:
//   left: page nav sidebar (status dots + featured ★)
//   center: side-by-side admin editor + client preview
//   bottom: AI Co-Pilot panel
//
// First-draft strategy: SideBySideEditor renders a generic admin form
// (title / narrative / observations / notes for next visit) and the
// preview pane renders the same fields as a styled, read-only mock of
// what the client will see. The page-type-specific editors (Room / System
// / Vision / Exec Summary) come behind this scaffold; the structure here
// is what makes them shippable.

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

interface SelectedPage extends TocPage {
  sectionLabel: string;
}

export function Step3Authoring() {
  const { user } = useAuth();
  const {
    state,
    goToStep,
    setActivePageKey,
    upsertAuthoring,
    setPageSeeds,
  } = useWizard();
  const [savingNotes, setSavingNotes] = useState(false);

  const selectedPages = useMemo<SelectedPage[]>(() => {
    const out: SelectedPage[] = [];
    for (const section of state.tocSections) {
      for (const page of section.pages) {
        if (!page.selected) continue;
        out.push({ ...page, sectionLabel: section.label });
      }
    }
    return out;
  }, [state.tocSections]);

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
  }, [selectedPages.length, state.currentStep]);

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

  if (selectedPages.length === 0) {
    return (
      <div className="space-y-4">
        <Card className="p-6">
          <h3 className="text-base font-sans font-semibold text-foreground">
            Step 3: Authoring
          </h3>
          <p className="text-xs font-sans text-muted-foreground mt-1">
            No pages selected yet. Go back to Step 2 and pick at least one page.
          </p>
        </Card>
        <WizardNavigation
          onBack={() => goToStep("toc")}
          nextDisabled
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {autoDraftStatus.total > 0 && (
        <Card className={`p-3 flex items-start gap-3 ${
          autoDraftStatus.active
            ? "border-accent/30 bg-accent/5"
            : autoDraftStatus.failed.length > 0
              ? "border-amber-300/40 bg-amber-50/40"
              : "border-emerald-600/30 bg-emerald-50/30"
        }`}>
          {autoDraftStatus.active ? (
            <Loader2 className="w-4 h-4 mt-0.5 animate-spin text-accent shrink-0" aria-hidden />
          ) : autoDraftStatus.failed.length > 0 ? (
            <Sparkles className="w-4 h-4 mt-0.5 text-amber-700 shrink-0" aria-hidden />
          ) : (
            <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-600 shrink-0" aria-hidden />
          )}
          <div className="flex-1 min-w-0">
            <div className="text-xs font-sans font-medium text-foreground">
              {autoDraftStatus.active
                ? `AI is drafting page narratives — ${autoDraftStatus.current} of ${autoDraftStatus.total} done`
                : autoDraftStatus.failed.length > 0
                  ? `${autoDraftStatus.total - autoDraftStatus.failed.length} of ${autoDraftStatus.total} pages drafted (${autoDraftStatus.failed.length} need a manual retry)`
                  : `All ${autoDraftStatus.total} empty pages drafted by AI`}
            </div>
            <div className="text-[10px] font-mono text-muted-foreground mt-0.5">
              {autoDraftStatus.active
                ? "Pages already drafted are ready to edit while the rest finish in the background."
                : autoDraftStatus.failed.length > 0
                  ? `Failed: ${autoDraftStatus.failed.slice(0, 3).join(" · ")}${autoDraftStatus.failed.length > 3 ? ` · +${autoDraftStatus.failed.length - 3} more` : ""}. Open each and use AI Co-Pilot to retry.`
                  : "Edit + refine using the AI Co-Pilot panel below each page."}
            </div>
          </div>
        </Card>
      )}
      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-4">
        {/* Left — Page nav sidebar */}
        <Card className="p-3 space-y-3 md:max-h-[calc(100vh-220px)] md:overflow-auto">
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            Pages ({selectedPages.length})
          </div>
          <ul className="space-y-1">
            {selectedPages.map((page) => {
              const authoring = state.authoring[page.page_key];
              const status: PageAuthoringStatus = authoring?.status ?? "draft";
              const isActive = state.activePageKey === page.page_key;
              return (
                <li key={page.page_key}>
                  <button
                    type="button"
                    onClick={() => setActivePageKey(page.page_key)}
                    className={`w-full text-left flex items-start gap-2 rounded-md px-2 py-2 min-h-[44px] transition-colors ${
                      isActive
                        ? "bg-primary/10 border border-primary/30"
                        : "border border-transparent hover:bg-muted/40"
                    }`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <span
                      className={`w-2 h-2 rounded-full mt-1.5 ${STATUS_DOT_CLASS[status]}`}
                      aria-label={STATUS_LABEL[status]}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-sans font-medium text-foreground truncate">
                        {page.title}
                      </div>
                      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground truncate">
                        {page.sectionLabel}
                      </div>
                    </div>
                    {(page.is_featured || authoring?.is_featured) && (
                      <Star className="w-3.5 h-3.5 fill-primary text-primary shrink-0" aria-hidden />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>

        {/* Center — side-by-side editor */}
        <div className="space-y-3 min-w-0">
          {activePage ? (
            <>
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                    {activePage.sectionLabel}
                  </div>
                  <h3 className="text-base font-sans font-semibold text-foreground">
                    {activePage.title}
                  </h3>
                </div>
                <StatusToggle
                  current={activeAuthoring?.status ?? "draft"}
                  onChange={(status) => updateAuthoring({ status })}
                />
              </div>

              <SideBySideEditor
                admin={
                  <PageAdminEditor
                    pageType={pageType}
                    narrative={activeNarrative}
                    observations={activeObservations}
                    onUpdateBlock={updateActiveBlock}
                    notesForNextVisit={activeAuthoring?.notes_for_next_visit ?? ""}
                    onChangeNotes={(v) =>
                      updateAuthoring({ notes_for_next_visit: v })
                    }
                    onPersistNotes={persistNotesForNextVisit}
                    savingNotes={savingNotes}
                  />
                }
                preview={
                  <PageClientPreview
                    pageTitle={activePage.title}
                    sectionLabel={activePage.sectionLabel}
                    authoring={activeAuthoring}
                  />
                }
              />

              <AICoPilotPanel
                pageType={pageType}
                pageTitle={activePage.title}
                pageKey={activePage.page_key}
                narrative={activeNarrative}
                observations={activeObservations}
                onUpdateNarrative={(next) => updateActiveBlock("narrative", next)}
                propertyId={state.propertyId}
              />
            </>
          ) : (
            <Card className="p-6 text-xs font-sans text-muted-foreground">
              Pick a page from the sidebar to start authoring.
            </Card>
          )}
        </div>
      </div>

      <WizardNavigation
        onBack={() => goToStep("toc")}
        onNext={() => goToStep("strategy")}
      />
    </div>
  );
}

// ─── Inner pieces ───────────────────────────────────────────────────────

interface StatusToggleProps {
  current: PageAuthoringStatus;
  onChange: (status: PageAuthoringStatus) => void;
}

function StatusToggle({ current, onChange }: StatusToggleProps) {
  const order: PageAuthoringStatus[] = ["draft", "reviewed", "complete"];
  return (
    <div className="flex items-center gap-1 rounded-md border border-border p-0.5 bg-background">
      {order.map((status) => {
        const isActive = current === status;
        return (
          <button
            key={status}
            type="button"
            onClick={() => onChange(status)}
            className={`text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded min-h-[36px] transition-colors ${
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {STATUS_LABEL[status]}
          </button>
        );
      })}
    </div>
  );
}

interface PageAdminEditorProps {
  pageType: PageType;
  narrative: string;
  observations: string;
  onUpdateBlock: (type: string, value: string) => void;
  notesForNextVisit: string;
  onChangeNotes: (value: string) => void;
  onPersistNotes: (notes: string) => Promise<void>;
  savingNotes: boolean;
}

// Generic admin editor. Renders the same scaffold for every page type;
// page-type-specific fields plug in here in a follow-up. Auto-save lives
// at the WizardContext level — content updates flow through onUpdateBlock.
function PageAdminEditor({
  pageType,
  narrative,
  observations,
  onUpdateBlock,
  notesForNextVisit,
  onChangeNotes,
  onPersistNotes,
  savingNotes,
}: PageAdminEditorProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-xs font-sans">Page narrative</Label>
        <Textarea
          value={narrative}
          onChange={(e) => onUpdateBlock("narrative", e.target.value)}
          rows={6}
          placeholder="The big-picture summary the client reads first."
          className="text-xs"
        />
      </div>

      {pageType !== "executive_summary" && (
        <div className="space-y-1.5">
          <Label className="text-xs font-sans">Observations</Label>
          <Textarea
            value={observations}
            onChange={(e) => onUpdateBlock("observations", e.target.value)}
            rows={5}
            placeholder="What you saw on the walkthrough. Bullets are fine."
            className="text-xs"
          />
        </div>
      )}

      <div className="space-y-1.5 pt-3 border-t border-border">
        <div className="flex items-center justify-between gap-2">
          <Label className="text-xs font-sans">
            Notes for next visit (admin only)
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
          className="text-xs"
        />
        <p className="text-[10px] font-sans text-muted-foreground">
          Saved to annual_review_notes. Hidden from the client portal.
        </p>
      </div>
    </div>
  );
}

interface PageClientPreviewProps {
  pageTitle: string;
  sectionLabel: string;
  authoring: PageAuthoring | undefined;
}

// A read-only mock of the client-facing render. The real renderer is
// SharedBlockRenderer; we reuse the same content[] shape so wiring it
// in is a swap, not a rewrite.
function PageClientPreview({
  pageTitle,
  sectionLabel,
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

  return (
    <div className="space-y-4">
      <div>
        <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          {sectionLabel}
        </div>
        <h2 className="text-xl font-display text-foreground">{pageTitle}</h2>
      </div>
      {narrative ? (
        <p className="text-sm font-sans text-foreground whitespace-pre-line">
          {narrative}
        </p>
      ) : (
        <p className="text-xs font-sans text-muted-foreground italic">
          The narrative will appear here as you write.
        </p>
      )}
      {observations && (
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
            Observations
          </div>
          <p className="text-sm font-sans text-foreground whitespace-pre-line">
            {observations}
          </p>
        </div>
      )}
    </div>
  );
}

// Suppress unused-import lint when react/runtime helpers aren't reached.
// (Input is used by the dialog imports indirectly; kept for parity.)
void Input;
