import { useState, useEffect } from "react";
import {
  Calendar, Clock, Sun, Thermometer, Leaf, Snowflake,
  Phone, Hammer, ChevronRight, FileText, Wrench,
  AlertCircle, CheckCircle2, Star,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, isThisWeek, isFuture, isPast, isToday, differenceInDays, startOfDay } from "date-fns";

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

const cardBase =
  "group bg-card rounded-lg p-6 shadow-hbc-sm hover:shadow-hbc-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col gap-3 border border-border text-left w-full";

const seasonalCards = [
  {
    title: "Spring Checklist",
    icon: Sun,
    tasks: ["Clean gutters & downspouts", "HVAC filter replacement", "Exterior inspection for winter damage", "Test smoke & CO detectors"],
  },
  {
    title: "Summer Checklist",
    icon: Thermometer,
    tasks: ["A/C tune-up & filter check", "Deck/patio inspection", "Pest prevention check", "Check irrigation system"],
  },
  {
    title: "Fall Checklist",
    icon: Leaf,
    tasks: ["Furnace service & filter", "Weatherstripping doors & windows", "Roof & flashing inspection", "Flush water heater"],
  },
  {
    title: "Winter Checklist",
    icon: Snowflake,
    tasks: ["Insulate exposed pipes", "Test heating system", "Clear dryer vents", "Check attic for ice dam risk"],
  },
];

const eventTypeConfig: Record<string, { icon: typeof Calendar; label: string; dotClass: string; badgeClass: string }> = {
  appointment: { icon: Calendar, label: "Appointment", dotClass: "bg-foreground", badgeClass: "bg-muted text-muted-foreground" },
  milestone: { icon: Star, label: "Milestone", dotClass: "bg-accent", badgeClass: "bg-accent/10 text-accent" },
  task: { icon: Wrench, label: "Task", dotClass: "bg-orange-400", badgeClass: "bg-orange-100 text-orange-700" },
  inspection: { icon: FileText, label: "Inspection", dotClass: "bg-primary", badgeClass: "bg-primary/10 text-primary" },
  reminder: { icon: AlertCircle, label: "Reminder", dotClass: "bg-destructive", badgeClass: "bg-destructive/10 text-destructive" },
};

function getRelativeLabel(dateStr: string): string {
  const date = startOfDay(new Date(dateStr));
  const today = startOfDay(new Date());
  const diff = differenceInDays(date, today);
  if (isToday(new Date(dateStr))) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  if (diff > 0 && diff <= 7) return `In ${diff} days`;
  if (diff < 0 && diff >= -7) return `${Math.abs(diff)} days ago`;
  return format(new Date(dateStr), "MMM d, yyyy");
}

interface EventCardProps {
  event: ScheduleEvent;
  past?: boolean;
}

