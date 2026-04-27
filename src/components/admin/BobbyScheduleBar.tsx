/**
 * BobbyScheduleBar
 * Natural language scheduling command bar powered by Bobby (hbc-agent).
 * Lives at the top of the admin calendar page.
 *
 * Examples:
 *   "Move the Johnson site visit from Monday to Wednesday at 9am, notify Mrs Johnson"
 *   "Schedule a consultation with the Smith property on Friday at 2pm"
 *   "Set a 2 hour reminder for the Maple Ridge inspection"
 */
import { useState, useRef } from "react";
import { Sparkles, Send, Loader2, ChevronDown, ChevronUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const EXAMPLES = [
  "Move the Johnson site visit to Wednesday at 9am and notify them",
  "Schedule a consultation with the Smith property Friday at 2pm",
  "Set a 2-hour reminder for tomorrow's inspection",
  "Show me everything scheduled this week",
  "Cancel the Monday follow-up with the Garcia property",
];

const BobbyScheduleBar = () => {
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showExamples, setShowExamples] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const conversationHistory = useRef<any[]>([]);

  const send = async (text?: string) => {
    const prompt = text || input.trim();
    if (!prompt || loading) return;

    setInput("");
    setShowExamples(false);
    setExpanded(true);

    const userMsg: Message = { role: "user", content: prompt };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    conversationHistory.current.push({ role: "user", parts: [{ text: prompt }] });

    try {
      const { data, error } = await supabase.functions.invoke("hbc-agent", {
        body: {
          message: prompt,
          userId: user?.id,
          role: "creator",
          conversationHistory: conversationHistory.current,
          context: {
            page: "calendar",
            hint: "The admin is on the calendar page and wants to manage scheduling using natural language.",
          },
        },
      });

      if (error) throw error;

      const reply = data?.response || data?.message || "Done.";
      conversationHistory.current.push({ role: "model", parts: [{ text: reply }] });
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch (e: any) {
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, something went wrong. Try again." }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const clear = () => {
    setMessages([]);
    conversationHistory.current = [];
    setExpanded(false);
    setShowExamples(true);
  };

  return (
    <div className="mb-6 rounded-xl border border-accent/20 bg-accent/5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-accent/10">
        <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
          <span className="text-white font-display text-xs font-bold">B</span>
        </div>
        <div className="flex-1">
          <p className="font-mono text-[10px] uppercase tracking-wider text-accent">Bobby: Schedule Assistant</p>
          <p className="font-sans text-xs text-muted-foreground">Type any scheduling command in plain English</p>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs font-sans text-muted-foreground" onClick={clear}>
            <X className="w-3 h-3 mr-1" /> Clear
          </Button>
        )}
      </div>

      {/* Conversation thread */}
      {expanded && messages.length > 0 && (
        <div className="px-4 py-3 space-y-3 max-h-64 overflow-y-auto border-b border-accent/10">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              {m.role === "assistant" && (
                <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white font-display text-[9px] font-bold">B</span>
                </div>
              )}
              <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm font-sans leading-relaxed
                ${m.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-background border border-border text-foreground"
                }`}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-2 items-center">
              <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                <span className="text-white font-display text-[9px] font-bold">B</span>
              </div>
              <div className="bg-background border border-border rounded-lg px-3 py-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Example chips */}
      {showExamples && (
        <div className="px-4 py-2 flex flex-wrap gap-1.5 border-b border-accent/10">
          {EXAMPLES.map((ex, i) => (
            <button
              key={i}
              onClick={() => send(ex)}
              className="font-sans text-[11px] text-accent/80 bg-accent/10 hover:bg-accent/20 px-2.5 py-1 rounded-full transition-colors text-left"
            >
              {ex}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex items-center gap-2 px-4 py-3">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
          placeholder="e.g. Move the Johnson site visit to Wednesday at 9am and notify them…"
          className="flex-1 bg-transparent font-sans text-sm text-foreground placeholder:text-muted-foreground/50 outline-none"
        />
        <Button
          size="sm"
          onClick={() => send()}
          disabled={!input.trim() || loading}
          className="h-8 w-8 p-0 rounded-full bg-accent hover:bg-accent/90 flex-shrink-0"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
        </Button>
      </div>
    </div>
  );
};

export default BobbyScheduleBar;
