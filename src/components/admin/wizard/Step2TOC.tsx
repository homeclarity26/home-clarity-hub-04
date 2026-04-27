import { Card } from "@/components/ui/card";
import { useWizard } from "@/contexts/WizardContext";
import { WizardNavigation } from "./WizardNavigation";

// Stub: full implementation lands in PR B (W2). The wizard envelope
// already routes here, so we render a placeholder that proves the flow.

export function Step2TOC() {
  const { goToStep } = useWizard();
  return (
    <div className="space-y-4">
      <Card className="p-6">
        <h3 className="text-base font-sans font-semibold text-foreground">
          Step 2 — TOC Proposal
        </h3>
        <p className="text-xs font-sans text-muted-foreground mt-1">
          Full implementation arrives in PR B. This placeholder exists so
          the W1/W6 wizard shell can be tested end-to-end.
        </p>
      </Card>
      <WizardNavigation
        onBack={() => goToStep("intake")}
        onNext={() => goToStep("authoring")}
      />
    </div>
  );
}
