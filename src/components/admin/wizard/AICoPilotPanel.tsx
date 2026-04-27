// TODO(W3-AI): Wire AICoPilotPanel actions to ai-edit, expand-tighten,
// and consistency-check edge functions. First-draft ships an inert UI
// so the surrounding side-by-side layout is shippable + testable.

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles } from "lucide-react";
import { useState } from "react";

interface AICoPilotPanelProps {
  pageType: "room" | "system" | "vision" | "executive_summary" | "generic";
  pageTitle?: string;
}

const ACTIONS_BY_PAGE_TYPE: Record<AICoPilotPanelProps["pageType"], string[]> = {
  room: [
    "Draft observations from photos",
    "Suggest paint match from photo",
    "Add maintenance recommendations",
  ],
  system: [
    "Generate Replacement Briefing",
    "Add 'How replacement happens' explainer",
    "Pull serial plate data",
  ],
  vision: [
    "Expand 'Why Design Matters First'",
    "Generate three-tier estimate",
    "Draft execution path",
  ],
  executive_summary: [
    "Synthesize from all pages",
    "Add Top Themes section",
  ],
  generic: ["Draft narrative", "Tighten copy", "Match brand voice"],
};

export function AICoPilotPanel({
  pageType,
  pageTitle,
}: AICoPilotPanelProps) {
  const [prompt, setPrompt] = useState("");
  const actions = ACTIONS_BY_PAGE_TYPE[pageType] ?? ACTIONS_BY_PAGE_TYPE.generic;

  return (
    <Card className="p-4 space-y-3 border-primary/20 bg-primary/[0.02]">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" aria-hidden />
        <h4 className="text-sm font-sans font-semibold text-foreground">
          AI Co-Pilot
        </h4>
        {pageTitle && (
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            {pageTitle}
          </span>
        )}
      </div>
      <p className="text-[11px] font-sans text-muted-foreground">
        Quick actions tailored to this page type. Wiring lands in a follow-up
        ticket; right now these log a TODO to console.
      </p>
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <Button
            key={action}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              // eslint-disable-next-line no-console
              console.log("[AICoPilotPanel TODO]", action, pageTitle);
            }}
            className="min-h-[44px]"
          >
            {action}
          </Button>
        ))}
      </div>
      <div className="space-y-2">
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={2}
          placeholder="Or ask the co-pilot something specific..."
          className="text-xs"
        />
        <div className="flex justify-end">
          <Button
            type="button"
            size="sm"
            disabled={!prompt.trim()}
            onClick={() => {
              // eslint-disable-next-line no-console
              console.log("[AICoPilotPanel TODO] free-form:", prompt);
              setPrompt("");
            }}
            className="min-h-[40px]"
          >
            Send
          </Button>
        </div>
      </div>
    </Card>
  );
}
