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
      <div className="bg-card rounded-xl border border-border shadow-hbc-md p-1">
        <form onSubmit={handleSubmit} className="relative">
          <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-accent" />
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Ask your home concierge anything…"
            className="w-full h-14 pl-12 pr-4 bg-transparent rounded-lg text-foreground font-sans text-base placeholder:text-muted-foreground/60 focus:outline-none focus:ring-0 border-none"
          />
        </form>
      </div>
      {/* Prompt chips */}
      <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
        {SUGGESTED_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            onClick={() => handleChipClick(prompt)}
            className="shrink-0 px-4 py-2 rounded-full border border-border bg-card text-sm font-sans text-muted-foreground hover:border-accent hover:text-accent transition-colors cursor-pointer whitespace-nowrap"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
};

export default AICommandBar;
