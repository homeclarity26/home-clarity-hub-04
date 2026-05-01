import { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles, AlertCircle, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  useWizard,
  type PageSeed,
  type IntakeFinding,
  type CapitalPlan,
  type CapitalPlanYear,
  type MaintenanceCalendar,
  type MaintenanceTask,
  type RecurringServicePreview,
} from "@/contexts/WizardContext";
import { WizardNavigation } from "./WizardNavigation";
import { PhaseCard } from "./PhaseCard";

// Step 4 — Strategy. On mount the wizard auto-fires three Sonnet 4.6
// generators in parallel (capital plan, recurring services register,
// maintenance calendar) so the consultant lands on a fully drafted
// strategy view and only has to refine. A top progress banner streams
// the running count while sections fill in. Each section is editable
// inline so adam can nudge AI output toward what he actually saw on the
// walkthrough. Phase classification (defense / offense / expansion) is
// hydrated from state.pageSeeds + intake findings via classifyPhases.

const SEASONS: Array<{ key: keyof MaintenanceCalendar; label: string }> = [
  { key: "winter", label: "Winter" },
  { key: "spring", label: "Spring" },
  { key: "summer", label: "Summer" },
  { key: "fall", label: "Fall" },
];

interface PhasedProject {
  key: string;
  title: string;
}

function classifyPhases(
  pageSeeds: PageSeed[],
  intakeFindings: IntakeFinding[],
): {
  defense: PhasedProject[];
  offense: PhasedProject[];
  expansion: PhasedProject[];
} {
  const defense: PhasedProject[] = [];
  const offense: PhasedProject[] = [];
  const expansion: PhasedProject[] = [];
  const seen = new Set<string>();

  const sequenceRiskKeywords = (
    intakeFindings.find((f) => f.category === "sequence_risk")?.bullets ?? []
  )
    .map((b) => b.toLowerCase())
    .join(" ");

  for (const seed of pageSeeds) {
    if (seen.has(seed.page_key)) continue;
    seen.add(seed.page_key);
    const condition = (seed.suggested_condition ?? "").toLowerCase();
    const group = (seed.group ?? "").toLowerCase();
    const title = (seed.title ?? "").toLowerCase();
    const isVision =
      seed.page_key.includes("vision") ||
      group.includes("strategy") ||
      title.includes("vision");

    const entry: PhasedProject = { key: seed.page_key, title: seed.title };

    if (isVision) {
      expansion.push(entry);
      continue;
    }
    const flaggedBySequenceRisk =
      title.length > 0 && sequenceRiskKeywords.includes(title);
    if (condition === "critical" || flaggedBySequenceRisk) {
      defense.push(entry);
      continue;
    }
    const hasBriefing =
      seed.replacement_briefing_stub != null &&
      typeof seed.replacement_briefing_stub === "object";
    if (seed.priority === true || hasBriefing || condition === "poor") {
      offense.push(entry);
    }
  }
  return { defense, offense, expansion };
}

interface SectionStatus {
  capital: "idle" | "running" | "ready" | "error";
  services: "idle" | "running" | "ready" | "error";
  calendar: "idle" | "running" | "ready" | "error";
}

const TOTAL_SECTIONS = 3;

