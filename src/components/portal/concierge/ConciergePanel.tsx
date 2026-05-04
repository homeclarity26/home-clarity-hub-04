import { Sheet, SheetContent } from "@/components/ui/sheet";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import AgentChat from "@/components/agent/AgentChat";
import type { AgentContextOverride } from "@/components/agent/AgentChat";
import ConciergeTranscript from "./ConciergeTranscript";

interface ConciergePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId?: string;
}

// Demo prompts per [v1.24] — schedule, pay, log, retrieve, communication-route.
// These render as quick-tap chips above the transcript so the client never
// has to stare at a blank input.
const DEMO_PROMPTS = [
  "Schedule the chimney sweep",
  "Pay the AKR draw invoice",
  "What paint is in the dining room?",
  "Pull up the furnace serial plate",
  "Where do I send a question?",
];

const NAVY = "#0A1628";
const GOLD = "#B87333";
const CREAM = "#EDE9E1";

const ConciergePanel = ({ open, onOpenChange, propertyId }: ConciergePanelProps) => {
  const { user } = useAuth();

  const agentContext: AgentContextOverride = {
    userId: user?.id || "",
    role: "client",
    currentPage: typeof window !== "undefined" ? window.location.pathname : "",
    currentEntityType: "property",
    currentEntityId: propertyId || "",
    currentEntityName: "",
    propertyId,
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-0 flex flex-col"
        style={{ background: NAVY, color: CREAM, border: `1px solid ${GOLD}33` }}
      >
        {/* Header */}
        <div
          className="px-4 py-3 flex items-center justify-between gap-2 border-b"
          style={{ borderColor: GOLD + "33" }}
        >
          <div className="flex items-center gap-2">
            <span
              className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
              style={{ background: GOLD }}
            >
              <span className="font-display text-xs font-bold" style={{ color: NAVY }}>B</span>
            </span>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.15em]" style={{ color: GOLD }}>
                Ask Bobby
              </div>
              <div className="text-sm" style={{ color: CREAM }}>
                Trained on your home
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="hover:bg-white/10"
            style={{ color: CREAM }}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Demo prompt chips */}
        <div className="px-4 pt-3 pb-2 flex flex-wrap gap-2">
          {DEMO_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => {
                // Drop the prompt into the AgentChat input. AgentChat doesn't
                // expose a controlled input prop today, so we use a custom
                // event the AgentChat component can listen for. Until that
                // wire-up lands the chips are visual demos.
                const ev = new CustomEvent("concierge:prefill", { detail: { prompt } });
                window.dispatchEvent(ev);
              }}
              className="text-xs px-3 py-1 rounded-full border transition-colors"
              style={{
                borderColor: GOLD + "55",
                background: GOLD + "15",
                color: CREAM,
              }}
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Transcript + input — AgentChat handles its own scroll, wrapped
            in ConciergeTranscript so the Master Spec 6.1 "one allowed
            inner scroll" rule is documented at the call site. */}
        <ConciergeTranscript>
          <AgentChat
            contextOverride={agentContext}
            quickChips={DEMO_PROMPTS}
            className="flex-1 flex flex-col"
          />
        </ConciergeTranscript>
      </SheetContent>
    </Sheet>
  );
};

export default ConciergePanel;
