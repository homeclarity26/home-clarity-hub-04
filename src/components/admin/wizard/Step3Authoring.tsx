import { Card } from "@/components/ui/card";
import { useWizard } from "@/contexts/WizardContext";
import { WizardNavigation } from "./WizardNavigation";

// Stub: full implementation lands in PR B (W3). PR B will replace this with
// the side-by-side editor, page nav sidebar, and AI co-pilot panel.

export function Step3Authoring() {
  const { goToStep } = useWizard();
  return (
    <div className="space-y-4">
      <Card className="p-6">
        <h3 className="text-base font-sans font-semibold text-foreground">
          Step 3 — Authoring
        </h3>
        <p className="text-xs font-sans text-muted-foreground mt-1">
          Full implementation arrives in PR B. The side-by-side editor and
          AI co-pilot panel land in W3.
        </p>
      </Card>
      <WizardNavigation
        onBack={() => goToStep("toc")}
        onNext={() => goToStep("strategy")}
      />
    </div>
  );
}
