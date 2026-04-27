import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useWizard } from "@/contexts/WizardContext";
import { WizardNavigation } from "./WizardNavigation";
import { PhaseCard } from "./PhaseCard";

// Step 4 — Strategy. Three phase cards (Defense / Offense / Expansion) +
// surface-level entry points for the recurring services register and the
// capital plan + maintenance calendar blocks. The full block editors live
// in their own components (B6/B7/B8 already shipped); this step just
// orchestrates the wiring into the wizard envelope.

export function Step4Strategy() {
  const { state, goToStep, setStrategy } = useWizard();
  const [generating, setGenerating] = useState(false);

  const buildRecurringRegister = async () => {
    if (!state.propertyId) {
      toast({
        title: "Save the property first",
        description:
          "Step 1 needs to be saved before we can generate the recurring services register.",
        variant: "destructive",
      });
      return;
    }
    setGenerating(true);
    try {
      const intelligenceParts: string[] = [];
      if (state.client.discoveryNotes)
        intelligenceParts.push(state.client.discoveryNotes);
      if (state.anythingElse) intelligenceParts.push(state.anythingElse);
      for (const f of state.intakeFindings) {
        if (f.category === "recurring_services") {
          intelligenceParts.push(`${f.title}: ${f.bullets.join("; ")}`);
        }
      }

      const { error } = await supabase.functions.invoke(
        "generate-recurring-services-register",
        {
          body: {
            property_id: state.propertyId,
            intelligence: intelligenceParts.join("\n\n"),
          },
        },
      );
      if (error) throw error;
      setStrategy({ recurring_register_built: true });
      toast({
        title: "Recurring services register built",
        description: "Categories and frequencies are seeded. Refine in detail below.",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast({
        title: "Could not build register",
        description: message,
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <PhaseCard
          tone="defense"
          title="Defense"
          description="Stabilize what's at risk. Roof, water intrusion, life-safety."
          count={state.strategy.defense_project_ids.length}
        />
        <PhaseCard
          tone="offense"
          title="Offense"
          description="High-leverage upgrades that move the home forward."
          count={state.strategy.offense_project_ids.length}
        />
        <PhaseCard
          tone="expansion"
          title="Expansion"
          description="Vision projects: kitchens, additions, design-fee work."
          count={state.strategy.expansion_project_ids.length}
        />
      </div>

      <Card className="p-5 space-y-3">
        <div>
          <h4 className="text-sm font-sans font-semibold text-foreground">
            Capital plan
          </h4>
          <p className="text-xs font-sans text-muted-foreground">
            10-year horizontal Gantt. Bars persist via the capital_plan block;
            phase totals + annual cash flow recompute live.
          </p>
        </div>
        <div className="rounded-md border border-dashed border-border bg-muted/30 px-4 py-6 text-xs font-sans text-muted-foreground">
          Capital plan editor lives in the capital_plan block (B7). The block
          renders in the published report and on the strategy tab.
        </div>
      </Card>

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
            onClick={buildRecurringRegister}
            disabled={generating}
            className="min-h-[44px]"
          >
            {generating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" aria-hidden />
            )}
            {state.strategy.recurring_register_built
              ? "Rebuild from intake"
              : "Build from intake"}
          </Button>
        </div>
        <div className="rounded-md border border-dashed border-border bg-muted/30 px-4 py-6 text-xs font-sans text-muted-foreground">
          {state.strategy.recurring_register_built
            ? "Register seeded. Edit categories and add HBC-managed toggles in the recurring_services_register block (B6)."
            : "Click Build from intake to seed categories. The block editor handles row-level edits."}
        </div>
      </Card>

      <Card className="p-5 space-y-3">
        <div>
          <h4 className="text-sm font-sans font-semibold text-foreground">
            Maintenance calendar
          </h4>
          <p className="text-xs font-sans text-muted-foreground">
            Four-season grid; tasks are derived from equipment + system pages.
          </p>
        </div>
        <div className="rounded-md border border-dashed border-border bg-muted/30 px-4 py-6 text-xs font-sans text-muted-foreground">
          The maintenance_calendar block (B8) handles row-level edits and
          renders in the published report.
        </div>
      </Card>

      <WizardNavigation
        onBack={() => goToStep("authoring")}
        onNext={() => goToStep("publish")}
      />
    </div>
  );
}
