import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, Star, Plus, AlertCircle, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  useWizard,
  type TocPage,
  type TocSection,
  type TocSectionKey,
} from "@/contexts/WizardContext";
import { CustomPageDialog } from "./CustomPageDialog";
import { CustomSectionDialog } from "./CustomSectionDialog";
import { WizardStepHeader } from "./WizardShell";

// Step 2 — TOC Proposal, prototype screens 5-7. Four canonical sections
// (Information / Spaces / Systems & Appliances / Strategy) plus any custom
// sections the admin has added: section summary cards up top, then a
// 3-col grid of checkbox page cards per section (gold border when
// included). Source: recommend-report-pages (E8 already returns
// four-section grouping). Toggling, featuring, and add-custom flows are
// all local-state — the actual report_pages INSERTs land on Step 2 →
// Step 3 transition.

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
    <div className="space-y-6">
      <WizardStepHeader
        step={2}
        title="Proposed Table of Contents"
        description={`The AI proposed every page based on what it found in the intake. Toggle off anything you don't want, add custom pages, or rearrange. ${totalSelected} page${totalSelected === 1 ? "" : "s"} currently included.`}
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => goToStep("intake")}
              className="min-h-[44px] border-hbc-border bg-white text-hbc-navy"
            >
              ← Back
            </Button>
            <Button
              type="button"
              onClick={handleContinue}
              disabled={loading || totalSelected === 0}
              className="min-h-[44px] bg-hbc-navy text-white hover:bg-[hsl(var(--hbc-navy)/0.92)]"
            >
              Approve & Author Pages →
            </Button>
          </>
        }
      />

      {state.tocReasoning && (
        <div className="flex items-start gap-2 rounded-md border border-hbc-border bg-white px-4 py-3">
          <Sparkles className="w-4 h-4 text-hbc-gold-readable mt-0.5 shrink-0" aria-hidden />
          <p className="text-xs font-sans text-foreground">{state.tocReasoning}</p>
        </div>
      )}
      {error && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3">
          <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" aria-hidden />
          <p className="text-xs font-sans text-destructive">{error}</p>
        </div>
      )}

      {loading && (
        <div className="rounded-lg border border-hbc-border bg-white p-8 flex items-center justify-center gap-2 text-xs font-sans text-hbc-grey">
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
          Loading recommendations...
        </div>
      )}

      {/* Section summary cards */}
      {!loading && state.tocSections.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {state.tocSections.map((section, i) => {
            const selected = section.pages.filter((p) => p.selected).length;
            return (
              <div
                key={section.key}
                className="rounded-lg border border-hbc-border bg-white p-4"
              >
                <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-hbc-gold-readable">
                  Section {i + 1}
                </div>
                <div className="font-display text-lg text-hbc-navy mt-1 leading-tight">
                  {section.label}
                </div>
                <div className="text-[11px] font-sans text-hbc-grey mt-1">
                  {selected} of {section.pages.length} pages included
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bulk selection helpers */}
      {!loading && state.tocSections.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-[36px] text-[11px] border-hbc-border bg-white"
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
            className="min-h-[36px] text-[11px] border-hbc-border bg-white"
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
            className="min-h-[36px] text-[11px] border-hbc-border bg-white"
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

      {!loading &&
        state.tocSections.map((section) => {
          const selected = section.pages.filter((p) => p.selected).length;
          const isCanonical = CANONICAL_SECTIONS.some((c) => c.key === section.key);
          return (
            <section key={section.key} className="space-y-3">
              <div className="flex items-end justify-between gap-3 flex-wrap">
                <div className="flex items-baseline gap-3">
                  <h4 className="font-display text-2xl text-hbc-navy">
                    {section.label}
                  </h4>
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-hbc-gold-readable">
                    {selected} included
                  </span>
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
                    className="min-h-[36px] text-[11px] border-hbc-border bg-white"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" aria-hidden />
                    Add custom page
                  </Button>
                )}
              </div>
              {section.pages.length === 0 ? (
                <p className="text-xs font-sans text-hbc-grey">
                  No pages in this section yet. Use Add custom page to add one.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {section.pages.map((page) => (
                    <div
                      key={page.page_key}
                      className={`flex items-start gap-3 rounded-md border bg-white px-4 py-3 ${
                        page.selected ? "border-hbc-gold" : "border-hbc-border"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-sans font-semibold text-hbc-navy">
                          {page.title}
                        </div>
                        {(page.is_featured || page.reason) && (
                          <div className="text-[11px] font-sans text-hbc-grey mt-0.5">
                            {page.is_featured ? "Featured" : page.reason}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {page.is_custom && (
                          <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider text-muted-foreground">
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
                          className="min-h-[36px] min-w-[36px] px-1"
                        >
                          <Star
                            className={`w-4 h-4 ${page.is_featured ? "fill-hbc-gold text-hbc-gold" : "text-hbc-grey/50"}`}
                            aria-hidden
                          />
                        </Button>
                        <button
                          type="button"
                          role="checkbox"
                          aria-checked={page.selected}
                          aria-label={`Toggle ${page.title}`}
                          onClick={() => togglePage(page.page_key)}
                          className={`flex h-6 w-6 items-center justify-center rounded-sm border transition-colors ${
                            page.selected
                              ? "border-hbc-gold bg-hbc-gold text-white"
                              : "border-hbc-border bg-white"
                          }`}
                        >
                          {page.selected && (
                            <Check className="h-4 w-4" aria-hidden />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          );
        })}

      {!loading && state.tocSections.length > 0 && (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => setCustomSectionOpen(true)}
            className="min-h-[44px] border-hbc-border bg-white"
          >
            <Plus className="w-4 h-4 mr-1" aria-hidden />
            Add custom section
          </Button>
        </div>
      )}

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
