import { useState, useRef, useEffect, useCallback } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Send, Loader2, HelpCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const HELP_TEXT = `**What can I do?** Here are some examples:

**Contact Management:**
• "Add a new client named John Smith at 123 Main St"
• "Move all clients in Draft stage to At Risk"

**Communication:**
• "Write a follow-up email to Sarah about the kitchen estimate"
• "Draft a welcome message for my newest clients"

**Tasks & Follow-ups:**
• "Remind me to follow up with clients who have open invoices"
• "Show me all clients I haven't contacted in 60+ days"

**Financial:**
• "Create an invoice for HVAC tune-up, $350"
• "What's my total outstanding receivables?"

**Insights:**
• "Who are my top 5 clients by lifetime value?"
• "Which trade partners have the best ratings?"
`;

const genId = () => Math.random().toString(36).slice(2, 10);

const CRMAIAssistant = ({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const [sessionId] = useState(() => genId() + genId());

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const send = useCallback(async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput("");
    setLoading(true);

    try {
      const history = allMessages.slice(-12).map(m => ({ role: m.role, content: m.content }));
      const { data, error } = await supabase.functions.invoke("hbc-agent", {
        body: {
          message: userMsg.content,
          history: history.slice(0, -1),
          context: {
            userId: user?.id || "",
            role: "creator",
            currentPage: "/admin/crm",
            currentEntityType: "crm",
            currentEntityId: "",
            currentEntityName: "CRM Hub",
            sessionId,
          },
        },
      });

      if (error) throw error;
      setMessages(prev => [...prev, { role: "assistant", content: data.reply || "Done!" }]);
    } catch (err: any) {
      if (err?.message?.includes("429") || err?.status === 429) {
        setMessages(prev => [...prev, { role: "assistant", content: "Rate limit reached. Please try again in a moment." }]);
      } else if (err?.message?.includes("402") || err?.status === 402) {
        setMessages(prev => [...prev, { role: "assistant", content: "AI credits exhausted. Please add funds." }]);
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: "Sorry, something went wrong. Please try again." }]);
      }
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, user, sessionId]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-[440px] p-0 flex flex-col">
        <SheetHeader className="px-5 py-4 border-b border-border">
          <SheetTitle className="flex items-center gap-2 font-sans text-base">
            <Sparkles className="w-5 h-5 text-accent" /> CRM AI Assistant
          </SheetTitle>
        </SheetHeader>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {messages.length === 0 && (
            <div className="prose prose-sm text-muted-foreground font-sans max-w-none">
              <ReactMarkdown>{HELP_TEXT}</ReactMarkdown>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-xl px-4 py-2.5 text-sm font-sans ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                {m.role === "assistant" ? (
                  <div className="prose prose-sm max-w-none"><ReactMarkdown>{m.content}</ReactMarkdown></div>
                ) : m.content}
              </div>
            </div>
          ))}
          {loading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-xl px-4 py-3">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-border px-5 py-3 flex items-center gap-2">
          <Button variant="ghost" size="icon" className="shrink-0" onClick={() => {
            setMessages([{ role: "user", content: "What can you do?" }, { role: "assistant", content: HELP_TEXT }]);
          }}>
            <HelpCircle className="w-4 h-4 text-muted-foreground" />
          </Button>
          <Input
            placeholder="Ask me anything about your CRM..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && send()}
            className="flex-1 font-sans"
          />
          <Button size="icon" onClick={send} disabled={!input.trim() || loading}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CRMAIAssistant;
