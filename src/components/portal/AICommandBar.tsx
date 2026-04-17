import { useState, useRef } from "react";
import { Sparkles, Send } from "lucide-react";

interface AICommandBarProps {
  onSubmit: (query: string) => void;
  autoSubmitChip?: boolean;
}

const SUGGESTED_PROMPTS = [
  "What's my balance due?",
  "What should I fix first?",
  "When is my next milestone?",
  "What needs attention?",
  "Tell me about my equipment",
  "Review my spending",
];

const AICommandBar = ({ onSubmit, autoSubmitChip = true }: AICommandBarProps) => {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onSubmit(value.trim());
      setValue("");
    }
  };

  const handleChipClick = (prompt: string) => {
    if (autoSubmitChip) {
      onSubmit(prompt);
      return;
    }
    setValue(prompt);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const canSend = value.trim().length > 0;

  return (
    <div className="w-full">
      <div className="bg-card rounded-lg border border-border shadow-hbc-sm">
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <Sparkles className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-accent pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Ask your home concierge anything…"
            className="flex-1 h-14 pr-2 bg-transparent rounded-l-lg text-foreground font-sans text-[15px] placeholder:text-muted-foreground focus:outline-none focus:ring-0 border-none"
            style={{ paddingLeft: "3rem" }}
            aria-label="Ask the Home Assistant"
          />
          <button
            type="submit"
            disabled={!canSend}
            aria-label="Send question"
            className="shrink-0 mr-2 h-10 w-10 rounded-full bg-accent text-accent-foreground flex items-center justify-center hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all min-h-[44px] min-w-[44px] md:min-h-[40px] md:min-w-[40px]"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
      {/* Prompt chips — uniform grid */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-2 mt-3">
        {SUGGESTED_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            onClick={() => handleChipClick(prompt)}
            className="text-xs font-sans text-accent border border-accent/30 rounded-full px-3 py-2 hover:bg-accent/10 hover:border-accent/60 transition-all cursor-pointer bg-transparent text-center"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
};

export default AICommandBar;
