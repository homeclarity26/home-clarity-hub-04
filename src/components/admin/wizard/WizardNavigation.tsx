import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";

// Shared Back/Next chrome row used by every wizard step. The label and
// disabled rules vary per step, so the parent decides; this component
// just enforces consistent spacing + 44px touch targets.

interface WizardNavigationProps {
  onBack?: () => void;
  onNext?: () => void;
  backLabel?: string;
  nextLabel?: string;
  nextDisabled?: boolean;
  isSaving?: boolean;
  helperText?: string | null;
}

export function WizardNavigation({
  onBack,
  onNext,
  backLabel = "Back",
  nextLabel = "Continue",
  nextDisabled = false,
  isSaving = false,
  helperText,
}: WizardNavigationProps) {
  return (
    <div className="flex flex-col gap-3 pt-6 border-t border-border sm:flex-row sm:items-center sm:justify-between">
      <div className="text-xs font-sans text-muted-foreground">
        {helperText}
      </div>
      <div className="flex items-center gap-3">
        {onBack && (
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={isSaving}
            className="min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" aria-hidden />
            {backLabel}
          </Button>
        )}
        {onNext && (
          <Button
            type="button"
            onClick={onNext}
            disabled={nextDisabled || isSaving}
            className="min-h-[44px]"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden />
            ) : null}
            {nextLabel}
            {!isSaving && (
              <ArrowRight className="w-4 h-4 ml-2" aria-hidden />
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
