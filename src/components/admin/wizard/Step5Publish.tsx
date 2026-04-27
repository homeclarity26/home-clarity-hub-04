import { Card } from "@/components/ui/card";
import { useWizard } from "@/contexts/WizardContext";
import { WizardNavigation } from "./WizardNavigation";

// Stub: full implementation lands in PR B (W5). The AI quality gate calls
// consistency-check (E5 already shipped), renders pre_publish_questions
// blocking on severity:high, persists ack to properties.qa_acknowledgments.

export function Step5Publish() {
  const { goToStep } = useWizard();
  return (
    <div className="space-y-4">
      <Card className="p-6">
        <h3 className="text-base font-sans font-semibold text-foreground">
          Step 5 — Publish
        </h3>
        <p className="text-xs font-sans text-muted-foreground mt-1">
          Full implementation arrives in PR B. AIQualityGate hits
          consistency-check, gates Publish on every high-severity question
          getting acknowledged.
        </p>
      </Card>
      <WizardNavigation
        onBack={() => goToStep("strategy")}
        nextLabel="Publish (PR B)"
        nextDisabled
      />
    </div>
  );
}
