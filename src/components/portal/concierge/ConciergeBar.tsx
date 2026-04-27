import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import ConciergePanel from "./ConciergePanel";

interface ConciergeBarProps {
  /** Property the Concierge is contextual to (drives the agent's prompt enrichment). */
  propertyId?: string;
}

const NAVY = "#0A1628";
const GOLD = "#B87333";
const CREAM = "#EDE9E1";

// C1 — Per [v1.23] this is sticky-positioned (not fixed), so it sits at
// the bottom of the portal scroll container without overlapping content.
// Tap opens ConciergePanel as a sheet/drawer.
const ConciergeBar = ({ propertyId }: ConciergeBarProps) => {
  const [open, setOpen] = useState(false);

  // C8 — Other portal surfaces (HomeTab "Schedule a Consultation" card,
  // PaymentsTab invoice Q&A) open the Concierge by dispatching
  // window.dispatchEvent(new CustomEvent("concierge:open", { detail: { prompt } })).
  // The optional `prompt` is forwarded to AgentChat via the
  // `concierge:prefill` event after a tick so the panel mounts first.
  useEffect(() => {
    const onOpen = (e: Event) => {
      const detail = (e as CustomEvent<{ prompt?: string }>).detail;
      setOpen(true);
      if (detail?.prompt) {
        setTimeout(() => {
          window.dispatchEvent(
            new CustomEvent("concierge:prefill", { detail: { prompt: detail.prompt } })
          );
        }, 50);
      }
    };
    window.addEventListener("concierge:open", onOpen as EventListener);
    return () => window.removeEventListener("concierge:open", onOpen as EventListener);
  }, []);

  return (
    <>
      <div
        className="sticky bottom-0 left-0 right-0 z-30 backdrop-blur"
        style={{
          background: NAVY + "ee",
          borderTop: `1px solid ${GOLD}33`,
        }}
      >
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full flex items-center gap-3 px-4 py-3 sm:px-6"
          style={{ color: CREAM }}
        >
          <Sparkles className="w-4 h-4" style={{ color: GOLD }} />
          <span className="text-sm flex-1 text-left" style={{ color: CREAM + "cc" }}>
            Ask your Concierge anything about your home
          </span>
          <span
            className="font-mono text-[10px] uppercase tracking-[0.15em] px-2 py-1 rounded"
            style={{ background: GOLD, color: NAVY }}
          >
            Open
          </span>
        </button>
      </div>

      <ConciergePanel open={open} onOpenChange={setOpen} propertyId={propertyId} />
    </>
  );
};

export default ConciergeBar;