export function Step4Strategy() {
  const {
    state,
    goToStep,
    setStrategy,
    setCapitalPlan,
    setMaintenanceCalendar,
    setRecurringServicesPreview,
  } = useWizard();
  const autoFiredRef = useRef(false);
  const [status, setStatus] = useState<SectionStatus>({
    capital: state.capitalPlan ? "ready" : "idle",
    services: state.recurringServicesPreview.length > 0 ? "ready" : "idle",
    calendar: state.maintenanceCalendar ? "ready" : "idle",
  });
  const [errors, setErrors] = useState<{
    capital?: string;
    services?: string;
    calendar?: string;
  }>({});

  const phases = useMemo(
    () => classifyPhases(state.pageSeeds, state.intakeFindings),
    [state.pageSeeds, state.intakeFindings],
  );

  // Cache phase project IDs into wizard state once classified, so Step 5
  // and downstream blocks pick them up without re-running the classifier.
  // Skips when arrays are already populated so manual edits stick.
  useEffect(() => {
    const totalAlready =
      state.strategy.defense_project_ids.length +
      state.strategy.offense_project_ids.length +
      state.strategy.expansion_project_ids.length;
    if (totalAlready > 0) return;
    const total =
      phases.defense.length + phases.offense.length + phases.expansion.length;
    if (total === 0) return;
    setStrategy({
      defense_project_ids: phases.defense.map((p) => p.key),
      offense_project_ids: phases.offense.map((p) => p.key),
      expansion_project_ids: phases.expansion.map((p) => p.key),
    });
  }, [
    phases,
    state.strategy.defense_project_ids.length,
    state.strategy.offense_project_ids.length,
    state.strategy.expansion_project_ids.length,
    setStrategy,
  ]);

  const propertyContext = useMemo(
    () => ({
      address: state.client.address || undefined,
      year_built: state.client.yearBuilt || null,
      sqft: state.client.sqft || null,
      bedrooms: state.client.bedrooms || null,
      bathrooms: state.client.bathrooms || null,
      property_type: state.client.propertyType || null,
    }),
    [state.client],
  );

  const sequenceRiskFlags = useMemo(
    () =>
      state.intakeFindings
        .filter((f) => f.category === "sequence_risk")
        .map((f) => ({ title: f.title, bullets: f.bullets })),
    [state.intakeFindings],
  );

  const runCapitalPlan = async (force = false) => {
    if (!state.propertyId) return;
    if (!force && state.capitalPlan) return;
    setStatus((s) => ({ ...s, capital: "running" }));
    setErrors((e) => ({ ...e, capital: undefined }));
    try {
      const { data, error } = await supabase.functions.invoke(
        "generate-capital-plan",
        {
          body: {
            property_id: state.propertyId,
            page_seeds: state.pageSeeds,
            sequence_risk_flags: sequenceRiskFlags,
            property_context: propertyContext,
            clarifying_answers: state.clarifyingAnswers,
          },
        },
      );
      if (error) throw error;
      const plan = (data as { capital_plan?: CapitalPlan } | null)?.capital_plan;
      if (!plan || !Array.isArray(plan.years)) throw new Error("Empty plan");
      setCapitalPlan(plan);
      setStatus((s) => ({ ...s, capital: "ready" }));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setErrors((e) => ({ ...e, capital: message }));
      setStatus((s) => ({ ...s, capital: "error" }));
    }
  };

  const runRecurringRegister = async (force = false) => {
    if (!state.propertyId) return;
    if (!force && state.recurringServicesPreview.length > 0) return;
    setStatus((s) => ({ ...s, services: "running" }));
    setErrors((e) => ({ ...e, services: undefined }));
    try {
      const intakeSignals = {
        discovery_notes_html: state.client.discoveryNotes || undefined,
        anything_else_html: state.anythingElse || undefined,
      };
      const { data, error } = await supabase.functions.invoke(
        "generate-recurring-services-register",
        {
          body: {
            property_id: state.propertyId,
            intake_signals: intakeSignals,
          },
        },
      );
      if (error) throw error;
      const proposalsRaw =
        (data as { proposals?: unknown[] } | null)?.proposals ?? [];
      const proposals: RecurringServicePreview[] = [];
      for (const p of proposalsRaw) {
        if (!p || typeof p !== "object") continue;
        const r = p as Record<string, unknown>;
        const category = typeof r.category === "string" ? r.category : null;
        const service_name =
          typeof r.service_name === "string" ? r.service_name : null;
        const frequency = typeof r.frequency === "string" ? r.frequency : null;
        if (!category || !service_name || !frequency) continue;
        proposals.push({
          category,
          service_name,
          vendor_name: typeof r.vendor_name === "string" ? r.vendor_name : null,
          frequency,
          cost_per_visit:
            typeof r.cost_per_visit === "number" ? r.cost_per_visit : null,
          annual_cost:
            typeof r.annual_cost === "number" ? r.annual_cost : null,
          hbc_managed: r.hbc_managed === true,
        });
      }
      setRecurringServicesPreview(proposals);
      setStrategy({ recurring_register_built: true });
      setStatus((s) => ({ ...s, services: "ready" }));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setErrors((e) => ({ ...e, services: message }));
      setStatus((s) => ({ ...s, services: "error" }));
    }
  };

  const runMaintenanceCalendar = async (force = false) => {
    if (!state.propertyId) return;
    if (!force && state.maintenanceCalendar) return;
    setStatus((s) => ({ ...s, calendar: "running" }));
    setErrors((e) => ({ ...e, calendar: undefined }));
    try {
      const { data, error } = await supabase.functions.invoke(
        "generate-maintenance-calendar",
        {
          body: {
            property_id: state.propertyId,
            page_seeds: state.pageSeeds,
            equipment_list: [],
          },
        },
      );
      if (error) throw error;
      const cal = (data as { maintenance_calendar?: MaintenanceCalendar } | null)
        ?.maintenance_calendar;
      if (
        !cal ||
        !Array.isArray(cal.winter) ||
        !Array.isArray(cal.spring) ||
        !Array.isArray(cal.summer) ||
        !Array.isArray(cal.fall)
      ) {
        throw new Error("Empty calendar");
      }
      setMaintenanceCalendar(cal);
      setStatus((s) => ({ ...s, calendar: "ready" }));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setErrors((e) => ({ ...e, calendar: message }));
      setStatus((s) => ({ ...s, calendar: "error" }));
    }
  };

  // Auto-fire all three generators in parallel the first time the
  // consultant lands on Step 4 with a property_id. Each generator is a
  // no-op if its slot is already populated (handles resume + remount
  // gracefully). PR #158's ensurePropertyAndReport flow normally
  // guarantees property_id by the time Step 4 mounts; if not, the
  // banner below tells the consultant to save Step 1 first.
  useEffect(() => {
    if (autoFiredRef.current) return;
    if (state.currentStep !== "strategy") return;
    if (!state.propertyId) return;
    autoFiredRef.current = true;
    void Promise.allSettled([
      runCapitalPlan(),
      runRecurringRegister(),
      runMaintenanceCalendar(),
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.currentStep, state.propertyId]);

  const completedSections =
    (status.capital === "ready" ? 1 : 0) +
    (status.services === "ready" ? 1 : 0) +
    (status.calendar === "ready" ? 1 : 0);
  const anyRunning =
    status.capital === "running" ||
    status.services === "running" ||
    status.calendar === "running";

  return (
    <div className="space-y-5">
      <Card className="p-6">
        <h3 className="text-base font-sans font-semibold text-foreground">
          Strategy and roadmap
        </h3>
        <p className="text-xs font-sans text-muted-foreground mt-1">
          Sequence projects across three phases, set the capital plan, and
          confirm the recurring services and maintenance calendar.
        </p>
      </Card>

      {(anyRunning || completedSections < TOTAL_SECTIONS) && state.propertyId && (
        <Card className="p-4 border-primary/30 bg-primary/5">
          <div className="flex items-center gap-3">
            {anyRunning ? (
              <Loader2
                className="w-4 h-4 animate-spin text-primary"
                aria-hidden
              />
            ) : (
              <Sparkles className="w-4 h-4 text-primary" aria-hidden />
            )}
            <div className="flex-1">
              <div className="text-[10px] font-mono uppercase tracking-wider text-primary">
                AI is drafting your strategy
              </div>
              <p className="text-xs font-sans text-foreground mt-0.5">
                {completedSections} of {TOTAL_SECTIONS} sections done
                {anyRunning ? "..." : "."}
              </p>
            </div>
          </div>
        </Card>
      )}

      {!state.propertyId && (
        <Card className="p-4 border-amber-200 bg-amber-50">
          <div className="flex items-start gap-2 text-xs font-sans text-amber-800">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden />
            <span>
              Property has not saved yet. Fill in the client name and address
              on Step 1; the strategy generators fire automatically as soon
              as the property row exists.
            </span>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <PhaseCard
          tone="defense"
          title="Defense"
          description="Stabilize what's at risk. Roof, water intrusion, life-safety."
          count={phases.defense.length}
        >
          {phases.defense.length > 0 && (
            <ul className="text-[11px] font-sans text-foreground space-y-0.5">
              {phases.defense.map((p) => (
                <li key={p.key}>• {p.title}</li>
              ))}
            </ul>
          )}
        </PhaseCard>
        <PhaseCard
          tone="offense"
          title="Offense"
          description="High-leverage upgrades that move the home forward."
          count={phases.offense.length}
        >
          {phases.offense.length > 0 && (
            <ul className="text-[11px] font-sans text-foreground space-y-0.5">
              {phases.offense.map((p) => (
                <li key={p.key}>• {p.title}</li>
              ))}
            </ul>
          )}
        </PhaseCard>
        <PhaseCard
          tone="expansion"
          title="Expansion"
          description="Vision projects: kitchens, additions, design-fee work."
          count={phases.expansion.length}
        >
          {phases.expansion.length > 0 && (
            <ul className="text-[11px] font-sans text-foreground space-y-0.5">
              {phases.expansion.map((p) => (
                <li key={p.key}>• {p.title}</li>
              ))}
            </ul>
          )}
        </PhaseCard>
      </div>

      <CapitalPlanSection
        plan={state.capitalPlan}
        status={status.capital}
        errorMessage={errors.capital}
        onRebuild={() => void runCapitalPlan(true)}
        onChange={setCapitalPlan}
      />

      <RecurringServicesSection
        proposals={state.recurringServicesPreview}
        status={status.services}
        errorMessage={errors.services}
        onRebuild={() => void runRecurringRegister(true)}
        onChange={setRecurringServicesPreview}
      />

      <MaintenanceCalendarSection
        calendar={state.maintenanceCalendar}
        status={status.calendar}
        errorMessage={errors.calendar}
        onRebuild={() => void runMaintenanceCalendar(true)}
        onChange={setMaintenanceCalendar}
      />

      <WizardNavigation
        onBack={() => goToStep("authoring")}
        onNext={() => goToStep("publish")}
      />
    </div>
  );
}

interface CapitalPlanSectionProps {
  plan: CapitalPlan | null;
  status: SectionStatus["capital"];
  errorMessage?: string;
  onRebuild: () => void;
  onChange: (next: CapitalPlan | null) => void;
}

function CapitalPlanSection({
  plan,
  status,
  errorMessage,
  onRebuild,
  onChange,
}: CapitalPlanSectionProps) {
  const updateRow = (idx: number, patch: Partial<CapitalPlanYear>) => {
    if (!plan) return;
    const nextYears = plan.years.map((y, i) => (i === idx ? { ...y, ...patch } : y));
    const total_low = nextYears.reduce((sum, y) => sum + (y.ballpark_low || 0), 0);
    const total_high = nextYears.reduce((sum, y) => sum + (y.ballpark_high || 0), 0);
    onChange({ years: nextYears, total_low, total_high });
  };

  const removeRow = (idx: number) => {
    if (!plan) return;
    const nextYears = plan.years.filter((_, i) => i !== idx);
    const total_low = nextYears.reduce((sum, y) => sum + (y.ballpark_low || 0), 0);
    const total_high = nextYears.reduce((sum, y) => sum + (y.ballpark_high || 0), 0);
    onChange({ years: nextYears, total_low, total_high });
  };

  return (
    <Card className="p-5 space-y-3">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h4 className="text-sm font-sans font-semibold text-foreground">
            Capital plan
          </h4>
          <p className="text-xs font-sans text-muted-foreground">
            10-year roadmap. Edit any row inline; total recomputes live.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRebuild}
          disabled={status === "running"}
          className="h-9 text-[11px] gap-1.5"
        >
          {status === "running" ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden />
          ) : (
            <RotateCcw className="w-3.5 h-3.5" aria-hidden />
          )}
          {plan ? "Rebuild" : "Build"}
        </Button>
      </div>

      {status === "running" && !plan && (
        <div className="flex items-center gap-2 text-xs font-sans text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
          Drafting 10-year capital plan...
        </div>
      )}

      {status === "error" && (
        <div className="flex items-start gap-2 text-xs font-sans text-destructive">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden />
          <span>{errorMessage || "Could not build capital plan."}</span>
        </div>
      )}

      {plan && plan.years.length > 0 && (
        <div className="space-y-2">
          <div className="grid grid-cols-12 gap-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground px-1">
            <div className="col-span-1">Yr</div>
            <div className="col-span-2">Phase</div>
            <div className="col-span-4">Project</div>
            <div className="col-span-2">Low</div>
            <div className="col-span-2">High</div>
            <div className="col-span-1" />
          </div>
          {plan.years.map((row, idx) => (
            <div
              key={`${row.year}-${idx}`}
              className="grid grid-cols-12 gap-2 items-start"
            >
              <Input
                type="number"
                value={row.year}
                onChange={(e) => updateRow(idx, { year: Number(e.target.value) || 1 })}
                className="col-span-1 text-xs h-9"
              />
              <Input
                value={row.phase}
                onChange={(e) =>
                  updateRow(idx, {
                    phase: e.target.value as CapitalPlanYear["phase"],
                  })
                }
                className="col-span-2 text-xs h-9"
              />
              <div className="col-span-4 space-y-1">
                <Input
                  value={row.project}
                  onChange={(e) => updateRow(idx, { project: e.target.value })}
                  className="text-xs h-9"
                />
                <Textarea
                  value={row.rationale}
                  onChange={(e) => updateRow(idx, { rationale: e.target.value })}
                  rows={2}
                  className="text-[11px]"
                />
              </div>
              <Input
                type="number"
                value={row.ballpark_low}
                onChange={(e) =>
                  updateRow(idx, { ballpark_low: Number(e.target.value) || 0 })
                }
                className="col-span-2 text-xs h-9"
              />
              <Input
                type="number"
                value={row.ballpark_high}
                onChange={(e) =>
                  updateRow(idx, { ballpark_high: Number(e.target.value) || 0 })
                }
                className="col-span-2 text-xs h-9"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="col-span-1 h-9 text-[10px]"
                onClick={() => removeRow(idx)}
              >
                Remove
              </Button>
            </div>
          ))}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Total range
            </div>
            <div className="text-sm font-sans font-semibold text-foreground">
              ${plan.total_low.toLocaleString()} to ${plan.total_high.toLocaleString()}
            </div>
          </div>
        </div>
      )}

      {plan && plan.years.length === 0 && status !== "running" && (
        <div className="rounded-md border border-dashed border-border bg-muted/30 px-4 py-6 text-xs font-sans text-muted-foreground">
          Plan is empty. Click Rebuild to draft a fresh 10-year roadmap.
        </div>
      )}
    </Card>
  );
}

interface RecurringServicesSectionProps {
  proposals: RecurringServicePreview[];
  status: SectionStatus["services"];
  errorMessage?: string;
  onRebuild: () => void;
  onChange: (next: RecurringServicePreview[]) => void;
}

function RecurringServicesSection({
  proposals,
  status,
  errorMessage,
  onRebuild,
  onChange,
}: RecurringServicesSectionProps) {
  const updateRow = (idx: number, patch: Partial<RecurringServicePreview>) => {
    onChange(proposals.map((p, i) => (i === idx ? { ...p, ...patch } : p)));
  };

  return (
    <Card className="p-5 space-y-3">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h4 className="text-sm font-sans font-semibold text-foreground">
            Recurring services register
          </h4>
          <p className="text-xs font-sans text-muted-foreground">
            Categories, frequencies, and HBC-managed toggles. Honest framing:
            the value is saved time and reduced stress, not lower cost.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRebuild}
          disabled={status === "running"}
          className="h-9 text-[11px] gap-1.5"
        >
          {status === "running" ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden />
          ) : (
            <RotateCcw className="w-3.5 h-3.5" aria-hidden />
          )}
          {proposals.length > 0 ? "Rebuild" : "Build"}
        </Button>
      </div>

      {status === "running" && proposals.length === 0 && (
        <div className="flex items-center gap-2 text-xs font-sans text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
          Pulling recurring services from intake...
        </div>
      )}

      {status === "error" && (
        <div className="flex items-start gap-2 text-xs font-sans text-destructive">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden />
          <span>{errorMessage || "Could not build the register."}</span>
        </div>
      )}

      {proposals.length > 0 && (
        <div className="space-y-2">
          <div className="grid grid-cols-12 gap-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground px-1">
            <div className="col-span-3">Service</div>
            <div className="col-span-2">Category</div>
            <div className="col-span-2">Vendor</div>
            <div className="col-span-2">Frequency</div>
            <div className="col-span-2">Annual</div>
            <div className="col-span-1">HBC</div>
          </div>
          {proposals.map((p, idx) => (
            <div
              key={`${p.service_name}-${idx}`}
              className="grid grid-cols-12 gap-2 items-center"
            >
              <Input
                value={p.service_name}
                onChange={(e) => updateRow(idx, { service_name: e.target.value })}
                className="col-span-3 text-xs h-9"
              />
              <Input
                value={p.category}
                onChange={(e) => updateRow(idx, { category: e.target.value })}
                className="col-span-2 text-xs h-9"
              />
              <Input
                value={p.vendor_name ?? ""}
                onChange={(e) =>
                  updateRow(idx, { vendor_name: e.target.value || null })
                }
                placeholder="optional"
                className="col-span-2 text-xs h-9"
              />
              <Input
                value={p.frequency}
                onChange={(e) => updateRow(idx, { frequency: e.target.value })}
                className="col-span-2 text-xs h-9"
              />
              <Input
                type="number"
                value={p.annual_cost ?? ""}
                onChange={(e) =>
                  updateRow(idx, {
                    annual_cost:
                      e.target.value === "" ? null : Number(e.target.value),
                  })
                }
                className="col-span-2 text-xs h-9"
              />
              <label className="col-span-1 inline-flex items-center justify-center text-[10px] font-mono">
                <input
                  type="checkbox"
                  checked={p.hbc_managed}
                  onChange={(e) => updateRow(idx, { hbc_managed: e.target.checked })}
                  className="h-4 w-4"
                />
              </label>
            </div>
          ))}
        </div>
      )}

      {status === "ready" && proposals.length === 0 && (
        <div className="rounded-md border border-dashed border-border bg-muted/30 px-4 py-6 text-xs font-sans text-muted-foreground">
          No recurring services found in the intake. Add them manually in the
          register block once the report is published, or drop a transcript
          into Step 1 and rebuild.
        </div>
      )}
    </Card>
  );
}

