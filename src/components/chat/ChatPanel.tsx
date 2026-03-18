import { useState, useRef, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Send, Loader2, Trash2 } from "lucide-react";
import ChatMessage from "./ChatMessage";
import { useChat } from "./useChat";

interface ChatPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportContext: unknown;
  initialQuery?: string;
  onNavigateToPage?: (pageTitle: string) => void;
}

const ChatPanel = ({ open, onOpenChange, reportContext, initialQuery, onNavigateToPage }: ChatPanelProps) => {
  const { messages, isLoading, send, clearMessages } = useChat(reportContext);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sentInitial = useRef(false);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  // Send initial query if provided
  useEffect(() => {
    if (open && initialQuery && !sentInitial.current && messages.length === 0) {
      sentInitial.current = true;
      send(initialQuery);
    }
  }, [open, initialQuery, messages.length, send]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    setInput("");
    send(trimmed);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[70vh] flex flex-col p-0 rounded-t-2xl">
        <SheetHeader className="px-6 pt-5 pb-3 border-b border-border shrink-0">
          <div className="flex items-center justify-between">
            <SheetTitle className="font-display text-lg">Home Advisor</SheetTitle>
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground"
                onClick={clearMessages}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </SheetHeader>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3">
              <p className="text-sm text-muted-foreground max-w-[300px]">
                Ask anything about your home — condition, costs, recommendations, or timing.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {["What's the most urgent repair?", "How much for the kitchen?", "What's my roof condition?"].map((q) => (
                  <button
                    key={q}
                    onClick={() => send(q)}
                    className="text-xs px-3 py-1.5 rounded-full bg-muted text-foreground hover:bg-accent/20 transition-colors font-sans"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((msg, i) => (
            <ChatMessage key={i} message={msg} />
          ))}
          {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-border px-6 py-4 shrink-0">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="Ask about your home..."
              className="flex-1 h-11 bg-background border border-border rounded-lg px-4 text-sm text-foreground outline-none focus:border-accent transition-colors font-sans"
              disabled={isLoading}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="h-11 w-11 shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ChatPanel;