const EventCard = ({ event, past }: EventCardProps) => {
  const cfg = eventTypeConfig[event.event_type] || eventTypeConfig.appointment;

  return (
    <div className={`flex items-start gap-3 py-3 border-b border-border last:border-b-0 ${past ? "opacity-60" : ""}`}>
      <span className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${cfg.dotClass}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <p className="font-sans text-sm font-medium text-foreground">{event.title}</p>
          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded flex-shrink-0 ${cfg.badgeClass}`}>
            {cfg.label}
          </span>
        </div>
        {event.description && (
          <p className="font-sans text-xs text-muted-foreground mt-0.5 line-clamp-2">{event.description}</p>
        )}
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground mt-1.5 flex items-center gap-1.5">
          <Clock className="w-3 h-3" />
          <span className="text-foreground/70">{getRelativeLabel(event.event_date)}</span>
          <span className="text-muted-foreground/40">·</span>
          <span>{format(new Date(event.event_date), "MMMM d, yyyy")}</span>
        </p>
      </div>
      {past && <CheckCircle2 className="w-4 h-4 text-muted-foreground/40 flex-shrink-0 mt-1" />}
    </div>
  );
};

const ScheduleTab = ({ propertyId, onTabChange }: ScheduleTabProps) => {
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSeason, setExpandedSeason] = useState<string | null>(null);

  useEffect(() => {
    if (!propertyId) { setLoading(false); return; }

    if (propertyId.startsWith("mock-")) {
      const d = (offset: number) => {
        const dt = new Date();
        dt.setDate(dt.getDate() + offset);
        return dt.toISOString();
      };
      setEvents([
        { id: "1", title: "Furnace replacement consultation", description: "Review vendor bids with Adam — bring questions about efficiency ratings and warranty", event_date: d(2), event_type: "appointment", status: "scheduled" },
        { id: "2", title: "Electrical panel inspection", description: "Licensed electrician evaluating panel upgrade options and load capacity", event_date: d(18), event_type: "inspection", status: "scheduled" },
        { id: "3", title: "Spring exterior walkthrough", description: "Seasonal assessment of roof, gutters, and landscaping drainage", event_date: d(45), event_type: "milestone", status: "scheduled" },
        { id: "4", title: "HVAC filter replacement", description: "Changed all 3-inch MERV 11 filters — next change due in 90 days", event_date: d(-30), event_type: "task", status: "completed" },
        { id: "5", title: "Roof inspection", description: "Pre-winter assessment completed — minor sealant repair at chimney flashing noted", event_date: d(-90), event_type: "inspection", status: "completed" },
      ]);
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

  const todayEvents = events.filter((e) => isToday(new Date(e.event_date)));
  const thisWeekEvents = events.filter((e) => isThisWeek(new Date(e.event_date)) && isFuture(new Date(e.event_date)));
  const upcomingEvents = events.filter((e) => isFuture(new Date(e.event_date)) && !isThisWeek(new Date(e.event_date)));
  const pastEvents = events.filter((e) => isPast(new Date(e.event_date)) && !isToday(new Date(e.event_date)));
  const allUpcoming = [...todayEvents, ...thisWeekEvents, ...upcomingEvents];

  return (
    <div>
      {/* Hero */}
      <section className="text-center py-12 md:py-16 px-6 md:px-20 max-w-4xl mx-auto">
        <h1 className="font-display text-3xl md:text-[36px] text-foreground mb-3">Schedule & Timeline</h1>
        <p className="font-sans text-base text-muted-foreground">
          Upcoming appointments, maintenance reminders, and project milestones.
        </p>
        {!loading && allUpcoming.length > 0 && (
          <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-accent mt-3">
            {allUpcoming.length} upcoming event{allUpcoming.length !== 1 ? "s" : ""}
          </p>
        )}
      </section>

      <div className="max-w-[1400px] mx-auto px-6 md:px-20 pb-16 flex flex-col gap-10">

        {/* Upcoming */}
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent mb-6">Upcoming</p>
          <div className="bg-card rounded-lg border border-border p-6">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => <div key={i} className="h-12 bg-muted rounded animate-pulse" />)}
              </div>
            ) : allUpcoming.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
                <p className="font-sans text-sm text-muted-foreground">No upcoming events scheduled</p>
                <p className="font-sans text-xs text-muted-foreground/60 mt-1">
                  Your HBC advisor will add appointments and milestones here
                </p>
              </div>
            ) : (
              allUpcoming.map((event) => <EventCard key={event.id} event={event} />)
            )}
          </div>
        </div>

        {/* History */}
        {!loading && pastEvents.length > 0 && (
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent mb-6">History</p>
            <div className="bg-card rounded-lg border border-border p-6">
              {pastEvents.slice().reverse().map((event) => (
                <EventCard key={event.id} event={event} past />
              ))}
            </div>
          </div>
        )}

        {/* Seasonal Checklists */}
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent mb-6">Annual Maintenance</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {seasonalCards.map((card) => {
              const isOpen = expandedSeason === card.title;
              return (
                <button
                  key={card.title}
                  onClick={() => setExpandedSeason(isOpen ? null : card.title)}
                  className={cardBase}
                >
                  <div className="flex items-start justify-between w-full">
                    <card.icon className="w-5 h-5 text-accent" />
                    <span className="font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent/10 text-accent">
                      {isOpen ? "Collapse" : "View Tasks"}
                    </span>
                  </div>
                  <h3 className="font-display text-xl text-foreground">{card.title}</h3>
                  {isOpen ? (
                    <ul className="space-y-2 mt-1 text-left">
                      {card.tasks.map((task) => (
                        <li key={task} className="flex items-start gap-2">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
                          <span className="font-sans text-sm text-muted-foreground">{task}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="font-sans text-sm text-muted-foreground text-left">
                      {card.tasks[0]} + {card.tasks.length - 1} more
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent mb-6">Quick Actions</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button onClick={() => onTabChange?.("contacts")} className={cardBase}>
              <Phone className="w-5 h-5 text-accent" />
              <h2 className="font-display text-xl text-foreground mb-1">Contact Your Advisor</h2>
              <p className="font-sans text-sm text-muted-foreground">Schedule a consultation or ask a question</p>
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
