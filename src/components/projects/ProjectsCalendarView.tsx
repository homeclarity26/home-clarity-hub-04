import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getDay } from "date-fns";
import { useNavigate } from "react-router-dom";

interface Props {
  projects: any[];
}

const ProjectsCalendarView = ({ projects }: Props) => {
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDow = getDay(monthStart);
  const blanks = Array.from({ length: startDow }, (_, i) => i);

  const getProjectsForDay = (day: Date) => {
    return projects.filter((p) => {
      const start = p.start_date ? new Date(p.start_date) : null;
      const end = p.end_date ? new Date(p.end_date) : null;
      if (start && isSameDay(start, day)) return true;
      if (end && isSameDay(end, day)) return true;
      return false;
    });
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <h3 className="text-sm font-sans font-semibold text-foreground">{format(currentMonth, "MMMM yyyy")}</h3>
        <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="bg-muted p-2 text-center text-[10px] font-sans font-medium text-muted-foreground">{d}</div>
        ))}
        {blanks.map((i) => (
          <div key={`blank-${i}`} className="bg-background p-2 min-h-[80px]" />
        ))}
        {days.map((day) => {
          const dayProjects = getProjectsForDay(day);
          const isToday = isSameDay(day, new Date());
          return (
            <div key={day.toISOString()} className={`bg-background p-1.5 min-h-[80px] ${isToday ? "ring-1 ring-primary/50" : ""}`}>
              <p className={`text-[11px] font-sans mb-1 ${isToday ? "font-bold text-primary" : "text-muted-foreground"}`}>
                {format(day, "d")}
              </p>
              {dayProjects.slice(0, 2).map((p) => (
                <button
                  key={p.id}
                  onClick={() => navigate(`/admin/projects/${p.id}`)}
                  className="w-full text-left bg-primary/10 text-primary rounded px-1 py-0.5 text-[9px] font-sans truncate mb-0.5 border-none cursor-pointer"
                >
                  {p.title}
                </button>
              ))}
              {dayProjects.length > 2 && (
                <p className="text-[9px] text-muted-foreground font-sans">+{dayProjects.length - 2} more</p>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default ProjectsCalendarView;
