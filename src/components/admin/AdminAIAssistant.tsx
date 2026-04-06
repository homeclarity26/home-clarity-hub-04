import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, X, ChevronDown, ChevronUp, Loader2, Send } from "lucide-react";
import { toast } from "sonner";

export type AdminAIContext = "report" | "proposal" | "invoice" | "general";

export interface AdminAIAssistantProps {
  context: AdminAIContext;
  contextData?: any;
  propertyId?: string;
}

const SUGGESTIONS: Record<AdminAIContext, { label: string; prompt: string }[]> = {
  report: [
    { label: "Draft narrative", prompt: "Draft a professional narrative for this report page based on the condition rating and specs." },
    { label: "Check for issues", prompt: "Review this page and flag any inconsistencies, missing info, or items that need attention." },
    { label: "Suggest cost range", prompt: "Based on the condition and scope, suggest a realistic cost range for repair or replacement." },
  ],
  proposal: [
    { label: "Generate intro text", prompt: "Write a warm, professional intro paragraph for this proposal." },
    { label: "Suggest scope items", prompt: "Based on the project description, suggest any scope items that might be missing." },
    { label: "Calculate timeline", prompt: "Estimate a realistic project timeline based on the scope of work." },
  ],
  invoice: [
    { label: "Summarize for client", prompt: "Write a brief, friendly summary of this invoice for the client." },
    { label: "Flag overdue risk", prompt: "Analyze this invoice and flag any risk factors that might lead to late payment." },
    { label: "Draft payment reminder", prompt: "Draft a polite payment reminder message for this invoice." },
  ],
  general: [
    { label: "Summarize activity", prompt: "Summarize recent activity and highlight anything that needs attention." },
    { label: "Draft client update", prompt: "Draft a brief client update message for this property." },
    { label: "Next steps", prompt: "Based on the current state of this property, what are the recommended next steps?" },
  ],
};

const CONTEXT_LABELS: Record<AdminAIContext, string> = {
  report: "Report Page AI",
  proposal: "Proposal AI",
  invoice: "Invoice AI",
  general: "Admin AI",
};

const AdminAIAssistant = ({ context, contextData, propertyId }: AdminAIAssistantProps) => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const suggestions = SUGGESTIONS[context] || SUGGESTIONS.general;

  const sendMessage = async (prompt: string) => {
    if (!prompt.trim()) return;
    setLoading(true);
    setResponse("");

    try {
      // Build context string from contextData
      let contextStr = "";
      if (contextData) {
        if (context === "report") {
          contextStr = [
            contextData.title ? `Page: ${contextData.title}` : "",
            contextData.conditionRating ? `Condition: ${contextData.conditionRating}` : "",
            contextData.group ? `Group: ${contextData.group}` : "",
            contextData.narrative ? `Existing narrative: ${Array.isArray(contextData.narrative) ? contextData.narrative.join(" ") : contextData.narrative}` : "",
            contextData.specs ? `Specs: ${JSON.stringify(contextData.specs)}` : "",
          ].filter(Boolean).join("\n");
        } else if (context === "proposal") {
          contextStr = [
            contextData.title ? `Proposal: ${contextData.title}` : "",
            contextData.description ? `Description: ${contextData.description}` : "",
            contextData.total ? `Total: $${contextData.total}` : "",
            contextData.scope ? `Scope: ${contextData.scope}` : "",
          ].filter(Boolean).join("\n");
        } else if (context === "invoice") {
          contextStr = [
            contextData.title ? `Invoice: ${contextData.title}` : "",
            contextData.status ? `Status: ${contextData.status}` : "",
            contextData.total ? `Total: $${contextData.total}` : "",
            contextData.balance_due != null ? `Balance due: $${contextData.balance_due}` : "",
            contextData.due_date ? `Due date: ${contextData.due_date}` : "",
            contextData.notes ? `Notes: ${contextData.notes}` : "",
          ].filter(Boolean).join("\n");
        }
      }

      const systemNote = contextStr ? `\n\nCurrent context:\n${contextStr}` : "";

      const { data, error } = await supabase.functions.invoke("ai-draft-assistant", {
        body: {
          prompt: prompt.trim(),
          context: `You are an expert home inspection and renovation business assistant for Adam Kilgore at Home Clarity Hub. Provide concise, actionable, professional responses.${systemNote}`,
          propertyId: propertyId || null,
          mode: context,
        },
      });

      if (error) throw error;
      setResponse(data?.text || data?.content || data?.result || "No response received.");
    } catch (err) {
      console.error("[AdminAIAssistant] Error:", err);
      toast.error("AI assistant unavailable. Please try again.");
      setResponse("Unable to get a response. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage(input.trim());
      setInput("");
    }
  };

  const handleSuggestion = (prompt: string) => {
    sendMessage(prompt);
    setInput("");
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
      {/* Panel */}
      {open && (
        <div
          className="bg-card border border-border rounded-xl shadow-xl w-80 md:w-96 flex flex-col overflow-hidden"
          style={{ maxHeight: "520px", boxShadow: "0 8px 32px rgba(27,43,77,0.14)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-[#1B2B4D]">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#C4A265]" />
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-white">
                {CONTEXT_LABELS[context]}
              </span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-white/60 hover:text-white transition-colors"
              aria-label="Close AI assistant"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Suggestions */}
          <div className="flex flex-wrap gap-1.5 px-4 pt-3 pb-2">
            {suggestions.map((s) => (
              <button
                key={s.label}
                onClick={() => handleSuggestion(s.prompt)}
                disabled={loading}
                className="text-[11px] font-mono text-[#C4A265] border border-[#C4A265]/30 rounded-full px-2.5 py-1 hover:bg-[#C4A265]/10 hover:border-[#C4A265]/60 transition-all bg-transparent disabled:opacity-40"
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Response area */}
          {(response || loading) && (
            <div className="flex-1 overflow-y-auto px-4 py-3 border-t border-border bg-muted/30">
              {loading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="font-sans text-sm">Thinking...</span>
                </div>
              ) : (
                <div className="font-sans text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                  {response}
                </div>
              )}
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSubmit} className="border-t border-border px-3 py-3 flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask AI anything..."
              rows={2}
              className="flex-1 resize-none bg-muted/40 rounded-lg px-3 py-2 text-sm font-sans text-foreground placeholder:text-muted-foreground border border-border focus:outline-none focus:ring-1 focus:ring-[#C4A265]/40"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e as any);
                }
              }}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="shrink-0 bg-[#C4A265] hover:bg-[#C4A265]/90 disabled:opacity-40 text-white rounded-lg p-2 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* FAB toggle */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 bg-[#1B2B4D] hover:bg-[#1B2B4D]/90 text-white rounded-full px-4 py-3 shadow-lg transition-all hover:scale-105"
        aria-label="Toggle admin AI assistant"
      >
        <Sparkles className="w-4 h-4 text-[#C4A265]" />
        <span className="font-mono text-[11px] uppercase tracking-[0.15em]">AI</span>
        {open ? <ChevronDown className="w-3.5 h-3.5 opacity-60" /> : <ChevronUp className="w-3.5 h-3.5 opacity-60" />}
      </button>
    </div>
  );
};

export default AdminAIAssistant;
