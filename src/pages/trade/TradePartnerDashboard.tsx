import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Briefcase, CheckSquare, Calendar, FileText, MessageSquare, DollarSign } from "lucide-react";
import { useMyAssignedProjects, useMyTasks, useMyBids } from "@/hooks/useTradePartnerData";
import { useNavigate } from "react-router-dom";
import { format, isPast, isFuture } from "date-fns";

const TradePartnerDashboard = () => {
  const navigate = useNavigate();
  const { data: projects, isLoading: projLoading } = useMyAssignedProjects();
  const { data: tasks, isLoading: taskLoading } = useMyTasks();
  const { data: bids, isLoading: bidLoading } = useMyBids();

  const isLoading = projLoading || taskLoading || bidLoading;

  const activeProjects = (projects || []).filter(p => p.status !== "completed" && p.status !== "cancelled");
  const openTasks = (tasks || []).filter((t: any) => t.status !== "complete");
  const dueTodayTasks = openTasks.filter((t: any) => t.due_date && format(new Date(t.due_date), "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd"));
  const overdueTasks = openTasks.filter((t: any) => t.due_date && isPast(new Date(t.due_date)));
  const pendingBids = (bids || []).filter((b: any) => b.status === "pending");
  const upcomingTasks = openTasks.filter((t: any) => t.due_date && isFuture(new Date(t.due_date))).sort((a: any, b: any) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()).slice(0, 5);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-sans font-bold text-foreground">Trade Partner Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Briefcase} label="Active Projects" value={activeProjects.length} onClick={() => navigate("/trade/projects")} />
        <StatCard icon={CheckSquare} label="Open Tasks" value={openTasks.length} badge={overdueTasks.length > 0 ? `${overdueTasks.length} overdue` : undefined} onClick={() => navigate("/trade/tasks")} />
        <StatCard icon={DollarSign} label="Pending Bids" value={pendingBids.length} onClick={() => navigate("/trade/bids")} />
        <StatCard icon={Calendar} label="Due Today" value={dueTodayTasks.length} onClick={() => navigate("/trade/schedule")} />
      </div>

      {/* Active Projects */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-sans font-semibold text-foreground">Your Projects</h2>
          {activeProjects.length > 0 && (
            <button onClick={() => navigate("/trade/projects")} className="text-xs text-primary font-sans bg-transparent border-none cursor-pointer hover:underline">View all →</button>
          )}
        </div>
        {activeProjects.length === 0 ? (
          <p className="text-sm text-muted-foreground font-sans text-center py-8">
            No projects assigned yet. You'll see your assigned projects here when a project manager adds you.
          </p>
        ) : (
          <div className="space-y-2">
            {activeProjects.slice(0, 5).map((p: any) => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-sans font-medium text-foreground">{p.title}</p>
                  <p className="text-[11px] text-muted-foreground font-sans">{(p.status || "").replace(/_/g, " ")}</p>
                </div>
                {p.priority && <Badge variant="outline" className="text-[10px] font-sans">{p.priority}</Badge>}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Upcoming Tasks */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-sans font-semibold text-foreground">Upcoming Tasks</h2>
          {upcomingTasks.length > 0 && (
            <button onClick={() => navigate("/trade/tasks")} className="text-xs text-primary font-sans bg-transparent border-none cursor-pointer hover:underline">View all →</button>
          )}
        </div>
        {upcomingTasks.length === 0 ? (
          <p className="text-sm text-muted-foreground font-sans text-center py-8">
            No upcoming tasks. Tasks from your active projects will appear here.
          </p>
        ) : (
          <div className="space-y-2">
            {upcomingTasks.map((t: any) => (
              <div key={t.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-sans font-medium text-foreground">{t.title}</p>
                  <p className="text-[11px] text-muted-foreground font-sans">{t.projects?.title}</p>
                </div>
                <span className="text-xs text-muted-foreground font-sans">{t.due_date ? format(new Date(t.due_date), "MMM d") : ""}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Pending Bids */}
      {pendingBids.length > 0 && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-sans font-semibold text-foreground">Open Bids</h2>
            <button onClick={() => navigate("/trade/bids")} className="text-xs text-primary font-sans bg-transparent border-none cursor-pointer hover:underline">View all →</button>
          </div>
          <div className="space-y-2">
            {pendingBids.slice(0, 3).map((b: any) => (
              <div key={b.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <span className="text-sm font-sans text-foreground">{b.scope_of_work || "Bid"}</span>
                <span className="text-sm font-sans font-medium text-foreground">${Number(b.bid_amount).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, badge, onClick }: { icon: any; label: string; value: number; badge?: string; onClick?: () => void }) => (
  <Card className="p-4 flex items-center gap-3 cursor-pointer hover:bg-muted/50 transition-colors" onClick={onClick}>
    <div className="p-2 rounded-md bg-primary/10"><Icon className="w-4 h-4 text-primary" /></div>
    <div>
      <p className="text-2xl font-bold font-sans text-foreground">{value}</p>
      <div className="flex items-center gap-1.5">
        <p className="text-xs text-muted-foreground font-sans">{label}</p>
        {badge && <Badge variant="destructive" className="text-[9px] font-sans h-4">{badge}</Badge>}
      </div>
    </div>
  </Card>
);

export default TradePartnerDashboard;
