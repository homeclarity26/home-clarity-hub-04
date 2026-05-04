import { useEffect, useRef, useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { X, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBobbyThread } from "@/hooks/useBobbyThread";
import ConciergeTranscript from "./ConciergeTranscript";

interface ConciergePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId?: string;
}

const SUGGESTED_PROMPTS = [
  "Schedule the chimney sweep",
  "What paint is in the dining room?",
  "Pull up the furnace serial plate",
  "When is my next service visit?",
  "What should I do before winter?",
];

const NAVY = "#0A1628";
const GOLD = "#B87333";
const CREAM = "#EDE9E1";

const ConciergePanel = ({ open, onOpenChange, propertyId }: ConciergePanelProps) => {
  const { messages, isLoading, sendMessage } = useBobbyThread(propertyId);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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
    if (!text || sending) return;
    setInput("");
    setSending(true);
    await sendMessage(text);
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
        className="w-full sm:max-w-md p-0 flex flex-col"
        style={{ background: NAVY, color: CREAM, border: `1px solid ${GOLD}33` }}
      >
        {/* Header */}
        <div
          className="px-4 py-3 flex items-center justify-between gap-2 border-b"
          style={{ borderColor: GOLD + "33" }}
        >
          <div className="flex items-center gap-2">
            <span
              className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
              style={{ background: GOLD }}
            >
              <span className="font-display text-xs font-bold" style={{ color: NAVY }}>B</span>
            </span>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.15em]" style={{ color: GOLD }}>
                Ask Bobby
              </div>
              <div className="text-sm" style={{ color: CREAM }}>
                Trained on your home
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="hover:bg-white/10"
            style={{ color: CREAM }}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Message thread */}
        <ConciergeTranscript>
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin" style={{ color: GOLD }} />
              </div>
            ) : messages.length === 0 ? (
              <div className="space-y-4 py-6">
                <p className="text-sm text-center" style={{ color: CREAM + "99" }}>
                  Ask me anything about your home. I have access to your full report.
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {SUGGESTED_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => {
                        setInput(prompt);
                      }}
                      className="text-xs px-3 py-1.5 rounded-full border transition-colors"
                      style={{
                        borderColor: GOLD + "55",
                        background: GOLD + "15",
                        color: CREAM,
                      }}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg) => {
                if (msg.sender === "user") {
                  return (
                    <div key={msg.id} className="flex justify-end">
                      <div
                        className="max-w-[80%] rounded-lg px-3 py-2 text-sm"
                        style={{ background: CREAM + "22", color: CREAM }}
                      >
                        {msg.content}
                      </div>
                    </div>
                  );
                }
                if (msg.sender === "adam") {
                  return (
                    <div key={msg.id} className="flex justify-start">
                      <div
                        className="max-w-[80%] rounded-lg px-3 py-2 text-sm border-l-2"
                        style={{
                          background: "#ffffff11",
                          color: CREAM,
                          borderLeftColor: NAVY === "#0A1628" ? "#1a2d4a" : NAVY,
                        }}
                      >
                        <span
                          className="block font-mono text-[9px] uppercase tracking-[0.15em] mb-1"
                          style={{ color: GOLD }}
                        >
                          From Adam
                        </span>
                        {msg.content}
                      </div>
                    </div>
                  );
                }
                // bobby
                return (
                  <div key={msg.id} className="flex justify-start">
                    <div
                      className="max-w-[80%] rounded-lg px-3 py-2 text-sm"
                      style={{ background: "#ffffff11", color: CREAM }}
                    >
                      {msg.content}
                    </div>
                  </div>
                );
              })
            )}
            {sending && (
              <div className="flex justify-start">
                <div
                  className="rounded-lg px-3 py-2 flex items-center gap-2"
                  style={{ background: "#ffffff11" }}
                >
                  <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: GOLD }} />
                  <span className="text-xs" style={{ color: CREAM + "88" }}>Bobby is thinking...</span>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div
            className="px-4 py-3 border-t flex gap-2"
            style={{ borderColor: GOLD + "33" }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Bobby anything..."
              className="flex-1 bg-transparent border rounded-lg px-3 py-2 text-sm outline-none min-h-[44px]"
              style={{
                borderColor: GOLD + "44",
                color: CREAM,
              }}
            />
            <Button
              size="sm"
              disabled={!input.trim() || sending}
              onClick={() => void handleSend()}
              className="min-h-[44px] min-w-[44px] p-0 flex items-center justify-center shrink-0"
              style={{ background: GOLD, color: NAVY }}
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
