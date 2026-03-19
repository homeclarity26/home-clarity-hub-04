import { useState } from "react";
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onSubmit(value.trim());
      setValue("");
    }
  };

  const handleChipClick = (prompt: string) => {
    setValue(prompt);
    onSubmit(prompt);
  };

  return (
    <div className="w-full px-6 md:px-20 max-w-[1400px] mx-auto">
      <div className="bg-card rounded-xl border border-border shadow-hbc-md">
        <form onSubmit={handleSubmit} className="relative">
          <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-accent" />
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Ask your home concierge anything…"
            className="w-full h-11 pl-11 pr-4 bg-transparent rounded-xl text-foreground font-sans text-[15px] placeholder:text-muted-foreground/70 focus:outline-none focus:ring-0 border-none"
          />
        </form>
      </div>
      {/* Prompt chips */}
      <div className="flex gap-1.5 mt-1.5 overflow-x-auto pb-1 scrollbar-hide" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
        {SUGGESTED_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            onClick={() => handleChipClick(prompt)}
            className="shrink-0 px-3 py-1 rounded-full border border-border/60 bg-card text-xs font-sans text-muted-foreground hover:border-accent/50 hover:text-accent transition-colors cursor-pointer whitespace-nowrap"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
};

export default AICommandBar;
