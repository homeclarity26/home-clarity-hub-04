import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Star } from "lucide-react";
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
            Step 3 — Authoring
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
                    authoring={activeAuthoring}
                    onChange={updateAuthoring}
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

              <AICoPilotPanel pageType={pageType} pageTitle={activePage.title} />
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
  authoring: PageAuthoring | undefined;
  onChange: (patch: Partial<PageAuthoring>) => void;
  onPersistNotes: (notes: string) => Promise<void>;
  savingNotes: boolean;
}

// Generic admin editor. Renders the same scaffold for every page type;
// page-type-specific fields plug in here in a follow-up. Auto-save lives
// at the WizardContext level — content updates flow through onChange.
function PageAdminEditor({
  pageType,
  authoring,
  onChange,
  onPersistNotes,
  savingNotes,
}: PageAdminEditorProps) {
  const blocks = (authoring?.content ?? []) as Array<Record<string, unknown>>;
  const narrativeBlock = blocks.find(
    (b) => typeof b.type === "string" && b.type === "narrative",
  );
  const narrative = (narrativeBlock?.value as string | undefined) ?? "";
  const observationsBlock = blocks.find(
    (b) => typeof b.type === "string" && b.type === "observations",
  );
  const observations = (observationsBlock?.value as string | undefined) ?? "";

  const updateBlock = (type: string, value: string) => {
    const next = blocks.filter(
      (b) => !(typeof b.type === "string" && b.type === type),
    );
    next.push({ type, value });
    onChange({ content: next });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-xs font-sans">Page narrative</Label>
        <Textarea
          value={narrative}
          onChange={(e) => updateBlock("narrative", e.target.value)}
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
            onChange={(e) => updateBlock("observations", e.target.value)}
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
          value={authoring?.notes_for_next_visit ?? ""}
          onChange={(e) => onChange({ notes_for_next_visit: e.target.value })}
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
