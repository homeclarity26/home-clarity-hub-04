import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, getDay } from "date-fns";
import { useProjectPhases, useProjectTasks, useProjectInspections } from "@/hooks/useProjectData";

interface Props { projectId: string; }

const ProjectScheduleTab = ({ projectId }: Props) => {
  const [month, setMonth] = useState(new Date());
  const { data: phases } = useProjectPhases(projectId);
  const { data: tasks } = useProjectTasks(projectId);
  const { data: inspections } = useProjectInspections(projectId);

  const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });
  const blanks = Array.from({ length: getDay(startOfMonth(month)) }, (_, i) => i);
  const typeColors: Record<string, string> = { phase: "bg-primary/10 text-primary", task: "bg-amber-500/10 text-amber-700", inspection: "bg-emerald-500/10 text-emerald-700" };

  const getEvents = (day: Date) => {
    const evts: { label: string; type: string }[] = [];
    (phases || []).forEach((p) => { if (p.estimated_start_date && isSameDay(new Date(p.estimated_start_date), day)) evts.push({ label: `${p.name} starts`, type: "phase" }); if (p.estimated_end_date && isSameDay(new Date(p.estimated_end_date), day)) evts.push({ label: `${p.name} ends`, type: "phase" }); });
    (tasks || []).forEach((t) => { if (t.due_date && isSameDay(new Date(t.due_date), day)) evts.push({ label: t.title, type: "task" }); });
    (inspections || []).forEach((i) => { if (i.scheduled_date && isSameDay(new Date(i.scheduled_date), day)) evts.push({ label: `${i.inspection_type} inspection`, type: "inspection" }); });
    return evts;
  };

  return (
    <div className="space-y-4 mt-4">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="icon" onClick={() => setMonth(subMonths(month, 1))}><ChevronLeft className="w-4 h-4" /></Button>
          <h3 className="text-sm font-sans font-semibold text-foreground">{format(month, "MMMM yyyy")}</h3>
          <Button variant="ghost" size="icon" onClick={() => setMonth(addMonths(month, 1))}><ChevronRight className="w-4 h-4" /></Button>
        </div>
        <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => <div key={d} className="bg-muted p-2 text-center text-[10px] font-sans font-medium text-muted-foreground">{d}</div>)}
          {blanks.map((i) => <div key={`b-${i}`} className="bg-background p-2 min-h-[80px]" />)}
          {days.map((day) => { const evts = getEvents(day); const isToday = isSameDay(day, new Date()); return (
            <div key={day.toISOString()} className={`bg-background p-1.5 min-h-[80px] ${isToday ? "ring-1 ring-primary/50" : ""}`}>
              <p className={`text-[11px] font-sans mb-1 ${isToday ? "font-bold text-primary" : "text-muted-foreground"}`}>{format(day, "d")}</p>
              {evts.slice(0, 3).map((e, i) => <div key={i} className={`rounded px-1 py-0.5 text-[8px] font-sans truncate mb-0.5 ${typeColors[e.type]}`}>{e.label}</div>)}
              {evts.length > 3 && <p className="text-[8px] text-muted-foreground font-sans">+{evts.length - 3}</p>}
            </div>
          ); })}
        </div>
        <div className="flex gap-4 mt-3">
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-primary/30" /><span className="text-[10px] font-sans text-muted-foreground">Phase</span></div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500/30" /><span className="text-[10px] font-sans text-muted-foreground">Task</span></div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500/30" /><span className="text-[10px] font-sans text-muted-foreground">Inspection</span></div>
        </div>
      </Card>
    </div>
  );
};

export default ProjectScheduleTab;
