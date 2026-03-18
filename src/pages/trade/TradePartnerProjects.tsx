import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Briefcase, Calendar } from "lucide-react";
import { useMyAssignedProjects } from "@/hooks/useTradePartnerData";
import { format } from "date-fns";

const statusColor = (s: string) => {
  const m: Record<string, string> = { planning: "bg-blue-100 text-blue-800", in_progress: "bg-cyan-100 text-cyan-800", completed: "bg-emerald-100 text-emerald-800", on_hold: "bg-amber-100 text-amber-800", cancelled: "bg-red-100 text-red-800" };
  return m[s] || "bg-muted text-muted-foreground";
};

const TradePartnerProjects = () => {
  const { data: projects, isLoading } = useMyAssignedProjects();

  if (isLoading) return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-sans font-bold text-foreground">My Projects</h1>

      {(projects || []).length === 0 ? (
        <Card className="p-12 text-center">
          <Briefcase className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <h3 className="text-sm font-sans font-semibold text-foreground mb-1">No projects assigned</h3>
          <p className="text-xs text-muted-foreground font-sans">You'll see your assigned projects here when a project manager adds you.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {(projects || []).map((p: any) => (
            <Card key={p.id} className="p-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-sans font-medium text-foreground">{p.title}</h3>
                <Badge className={`text-[10px] font-sans ${statusColor(p.status)}`}>{(p.status || "").replace(/_/g, " ")}</Badge>
              </div>
              {p.description && <p className="text-xs text-muted-foreground font-sans mb-3">{p.description.slice(0, 120)}</p>}
              <div className="flex items-center gap-4 text-[11px] text-muted-foreground font-sans">
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{format(new Date(p.created_at), "MMM d, yyyy")}</span>
                {p.priority && <Badge variant="outline" className="text-[9px] font-sans">{p.priority}</Badge>}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default TradePartnerProjects;
