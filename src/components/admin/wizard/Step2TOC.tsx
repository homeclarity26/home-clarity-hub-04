import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Loader2, Sparkles, Star, Plus, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  useWizard,
  type TocPage,
  type TocSection,
  type TocSectionKey,
} from "@/contexts/WizardContext";
import { WizardNavigation } from "./WizardNavigation";
import { CustomPageDialog } from "./CustomPageDialog";
import { CustomSectionDialog } from "./CustomSectionDialog";

// Step 2 — TOC Proposal. Four canonical sections (Information / Spaces /
// Systems & Appliances / Strategy) plus any custom sections the admin has
// added. Source: recommend-report-pages (E8 already returns four-section
// grouping). Toggling, featuring, and add-custom flows are all local-state
// — the actual report_pages INSERTs land on Step 2 → Step 3 transition.

interface CanonicalSection {
  key: TocSectionKey;
  label: string;
}

const CANONICAL_SECTIONS: CanonicalSection[] = [
  { key: "information", label: "Information" },
  { key: "spaces", label: "Spaces" },
  { key: "systems_appliances", label: "Systems and Appliances" },
  { key: "strategy", label: "Strategy" },
];

interface PageTemplateRow {
  slug: string;
  name: string;
  group_name: string;
  sub_group: string | null;
  is_custom: boolean | null;
}

const groupToSectionKey = (group: string): TocSectionKey => {
  const g = (group || "").toLowerCase();
  if (g === "information" || g.startsWith("info")) return "information";
  if (g === "strategy" || g.startsWith("strategy")) return "strategy";
  if (g.startsWith("system") || g.startsWith("appliance") || g.startsWith("safety")) {
    return "systems_appliances";
  }
  return "spaces";
};

interface RecommendationsByKey {
  information: { page_key: string; reason: string }[];
  spaces: { page_key: string; reason: string }[];
  systems_appliances: { page_key: string; reason: string }[];
  strategy: { page_key: string; reason: string }[];
}