interface MaintenanceCalendarSectionProps {
  calendar: MaintenanceCalendar | null;
  status: SectionStatus["calendar"];
  errorMessage?: string;
  onRebuild: () => void;
  onChange: (next: MaintenanceCalendar | null) => void;
}

function MaintenanceCalendarSection({
  calendar,
  status,
  errorMessage,
  onRebuild,
  onChange,
}: MaintenanceCalendarSectionProps) {
  const updateTask = (
    season: keyof MaintenanceCalendar,
    idx: number,
    patch: Partial<MaintenanceTask>,
  ) => {
    if (!calendar) return;
    const seasonTasks = calendar[season].map((t, i) =>
      i === idx ? { ...t, ...patch } : t,
    );
    onChange({ ...calendar, [season]: seasonTasks });
  };

  return (
    <Card className="p-5 space-y-3">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h4 className="text-sm font-sans font-semibold text-foreground">
            Maintenance calendar
          </h4>
          <p className="text-xs font-sans text-muted-foreground">
            Four-season grid. Edit any task inline; HBC Concierge can pick
            up the calendar at publish.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRebuild}
          disabled={status === "running"}
          className="h-9 text-[11px] gap-1.5"
        >
          {status === "running" ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden />
          ) : (
            <RotateCcw className="w-3.5 h-3.5" aria-hidden />
          )}
          {calendar ? "Rebuild" : "Build"}
        </Button>
      </div>

      {status === "running" && !calendar && (
        <div className="flex items-center gap-2 text-xs font-sans text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
          Drafting four-season calendar...
        </div>
      )}

      {status === "error" && (
        <div className="flex items-start gap-2 text-xs font-sans text-destructive">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden />
          <span>{errorMessage || "Could not build the calendar."}</span>
        </div>
      )}

      {calendar && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {SEASONS.map(({ key, label }) => {
            const tasks = calendar[key];
            return (
              <div key={key} className="rounded-md border border-border p-3">
                <div className="text-[10px] font-mono uppercase tracking-wider text-primary">
                  {label}
                </div>
                {tasks.length === 0 ? (
                  <div className="mt-2 text-[11px] font-sans text-muted-foreground">
                    No tasks yet.
                  </div>
                ) : (
                  <ul className="mt-2 space-y-2">
                    {tasks.map((t, idx) => (
                      <li key={idx} className="space-y-1">
                        <Input
                          value={t.task}
                          onChange={(e) =>
                            updateTask(key, idx, { task: e.target.value })
                          }
                          className="text-[11px] h-8"
                        />
                        <div className="grid grid-cols-2 gap-1">
                          <Input
                            value={t.system}
                            onChange={(e) =>
                              updateTask(key, idx, { system: e.target.value })
                            }
                            placeholder="System"
                            className="text-[10px] h-7"
                          />
                          <Input
                            value={t.frequency}
                            onChange={(e) =>
                              updateTask(key, idx, { frequency: e.target.value })
                            }
                            placeholder="Frequency"
                            className="text-[10px] h-7"
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
