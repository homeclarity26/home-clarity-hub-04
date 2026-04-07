import { useState, useEffect, useMemo } from "react";
import {
  Calendar as CalendarIcon, Clock, Sun, Thermometer, Leaf, Snowflake,
  Phone, Hammer, ChevronRight, ChevronLeft, Wrench,
  AlertCircle, CheckCircle2, Star, FileText, Download, CalendarPlus,
} from "lucide-react";
import MaintenanceReminders from "@/components/MaintenanceReminders";
import SeasonalMaintenanceTips from "@/components/portal/SeasonalMaintenanceTips";
import PredictiveMaintenanceCard from "@/components/portal/PredictiveMaintenanceCard";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths,
  isToday, isFuture, isPast,
} from "date-fns";

interface ScheduleTabProps {
  propertyId?: string;
  propertyAddress?: string;
  onTabChange?: (tab: string) => void;
}

// Generate Google Calendar URL for a single event
const googleCalUrl = (event: ScheduleEvent) => {
  const start = new Date(event.event_date);
  const end = new Date(start.getTime() + 60 * 60 * 1000); // 1 hour
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${fmt(start)}/${fmt(end)}&details=${encodeURIComponent(event.description || '')}&sf=true&output=xml`;
};

// Generate ICS file content for all events
const generateICS = (events: ScheduleEvent[], propertyAddress: string) => {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Home Clarity Hub//HCH//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${propertyAddress} — HBC Schedule`,
  ];
  for (const ev of events) {
    const start = new Date(ev.event_date);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    lines.push(
      'BEGIN:VEVENT',
      `DTSTART:${fmt(start)}`,
      `DTEND:${fmt(end)}`,
      `SUMMARY:${ev.title}`,
      `DESCRIPTION:${ev.description || ''}`,
      `UID:hbc-${ev.id}@homeclarityhub.com`,
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
};

const downloadICS = (events: ScheduleEvent[], propertyAddress: string) => {
  const content = generateICS(events, propertyAddress);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'hbc-schedule.ics';
  a.click();
  URL.revokeObjectURL(url);
};

interface ScheduleEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_type: string;
  status: string;
}

const eventTypeConfig: Record<string, { icon: typeof CalendarIcon; label: string; dotClass: string }> = {
  appointment: { icon: CalendarIcon, label: "Appointment", dotClass: "bg-[hsl(var(--primary))]" },
  milestone: { icon: Star, label: "Milestone", dotClass: "bg-[hsl(var(--accent))]" },
  task: { icon: Wrench, label: "Task", dotClass: "bg-orange-400" },
  inspection: { icon: FileText, label: "Inspection", dotClass: "bg-[hsl(var(--primary))]" },
  reminder: { icon: AlertCircle, label: "Reminder", dotClass: "bg-[hsl(var(--destructive))]" },
};

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

