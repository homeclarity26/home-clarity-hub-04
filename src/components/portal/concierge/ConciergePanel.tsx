import { useEffect, useRef, useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBobbyThread } from "@/hooks/useBobbyThread";
import ConciergeTranscript from "./ConciergeTranscript";

interface ConciergePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId?: string;
  /**
   * Cormorant heading under the gold eyebrow. Defaults to the generic
   * label; pass e.g. "Trained on the Caldwell home" when the family
   * name is known (prototype screen 33).
   */
  homeLabel?: string;
  /**
   * Dev-only fixture thread for /dev/prototype-qa. When provided the
   * panel renders these messages instead of the live Bobby thread and
   * never touches the network.
   */
  qaThread?: { sender: "user" | "bobby" | "adam"; content: string }[];
}

// Prototype screen 33 demo prompts. Rendered as quoted chips; the list
// stays visible above the thread so the client always has a starting point.
const SUGGESTED_PROMPTS = [
  "Schedule the chimney sweep this fall",
  "Pay the AK Renovations draw invoice that came in",
  "What paint is on the dining room walls?",
  "Pull up the photo of the furnace serial plate",
  "Tell Adam I want to start planning the basement gym",
];

interface DisplayMessage {
  id: string;
  sender: "user" | "bobby" | "adam";
  content: string;
}

// White slide-over panel per prototype screens 33-34: gold mono eyebrow +
// Cormorant heading, intro line, quoted prompt chips, then the thread
// (user echoes on cream, Bobby replies on a navy card). Bobby naming is
// locked; internal paths keep concierge/ for code organization only.
const ConciergePanel = ({
  open,
  onOpenChange,
  propertyId,
  homeLabel,
  qaThread,
}: ConciergePanelProps) => {
  const thread = useBobbyThread(qaThread ? undefined : propertyId);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const messages: DisplayMessage[] = qaThread
    ? qaThread.map((m, i) => ({ id: `qa-${i}`, ...m }))
    : thread.messages;
  const isLoading = qaThread ? false : thread.isLoading;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const onPrefill = (e: Event) => {
      const detail = (e as CustomEvent<{ prompt?: string }>).detail;
      if (detail?.prompt) {
        setInput(detail.prompt);
      }
    };
    window.addEventListener("concierge:prefill", onPrefill as EventListener);
    return () => window.removeEventListener("concierge:prefill", onPrefill as EventListener);
  }, []);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending || qaThread) return;
    setInput("");
    setSending(true);
    await thread.sendMessage(text);
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-0 flex flex-col bg-card text-foreground border-l border-border"
      >
        {/* Header — SheetContent renders its own close X top-right */}
        <div className="px-5 py-4 border-b border-border">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-hbc-gold-readable">
            Ask Bobby
          </div>
          <div className="font-display text-xl text-primary leading-snug mt-0.5">
            {homeLabel ?? "Trained on your home"}
          </div>
        </div>

        {/* Thread */}
        <ConciergeTranscript>
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-accent" />
              </div>
            ) : (
              <>
                <p className="text-sm font-sans text-foreground/80 leading-relaxed">
                  I know everything in your HCR. I can answer questions, pull up
                  records, and take action. Try one of these:
                </p>
                <div className="space-y-2">
                  {SUGGESTED_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => setInput(prompt)}
                      className="w-full text-left rounded-md border border-border bg-card px-3.5 py-2.5 text-sm font-sans text-foreground min-h-[44px] transition-colors hover:border-accent/60 hover:bg-secondary"
                    >
                      &ldquo;{prompt}&rdquo;
                    </button>
                  ))}
                </div>
                {messages.map((msg) => {
                  if (msg.sender === "user") {
                    return (
                      <div
                        key={msg.id}
                        className="rounded-md bg-secondary px-3.5 py-2.5 text-sm font-sans italic text-foreground/90"
                      >
                        You: &ldquo;{msg.content}&rdquo;
                      </div>
                    );
                  }
                  return (
                    <div key={msg.id} className="rounded-md bg-primary p-4">
                      <span className="block font-mono text-[9px] uppercase tracking-[0.18em] text-hbc-gold mb-1.5">
                        {msg.sender === "adam" ? "From Adam" : "Bobby"}
                      </span>
                      <p className="text-sm font-sans text-primary-foreground/95 leading-relaxed whitespace-pre-line">
                        {msg.content}
                      </p>
                    </div>
                  );
                })}
              </>
            )}
            {sending && (
              <div className="rounded-md bg-primary/5 border border-border px-3.5 py-2.5 flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />
                <span className="text-xs font-sans text-muted-foreground">
                  Bobby is thinking...
                </span>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="px-5 py-4 border-t border-border flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Bobby anything..."
              className="flex-1 bg-card border border-input rounded-md px-3 py-2 text-sm font-sans text-foreground outline-none min-h-[44px] focus:border-accent"
            />
            <Button
              size="sm"
              disabled={!input.trim() || sending}
              onClick={() => void handleSend()}
              aria-label="Send message to Bobby"
              className="min-h-[44px] min-w-[44px] p-0 flex items-center justify-center shrink-0 bg-accent text-white hover:bg-accent/90"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </ConciergeTranscript>
      </SheetContent>
    </Sheet>
  );
};

export default ConciergePanel;
