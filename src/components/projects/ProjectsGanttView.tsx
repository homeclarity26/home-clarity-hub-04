import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { format, differenceInDays, addDays, startOfWeek, endOfWeek, eachWeekOfInterval, min, max } from "date-fns";

interface Props {
  projects: any[];
}

const ProjectsGanttView = ({ projects }: Props) => {
  const navigate = useNavigate();

  const projectsWithDates = projects.filter((p) => p.start_date && p.end_date);

  const { timelineStart, timelineEnd, totalDays } = useMemo(() => {
    if (projectsWithDates.length === 0) {
      const now = new Date();
      return { timelineStart: now, timelineEnd: addDays(now, 90), totalDays: 90 };
    }
    const starts = projectsWithDates.map((p) => new Date(p.start_date));
    const ends = projectsWithDates.map((p) => new Date(p.end_date));
    const earliest = min(starts);
    const latest = max(ends);
    const days = Math.max(differenceInDays(latest, earliest) + 14, 30);
    return { timelineStart: addDays(earliest, -7), timelineEnd: addDays(latest, 7), totalDays: days };
  }, [projectsWithDates]);

  const weeks = useMemo(() => {
    return eachWeekOfInterval({ start: timelineStart, end: timelineEnd });
  }, [timelineStart, timelineEnd]);

  if (projectsWithDates.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm text-muted-foreground font-sans">No projects with start/end dates to display. Set dates on your projects to see the Gantt view.</p>
      </Card>
    );
  }

  return (
    <Card className="p-4 overflow-x-auto">
      <div className="min-w-[800px]">
        {/* Week headers */}
        <div className="flex border-b border-border pb-1 mb-2">
          <div className="w-48 shrink-0" />
          <div className="flex-1 flex">
            {weeks.map((w) => {
              const offset = differenceInDays(w, timelineStart);
              const pct = (offset / totalDays) * 100;
              return (
                <div key={w.toISOString()} className="text-[9px] font-sans text-muted-foreground" style={{ position: "absolute", left: `calc(192px + ${pct}%)` }}>
                  {format(w, "MMM d")}
                </div>
              );
            })}
          </div>
        </div>

        {/* Project bars */}
        <div className="space-y-2 relative pt-4">
          {projectsWithDates.map((p) => {
            const startOffset = differenceInDays(new Date(p.start_date), timelineStart);
            const duration = differenceInDays(new Date(p.end_date), new Date(p.start_date));
            const leftPct = (startOffset / totalDays) * 100;
            const widthPct = Math.max((duration / totalDays) * 100, 2);

            return (
              <div key={p.id} className="flex items-center h-8 group">
                <button
                  onClick={() => navigate(`/admin/projects/${p.id}`)}
                  className="w-48 shrink-0 text-left text-xs font-sans font-medium text-foreground truncate pr-3 bg-transparent border-none cursor-pointer hover:text-primary"
                >
                  {p.title}
                </button>
                <div className="flex-1 relative h-6">
                  <div
                    className="absolute top-0 h-full bg-primary/20 rounded-md border border-primary/30 cursor-pointer hover:bg-primary/30 transition-colors flex items-center px-2"
                    style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                    onClick={() => navigate(`/admin/projects/${p.id}`)}
                  >
                    {widthPct > 8 && (
                      <span className="text-[9px] font-sans text-primary font-medium truncate">
                        {p.percent_complete || 0}%
                      </span>
                    )}
                    {/* Progress fill */}
                    <div
                      className="absolute left-0 top-0 h-full bg-primary/40 rounded-md"
                      style={{ width: `${p.percent_complete || 0}%` }}
                    />
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
