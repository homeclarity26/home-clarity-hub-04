import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Clock, MapPin } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { useMyTasks } from "@/hooks/useTradePartnerData";
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isFuture } from "date-fns";

const TradePartnerSchedule = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { data: tasks } = useMyTasks();

  const taskDates = (tasks || []).filter((t: any) => t.due_date).map((t: any) => ({ ...t, dateObj: new Date(t.due_date) }));
  const selectedTasks = taskDates.filter((t: any) => isSameDay(t.dateObj, selectedDate));
  const upcomingTasks = taskDates.filter((t: any) => isFuture(t.dateObj) && t.status !== "complete").sort((a: any, b: any) => a.dateObj.getTime() - b.dateObj.getTime()).slice(0, 5);

  // Dates that have tasks for calendar highlighting
  const datesWithTasks = taskDates.map((t: any) => t.dateObj);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-sans font-bold text-foreground">Schedule</h1>
        <Button variant="outline" size="sm" className="font-sans text-xs gap-1"><Clock className="w-3 h-3" /> Mark Unavailable</Button>
      </div>

      <div className="grid md:grid-cols-[auto_1fr] gap-6">
        <Card className="p-4">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={d => d && setSelectedDate(d)}
            modifiers={{ hasTasks: datesWithTasks }}
            modifiersStyles={{ hasTasks: { fontWeight: "bold", textDecoration: "underline" } }}
          />
        </Card>

        <div className="space-y-4">
          <h2 className="text-sm font-sans font-semibold text-foreground">
            {isToday(selectedDate) ? "Today" : format(selectedDate, "EEEE, MMMM d")}
          </h2>

          {selectedTasks.length === 0 ? (
            <Card className="p-8 text-center">
              <CalendarIcon className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground font-sans">Nothing scheduled for this day</p>
            </Card>
          ) : (
            selectedTasks.map((t: any) => (
              <Card key={t.id} className="p-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-sans font-medium text-foreground">{t.title}</h4>
                  <Badge variant="outline" className="text-[10px] font-sans">{(t.status || "").replace(/_/g, " ")}</Badge>
                </div>
                <p className="text-xs text-muted-foreground font-sans mt-1">{t.projects?.title}</p>
              </Card>
            ))
          )}

          {upcomingTasks.length > 0 && (
            <>
              <h2 className="text-sm font-sans font-semibold text-foreground mt-6">Upcoming</h2>
              {upcomingTasks.map((t: any) => (
                <Card key={t.id} className="p-3 flex items-center gap-3">
                  <div className="w-10 text-center">
                    <p className="text-lg font-sans font-bold text-foreground">{format(t.dateObj, "d")}</p>
                    <p className="text-[9px] text-muted-foreground font-sans uppercase">{format(t.dateObj, "MMM")}</p>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-sans text-foreground">{t.title}</p>
                    <p className="text-[11px] text-muted-foreground font-sans">{t.projects?.title}</p>
                  </div>
                </Card>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TradePartnerSchedule;
