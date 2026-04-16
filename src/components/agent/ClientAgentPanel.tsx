import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Sparkles, X, Send, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useParams, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import ErrorBoundary from "@/components/ErrorBoundary";

interface AgentMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ClientAgentPanelProps {
  propertyName?: string;
  propertyAddress?: string;
  enrichment?: {
    healthScore?: number;
    reportCompletion?: number;
    openInvoiceCount?: number;
    activeProjectCount?: number;
    equipmentNeedingService?: number;
    lastAdvisorContactDate?: string;
  };
}

const QUICK_CHIPS = [
  "What needs attention?",
  "My projects",
  "Maintenance due this month",
  "My warranties",
  "Schedule a visit",
  "Message my advisor",
  "My invoices",
  "Add a goal",
];

const genId = () => Math.random().toString(36).slice(2, 10);

const ClientAgentPanel = ({ propertyName, propertyAddress, enrichment }: ClientAgentPanelProps) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [sessionId] = useState(() => genId() + genId());
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { user } = useAuth();
  const { propertyId } = useParams<{ propertyId?: string }>();
  const location = useLocation();

  // Derive active tab from URL
  const searchParams = new URLSearchParams(location.search);
  const activeTab = searchParams.get("tab") || "home";

  useEffect(() => {
    if (open && messages.length === 0) {
      const name = propertyName || "your home";
      setMessages([{
        id: genId(),
        role: "assistant",
        content: `I'm your **Home Assistant** for ${name}. I can check what needs attention, look up your projects, invoices, warranties, or maintenance schedule, schedule a visit, or send a note to your advisor.\n\nWhat would you like to know?`,
      }]);
    }
  }, [open, messages.length, propertyName]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isThinking]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;
    const userMsg: AgentMessage = { id: genId(), role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsThinking(true);

    try {
      const history = messages.slice(-12).map(m => ({ role: m.role, content: m.content }));
      const { data, error } = await supabase.functions.invoke("hbc-agent", {
        body: {
          message: text,
          history,
          context: {
            userId: user?.id || "",
            role: "client",
            currentPage: `/portal/${propertyId}`,
            currentEntityType: "client_portal",
            currentEntityId: propertyId || "",
            currentEntityName: propertyName || "",
            activeTab,
            sessionId,
            enrichment: {
              propertyAddress,
              ...enrichment,
            },
          },
        },
      });
      if (error) throw error;
      setMessages(prev => [...prev, { id: genId(), role: "assistant", content: data.reply || "Done!" }]);

      // ── Log learning event for client interaction (fire-and-forget) ──
      (supabase.from("learning_events" as any) as any).insert({
        event_type: "client_agent_query",
        actor_id: user?.id || undefined,
        actor_role: "client",
        entity_type: "client_portal",
        entity_id: propertyId || "",
        event_data: {
          query_topic: text.slice(0, 100),
          tab: activeTab,
          had_actions: (data.actions_taken?.length || 0) > 0,
        },
      }).then(() => {}).catch(() => {});
    } catch (err: unknown) {
      setMessages(prev => [...prev, { id: genId(), role: "assistant", content: `Oops, something went wrong. Please try again! 🙏` }]);
    } finally {
      setIsThinking(false);
    }
  }, [messages, user, propertyId, sessionId, propertyName, propertyAddress, enrichment, activeTab]);

  // Keyboard shortcut to open on desktop: ⌘K / Ctrl+K.
  // Matches the spec in the WOW redesign doc — mirrors iOS Spotlight / Raycast.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isMeta = e.key === "k" && (e.metaKey || e.ctrlKey);
      if (isMeta) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      {/* ─── PERSISTENT COMMAND BAR ───
          A pill pinned above the mobile bottom nav (and the desktop FAB zone).
          On tap it opens the full conversational sheet. This replaces the old
          "hidden behind a FAB" pattern — the AI is now visible everywhere. */}
      <div
        className="fixed left-0 right-0 z-40 px-4 pointer-events-none bottom-[76px] md:bottom-6"
        style={{
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Ask the Home Assistant"
          className="pointer-events-auto mx-auto max-w-[640px] md:max-w-[560px] w-full h-12 rounded-full bg-card/95 backdrop-blur border border-border shadow-hbc-lg flex items-center gap-3 px-5 hover:border-accent/40 hover:shadow-xl transition-all cursor-pointer group"
        >
          <Sparkles className="w-4 h-4 text-accent flex-shrink-0" />
          <span className="font-sans text-sm text-muted-foreground flex-1 text-left truncate group-hover:text-foreground transition-colors">
            Ask anything about {propertyName || "your home"}
          </span>
          <kbd className="font-mono text-[10px] text-muted-foreground border border-border rounded px-1.5 py-0.5 hidden md:inline">
            ⌘K
          </kbd>
        </button>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="w-[400px] max-w-full p-0 flex flex-col"
          onOpenAutoFocus={(e) => {
            // Don't steal focus the moment the sheet opens — it yanks the
            // mobile keyboard up before the animation finishes. Move focus
            // after a frame.
            e.preventDefault();
            requestAnimationFrame(() => {
              inputRef.current?.focus({ preventScroll: true });
            });
          }}
        >
          <ErrorBoundary>
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-secondary/50">
            <Sparkles className="w-5 h-5 text-accent" />
            <div className="flex-1">
              <h2 className="text-sm font-sans font-semibold text-foreground">Home Assistant</h2>
              <span className="text-[10px] font-sans text-muted-foreground">
                {isThinking ? "Thinking..." : propertyName || "Here to help"}
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)} className="h-8 w-8 p-0" aria-label="Close">
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-secondary/20">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm font-sans ${
                  msg.role === "user" ? "bg-accent text-accent-foreground" : "bg-card border border-border text-foreground"
                }`}>
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none text-foreground [&_p]:mb-1 [&_li]:mb-0.5">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p>{msg.content}</p>
                  )}
                </div>
              </div>
            ))}
            {isThinking && (
              <div className="flex justify-start">
                <div className="bg-card border border-border rounded-lg px-3 py-2 flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />
                  <span className="text-xs font-sans text-muted-foreground">Thinking...</span>
                </div>
              </div>
            )}
          </div>

          {messages.length <= 1 && !input && (
            <div className="px-4 pb-2 flex gap-1.5 flex-wrap">
              {QUICK_CHIPS.map((chip) => (
                <button
                  key={chip}
                  onClick={() => sendMessage(chip)}
                  className="px-2.5 py-1 rounded-full bg-muted text-xs font-sans text-muted-foreground hover:bg-accent/10 hover:text-accent transition-colors border-none cursor-pointer"
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          <div className="border-t border-border p-3">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
                placeholder="Ask me anything about your home..."
                rows={1}
                className="flex-1 resize-none bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm font-sans text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
              />
              <Button size="sm" onClick={() => sendMessage(input)} disabled={!input.trim() || isThinking} className="h-9 w-9 p-0 shrink-0 bg-accent hover:bg-accent/90" aria-label="Send message">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
          </ErrorBoundary>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default ClientAgentPanel;
