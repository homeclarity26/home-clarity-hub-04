import { useState, useEffect, useRef } from "react";
import { Sparkles, PanelRightClose, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import AgentChat from "@/components/agent/AgentChat";
import type { AgentContextOverride } from "@/components/agent/AgentChat";

interface WorkspaceAgentRailProps {
  clientId: string;
  clientName: string;
  propertyId: string;
  propertyAddress: string;
  activeTab?: string;
  enrichment?: Record<string, any>;
  onNavigate?: (tab: string) => void;
}

const CLIENT_CHIPS = [
  "Draft an estimate",
  "Summarize the report",
  "What needs attention?",
  "Schedule a follow-up",
  "Check overdue invoices",
  "Write a check-in email",
];

const WorkspaceAgentRail = ({
  clientId,
  clientName,
  propertyId,
  propertyAddress,
  activeTab,
  enrichment,
  onNavigate,
}: WorkspaceAgentRailProps) => {
  const [isOpen, setIsOpen] = useState(() => {
    return localStorage.getItem("hbc-agent-rail-open") === "true";
  });

  // Dispatch focus-mode event on initial load if open
  useEffect(() => {
    if (isOpen) {
      window.dispatchEvent(new CustomEvent("hbc-agent-toggle", { detail: { open: true } }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleRail = () => {
    const next = !isOpen;
    setIsOpen(next);
    localStorage.setItem("hbc-agent-rail-open", String(next));
    window.dispatchEvent(new CustomEvent("hbc-agent-toggle", { detail: { open: next } }));
  };

  const contextOverride: AgentContextOverride = {
    currentEntityType: "client",
    currentEntityId: clientId,
    currentEntityName: clientName,
    propertyId,
    activeTab,
    enrichment: {
      propertyAddress,
      ...enrichment,
    },
  };

  const onboardingMessage = `👋 Hi! I'm **Bobby**, your HBC AI assistant, scoped to **${clientName}** (${propertyAddress}).\n\nI can see everything about this client — report, invoices, projects, schedule, equipment.\n\nWhat would you like me to do?`;

  return (
    <>
      {/* Floating toggle button — always visible when panel is closed */}
      {!isOpen && (
        <button
          onClick={toggleRail}
          title="Open Bobby"
          className="fixed right-4 bottom-6 z-50 flex items-center gap-2 bg-foreground text-background rounded-full px-3 py-2 shadow-lg hover:opacity-90 transition-opacity text-xs font-sans font-semibold"
        >
          <span className="w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center" style={{background:'#C4A265'}}>B</span>
          Bobby
        </button>
      )}

      {/* Overlay panel — slides in from the right, floats over content */}
      <div
        className={`fixed top-0 right-0 h-full z-40 flex flex-col bg-card border-l border-border shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ width: "380px" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-border shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center" style={{background:'#C4A265'}}>B</span>
            <span className="text-xs font-sans font-semibold text-foreground">Bobby</span>
            <span className="text-[10px] font-sans text-muted-foreground">· {clientName}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={toggleRail} className="h-7 w-7 p-0">
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Chat */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <AgentChat
            contextOverride={contextOverride}
            quickChips={CLIENT_CHIPS}
            onNavigate={onNavigate}
            onboardingMessage={onboardingMessage}
          />
        </div>
      </div>

      {/* Backdrop — clicking outside closes it on smaller screens */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 lg:hidden"
          onClick={toggleRail}
        />
      )}
    </>
  );
};

export default WorkspaceAgentRail;
