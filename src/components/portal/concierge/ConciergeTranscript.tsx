import type { ReactNode } from "react";

interface ConciergeTranscriptProps {
  children: ReactNode;
}

// Per Master Spec 6.1: the Concierge transcript is the ONE allowed inner
// scroll in the entire portal. Every other prose container expands
// naturally (universal expanding container pattern). This wrapper makes
// that rule visible at the call site so a future contributor doesn't
// accidentally add overflow-y to a different container.
//
// The actual scrolling is done by the AgentChat component inside; this
// wrapper just establishes the flex column that lets AgentChat fill the
// remaining sheet height.
const ConciergeTranscript = ({ children }: ConciergeTranscriptProps) => (
  <div className="flex-1 flex flex-col min-h-0">
    {children}
  </div>
);

export default ConciergeTranscript;
