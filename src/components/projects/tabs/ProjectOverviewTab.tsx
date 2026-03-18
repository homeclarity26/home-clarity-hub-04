import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, DollarSign, User, MapPin, BarChart3 } from "lucide-react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  project: any;
}

const ProjectOverviewTab = ({ project }: Props) => {
  const budget = Number(project.budget || 0);
  const spent = Number(project.actual_spent || 0);
  const remaining = budget - spent;
  const spentPct = budget > 0 ? (spent / budget) * 100 : 0;
  const budgetColor = spentPct >= 100 ? "text-destructive" : spentPct >= 80 ? "text-amber-500" : "text-emerald-500";

  const { data: phases } = useQuery({
    queryKey: ["project-phases-overview", project.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("project_phases")
        .select("*")
        .eq("project_id", project.id)
        .order("sort_order");
      return data || [];
    },
  });

  const { data: recentActivity } = useQuery({
    queryKey: ["project-activity-recent", project.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("project_activity_log")
        .select("*")
        .eq("project_id", project.id)
        .order("created_at", { ascending: false })
        .limit(10);
      return data || [];
    },
  });

  return (
    <div className="space-y-6 mt-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <User className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-xs font-sans font-semibold text-foreground">Project Summary</h3>
          </div>
          <div className="space-y-2 text-sm font-sans">
            <div className="flex justify-between"><span className="text-muted-foreground">Client</span><span className="font-medium">{project.properties?.property_name || "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span className="font-medium capitalize">{(project.project_type || "custom").replace("_", " ")}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge variant="secondary" className="text-[10px] capitalize">{(project.status || "lead").replace("_", " ")}</Badge></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Priority</span><span className="font-medium capitalize">{project.priority || "normal"}</span></div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-xs font-sans font-semibold text-foreground">Schedule</h3>
          </div>
          <div className="space-y-2 text-sm font-sans">
            <div className="flex justify-between"><span className="text-muted-foreground">Start</span><span className="font-medium">{project.start_date ? format(new Date(project.start_date), "MMM d, yyyy") : "Not set"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">End</span><span className="font-medium">{project.end_date ? format(new Date(project.end_date), "MMM d, yyyy") : "Not set"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Phases</span><span className="font-medium">{phases?.length || 0}</span></div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-xs font-sans font-semibold text-foreground">Budget</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm font-sans"><span className="text-muted-foreground">Budget</span><span className="font-mono font-medium">${budget.toLocaleString()}</span></div>
            <div className="flex justify-between text-sm font-sans"><span className="text-muted-foreground">Spent</span><span className={`font-mono font-medium ${budgetColor}`}>${spent.toLocaleString()}</span></div>
            <div className="flex justify-between text-sm font-sans"><span className="text-muted-foreground">Remaining</span><span className="font-mono font-medium">${remaining.toLocaleString()}</span></div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${spentPct >= 100 ? "bg-destructive" : spentPct >= 80 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${Math.min(spentPct, 100)}%` }} />
            </div>
          </div>
        </Card>
      </div>

      {/* Phase Timeline */}
      {phases && phases.length > 0 && (
        <Card className="p-4">
          <h3 className="text-xs font-sans font-semibold text-foreground mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-muted-foreground" />Phase Timeline
          </h3>
          <div className="flex gap-1 overflow-x-auto">
            {phases.map((phase: any) => {
              const isActive = phase.status === "in_progress";
              const isDone = phase.status === "complete";
              return (
                <div
                  key={phase.id}
                  className={`flex-1 min-w-[80px] rounded-md p-2 text-center ${
                    isDone ? "bg-emerald-500/10 border border-emerald-500/20" :
                    isActive ? "bg-primary/10 border border-primary/30 ring-1 ring-primary/20" :
                    "bg-muted/50 border border-border"
                  }`}
                >
                  <p className={`text-[10px] font-sans font-medium truncate ${isActive ? "text-primary" : isDone ? "text-emerald-600" : "text-muted-foreground"}`}>
                    {phase.name}
                  </p>
                  <Badge variant={isDone ? "default" : isActive ? "default" : "secondary"} className="text-[8px] mt-1 h-4">
                    {phase.status.replace("_", " ")}
                  </Badge>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Recent Activity */}
      <Card className="p-4">
        <h3 className="text-xs font-sans font-semibold text-foreground mb-3">Recent Activity</h3>
        {recentActivity && recentActivity.length > 0 ? (
          <div className="space-y-2">
            {recentActivity.map((a: any) => (
              <div key={a.id} className="flex items-start gap-3 py-1.5 border-b border-border last:border-0">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-sans text-foreground">{a.description}</p>
                  <p className="text-[10px] font-sans text-muted-foreground">{format(new Date(a.created_at), "MMM d, h:mm a")}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground font-sans">No activity yet.</p>
        )}
      </Card>
    </div>
  );
};

export default ProjectOverviewTab;
