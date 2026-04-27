import { Card } from "@/components/ui/card";
import { useWizard } from "@/contexts/WizardContext";
import { WizardNavigation } from "./WizardNavigation";

// Stub: full implementation lands in PR B (W4). Defense / Offense /
// Expansion phase cards plus the recurring-services + capital-plan blocks
// will land here.

export function Step4Strategy() {
  const { goToStep } = useWizard();
  return (
    <div className="space-y-4">
      <Card className="p-6">
        <h3 className="text-base font-sans font-semibold text-foreground">
          Step 4 — Strategy
        </h3>
        <p className="text-xs font-sans text-muted-foreground mt-1">
          Full implementation arrives in PR B. Defense / Offense / Expansion
          phase cards plus capital plan + recurring services blocks land here.
        </p>
      </Card>
      <WizardNavigation
        onBack={() => goToStep("authoring")}
        onNext={() => goToStep("publish")}
      />
    </div>
  );
}
