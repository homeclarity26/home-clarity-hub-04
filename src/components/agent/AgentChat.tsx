import { useState, useRef, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Send, Loader2, CheckCircle, AlertTriangle, ExternalLink, Mic, MicOff, RotateCcw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";

interface AgentMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  actions?: any[];
  needs_confirmation?: boolean;
  confirmation_payload?: any;
}

export interface AgentContextOverride {
  userId?: string;
  role?: string;
  currentPage?: string;
  currentEntityType: string;
  currentEntityId: string;
  currentEntityName: string;
  propertyId?: string;
  activeTab?: string;
  enrichment?: Record<string, any>;
}

interface AgentChatProps {
  contextOverride?: AgentContextOverride;
  quickChips?: string[];
  onNavigate?: (tab: string) => void;
  onboardingMessage?: string;
  className?: string;
}

const DEFAULT_CHIPS = [
  "+ New client",
  "Build estimate",
  "Log a call",
  "Check overdue invoices",
  "Dashboard summary",
  "Draft announcement",
];

const genId = () => Math.random().toString(36).slice(2, 10);

const ActionCard = ({ action, onNavigate }: { action: any; onNavigate?: (tab: string) => void }) => {
  const icons: Record<string, any> = {
    client: "👤", project: "🏗️", invoice: "💰", estimate: "📋",
    vendor: "🤝", event: "📅", equipment: "⚙️", message: "💬",
    report: "📄", goal: "🎯", announcement: "📢",
  };
  const icon = icons[action.entity_type] || "✅";

  const handleNav = (e: React.MouseEvent) => {
    if (onNavigate && action.nav_tab) {
      e.preventDefault();
      onNavigate(action.nav_tab);
    }
  };

  // Guard against raw JSON leaking in here — if the backend couldn't
  // produce a human-readable summary and fell back to JSON.stringify,
  // show the tool name instead. The conversational reply already has
  // the real answer; this chip is supposed to be a one-line receipt.
  const rawSummary = typeof action.result_summary === "string" ? action.result_summary.trim() : "";
  const looksLikeJson = rawSummary.startsWith("{") || rawSummary.startsWith("[");
  const displaySummary = !rawSummary || looksLikeJson
    ? (action.tool_name ? action.tool_name.replace(/_/g, " ") : "Action completed")
    : rawSummary;

  return (
    <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-2 text-xs font-sans">
      <span className="text-base">{icon}</span>
      <span className="flex-1 text-foreground">{displaySummary}</span>
      {action.nav_link && (
        <a href={action.nav_link} onClick={handleNav} className="text-primary hover:underline flex items-center gap-0.5">
          View <ExternalLink className="w-3 h-3" />
        </a>
      )}
      {action.success ? (
        <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
      ) : (
        <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0" />
      )}
    </div>
  );
};

const ConfirmationCard = ({ payload, onConfirm, onCancel }: { payload: any; onConfirm: () => void; onCancel: () => void }) => (
  <Card className="p-3 border-primary/20 bg-primary/5">
    <p className="text-xs font-sans font-medium text-foreground mb-2">⚠️ Confirmation Required</p>
    <p className="text-xs font-sans text-muted-foreground mb-3">{payload.summary}</p>
    {payload.items?.map((item: any, i: number) => (
      <div key={i} className="text-[11px] font-mono text-muted-foreground mb-1">
        {item.tool}: {JSON.stringify(item.params).slice(0, 100)}
      </div>
    ))}
    <div className="flex items-center gap-2 mt-3">
      <Badge variant="outline" className="text-[10px]">
        {payload.reversible ? "Reversible" : "Not reversible"}
      </Badge>
      <div className="ml-auto flex gap-2">
        <Button size="sm" variant="outline" onClick={onCancel} className="h-7 text-xs">Cancel</Button>
        <Button size="sm" onClick={onConfirm} className="h-7 text-xs">Confirm ✓</Button>
      </div>
    </div>
  </Card>
);

