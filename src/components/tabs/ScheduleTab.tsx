import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { format, isThisWeek, isFuture } from "date-fns";

interface ScheduleTabProps {
  propertyId?: string;
}

interface ScheduleEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_type: string;
  status: string;
}

const ScheduleTab = ({ propertyId }: ScheduleTabProps) => {
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!propertyId) {
      setLoading(false);
      return;
    }
    supabase
      .from("schedule_events")
      .select("*")
      .eq("property_id", propertyId)
      .order("event_date", { ascending: true })
      .then(({ data }) => {
        if (data) setEvents(data as ScheduleEvent[]);
        setLoading(false);
      });
  }, [propertyId]);

  const thisWeek = events.filter((e) => isThisWeek(new Date(e.event_date)));
  const upcoming = events.filter((e) => isFuture(new Date(e.event_date)) && !isThisWeek(new Date(e.event_date)));

  const renderTimeline = (items: ScheduleEvent[], emptyMsg: string) => {
    if (items.length === 0) {
      return <p className="text-base text-muted-foreground">{emptyMsg}</p>;
    }
    return (
      <div className="relative pl-6">
        <div className="absolute left-0 top-0 bottom-0 w-px bg-border" />
        {items.map((event, i) => (
          <div key={event.id} className={`relative ${i < items.length - 1 ? "pb-10" : ""}`}>
            <div className={`absolute -left-[25px] top-1 w-2 h-2 rounded-full ${
              event.event_type === "milestone" ? "bg-accent" : "bg-foreground"
            }`} />
            <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground mb-2">
              {format(new Date(event.event_date), "MMMM d, yyyy")}
            </p>
            <p className="text-base text-foreground">{event.title}</p>
            {event.description && (
              <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
      <div className="py-16 md:py-24 px-6 md:px-20 max-w-[1400px] mx-auto">
        <h1 className="font-display text-3xl text-foreground mb-6">Schedule & Timeline</h1>
        <p className="text-base text-muted-foreground max-w-[60ch]">
          Upcoming appointments, maintenance reminders, and project milestones.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 max-w-[1400px] mx-auto px-6 md:px-20 pb-16">
        <Card className="p-8 md:p-10 shadow-hbc-sm hover:shadow-hbc-md transition-all hover:-translate-y-0.5">
          <h2 className="font-display text-2xl text-foreground mb-8">This Week</h2>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : (
            renderTimeline(thisWeek, "No events scheduled this week.")
          )}
        </Card>

        <Card className="p-8 md:p-10 shadow-hbc-sm hover:shadow-hbc-md transition-all hover:-translate-y-0.5">
          <h2 className="font-display text-2xl text-foreground mb-8">Upcoming</h2>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : (
            renderTimeline(upcoming, "No upcoming events scheduled.")
          )}
        </Card>

        <Card className="md:col-span-2 p-8 md:p-10 shadow-hbc-sm hover:shadow-hbc-md transition-all hover:-translate-y-0.5">
          <h2 className="font-display text-2xl text-foreground mb-6">Annual Reminders</h2>
          <p className="text-base text-foreground">
            Seasonal maintenance schedules will be populated after your report is complete.
          </p>
        </Card>
      </div>
    </div>
  );
};

export default ScheduleTab;
