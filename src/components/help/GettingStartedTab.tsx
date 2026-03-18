import { Check, Star, ArrowRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useTutorialProgress } from "@/hooks/useTutorialProgress";

interface GettingStartedTabProps {
  onNavigate: (tab: string) => void;
}

const GettingStartedTab = ({ onNavigate }: GettingStartedTabProps) => {
  const { progress, clientChecklistItems, completedCount, allComplete } = useTutorialProgress();
  const checklist = (progress?.checklist_items_json || {}) as Record<string, boolean>;

  if (allComplete) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mb-4">
          <Star className="w-8 h-8 text-accent" />
        </div>
        <h3 className="font-display text-lg text-foreground mb-2">You know your portal inside and out!</h3>
        <p className="text-sm font-sans text-muted-foreground mb-6">
          You've explored every section of your Home Clarity Hub portal. Great work!
        </p>
        <Button onClick={() => onNavigate("report")} className="font-sans">
          View Your Report →
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            {completedCount} of {clientChecklistItems.length} complete
          </span>
        </div>
        <Progress
          value={(completedCount / clientChecklistItems.length) * 100}
          className="h-2 bg-muted [&>div]:bg-accent"
        />
      </div>

      <div className="space-y-1">
        {clientChecklistItems.map((item) => {
          const done = !!checklist[item.key];
          return (
            <div
              key={item.key}
              className={`flex items-start gap-3 p-3 rounded-md transition-colors ${done ? "bg-accent/5" : "hover:bg-muted/50"}`}
            >
              <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${done ? "bg-accent border-accent" : "border-muted-foreground/30"}`}>
                {done && <Check className="w-3 h-3 text-primary-foreground" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-sans ${done ? "text-muted-foreground line-through" : "text-foreground font-medium"}`}>
                  {item.title}
                </p>
                <p className="text-xs font-sans text-muted-foreground mt-0.5">{item.description}</p>
              </div>
              {!done && (
                <button
                  onClick={() => onNavigate(item.tab)}
                  className="text-xs font-sans text-accent hover:text-accent/80 transition-colors bg-transparent border-none cursor-pointer whitespace-nowrap flex items-center gap-1 mt-0.5"
                >
                  Go There <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GettingStartedTab;