const cardBase =
  "group bg-card rounded-lg p-6 shadow-hbc-sm hover:shadow-hbc-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col gap-3 border border-border text-left w-full";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const ScheduleTab = ({ propertyId, propertyAddress, onTabChange }: ScheduleTabProps) => {
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
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
        { id: "1", title: "Furnace replacement consultation", description: "Review vendor bids with Adam", event_date: d(2), event_type: "appointment", status: "scheduled" },
        { id: "2", title: "Electrical panel inspection", description: "Licensed electrician evaluating panel upgrade options", event_date: d(18), event_type: "inspection", status: "scheduled" },
        { id: "3", title: "Spring exterior walkthrough", description: "Seasonal assessment of roof, gutters, and landscaping", event_date: d(45), event_type: "milestone", status: "scheduled" },
        { id: "4", title: "HVAC filter replacement", description: "Changed all MERV 11 filters — next change in 90 days", event_date: d(-30), event_type: "task", status: "completed" },
        { id: "5", title: "Roof inspection", description: "Pre-winter assessment completed", event_date: d(-90), event_type: "inspection", status: "completed" },
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

  // Calendar grid days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart);
    const calEnd = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

  // Events grouped by date key
  const eventsByDate = useMemo(() => {
    const map: Record<string, ScheduleEvent[]> = {};
    for (const ev of events) {
      const key = format(new Date(ev.event_date), "yyyy-MM-dd");
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    }
    return map;
  }, [events]);

  const selectedEvents = useMemo(() => {
    if (!selectedDate) return [];
    const key = format(selectedDate, "yyyy-MM-dd");
    return eventsByDate[key] || [];
  }, [selectedDate, eventsByDate]);

  const upcomingCount = events.filter((e) => isFuture(new Date(e.event_date))).length;

  return (
    <div>
      {/* Hero */}
      <section className="text-center py-12 md:py-16 px-6 md:px-20 max-w-4xl mx-auto">
        <h1 className="font-display text-3xl md:text-[36px] text-foreground mb-3">Schedule & Timeline</h1>
        <p className="font-sans text-base text-muted-foreground">
          Upcoming appointments, maintenance reminders, and project milestones.
        </p>
        {!loading && upcomingCount > 0 && (
          <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-accent mt-3">
            {upcomingCount} upcoming event{upcomingCount !== 1 ? "s" : ""}
          </p>
        )}
      </section>

      <div className="max-w-[1400px] mx-auto px-6 md:px-20 pb-16 flex flex-col gap-10">

        {/* Calendar */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent">Calendar</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => downloadICS(events, propertyAddress || 'Your Home')}
                className="flex items-center gap-1.5 text-xs font-sans text-muted-foreground hover:text-foreground border border-border rounded-md px-2.5 py-1.5 transition-colors"
                title="Export all events as ICS file (works with Apple Calendar & Outlook)"
              >
                <Download className="w-3 h-3" /> Export (.ics)
              </button>
            </div>
          </div>
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            {/* Month Nav */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <button
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h3 className="font-display text-xl text-foreground">
                {format(currentMonth, "MMMM yyyy")}
              </h3>
              <button
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 border-b border-border">
              {WEEKDAYS.map((day) => (
                <div key={day} className="py-2 text-center font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {day}
                </div>
              ))}
            </div>

            {/* Day cells */}
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="h-6 w-6 border-2 border-muted-foreground/20 border-t-accent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-7">
                {calendarDays.map((day) => {
                  const dateKey = format(day, "yyyy-MM-dd");
                  const dayEvents = eventsByDate[dateKey] || [];
                  const inMonth = isSameMonth(day, currentMonth);
                  const today = isToday(day);
                  const isSelected = selectedDate && isSameDay(day, selectedDate);

                  return (
                    <button
                      key={dateKey}
                      onClick={() => setSelectedDate(isSelected ? null : day)}
                      className={`relative min-h-[72px] md:min-h-[80px] p-1.5 border-b border-r border-border text-left transition-colors cursor-pointer ${
                        !inMonth ? "bg-muted/30" : "bg-card hover:bg-muted/50"
                      } ${isSelected ? "ring-2 ring-inset ring-accent" : ""}`}
                    >
                      <span className={`text-xs font-sans block mb-1 ${
                        today
                          ? "w-6 h-6 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-bold"
                          : inMonth
                            ? "text-foreground"
                            : "text-muted-foreground/40"
                      }`}>
                        {format(day, "d")}
                      </span>
                      {dayEvents.length > 0 && (
                        <div className="flex gap-0.5 flex-wrap">
                          {dayEvents.slice(0, 3).map((ev) => {
                            const cfg = eventTypeConfig[ev.event_type] || eventTypeConfig.appointment;
                            return (
                              <span
                                key={ev.id}
                                className={`w-1.5 h-1.5 rounded-full ${cfg.dotClass}`}
                                title={ev.title}
                              />
                            );
                          })}
                          {dayEvents.length > 3 && (
                            <span className="text-[8px] font-mono text-muted-foreground ml-0.5">+{dayEvents.length - 3}</span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Selected day detail */}
        {selectedDate && (
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent mb-4">
              {format(selectedDate, "EEEE, MMMM d, yyyy")}
            </p>
            <div className="bg-card rounded-lg border border-border p-6">
              {selectedEvents.length === 0 ? (
                <p className="text-sm font-sans text-muted-foreground text-center py-4">No events on this day</p>
              ) : (
                <div className="space-y-3">
                  {selectedEvents.map((ev) => {
                    const cfg = eventTypeConfig[ev.event_type] || eventTypeConfig.appointment;
                    const past = isPast(new Date(ev.event_date)) && !isToday(new Date(ev.event_date));
                    return (
                      <div key={ev.id} className={`flex items-start gap-3 py-3 border-b border-border last:border-b-0 ${past ? "opacity-60" : ""}`}>
                        <span className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${cfg.dotClass}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <p className="font-sans text-sm font-medium text-foreground">
                              {ev.title}
                              <a href={googleCalUrl(ev)} target="_blank" rel="noopener" className="ml-1 text-muted-foreground hover:text-accent" title="Add to Google Calendar">
                                <CalendarPlus className="w-3 h-3 inline" />
                              </a>
                            </p>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground flex-shrink-0">
                              {cfg.label}
                            </span>
                          </div>
                          {ev.description && (
                            <p className="font-sans text-xs text-muted-foreground mt-0.5">{ev.description}</p>
                          )}
                          <p className="font-mono text-[10px] text-muted-foreground mt-1 flex items-center gap-1.5">
                            <Clock className="w-3 h-3" />
                            {format(new Date(ev.event_date), "h:mm a")}
                          </p>
                        </div>
                        {past && <CheckCircle2 className="w-4 h-4 text-muted-foreground/40 flex-shrink-0 mt-1" />}
                      </div>
                    );
                  })}
                </div>
              )}
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

        {/* Maintenance Reminders — relocated from Home */}
        {propertyId && !propertyId?.startsWith("mock-") && (
          <MaintenanceReminders propertyId={propertyId} />
        )}

        {/* Predictive Maintenance — relocated from Home */}
        {propertyId && <PredictiveMaintenanceCard propertyId={propertyId} clientId={undefined} />}

        {/* Seasonal Maintenance Tips — relocated from Home */}
        <SeasonalMaintenanceTips />

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
