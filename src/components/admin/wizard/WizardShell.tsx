import { useEffect, useState, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RotateCcw, FilePlus, Check } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
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

// Five-step shell, prototype screens 1-20: full-height navy left rail
// (BUILDING REPORT eyebrow, property name, numbered step list, auto-save
// footer) + cream content area. Internal step state is driven by
// WizardContext.currentStep.
//
// Resume flow:
//   1. URL `?reportId=X` resumes a draft via the legacy report-id path
//      (kept for backwards compatibility).
//   2. URL `?draftId=X` resumes the wizard_drafts row directly.
//   3. Otherwise, on first mount we look up the creator's most recent
//      in-progress draft and offer a resume prompt. They can either
//      "Resume" (hydrates state) or "Start fresh" (marks the draft
//      abandoned and continues with empty state).
//
// `qaMode` (dev-only, threaded from DevPrototypeQA) skips the resume
// check and suppresses the steps' on-mount network calls so the visual
// QA harness can render each step from in-memory fixture state.

type ResumePromptState =
  | { phase: "checking" }
  | { phase: "found"; draft: WizardDraftSummary }
  | { phase: "dismissed" };

// Display labels for the rail per prototype; WIZARD_STEPS (context) keeps
// its own shorter labels for drafts/resume copy.
const RAIL_LABELS: Record<WizardStepKey, string> = {
  intake: "Intake",
  toc: "TOC Proposal",
  authoring: "Page Authoring",
  strategy: "Strategy & Roadmap",
  publish: "Publish",
};

interface WizardShellProps {
  qaMode?: boolean;
}

export function WizardShell({ qaMode = false }: WizardShellProps) {
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
  const [resumePrompt, setResumePrompt] = useState<ResumePromptState>(
    qaMode ? { phase: "dismissed" } : { phase: "checking" },
  );

  useEffect(() => {
    if (qaMode) return;
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
      <Card className="m-6 p-6 flex items-center justify-center gap-2 text-xs font-sans text-muted-foreground">
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
      <Card className="m-6 p-6 space-y-4">
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
    <div className="flex min-h-screen">
      <StepRail currentStep={state.currentStep} />
      <main className="flex-1 min-w-0 bg-hbc-cream">
        {state.currentStep === "authoring" ? (
          <Step3Authoring qaMode={qaMode} />
        ) : (
          <div className="px-6 md:px-10 py-8 max-w-[1160px]">
            {state.currentStep === "intake" && <Step1Intake qaMode={qaMode} />}
            {state.currentStep === "toc" && <Step2TOC />}
            {state.currentStep === "strategy" && (
              <Step4Strategy qaMode={qaMode} />
            )}
            {state.currentStep === "publish" && (
              <Step5Publish qaMode={qaMode} />
            )}
          </div>
        )}
      </main>
    </div>
  );
}

// ─── Left rail ────────────────────────────────────────────────────────────

interface StepRailProps {
  currentStep: WizardStepKey;
}

function StepRail({ currentStep }: StepRailProps) {
  const { state, isSaving } = useWizard();
  const currentIndex = WIZARD_STEPS.findIndex((s) => s.key === currentStep);
  const propertyName =
    state.client.propertyName.trim() ||
    state.client.fullName.trim() ||
    "New Client Report";
  const address = state.client.address.trim();

  return (
    <aside className="w-[210px] shrink-0 bg-hbc-navy flex flex-col">
      <div className="px-5 pt-7 pb-6 border-b border-white/10">
        <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-[hsl(var(--hbc-gold))]">
          Building Report
        </div>
        <div className="font-display text-xl leading-tight text-white mt-2">
          {propertyName}
        </div>
        {address && (
          <div className="text-[11px] font-sans text-white/50 mt-1.5 leading-snug">
            {address}
          </div>
        )}
      </div>
      <ol className="flex-1 py-3" aria-label="Wizard progress">
        {WIZARD_STEPS.map((step, i) => {
          const isActive = i === currentIndex;
          const isComplete = i < currentIndex;
          return (
            <li key={step.key}>
              <div
                className={`flex items-center gap-3 px-4 py-3 border-l-2 ${
                  isActive
                    ? "border-hbc-gold bg-white/5"
                    : "border-transparent"
                }`}
                aria-current={isActive ? "step" : undefined}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-mono ${
                    isActive
                      ? "border-hbc-gold text-[hsl(var(--hbc-gold))]"
                      : isComplete
                        ? "border-white/40 text-white/80"
                        : "border-white/25 text-white/40"
                  }`}
                  aria-hidden
                >
                  {isComplete ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </span>
                <span
                  className={`text-[13px] font-sans ${
                    isActive
                      ? "text-[hsl(var(--hbc-gold))] font-medium"
                      : isComplete
                        ? "text-white/80"
                        : "text-white/50"
                  }`}
                >
                  {RAIL_LABELS[step.key]}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="px-5 py-5 border-t border-white/10 font-mono text-[9px] uppercase tracking-wider text-white/40">
        {isSaving ? "Saving..." : "Auto-saving every 30 seconds"}
      </div>
    </aside>
  );
}

// ─── Shared step header ──────────────────────────────────────────────────

interface WizardStepHeaderProps {
  step: number;
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function WizardStepHeader({
  step,
  title,
  description,
  actions,
}: WizardStepHeaderProps) {
  return (
    <header className="mb-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-hbc-gold-readable">
            Step {step} of 5
          </div>
          <h2 className="font-display text-3xl text-hbc-navy mt-1">{title}</h2>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      <div className="h-px bg-[hsl(var(--hbc-border))] mt-5" aria-hidden />
      {description && (
        <p className="text-sm font-sans text-hbc-grey mt-4 max-w-2xl">
          {description}
        </p>
      )}
    </header>
  );
}
