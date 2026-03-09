import { Check, Loader2, AlertCircle } from "lucide-react";
import type { SaveStatus } from "@/hooks/useReportPage";
import { cn } from "@/lib/utils";

interface SaveIndicatorProps {
  status: SaveStatus;
  className?: string;
}

const SaveIndicator = ({ status, className }: SaveIndicatorProps) => {
  if (status === "idle") return null;

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.15em]",
        status === "saving" && "text-muted-foreground",
        status === "saved" && "text-accent",
        status === "error" && "text-destructive",
        className
      )}
    >
      {status === "saving" && (
        <>
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Saving...</span>
        </>
      )}
      {status === "saved" && (
        <>
          <Check className="h-3 w-3" />
          <span>Saved</span>
        </>
      )}
      {status === "error" && (
        <>
          <AlertCircle className="h-3 w-3" />
          <span>Error</span>
        </>
      )}
    </div>
  );
};

export default SaveIndicator;