const AgentChat = ({ contextOverride, quickChips, onNavigate, onboardingMessage, className }: AgentChatProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingStep, setThinkingStep] = useState("");
  const [sessionId] = useState(() => genId() + genId());
  const [pendingConfirm, setPendingConfirm] = useState<any>(null);
  const [isListening, setIsListening] = useState(false);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const chips = quickChips || DEFAULT_CHIPS;
  const defaultOnboarding = "👋 Hi! I'm **HBC Agent** — your AI-powered business partner.\n\nI can do *everything* in this app:\n- **Create clients, estimates, invoices, and projects**\n- **Send messages and schedule events**\n- **Look up data and run analytics**\n- **Draft AI-powered content**\n\nJust tell me what you need in plain English. Try one of the quick actions below, or type anything!";

  // Show onboarding
  useEffect(() => {
    if (!hasOnboarded && messages.length === 0) {
      setMessages([{
        id: genId(),
        role: "assistant",
        content: onboardingMessage || defaultOnboarding,
      }]);
      setHasOnboarded(true);
    }
  }, [hasOnboarded, messages.length, onboardingMessage]);

  // Scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isThinking]);

  // Focus input on mount
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const buildContext = useCallback(() => {
    if (contextOverride) {
      return {
        userId: contextOverride.userId || user?.id || "",
        role: contextOverride.role || "creator",
        currentPage: contextOverride.currentPage || "",
        currentEntityType: contextOverride.currentEntityType,
        currentEntityId: contextOverride.currentEntityId,
        currentEntityName: contextOverride.currentEntityName,
        propertyId: contextOverride.propertyId,
        activeTab: contextOverride.activeTab,
        enrichment: contextOverride.enrichment,
        sessionId,
      };
    }
    return { userId: user?.id || "", role: "creator", sessionId };
  }, [contextOverride, user?.id, sessionId]);

  const sendMessage = useCallback(async (text: string, confirmAction = false) => {
    if (!text.trim() && !confirmAction) return;

    const userMsg: AgentMessage = { id: genId(), role: "user", content: text };
    if (!confirmAction) setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsThinking(true);
    setThinkingStep("🔍 Thinking...");

    try {
      const history = messages.slice(-12).map(m => ({ role: m.role, content: m.content }));

      const { data, error } = await supabase.functions.invoke("hbc-agent", {
        body: {
          message: text,
          history,
          context: buildContext(),
          confirm_action: confirmAction,
        },
      });

      if (error) throw error;

      const assistantMsg: AgentMessage = {
        id: genId(),
        role: "assistant",
        content: data.reply || "I completed the action.",
        actions: data.actions_taken,
        needs_confirmation: data.needs_confirmation,
        confirmation_payload: data.confirmation_payload,
      };

      setMessages(prev => [...prev, assistantMsg]);

      if (data.needs_confirmation) {
        setPendingConfirm(data.confirmation_payload);
      } else {
        setPendingConfirm(null);
      }

      // ── Log learning event for agent interaction ──
      if (data.actions_taken?.length > 0) {
        supabase.from("learning_events").insert({
          event_type: "agent_action_completed",
          actor_id: buildContext().userId || undefined,
          actor_role: buildContext().role || "creator",
          entity_type: "agent_interaction",
          entity_id: sessionId,
          event_data: {
            user_message: text,
            actions_count: data.actions_taken.length,
            action_types: data.actions_taken.map((a: any) => a.tool_name),
          },
        } as any).then(() => {});
      }
    } catch (err: any) {
      // supabase.functions.invoke throws a FunctionsHttpError with a
      // .context.response that carries the actual Edge Function response.
      // The default err.message is the useless "Edge Function returned a
      // non-2xx status code" — try to pull the real error body so Adam can
      // actually see what went wrong (missing column, rate limit, etc.).
      let detail = err?.message || "Unknown error";
      try {
        const resp = err?.context?.response;
        if (resp && typeof resp.text === "function") {
          const bodyText = await resp.text();
          if (bodyText) {
            try {
              const parsed = JSON.parse(bodyText);
              detail = parsed.error || parsed.reply || parsed.message || bodyText.slice(0, 300);
            } catch {
              detail = bodyText.slice(0, 300);
            }
          }
        }
      } catch { /* fall back to err.message */ }
      console.error("[HBC Agent] invoke failed:", err, "detail:", detail);
      setMessages(prev => [...prev, {
        id: genId(),
        role: "assistant",
        content: `Sorry, something went wrong: ${detail}. Please try again.`,
      }]);
    } finally {
      setIsThinking(false);
      setThinkingStep("");
    }
  }, [messages, buildContext, sessionId]);

  const handleConfirm = () => {
    if (pendingConfirm?.pending_tool_call) {
      sendMessage("Yes, confirmed. Please proceed.", true);
    }
    setPendingConfirm(null);
  };

  const handleCancel = () => {
    setPendingConfirm(null);
    setMessages(prev => [...prev, { id: genId(), role: "assistant", content: "Action cancelled. What else can I help with?" }]);
  };

  const toggleVoice = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) return;
    if (isListening) { setIsListening(false); return; }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (e: any) => {
      setInput(prev => prev + e.results[0][0].transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
    setIsListening(true);
  };

  const clearChat = () => {
    setMessages([]);
    setHasOnboarded(false);
    setPendingConfirm(null);
  };

  return (
    <div className={`flex flex-col h-full ${className || ""}`}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0">
        <Sparkles className="w-5 h-5 text-primary" />
        <div className="flex-1">
          <h2 className="text-sm font-sans font-semibold text-foreground">HBC Agent</h2>
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${isThinking ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`} />
            <span className="text-[10px] font-sans text-muted-foreground">
              {isThinking ? "Thinking..." : "Ready"}
            </span>
          </div>
        </div>
        {contextOverride?.currentEntityType && contextOverride.currentEntityType !== "dashboard" && (
          <Badge variant="secondary" className="text-[10px] font-sans">
            {contextOverride.currentEntityType === "client" ? "👤" : contextOverride.currentEntityType === "project" ? "🏗️" : "📋"} {contextOverride.currentEntityName || contextOverride.currentEntityType}
          </Badge>
        )}
        <Button variant="ghost" size="sm" onClick={clearChat} className="h-7 w-7 p-0">
          <RotateCcw className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
            <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm font-sans ${
              msg.role === "user"
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border text-foreground"
            }`}>
              {msg.role === "assistant" ? (
                <div className="prose prose-sm max-w-none text-foreground [&_p]:mb-1 [&_li]:mb-0.5 [&_strong]:text-foreground">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                <p>{msg.content}</p>
              )}
              {msg.actions && msg.actions.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  {msg.actions.map((a: any, i: number) => (
                    <ActionCard key={i} action={a} onNavigate={onNavigate} />
                  ))}
                </div>
              )}
            </div>
            {msg.role === "assistant" && (
              <button
                className="text-[10px] font-sans text-muted-foreground hover:text-accent flex items-center gap-1 mt-1 transition-colors"
                onClick={() => {
                  setInput(`Bobby, help me reply to this message: ${msg.content}`);
                  setTimeout(() => inputRef.current?.focus(), 50);
                }}
              >
                <span style={{background:'#C4A265',color:'#1B2B4D'}} className="w-3.5 h-3.5 rounded-full text-[8px] font-bold flex items-center justify-center">B</span>
                Ask Bobby
              </button>
            )}
          </div>
        ))}

        {isThinking && (
          <div className="flex justify-start">
            <div className="bg-card border border-border rounded-lg px-3 py-2 flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
              <span className="text-xs font-sans text-muted-foreground animate-pulse">{thinkingStep}</span>
            </div>
          </div>
        )}

        {pendingConfirm && (
          <ConfirmationCard
            payload={pendingConfirm}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
          />
        )}
      </div>

      {/* Quick chips */}
      {messages.length <= 1 && !input && (
        <div className="px-4 pb-2 flex gap-1.5 flex-wrap shrink-0">
          {chips.map((chip) => (
            <button
              key={chip}
              onClick={() => sendMessage(chip)}
              className="px-2.5 py-1 rounded-full bg-muted text-xs font-sans text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors border-none cursor-pointer"
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="border-t border-border p-3 shrink-0">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage(input);
              }
            }}
            placeholder="What would you like me to do?"
            rows={1}
            className="flex-1 resize-none bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm font-sans text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleVoice}
            className={`h-9 w-9 p-0 shrink-0 ${isListening ? "text-destructive" : "text-muted-foreground"}`}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </Button>
          <Button
            size="sm"
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isThinking}
            className="h-9 w-9 p-0 shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AgentChat;
