import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckSquare, Calendar, AlertCircle } from "lucide-react";
import { useMyTasks, useUpdateTaskStatus } from "@/hooks/useTradePartnerData";
import { format, isPast } from "date-fns";

const statusOptions = ["not_started", "in_progress", "complete", "needs_review"];
const statusLabel = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
const statusColor = (s: string) => {
  const m: Record<string, string> = { not_started: "bg-muted text-muted-foreground", in_progress: "bg-blue-100 text-blue-800", complete: "bg-emerald-100 text-emerald-800", needs_review: "bg-amber-100 text-amber-800" };
  return m[s] || "bg-muted text-muted-foreground";
};
const priorityColor = (p: string) => {
  const m: Record<string, string> = { critical: "bg-red-100 text-red-800", high: "bg-orange-100 text-orange-800", medium: "bg-blue-100 text-blue-800", low: "bg-muted text-muted-foreground" };
  return m[p] || "";
};

const TradePartnerTasks = () => {
  const { data: tasks, isLoading } = useMyTasks();
  const updateStatus = useUpdateTaskStatus();

  if (isLoading) return <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>;

  const openTasks = (tasks || []).filter((t: any) => t.status !== "complete");
  const completedTasks = (tasks || []).filter((t: any) => t.status === "complete");

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-sans font-bold text-foreground">My Tasks</h1>

      {openTasks.length === 0 && completedTasks.length === 0 ? (
        <Card className="p-12 text-center">
          <CheckSquare className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <h3 className="text-sm font-sans font-semibold text-foreground mb-1">No tasks assigned</h3>
          <p className="text-xs text-muted-foreground font-sans">Tasks from your active projects will appear here.</p>
        </Card>
      ) : (
        <>
          {openTasks.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-xs font-sans font-semibold text-muted-foreground uppercase tracking-wider">Open ({openTasks.length})</h2>
              {openTasks.map((t: any) => (
                <TaskRow key={t.id} task={t} onStatusChange={(status) => updateStatus.mutate({ taskId: t.id, status })} />
              ))}
            </div>
          )}
          {completedTasks.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-xs font-sans font-semibold text-muted-foreground uppercase tracking-wider">Completed ({completedTasks.length})</h2>
              {completedTasks.slice(0, 10).map((t: any) => (
                <TaskRow key={t.id} task={t} onStatusChange={(status) => updateStatus.mutate({ taskId: t.id, status })} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

const TaskRow = ({ task, onStatusChange }: { task: any; onStatusChange: (s: string) => void }) => {
  const overdue = task.due_date && isPast(new Date(task.due_date)) && task.status !== "complete";

  return (
    <Card className={`p-4 flex items-center gap-4 ${overdue ? "border-destructive/30" : ""}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-sans font-medium text-foreground truncate">{task.title}</p>
          {overdue && <AlertCircle className="w-3.5 h-3.5 text-destructive shrink-0" />}
        </div>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-sans mt-0.5">
          <span>{task.projects?.title || "Project"}</span>
          {task.due_date && (
            <span className={`flex items-center gap-1 ${overdue ? "text-destructive" : ""}`}>
              <Calendar className="w-3 h-3" />{format(new Date(task.due_date), "MMM d")}
            </span>
          )}
          {task.priority && <Badge className={`text-[9px] ${priorityColor(task.priority)}`}>{task.priority}</Badge>}
        </div>
      </div>
      <Select value={task.status} onValueChange={onStatusChange}>
        <SelectTrigger className="w-36 h-8 text-xs font-sans">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {statusOptions.map(s => <SelectItem key={s} value={s} className="text-xs font-sans">{statusLabel(s)}</SelectItem>)}
        </SelectContent>
      </Select>
    </Card>
  );
};

export default TradePartnerTasks;
