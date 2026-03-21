import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Target, Plus, Check, X, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface ClientGoalsWidgetProps {
  propertyId?: string;
}

interface Goal {
  id: string;
  title: string;
  description: string | null;
  category: string;
  status: string;
  progress: number;
}

const ClientGoalsWidget = ({ propertyId }: ClientGoalsWidgetProps) => {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  useEffect(() => {
    if (!propertyId || !user) return;
    const load = async () => {
      const { data } = await (supabase.from("client_goals" as any) as any)
        .select("*")
        .eq("property_id", propertyId)
        .eq("client_id", user.id)
        .order("created_at", { ascending: false });
      if (data) setGoals(data);
    };
    load();
  }, [propertyId, user]);

  const addGoal = async () => {
    if (!newTitle.trim() || !user || !propertyId) return;
    const { data, error } = await (supabase.from("client_goals" as any) as any).insert({
      property_id: propertyId,
      client_id: user.id,
      title: newTitle.trim(),
      status: "active",
      progress: 0,
    }).select().single();

    if (error) {
      toast.error("Failed to add goal");
      return;
    }
    if (data) setGoals((prev) => [data, ...prev]);
    setNewTitle("");
    setAdding(false);
    toast.success("Goal added!");
  };

  const toggleComplete = async (goal: Goal) => {
    const newStatus = goal.status === "completed" ? "active" : "completed";
    const newProgress = newStatus === "completed" ? 100 : goal.progress;
    await (supabase.from("client_goals" as any) as any)
      .update({ status: newStatus, progress: newProgress })
      .eq("id", goal.id);
    setGoals((prev) => prev.map((g) => g.id === goal.id ? { ...g, status: newStatus, progress: newProgress } : g));
  };

  const activeGoals = goals.filter((g) => g.status === "active");
  const completedGoals = goals.filter((g) => g.status === "completed");

  return (
    <div className="bg-card rounded-lg shadow-hbc-sm border border-border p-5">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-4 h-4 text-primary" />
        <h3 className="font-display text-lg text-foreground">My Home Goals</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setAdding(true)}
          className="ml-auto gap-1 text-xs font-sans"
        >
          <Plus className="w-3.5 h-3.5" />Add
        </Button>
      </div>

      {adding && (
        <div className="flex gap-2 mb-3">
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="e.g., Upgrade kitchen lighting"
            className="font-sans text-sm flex-1"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && addGoal()}
          />
          <Button size="sm" onClick={addGoal} disabled={!newTitle.trim()} className="gap-1">
            <Check className="w-3.5 h-3.5" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { setAdding(false); setNewTitle(""); }}>
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}

      {activeGoals.length === 0 && completedGoals.length === 0 && !adding && (
        <p className="text-sm font-sans text-muted-foreground text-center py-4">
          Set goals for your home improvements and track progress.
        </p>
      )}

      <div className="space-y-2">
        {activeGoals.map((goal) => (
          <button
            key={goal.id}
            onClick={() => toggleComplete(goal)}
            className="w-full flex items-center gap-3 text-left bg-transparent border-none cursor-pointer p-2.5 rounded-md hover:bg-muted/50 transition-colors"
          >
            <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 shrink-0" />
            <span className="text-sm font-sans text-foreground flex-1 truncate">{goal.title}</span>
            <ChevronRight className="w-3 h-3 text-muted-foreground/30" />
          </button>
        ))}
        {completedGoals.slice(0, 2).map((goal) => (
          <button
            key={goal.id}
            onClick={() => toggleComplete(goal)}
            className="w-full flex items-center gap-3 text-left bg-transparent border-none cursor-pointer p-2.5 rounded-md hover:bg-muted/50 transition-colors"
          >
            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
              <Check className="w-3 h-3 text-primary-foreground" />
            </div>
            <span className="text-sm font-sans text-muted-foreground line-through flex-1 truncate">{goal.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ClientGoalsWidget;
