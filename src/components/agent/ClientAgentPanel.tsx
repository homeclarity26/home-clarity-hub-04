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

/**
 * FloatingAssistantButton
 *
 * A compact 52px circular FAB pinned bottom-right. Hides when the user scrolls
 * down, reveals when they scroll up or pause — the Medium / iOS convention.
 * Small enough to ignore, visible enough to find, never covers a full row of
 * content the way the old full-width pill did.
 */
const FloatingAssistantButton = ({
  onOpen,
  hidden,
}: {
  onOpen: () => void;
  hidden: boolean;
}) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let lastY = typeof window !== "undefined" ? window.scrollY : 0;
    let idleTimer: ReturnType<typeof setTimeout> | null = null;

    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - lastY;

      // Only react to meaningful deltas to avoid flicker during rubber-banding.
      if (Math.abs(delta) > 6) {
        if (delta > 0 && y > 120) {
          setVisible(false); // scrolling down past the hero — get out of the way
        } else {
          setVisible(true); // scrolling up — come back
        }
        lastY = y;
      }

      // Reappear after the user stops scrolling for a moment.
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => setVisible(true), 500);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (idleTimer) clearTimeout(idleTimer);
    };
  }, []);

  // Don't render at all while the sheet is open — saves z-index headaches.
  if (hidden) return null;

  return (
    <div
      className="fixed z-40 pointer-events-none right-4 md:right-6 bottom-[84px] md:bottom-6"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <button
        type="button"
        onClick={onOpen}
        aria-label="Ask the Home Assistant"
        title="Ask the Home Assistant (⌘K)"
        className={`pointer-events-auto h-13 w-13 md:h-14 md:w-14 rounded-full bg-accent text-accent-foreground shadow-hbc-lg flex items-center justify-center hover:scale-105 hover:shadow-xl transition-all duration-300 ${
          visible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-4 pointer-events-none"
        }`}
        style={{ width: "52px", height: "52px" }}
      >
        <Sparkles className="w-5 h-5" />
      </button>
    </div>
  );
};

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

  // Listen for asks originating from the inline AICommandBar (Home tab).
  // Opening the sheet AND immediately sending the query is the whole point —
  // the old FAB-click shortcut threw away the user's text.
  useEffect(() => {
    const onAsk = (e: Event) => {
      const detail = (e as CustomEvent<{ query?: string }>).detail;
      const q = (detail?.query || "").trim();
      setOpen(true);
      if (q) {
        // Defer a tick so the sheet animation/focus logic can settle before
        // the first message appears in the scroll area.
        setTimeout(() => sendMessage(q), 50);
      }
    };
    window.addEventListener("hbc:ask", onAsk as EventListener);
    return () => window.removeEventListener("hbc:ask", onAsk as EventListener);
  }, [sendMessage]);

  return (
    <>
      {/* ─── COMPACT ASSISTANT BUTTON ───
          The inline AICommandBar on the Home tab is now the primary, full-size
          entry point to the assistant. This floating button is a secondary,
          always-available shortcut — a small pill bottom-right (like Intercom /
          Linear) that doesn't cover content.

          It also auto-hides when the client scrolls down (reveals on scroll up
          or when they pause), so it never obscures what they're reading. */}
      <FloatingAssistantButton
        onOpen={() => setOpen(true)}
        hidden={open}
      />
      <div className="sr-only">
        {/* Keep ⌘K shortcut discoverable for screen readers / keyboard users */}
        Press Command K or Control K to open the Home Assistant.
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
