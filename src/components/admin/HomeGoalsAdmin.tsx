import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, ArrowRight, Receipt, Loader2 } from "lucide-react";

interface HomeGoal {
  id: string;
  title: string;
  description: string | null;
  target_year: number | null;
  estimated_budget: number | null;
  status: string;
  created_at: string;
}

const STATUS_LABELS: Record<string, string> = {
  dreaming: "Dreaming",
  planning: "Planning",
  in_progress: "In Progress",
  complete: "Complete",
};

interface HomeGoalsAdminProps {
  clientUserId: string;
  propertyId: string;
  onCreateProject?: (title: string, budget: number | null) => void;
}

const HomeGoalsAdmin = ({ clientUserId, propertyId, onCreateProject }: HomeGoalsAdminProps) => {
  const [goals, setGoals] = useState<HomeGoal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await (supabase.from("home_goals" as any) as any)
        .select("*")
        .eq("client_id", clientUserId)
        .order("created_at", { ascending: false });
      setGoals((data as HomeGoal[]) || []);
      setLoading(false);
    };
    load();
  }, [clientUserId]);

  if (loading) return <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>;
  if (goals.length === 0) return null;

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-3">
        <Target className="w-4 h-4 text-accent" />
        <h3 className="text-sm font-sans font-semibold text-foreground">Client's Home Goals</h3>
      </div>
      <div className="space-y-3">
        {goals.map((goal) => (
          <div key={goal.id} className="flex items-start justify-between py-2 border-b border-border last:border-0">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-sans font-medium text-foreground truncate">{goal.title}</p>
                <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground px-1.5 py-0.5 rounded-full bg-muted">
                  {STATUS_LABELS[goal.status] || goal.status}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground font-sans">
                {goal.target_year && <span>Target: {goal.target_year}</span>}
                {goal.estimated_budget && <span>Budget: ${Number(goal.estimated_budget).toLocaleString()}</span>}
              </div>
            </div>
            {onCreateProject && goal.status !== "complete" && (
              <Button variant="ghost" size="sm" className="gap-1 text-xs font-sans shrink-0" onClick={() => onCreateProject(goal.title, goal.estimated_budget)}>
                <ArrowRight className="w-3 h-3" />Project
              </Button>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
};

export default HomeGoalsAdmin;
