import { useState } from "react";
import { Sparkles, PanelRightClose, PanelRightOpen } from "lucide-react";
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
    return localStorage.getItem("hbc-agent-rail-open") !== "false";
  });

  const toggleRail = () => {
    const next = !isOpen;
    setIsOpen(next);
    localStorage.setItem("hbc-agent-rail-open", String(next));
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

  const onboardingMessage = `👋 I'm scoped to **${clientName}** (${propertyAddress}).\n\nI can see everything about this client — report, invoices, projects, schedule, equipment.\n\nWhat would you like me to do?`;

  if (!isOpen) {
    return (
      <div className="shrink-0 border-l border-border flex flex-col items-center py-3 px-1.5 bg-card">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleRail}
          className="h-9 w-9 p-0"
          title="Open AI Agent"
        >
          <PanelRightOpen className="w-4 h-4" />
        </Button>
        <div className="mt-2 writing-mode-vertical text-[10px] font-sans text-muted-foreground flex items-center gap-1" style={{ writingMode: "vertical-rl" }}>
          <Sparkles className="w-3 h-3" />
          AI Agent
        </div>
      </div>
    );
  }

  return (
    <div className="shrink-0 w-[360px] border-l border-border flex flex-col bg-card h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-xs font-sans font-semibold text-foreground">AI Agent</span>
          <span className="text-[10px] font-sans text-muted-foreground">· {clientName}</span>
        </div>
        <Button variant="ghost" size="sm" onClick={toggleRail} className="h-7 w-7 p-0">
          <PanelRightClose className="w-3.5 h-3.5" />
        </Button>
      </div>
      <AgentChat
        contextOverride={contextOverride}
        quickChips={CLIENT_CHIPS}
        onNavigate={onNavigate}
        onboardingMessage={onboardingMessage}
      />
    </div>
  );
};

export default WorkspaceAgentRail;
