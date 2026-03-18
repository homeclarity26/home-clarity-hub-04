import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronLeft, ChevronRight, Wrench, FileText, CreditCard, ClipboardCheck } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, isToday } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface CalendarEvent {
  id: string;
  date: Date;
  title: string;
  type: "inspection" | "invoice" | "equipment" | "schedule";
  propertyName?: string;
}

const typeConfig = {
  inspection: { icon: ClipboardCheck, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  invoice: { icon: CreditCard, color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
  equipment: { icon: Wrench, color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" },
  schedule: { icon: Calendar, color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
};

const SmartCalendarView = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Fetch all events across properties
  const { data: scheduleEvents } = useQuery({
    queryKey: ["all-schedule-events"],
    queryFn: async () => {
      const { data } = await supabase.from("schedule_events").select("*, properties(property_name, address)").order("event_date");
      return data || [];
    },
  });

  const { data: invoiceDues } = useQuery({
    queryKey: ["all-invoice-dues"],
    queryFn: async () => {
      const { data } = await supabase.from("invoices").select("id, title, description, due_date, property_id, properties(property_name, address)").gt("balance_due", 0).not("due_date", "is", null);
      return data || [];
    },
  });

  const { data: equipmentService } = useQuery({
    queryKey: ["all-equipment-service"],
    queryFn: async () => {
      const { data } = await supabase.from("equipment").select("id, name, next_service_date, property_id, properties:property_id(property_name, address)").not("next_service_date", "is", null);
      return data || [];
    },
  });

  const { data: inspections } = useQuery({
    queryKey: ["all-inspections"],
    queryFn: async () => {
      const { data } = await supabase.from("field_inspections").select("id, checked_in_at, property_id, properties(property_name, address)");
      return data || [];
    },
  });

  const events: CalendarEvent[] = useMemo(() => {
    const all: CalendarEvent[] = [];

    (scheduleEvents || []).forEach((e: any) => {
      all.push({
        id: `sched-${e.id}`,
        date: new Date(e.event_date),
        title: e.title,
        type: "schedule",
        propertyName: e.properties?.property_name || e.properties?.address,
      });
    });

    (invoiceDues || []).forEach((i: any) => {
      if (!i.due_date) return;
      all.push({
        id: `inv-${i.id}`,
        date: new Date(i.due_date),
        title: i.title || i.description,
        type: "invoice",
        propertyName: (i.properties as any)?.property_name || (i.properties as any)?.address,
      });
    });

    (equipmentService || []).forEach((eq: any) => {
      if (!eq.next_service_date) return;
      all.push({
        id: `equip-${eq.id}`,
        date: new Date(eq.next_service_date),
        title: `Service: ${eq.name}`,
        type: "equipment",
        propertyName: (eq.properties as any)?.property_name || (eq.properties as any)?.address,
      });
    });

    (inspections || []).forEach((ins: any) => {
      all.push({
        id: `insp-${ins.id}`,
        date: new Date(ins.checked_in_at),
        title: "Field Inspection",
        type: "inspection",
        propertyName: ins.properties?.property_name || ins.properties?.address,
      });
    });

    return all;
  }, [scheduleEvents, invoiceDues, equipmentService, inspections]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Pad start to Monday
  const startDay = monthStart.getDay();
  const padStart = startDay === 0 ? 6 : startDay - 1;

  const getEventsForDay = (day: Date) => events.filter((e) => isSameDay(e.date, day));
  const selectedEvents = selectedDate ? getEventsForDay(selectedDate) : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-accent" />
          <h2 className="text-base font-sans font-semibold text-foreground">Smart Calendar</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="text-xs font-sans gap-1" onClick={() => {
            // Scroll to add event - for now just select today
            setSelectedDate(new Date());
          }}>
            <Plus className="w-3 h-3" />Add Event
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}><ChevronLeft className="w-4 h-4" /></Button>
          <span className="text-sm font-sans font-medium text-foreground min-w-[140px] text-center">{format(currentMonth, "MMMM yyyy")}</span>
          <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}><ChevronRight className="w-4 h-4" /></Button>
        </div>
      </div>

      <Card className="p-4">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d} className="text-center text-[10px] font-sans font-semibold text-muted-foreground py-1">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: padStart }).map((_, i) => <div key={`pad-${i}`} />)}
          {days.map((day) => {
            const dayEvents = getEventsForDay(day);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className={`p-1 rounded-md text-center transition-colors min-h-[48px] flex flex-col items-center bg-transparent border-none cursor-pointer ${
                  isSelected ? "bg-primary/10 ring-1 ring-primary/30" :
                  isToday(day) ? "bg-accent/10" :
                  "hover:bg-muted/50"
                }`}
              >
                <span className={`text-xs font-sans ${isToday(day) ? "font-bold text-accent" : "text-foreground"}`}>
                  {format(day, "d")}
                </span>
                {dayEvents.length > 0 && (
                  <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                    {dayEvents.slice(0, 3).map((e) => (
                      <div key={e.id} className={`w-1.5 h-1.5 rounded-full ${
                        e.type === "invoice" ? "bg-amber-500" :
                        e.type === "equipment" ? "bg-purple-500" :
                        e.type === "inspection" ? "bg-blue-500" :
                        "bg-emerald-500"
                      }`} />
                    ))}
                    {dayEvents.length > 3 && <span className="text-[8px] text-muted-foreground">+{dayEvents.length - 3}</span>}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Legend */}
      <div className="flex gap-4 flex-wrap">
        {Object.entries(typeConfig).map(([key, cfg]) => {
          const Icon = cfg.icon;
          return (
            <div key={key} className="flex items-center gap-1.5">
              <Icon className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] font-sans text-muted-foreground capitalize">{key}</span>
            </div>
          );
        })}
      </div>

      {/* Selected day events */}
      {selectedDate && (
        <Card className="p-4">
          <h3 className="text-sm font-sans font-semibold text-foreground mb-3">
            {format(selectedDate, "EEEE, MMMM d, yyyy")}
          </h3>
          {selectedEvents.length > 0 ? (
            <div className="space-y-2">
              {selectedEvents.map((e) => {
                const cfg = typeConfig[e.type];
                const Icon = cfg.icon;
                return (
                  <div key={e.id} className="flex items-center gap-3 p-2 rounded-md bg-muted/30">
                    <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-sans text-foreground truncate">{e.title}</p>
                      {e.propertyName && <p className="text-[10px] font-sans text-muted-foreground">{e.propertyName}</p>}
                    </div>
                    <Badge className={`${cfg.color} text-[10px] border-none capitalize`}>{e.type}</Badge>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs font-sans text-muted-foreground">No events on this day</p>
          )}
        </Card>
      )}
    </div>
  );
};

export default SmartCalendarView;
