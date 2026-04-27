import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { useWizard, WIZARD_STEPS, type WizardStepKey } from "@/contexts/WizardContext";
import { Step1Intake } from "./Step1Intake";
import { Step2TOC } from "./Step2TOC";
import { Step3Authoring } from "./Step3Authoring";
import { Step4Strategy } from "./Step4Strategy";
import { Step5Publish } from "./Step5Publish";

// Five-step shell: progress indicator + step body. Internal step state is
// driven by WizardContext.currentStep; URL `?reportId=X` resumes a draft
// once on mount per Master Plan W6.

export function WizardShell() {
  const { state, resumeFromReportId } = useWizard();
  const [searchParams] = useSearchParams();
  const resumeReportId = searchParams.get("reportId");

  useEffect(() => {
    if (resumeReportId && resumeReportId !== state.reportId) {
      void resumeFromReportId(resumeReportId);
    }
    // We deliberately only run this on mount or when reportId search param
    // flips — switching steps must not retrigger a resume.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeReportId]);

  return (
    <div className="space-y-6">
      <ProgressIndicator currentStep={state.currentStep} />
      <div>
        {state.currentStep === "intake" && <Step1Intake />}
        {state.currentStep === "toc" && <Step2TOC />}
        {state.currentStep === "authoring" && <Step3Authoring />}
        {state.currentStep === "strategy" && <Step4Strategy />}
        {state.currentStep === "publish" && <Step5Publish />}
      </div>
    </div>
  );
}

interface ProgressIndicatorProps {
  currentStep: WizardStepKey;
}

function ProgressIndicator({ currentStep }: ProgressIndicatorProps) {
  const currentIndex = WIZARD_STEPS.findIndex((s) => s.key === currentStep);
  return (
    <Card className="p-4">
      <ol className="flex items-center gap-2 overflow-x-auto" aria-label="Wizard progress">
        {WIZARD_STEPS.map((step, i) => {
          const isActive = i === currentIndex;
          const isComplete = i < currentIndex;
          return (
            <li key={step.key} className="flex items-center gap-2 shrink-0">
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-sans transition-colors min-h-[36px] ${
                  isActive
                    ? "bg-primary text-primary-foreground font-medium"
                    : isComplete
                      ? "bg-primary/10 text-foreground"
                      : "bg-muted text-muted-foreground"
                }`}
                aria-current={isActive ? "step" : undefined}
              >
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border border-current/20">
                  {isComplete ? "✓" : i + 1}
                </span>
                <span className="hidden sm:inline">{step.label}</span>
              </div>
              {i < WIZARD_STEPS.length - 1 && (
                <div className="w-8 h-px bg-border" aria-hidden />
              )}
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
