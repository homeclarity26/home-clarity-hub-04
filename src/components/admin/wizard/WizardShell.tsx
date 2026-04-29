import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RotateCcw, FilePlus } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import {
  useWizard,
  WIZARD_STEPS,
  type WizardStepKey,
  type WizardDraftSummary,
} from "@/contexts/WizardContext";
import { Step1Intake } from "./Step1Intake";
import { Step2TOC } from "./Step2TOC";
import { Step3Authoring } from "./Step3Authoring";
import { Step4Strategy } from "./Step4Strategy";
import { Step5Publish } from "./Step5Publish";

// Five-step shell: progress indicator + step body. Internal step state is
// driven by WizardContext.currentStep.
//
// Resume flow:
//   1. URL `?reportId=X` resumes a draft via the legacy report-id path
//      (kept for backwards compatibility).
//   2. URL `?draftId=X` resumes the wizard_drafts row directly.
//   3. Otherwise, on first mount we look up the creator's most recent
//      in-progress draft and offer a resume prompt. They can either
//      "Resume" (hydrates state) or "Start fresh" (marks the draft
//      abandoned and continues with empty state).

type ResumePromptState =
  | { phase: "checking" }
  | { phase: "found"; draft: WizardDraftSummary }
  | { phase: "dismissed" };

export function WizardShell() {
  const {
    state,
    resumeFromReportId,
    resumeFromDraftId,
    findResumableDraft,
    abandonDraft,
  } = useWizard();
  const [searchParams] = useSearchParams();
  const resumeReportId = searchParams.get("reportId");
  const resumeDraftId = searchParams.get("draftId");
  const [resumePrompt, setResumePrompt] = useState<ResumePromptState>({
    phase: "checking",
  });

  useEffect(() => {
    if (resumeDraftId) {
      void resumeFromDraftId(resumeDraftId);
      setResumePrompt({ phase: "dismissed" });
      return;
    }
    if (resumeReportId && resumeReportId !== state.reportId) {
      void resumeFromReportId(resumeReportId);
      setResumePrompt({ phase: "dismissed" });
      return;
    }
    let cancelled = false;
    void findResumableDraft().then((draft) => {
      if (cancelled) return;
      if (draft) {
        setResumePrompt({ phase: "found", draft });
      } else {
        setResumePrompt({ phase: "dismissed" });
      }
    });
    return () => {
      cancelled = true;
    };
    // We deliberately only run this on mount or when the URL search
    // params flip; switching steps must not retrigger a resume.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeReportId, resumeDraftId]);

  const handleResume = async () => {
    if (resumePrompt.phase !== "found") return;
    await resumeFromDraftId(resumePrompt.draft.id);
    setResumePrompt({ phase: "dismissed" });
  };

  const handleStartFresh = async () => {
    if (resumePrompt.phase !== "found") return;
    await abandonDraft(resumePrompt.draft.id);
    setResumePrompt({ phase: "dismissed" });
  };

  if (resumePrompt.phase === "checking") {
    return (
      <Card className="p-6 flex items-center justify-center gap-2 text-xs font-sans text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
        Checking for an in-progress draft...
      </Card>
    );
  }

  if (resumePrompt.phase === "found") {
    const { draft } = resumePrompt;
    const stepLabel =
      WIZARD_STEPS.find((s) => s.key === draft.current_step)?.label ?? "Step";
    const heading = draft.client_full_name
      ? `${draft.client_full_name}${draft.property_address ? `, ${draft.property_address}` : ""}`
      : "Untitled draft";
    let when = "";
    try {
      when = formatDistanceToNow(new Date(draft.updated_at), {
        addSuffix: true,
      });
    } catch {
      when = "";
    }
    return (
      <Card className="p-6 space-y-4">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            Resume in-progress wizard
          </div>
          <h3 className="text-base font-sans font-semibold text-foreground mt-1">
            {heading}
          </h3>
          <p className="text-xs font-sans text-muted-foreground mt-1">
            Last edited on {stepLabel}
            {when ? ` ${when}` : ""}. Pick up where you left off, or start
            fresh and abandon this draft.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={handleResume}
            className="min-h-[44px]"
          >
            <RotateCcw className="w-4 h-4 mr-2" aria-hidden />
            Resume draft
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleStartFresh}
            className="min-h-[44px]"
          >
            <FilePlus className="w-4 h-4 mr-2" aria-hidden />
            Start fresh
          </Button>
        </div>
      </Card>
    );
  }

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
  const { isSaving, lastSavedAt } = useWizard();

  let saveLabel: string | null = null;
  if (isSaving) {
    saveLabel = "Saving...";
  } else if (lastSavedAt) {
    try {
      saveLabel = `Saved ${format(lastSavedAt, "h:mm a")}`;
    } catch {
      saveLabel = "Saved";
    }
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-3">
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
        {saveLabel && (
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground shrink-0">
            {saveLabel}
          </span>
        )}
      </div>
    </Card>
  );
}
