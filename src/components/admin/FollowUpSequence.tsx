import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Loader2, Play, CheckCircle2, Clock, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { addDays, format, isPast, isFuture } from "date-fns";

interface FollowUpSequenceProps {
  propertyId: string;
  reportStatus?: string;
  events?: { id: string; title: string; event_date: string; event_type: string; status: string; description: string | null }[];
}

const SEQUENCE_STEPS = [
  { offsetDays: 7, title: "1-Week Check-In", description: "Follow up on report delivery. Answer initial questions and clarify priority items." },
  { offsetDays: 30, title: "30-Day Review", description: "Review progress on approved projects. Discuss any new concerns or changes." },
  { offsetDays: 90, title: "90-Day Action Plan Review", description: "Evaluate completed work, update condition ratings, and plan next quarter priorities." },
];

const FollowUpSequence = ({ propertyId, reportStatus, events = [] }: FollowUpSequenceProps) => {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);

  // Find existing follow-up events
  const followUpEvents = events.filter(
    (e) => e.event_type === "milestone" && SEQUENCE_STEPS.some((s) => e.title.includes(s.title))
  );

  const hasSequence = followUpEvents.length > 0;

  const handleCreateSequence = async () => {
    setIsCreating(true);
    try {
      const now = new Date();
      const inserts = SEQUENCE_STEPS.map((step) => ({
        property_id: propertyId,
        title: `Follow-Up: ${step.title}`,
        description: step.description,
        event_date: addDays(now, step.offsetDays).toISOString(),
        event_type: "milestone" as const,
        status: "scheduled" as const,
      }));

      const { error } = await supabase.from("schedule_events").insert(inserts);
      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["admin-schedule-events", propertyId] });
      toast.success("Follow-up sequence created (7-day, 30-day, 90-day)");
    } catch {
      toast.error("Failed to create follow-up sequence");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-sans font-semibold text-foreground">Follow-Up Sequence</h4>
          <p className="text-xs font-sans text-muted-foreground mt-0.5">
            Automated touchpoints after report delivery
          </p>
        </div>
        {!hasSequence && (
          <Button
            size="sm"
            className="gap-1.5 text-xs font-sans"
            onClick={handleCreateSequence}
            disabled={isCreating}
          >
            {isCreating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            Start Sequence
          </Button>
        )}
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />

        <div className="space-y-4">
          {SEQUENCE_STEPS.map((step, i) => {
            const matchingEvent = followUpEvents.find((e) => e.title.includes(step.title));
            const isCompleted = matchingEvent?.status === "completed";
            const isUpcoming = matchingEvent && isFuture(new Date(matchingEvent.event_date));
            const isOverdue = matchingEvent && isPast(new Date(matchingEvent.event_date)) && !isCompleted;

            return (
              <div key={step.title} className="flex items-start gap-3 relative">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${
                  isCompleted
                    ? "bg-emerald-100 text-emerald-600"
                    : isOverdue
                      ? "bg-destructive/10 text-destructive"
                      : matchingEvent
                        ? "bg-accent/10 text-accent"
                        : "bg-muted text-muted-foreground"
                }`}>
                  {isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : isOverdue ? (
                    <Clock className="w-3.5 h-3.5" />
                  ) : (
                    <Calendar className="w-3.5 h-3.5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`text-sm font-sans font-medium ${isCompleted ? "text-muted-foreground line-through" : "text-foreground"}`}>
                      {step.title}
                    </p>
                    {matchingEvent && (
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-mono ${
                          isCompleted ? "text-emerald-600 border-emerald-200" : isOverdue ? "text-destructive border-destructive/30" : "text-muted-foreground"
                        }`}
                      >
                        {format(new Date(matchingEvent.event_date), "MMM d")}
                      </Badge>
                    )}
                    {!matchingEvent && (
                      <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground/50">
                        +{step.offsetDays}d
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs font-sans text-muted-foreground mt-0.5">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};

export default FollowUpSequence;