export function Step2TOC() {
  const {
    state,
    goToStep,
    setTocSections,
    setTocReasoning,
    togglePage,
    toggleFeatured,
    addCustomPage,
    addCustomSection,
  } = useWizard();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customPageOpen, setCustomPageOpen] = useState(false);
  const [customPageSection, setCustomPageSection] = useState<TocSectionKey>("spaces");
  const [customSectionOpen, setCustomSectionOpen] = useState(false);

  // First load: hydrate from recommend-report-pages if state.tocSections
  // is empty. If we already have sections (e.g. resumed from URL), skip.
  useEffect(() => {
    if (state.tocSections.length > 0) return;
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: templates, error: tplErr } = await supabase
          .from("page_templates")
          .select("slug, name, group_name, sub_group, is_custom");
        if (tplErr) throw tplErr;
        const availablePages = (templates ?? []).map((t: PageTemplateRow) => ({
          slug: t.slug,
          name: t.name,
          group: t.group_name,
        }));

        // Build the intelligence summary from intake state.
        const summaryParts: string[] = [];
        if (state.client.discoveryNotes)
          summaryParts.push(state.client.discoveryNotes);
        if (state.anythingElse) summaryParts.push(state.anythingElse);
        for (const f of state.intakeFindings) {
          summaryParts.push(`${f.title}: ${f.bullets.join("; ")}`);
        }
        const intelligenceSummary = summaryParts.join("\n\n") || "Standard home report.";

        const { data, error: rErr } = await supabase.functions.invoke(
          "recommend-report-pages",
          {
            body: {
              intelligenceSummary,
              goals: [],
              priorities: [],
              constraints: [],
              propertyType: state.client.propertyType || undefined,
              relationshipType: state.client.relationshipType || undefined,
              yearBuilt: state.client.yearBuilt || undefined,
              sqft: state.client.sqft || undefined,
              availablePages,
            },
          },
        );
        if (rErr) throw rErr;
        if (cancelled) return;

        const recommendations =
          (data?.recommendations as RecommendationsByKey | undefined) ?? {
            information: [],
            spaces: [],
            systems_appliances: [],
            strategy: [],
          };
        const aiSlugs = new Set<string>();
        const reasonByKey = new Map<string, string>();
        for (const key of Object.keys(recommendations) as (keyof RecommendationsByKey)[]) {
          for (const entry of recommendations[key] ?? []) {
            aiSlugs.add(entry.page_key);
            if (entry.reason) reasonByKey.set(entry.page_key, entry.reason);
          }
        }

        // Build the four canonical sections out of every available page.
        // Each page lands in exactly one section based on its group_name.
        const grouped: Record<TocSectionKey, TocPage[]> = {
          information: [],
          spaces: [],
          systems_appliances: [],
          strategy: [],
        };
        for (const t of templates ?? []) {
          const key = groupToSectionKey(t.group_name);
          grouped[key].push({
            page_key: t.slug,
            title: t.name,
            group: t.group_name,
            selected: aiSlugs.has(t.slug),
            ai_recommended: aiSlugs.has(t.slug),
            is_custom: Boolean(t.is_custom),
            is_featured: false,
            reason: reasonByKey.get(t.slug),
          });
        }

        const sections: TocSection[] = CANONICAL_SECTIONS.map((s) => ({
          key: s.key,
          label: s.label,
          pages: grouped[s.key],
        }));
        setTocSections(sections);
        const reasoning = typeof data?.reasoning === "string" ? data.reasoning : "";
        setTocReasoning(reasoning || null);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        toast({
          title: "Could not load TOC",
          description: message,
          variant: "destructive",
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalSelected = useMemo(
    () =>
      state.tocSections.reduce(
        (n, s) => n + s.pages.filter((p) => p.selected).length,
        0,
      ),
    [state.tocSections],
  );

  const handleContinue = async () => {
    if (totalSelected === 0) {
      toast({
        title: "Pick at least one page",
        description: "Select at least one page to continue.",
        variant: "destructive",
      });
      return;
    }
    await goToStep("authoring");
  };

  return (
    <div className="space-y-5">
      <Card className="p-6 space-y-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h3 className="text-base font-sans font-semibold text-foreground">
              Adjust which pages you want to include
            </h3>
            <p className="text-xs font-sans text-muted-foreground mt-1">
              We grouped your report into four sections. Toggle pages, mark
              favorites with the star, or add a custom page or section.
            </p>
          </div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            {totalSelected} pages selected
          </div>
        </div>
        {state.tocReasoning && (
          <div className="flex items-start gap-2 rounded-md border border-primary/30 bg-primary/[0.04] px-3 py-2">
            <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" aria-hidden />
            <p className="text-xs font-sans text-foreground">{state.tocReasoning}</p>
          </div>
        )}
        {error && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2">
            <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" aria-hidden />
            <p className="text-xs font-sans text-destructive">{error}</p>
          </div>
        )}
      </Card>

      {!loading && state.tocSections.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-[36px] text-[11px]"
            onClick={() => {
              setTocSections(
                state.tocSections.map((s) => ({
                  ...s,
                  pages: s.pages.map((p) => ({ ...p, selected: true })),
                })),
              );
            }}
          >
            Select all
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-[36px] text-[11px]"
            onClick={() => {
              setTocSections(
                state.tocSections.map((s) => ({
                  ...s,
                  pages: s.pages.map((p) => ({
                    ...p,
                    selected: p.ai_recommended,
                  })),
                })),
              );
            }}
          >
            Defaults only
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-[36px] text-[11px]"
            onClick={() => {
              setTocSections(
                state.tocSections.map((s) => ({
                  ...s,
                  pages: s.pages.map((p) => ({ ...p, selected: false })),
                })),
              );
            }}
          >
            Clear all
          </Button>
        </div>
      )}

      {loading && (
        <Card className="p-8 flex items-center justify-center gap-2 text-xs font-sans text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
          Loading recommendations...
        </Card>
      )}

      {!loading &&
        state.tocSections.map((section) => {
          const selected = section.pages.filter((p) => p.selected).length;
          const isCanonical = CANONICAL_SECTIONS.some((c) => c.key === section.key);
          return (
            <Card key={section.key} className="p-5 space-y-3">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h4 className="text-sm font-sans font-semibold text-foreground">
                    {section.label}
                  </h4>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                    {selected} of {section.pages.length} selected
                  </p>
                </div>
                {isCanonical && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCustomPageSection(section.key);
                      setCustomPageOpen(true);
                    }}
                    className="min-h-[44px]"
                  >
                    <Plus className="w-4 h-4 mr-1" aria-hidden />
                    Add custom page
                  </Button>
                )}
              </div>
              {section.pages.length === 0 ? (
                <p className="text-xs font-sans text-muted-foreground">
                  No pages in this section yet. Use Add custom page to add one.
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {section.pages.map((page) => (
                    <li
                      key={page.page_key}
                      className="flex items-center gap-3 rounded-md border border-border bg-background px-3 py-2"
                    >
                      <Switch
                        checked={page.selected}
                        onCheckedChange={() => togglePage(page.page_key)}
                        aria-label={`Toggle ${page.title}`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-sans text-foreground truncate">
                          {page.title}
                        </div>
                        {page.reason && (
                          <div className="text-[11px] font-sans text-muted-foreground truncate">
                            {page.reason}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {page.ai_recommended && (
                          <span
                            className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-primary"
                            title="AI recommended"
                          >
                            <Sparkles className="w-3 h-3" aria-hidden />
                            AI
                          </span>
                        )}
                        {page.is_custom && (
                          <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                            Custom
                          </span>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleFeatured(page.page_key)}
                          aria-label={
                            page.is_featured ? "Unfeature page" : "Feature page"
                          }
                          className="min-h-[36px] min-w-[36px]"
                        >
                          <Star
                            className={`w-4 h-4 ${page.is_featured ? "fill-primary text-primary" : "text-muted-foreground"}`}
                            aria-hidden
                          />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          );
        })}

      {!loading && state.tocSections.length > 0 && (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => setCustomSectionOpen(true)}
            className="min-h-[44px]"
          >
            <Plus className="w-4 h-4 mr-1" aria-hidden />
            Add custom section
          </Button>
        </div>
      )}

      <WizardNavigation
        onBack={() => goToStep("intake")}
        onNext={handleContinue}
        nextDisabled={loading || totalSelected === 0}
      />

      <CustomPageDialog
        open={customPageOpen}
        onOpenChange={setCustomPageOpen}
        sections={state.tocSections.map((s) => ({
          key: s.key,
          label: s.label,
        }))}
        defaultSection={customPageSection}
        onAdd={(sectionKey, page) => addCustomPage(sectionKey, page)}
      />

      <CustomSectionDialog
        open={customSectionOpen}
        onOpenChange={setCustomSectionOpen}
        onAdd={(section) => addCustomSection(section)}
      />
    </div>
  );
}
