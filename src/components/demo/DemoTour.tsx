import { useEffect } from "react";
import { X } from "lucide-react";

// Guided tour for the public sample report (/demo only). A small floating
// card, not a modal: there is no backdrop, no focus trap and no scroll
// lock, so the page underneath stays fully usable. Each stop tells the
// portal where to go; Escape or Skip closes it.

export interface DemoTourStop {
  /** Step number shown to the visitor (two stops may share one number). */
  step: number;
  title: string;
  body: string;
  /** Where the portal should be for this stop. */
  target: { view: "home" | "report" } | { page: string };
  /** Finds the element to scroll to and outline. Omit to stay at the top. */
  anchor?: () => Element | null;
  /** Outline the anchor without scrolling to it (pinned elements). */
  anchorPinned?: boolean;
}

interface DemoTourProps {
  stops: DemoTourStop[];
  /** Index into `stops`, or null when the tour is closed. */
  index: number | null;
  totalSteps: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
  /** Optional extra action on the last stop. */
  finalAction?: { label: string; onClick: () => void };
}

const FOCUS_ATTR = "data-demo-tour-focus";

const DemoTour = ({ stops, index, totalSteps, onIndexChange, onClose, finalAction }: DemoTourProps) => {
  const stop = index != null ? stops[index] : undefined;

  // Escape closes the tour.
  useEffect(() => {
    if (index == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, onClose]);

  // After the portal has navigated for this stop, bring the anchor into
  // view and outline it. The outline is removed when the stop changes.
  useEffect(() => {
    if (!stop?.anchor) return;
    let focused: Element | null = null;
    const timer = window.setTimeout(() => {
      const el = stop.anchor?.();
      if (!el) return;
      focused = el;
      el.setAttribute(FOCUS_ATTR, "");
      if (!stop.anchorPinned) {
        const top = el.getBoundingClientRect().top + window.scrollY - 190;
        window.scrollTo({ top: Math.max(top, 0), behavior: "smooth" });
      }
    }, 450);
    return () => {
      window.clearTimeout(timer);
      focused?.removeAttribute(FOCUS_ATTR);
    };
  }, [stop]);

  if (index == null || !stop) return null;

  const isFirst = index === 0;
  const isLast = index === stops.length - 1;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label={`Tour, step ${stop.step} of ${totalSteps}: ${stop.title}`}
      className="fixed z-[45] left-3 right-3 bottom-[64px] sm:left-auto sm:right-6 sm:bottom-[76px] sm:w-[400px] rounded-xl bg-primary text-primary-foreground shadow-2xl border border-accent/40"
    >
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-hbc-gold pt-1">
            Tour · {stop.step} of {totalSteps}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close the tour"
            className="-mt-2 -mr-2 w-11 h-11 flex items-center justify-center rounded-full text-primary-foreground/70 hover:text-primary-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <h2 className="font-display text-[22px] leading-tight -mt-1" aria-live="polite">
          {stop.title}
        </h2>
        <p className="text-sm leading-relaxed text-primary-foreground/85 mt-2">{stop.body}</p>

        {isLast && finalAction && (
          <button
            type="button"
            onClick={finalAction.onClick}
            className="mt-3 inline-flex items-center min-h-[44px] px-4 rounded-md border border-accent/60 text-sm font-medium text-primary-foreground hover:bg-accent/15 transition-colors"
          >
            {finalAction.label}
          </button>
        )}

        <div className="mt-4 flex items-center gap-2">
          {!isLast && (
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-2 text-sm text-primary-foreground/70 hover:text-primary-foreground"
            >
              Skip
            </button>
          )}
          <div className="flex-1" />
          {!isFirst && (
            <button
              type="button"
              onClick={() => onIndexChange(index - 1)}
              className="min-h-[44px] px-4 rounded-md border border-primary-foreground/25 text-sm font-medium text-primary-foreground hover:bg-primary-foreground/10 transition-colors"
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={() => (isLast ? onClose() : onIndexChange(index + 1))}
            className="min-h-[44px] px-5 rounded-md bg-accent text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            {isLast ? "Finish" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DemoTour;
