import { useState, useRef, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Sparkles, X, Send, Loader2, CheckCircle, AlertTriangle, ExternalLink, Mic, MicOff, RotateCcw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "react-router-dom";
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

interface AgentContext {
  userId: string;
  role: string;
  currentPage: string;
  currentEntityType: string;
  currentEntityId: string;
  currentEntityName: string;
  sessionId: string;
}

const QUICK_CHIPS = [
  "+ New client",
  "Build estimate",
  "Log a call",
  "Check overdue invoices",
  "Dashboard summary",
  "Draft announcement",
];

const genId = () => Math.random().toString(36).slice(2, 10);

export function useAgentContext(): Omit<AgentContext, "sessionId"> {
  const { user } = useAuth();
  const location = useLocation();
  const path = location.pathname;

  let currentEntityType = "";
  let currentEntityId = "";
  let currentEntityName = "";

  if (path.match(/\/admin\/clients\/([^/]+)/)) {
    currentEntityType = "client";
    currentEntityId = path.match(/\/admin\/clients\/([^/]+)/)?.[1] || "";
  } else if (path.match(/\/admin\/crm\/clients\/([^/]+)/)) {
    currentEntityType = "client";
    currentEntityId = path.match(/\/admin\/crm\/clients\/([^/]+)/)?.[1] || "";
  } else if (path.match(/\/admin\/projects\/([^/]+)/)) {
    currentEntityType = "project";
    currentEntityId = path.match(/\/admin\/projects\/([^/]+)/)?.[1] || "";
  } else if (path.match(/\/admin\/crm\/trade-partners\/([^/]+)/)) {
    currentEntityType = "vendor";
    currentEntityId = path.match(/\/admin\/crm\/trade-partners\/([^/]+)/)?.[1] || "";
  } else if (path === "/admin") {
    currentEntityType = "dashboard";
  } else if (path.startsWith("/admin/crm")) {
    currentEntityType = "crm";
  }

  return {
    userId: user?.id || "",
    role: "creator",
    currentPage: path,
    currentEntityType,
    currentEntityId,
    currentEntityName,
  };
}

const ActionCard = ({ action }: { action: any }) => {
  const icons: Record<string, any> = {
    client: "👤", project: "🏗️", invoice: "💰", estimate: "📋",
    vendor: "🤝", event: "📅", equipment: "⚙️", message: "💬",
    report: "📄", goal: "🎯", announcement: "📢",
  };
  const icon = icons[action.entity_type] || "✅";

  return (
    <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-2 text-xs font-sans">
      <span className="text-base">{icon}</span>
      <span className="flex-1 text-foreground">{action.result_summary}</span>
      {action.nav_link && (
        <a href={action.nav_link} className="text-primary hover:underline flex items-center gap-0.5">
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

const AgentPanel = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingStep, setThinkingStep] = useState("");
  const [sessionId] = useState(() => genId() + genId());
  const [pendingConfirm, setPendingConfirm] = useState<any>(null);
  const [isListening, setIsListening] = useState(false);
  const [hasOnboarded, setHasOnboarded] = useState(() => localStorage.getItem("hbc-agent-onboarded") === "true");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const agentContext = useAgentContext();

  // Show onboarding on first open
  useEffect(() => {
    if (open && !hasOnboarded && messages.length === 0) {
      setMessages([{
        id: genId(),
        role: "assistant",
        content: "👋 Hi! I'm **HBC Agent** — your AI-powered business partner.\n\nI can do *everything* in this app:\n- **Create clients, estimates, invoices, and projects**\n- **Send messages and schedule events**\n- **Look up data and run analytics**\n- **Draft AI-powered content**\n\nJust tell me what you need in plain English. Try one of the quick actions below, or type anything!",
      }]);
      localStorage.setItem("hbc-agent-onboarded", "true");
      setHasOnboarded(true);
    }
  }, [open, hasOnboarded, messages.length]);

  // Scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isThinking]);

  // Cmd+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
      if (e.key === "Escape" && open) setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

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
          context: { ...agentContext, sessionId },
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
    } catch (err: any) {
      setMessages(prev => [...prev, {
        id: genId(),
        role: "assistant",
        content: `Sorry, something went wrong: ${err.message || "Unknown error"}. Please try again.`,
      }]);
    } finally {
      setIsThinking(false);
      setThinkingStep("");
    }
  }, [messages, agentContext, sessionId]);

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

  // Voice input
  const toggleVoice = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) return;
    if (isListening) {
      setIsListening(false);
      return;
    }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setInput(prev => prev + transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
    setIsListening(true);
  };

  const clearChat = () => {
    setMessages([]);
    setPendingConfirm(null);
  };

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 100); }}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center border-none cursor-pointer"
        aria-label="Open HBC Agent"
      >
        <Sparkles className="w-6 h-6" />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-[440px] max-w-full p-0 flex flex-col">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
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
            {agentContext.currentEntityType && agentContext.currentEntityType !== "dashboard" && (
              <Badge variant="secondary" className="text-[10px] font-sans">
                {agentContext.currentEntityType === "client" ? "👤" : agentContext.currentEntityType === "project" ? "🏗️" : "📋"} {agentContext.currentEntityType}
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={clearChat} className="h-7 w-7 p-0">
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)} className="h-7 w-7 p-0">
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
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
                  {/* Action cards */}
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      {msg.actions.map((a: any, i: number) => (
                        <ActionCard key={i} action={a} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Thinking state */}
            {isThinking && (
              <div className="flex justify-start">
                <div className="bg-card border border-border rounded-lg px-3 py-2 flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                  <span className="text-xs font-sans text-muted-foreground animate-pulse">{thinkingStep}</span>
                </div>
              </div>
            )}

            {/* Confirmation card */}
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
            <div className="px-4 pb-2 flex gap-1.5 flex-wrap">
              {QUICK_CHIPS.map((chip) => (
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
          <div className="border-t border-border p-3">
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
            <p className="text-[10px] font-sans text-muted-foreground mt-1.5 text-center">
              ⌘K to open · Escape to close
            </p>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default AgentPanel;
