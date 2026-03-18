import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { differenceInDays, addDays, min, max, format, startOfWeek } from "date-fns";

interface Props { projects: any[]; }

const ProjectsGanttView = ({ projects }: Props) => {
  const navigate = useNavigate();
  const projectsWithDates = projects.filter((p) => p.start_date && p.end_date);

  const { timelineStart, totalDays, weeks } = useMemo(() => {
    if (projectsWithDates.length === 0) return { timelineStart: new Date(), totalDays: 90, weeks: [] as Date[] };
    const starts = projectsWithDates.map((p) => new Date(p.start_date));
    const ends = projectsWithDates.map((p) => new Date(p.end_date));
    const earliest = addDays(min(starts), -7);
    const latest = addDays(max(ends), 7);
    const days = Math.max(differenceInDays(latest, earliest), 30);
    const wks: Date[] = [];
    let current = startOfWeek(earliest);
    while (current <= latest) { wks.push(current); current = addDays(current, 7); }
    return { timelineStart: earliest, totalDays: days, weeks: wks };
  }, [projectsWithDates]);

  if (projectsWithDates.length === 0) return <Card className="p-8 text-center"><p className="text-sm text-muted-foreground font-sans">Set start/end dates on your projects to see the Gantt view.</p></Card>;

  const barW = 700;
  return (
    <Card className="p-4 overflow-x-auto">
      <div style={{ minWidth: barW + 200 }}>
        <div className="flex mb-2">
          <div className="w-[200px] shrink-0" />
          <div className="flex-1 relative h-4" style={{ width: barW }}>
            {weeks.map((w) => { const left = (differenceInDays(w, timelineStart) / totalDays) * barW; return <div key={w.toISOString()} className="absolute text-[9px] font-sans text-muted-foreground border-l border-border pl-1" style={{ left }}>{format(w, "MMM d")}</div>; })}
          </div>
        </div>
        <div className="space-y-1 pt-2">
          {projectsWithDates.map((p) => {
            const left = (differenceInDays(new Date(p.start_date), timelineStart) / totalDays) * barW;
            const width = Math.max((differenceInDays(new Date(p.end_date), new Date(p.start_date)) / totalDays) * barW, 16);
            return (
              <div key={p.id} className="flex items-center h-8">
                <button onClick={() => navigate(`/admin/projects/${p.id}`)} className="w-[200px] shrink-0 text-left text-xs font-sans font-medium text-foreground truncate pr-3 bg-transparent border-none cursor-pointer hover:text-primary">{p.title}</button>
                <div className="flex-1 relative h-6" style={{ width: barW }}>
                  <div className="absolute top-0 h-full bg-primary/20 rounded border border-primary/30 cursor-pointer hover:bg-primary/30 transition-colors overflow-hidden" style={{ left, width }} onClick={() => navigate(`/admin/projects/${p.id}`)}>
                    <div className="h-full bg-primary/40 rounded-l" style={{ width: `${p.percent_complete || 0}%` }} />
                    {width > 50 && <span className="absolute inset-0 flex items-center justify-center text-[9px] font-sans text-primary font-medium">{p.percent_complete || 0}%</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};

export default ProjectsGanttView;
