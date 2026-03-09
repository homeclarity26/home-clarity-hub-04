import { useState, useEffect } from "react";
import { Calendar, Clock, Sun, Thermometer, Leaf, Snowflake, Phone, Hammer, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, isThisWeek, isFuture } from "date-fns";

interface ScheduleTabProps {
  propertyId?: string;
  onTabChange?: (tab: string) => void;
}

interface ScheduleEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_type: string;
  status: string;
}

const cardBase = "group bg-card rounded-lg p-8 shadow-hbc-sm hover:shadow-hbc-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col gap-3 border border-border text-left w-full";

const seasonalCards = [
  { title: "Spring Checklist", icon: Sun, subtitle: "Gutters, HVAC filter, exterior inspection" },
  { title: "Summer Checklist", icon: Thermometer, subtitle: "A/C service, deck inspection, pest check" },
  { title: "Fall Checklist", icon: Leaf, subtitle: "Furnace service, weatherstripping, roof check" },
  { title: "Winter Checklist", icon: Snowflake, subtitle: "Pipe insulation, snow removal plan, fireplace" },
];

const ScheduleTab = ({ propertyId, onTabChange }: ScheduleTabProps) => {
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!propertyId) { setLoading(false); return; }
    supabase.from("schedule_events").select("*").eq("property_id", propertyId).order("event_date", { ascending: true })
      .then(({ data }) => { if (data) setEvents(data as ScheduleEvent[]); setLoading(false); });
  }, [propertyId]);

  const thisWeek = events.filter((e) => isThisWeek(new Date(e.event_date)));
  const upcoming = events.filter((e) => isFuture(new Date(e.event_date)) && !isThisWeek(new Date(e.event_date)));

  const renderEventList = (items: ScheduleEvent[], emptyMsg: string) => {
    if (items.length === 0) {
      return <p className="font-sans text-sm text-muted-foreground">{emptyMsg}</p>;
    }
    return (
      <div className="flex flex-col gap-4 mt-2">
        {items.map((event) => (
          <div key={event.id} className="flex items-start gap-3 py-2 border-b border-border last:border-b-0">
            <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${event.event_type === "milestone" ? "bg-accent" : "bg-foreground"}`} />
            <div>
              <p className="font-sans text-sm text-foreground">{event.title}</p>
              <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground mt-1">
                {format(new Date(event.event_date), "MMMM d, yyyy")}
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
      {/* Hero */}
      <section className="text-center py-12 md:py-16 px-6 md:px-20 max-w-4xl mx-auto">
        <h1 className="font-display text-3xl md:text-[36px] text-foreground mb-3">Schedule & Timeline</h1>
        <p className="font-sans text-base text-muted-foreground">
          Upcoming appointments, maintenance reminders, and project milestones.
        </p>
      </section>

      <div className="max-w-[1400px] mx-auto px-6 md:px-20 pb-16 flex flex-col gap-10">

        {/* Row 1: This Week + Upcoming */}
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent mb-6">This Week</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`${cardBase} cursor-default`}>
              <Calendar className="w-5 h-5 text-accent" />
              <h2 className="font-display text-xl text-foreground mb-1">This Week</h2>
              <p className="font-sans text-sm text-muted-foreground">Scheduled events for this week</p>
              {loading ? (
                <p className="font-sans text-sm text-muted-foreground">Loading...</p>
              ) : (
                renderEventList(thisWeek, "No events scheduled this week")
              )}
            </div>

            <div className={`${cardBase} cursor-default`}>
              <div className="flex items-start justify-between w-full">
                <Clock className="w-5 h-5 text-accent" />
                {upcoming.length > 0 && (
                  <span className="font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent/20 text-accent-foreground">
                    {upcoming.length} upcoming
                  </span>
                )}
              </div>
              <h2 className="font-display text-xl text-foreground mb-1">Upcoming Appointments</h2>
              <p className="font-sans text-sm text-muted-foreground">Future scheduled events</p>
              {loading ? (
                <p className="font-sans text-sm text-muted-foreground">Loading...</p>
              ) : (
                renderEventList(upcoming, "No upcoming events scheduled")
              )}
            </div>
          </div>
        </div>

        {/* Row 2: Annual Maintenance Reminders */}
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent mb-6">Annual Maintenance Reminders</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {seasonalCards.map((card) => (
              <div key={card.title} className={`${cardBase} cursor-default`}>
                <div className="flex items-start justify-between w-full">
                  <card.icon className="w-5 h-5 text-accent" />
                  <span className="font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    Report in progress
                  </span>
                </div>
                <h3 className="font-display text-xl text-foreground">{card.title}</h3>
                <p className="font-sans text-sm text-muted-foreground">{card.subtitle}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Row 3: Quick Actions */}
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent mb-6">Quick Actions</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <button onClick={() => onTabChange?.("contacts")} className={cardBase}>
              <Phone className="w-5 h-5 text-accent" />
              <h2 className="font-display text-xl text-foreground mb-1">Contact Your Advisor</h2>
              <p className="font-sans text-sm text-muted-foreground">Schedule a consultation with Adam Kinney</p>
              <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-accent self-end transition-colors" />
            </button>
            <button onClick={() => onTabChange?.("projects")} className={cardBase}>
              <Hammer className="w-5 h-5 text-accent" />
              <h2 className="font-display text-xl text-foreground mb-1">View Your Projects</h2>
              <p className="font-sans text-sm text-muted-foreground">See active and upcoming home improvements</p>
              <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-accent self-end transition-colors" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleTab;
