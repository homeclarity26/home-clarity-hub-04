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
  "View schedule",
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
      {/* Prompt chips — uniform grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mt-3">
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
