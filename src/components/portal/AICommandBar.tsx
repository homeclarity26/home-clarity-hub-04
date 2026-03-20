import { useState, useRef } from "react";
import { Sparkles } from "lucide-react";

interface AICommandBarProps {
  onSubmit: (query: string) => void;
}

const SUGGESTED_PROMPTS = [
  "What needs attention?",
  "Schedule a service",
  "Review my spending",
  "What's coming up?",
  "Show open proposals",
];

const AICommandBar = ({ onSubmit }: AICommandBarProps) => {
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
    setValue(prompt);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  return (
    <div className="w-full px-6 md:px-20 max-w-[1400px] mx-auto">
      <div className="bg-card rounded-lg border border-border shadow-hbc-sm">
        <form onSubmit={handleSubmit} className="relative">
          <Sparkles className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-accent" />
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Ask your home concierge anything…"
            className="w-full h-14 pl-13 pr-5 bg-transparent rounded-lg text-foreground font-sans text-[15px] placeholder:text-muted-foreground focus:outline-none focus:ring-0 border-none"
            style={{ paddingLeft: "3rem" }}
          />
        </form>
      </div>
      {/* Prompt chips as subtle gold text links */}
      <div className="flex items-center gap-1 mt-2 flex-wrap">
        {SUGGESTED_PROMPTS.map((prompt, i) => (
          <span key={prompt} className="flex items-center">
            <button
              onClick={() => handleChipClick(prompt)}
              className="text-[11px] font-mono tracking-[0.05em] text-accent hover:text-foreground transition-colors bg-transparent border-none cursor-pointer px-1 py-0.5"
            >
              {prompt}
            </button>
            {i < SUGGESTED_PROMPTS.length - 1 && (
              <span className="text-border text-[10px]">·</span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
};

export default AICommandBar;
