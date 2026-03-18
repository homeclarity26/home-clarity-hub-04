import { HelpCircle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface HelpTooltipProps {
  content: string;
  className?: string;
}

const HelpTooltip = ({ content, className = "" }: HelpTooltipProps) => (
  <Popover>
    <PopoverTrigger asChild>
      <button className={`inline-flex items-center justify-center w-4 h-4 rounded-full bg-transparent border-none cursor-pointer text-muted-foreground hover:text-accent transition-colors ${className}`}>
        <HelpCircle className="w-3.5 h-3.5" />
      </button>
    </PopoverTrigger>
    <PopoverContent
      side="top"
      className="max-w-[220px] p-3 bg-primary text-primary-foreground text-xs font-sans leading-relaxed border-none rounded-md shadow-lg"
      style={{ borderTop: "2px solid hsl(var(--accent))" }}
    >
      {content}
    </PopoverContent>
  </Popover>
);

export default HelpTooltip;
