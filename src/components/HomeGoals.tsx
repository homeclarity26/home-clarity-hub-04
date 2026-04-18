import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Target, Plus, Sparkles, Calendar, DollarSign } from "lucide-react";
import { toast } from "sonner";

interface HomeGoal {
  id: string;
  title: string;
  description: string | null;
  target_year: number | null;
  estimated_budget: number | null;
  status: string;
  created_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  dreaming: { label: "Dreaming", cls: "bg-muted text-muted-foreground" },
  planning: { label: "Planning", cls: "bg-accent/20 text-accent-foreground" },
  in_progress: { label: "In Progress", cls: "bg-primary/15 text-primary" },
  complete: { label: "Complete", cls: "bg-accent/20 text-accent" },
};

interface HomeGoalsProps {
  propertyId?: string;
}

const HomeGoals = ({ propertyId }: HomeGoalsProps) => {
  const { user } = useAuth();
  const [goals, setGoals] = useState<HomeGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", target_year: "", estimated_budget: "", status: "dreaming" });

  const loadGoals = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("home_goals")
      .select("*")
      .eq("client_id", user.id)
      .order("created_at", { ascending: false });
    setGoals((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { loadGoals(); }, [user]);

  const handleSubmit = async () => {
    if (!user || !form.title.trim()) return;
    const { error } = await supabase.from("home_goals").insert({
      client_id: user.id,
      title: form.title,
      description: form.description || null,
      target_year: form.target_year ? parseInt(form.target_year) : null,
      estimated_budget: form.estimated_budget ? parseFloat(form.estimated_budget) : null,
      status: form.status,
    });
    if (error) { toast.error("Failed to add goal"); return; }
    toast.success("Goal added!");
    setForm({ title: "", description: "", target_year: "", estimated_budget: "", status: "dreaming" });
    setDialogOpen(false);
    loadGoals();
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("home_goals").update({ status }).eq("id", id);
    if (error) { toast.error("Failed to update"); return; }
    setGoals((prev) => prev.map((g) => g.id === id ? { ...g, status } : g));
  };

  if (loading) return null;

  const activeGoals = goals.filter((g) => g.status !== "complete");
  const completedGoals = goals.filter((g) => g.status === "complete");

  return (
    <div className="max-w-[1400px] mx-auto px-6 md:px-20">
      <div className="flex items-center justify-between mb-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent">Home Goals & Wishlist</p>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="gap-1.5 text-xs font-sans">
              <Plus className="w-3.5 h-3.5" />Add Goal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-sans">Add a Home Goal</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div><Label className="font-sans">What do you want to do?</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g., Remodel kitchen" /></div>
              <div><Label className="font-sans">Description (optional)</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Any details..." rows={3} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="font-sans">Target Year</Label><Input type="number" value={form.target_year} onChange={(e) => setForm({ ...form, target_year: e.target.value })} placeholder="2027" /></div>
                <div><Label className="font-sans">Estimated Budget</Label><Input type="number" value={form.estimated_budget} onChange={(e) => setForm({ ...form, estimated_budget: e.target.value })} placeholder="25000" /></div>
              </div>
              <div>
                <Label className="font-sans">Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSubmit} className="w-full font-sans">Add Goal</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {goals.length === 0 ? (
        <Card className="p-8 text-center">
          <Target className="w-6 h-6 text-accent mx-auto mb-3" />
          <h3 className="font-display text-lg text-foreground mb-1">What's on Your Wishlist?</h3>
          <p className="font-sans text-sm text-muted-foreground mb-4">Add home improvement goals and track them over time.</p>
          <Button size="sm" variant="outline" className="font-sans gap-1.5" onClick={() => setDialogOpen(true)}>
            <Plus className="w-3.5 h-3.5" />Add Your First Goal
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {activeGoals.map((goal) => {
            const cfg = STATUS_CONFIG[goal.status] || STATUS_CONFIG.dreaming;
            return (
              <Card key={goal.id} className="p-5 border-l-[3px] border-l-accent">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-accent shrink-0" />
                    <h3 className="font-display text-base text-foreground">{goal.title}</h3>
                  </div>
                  <Select value={goal.status} onValueChange={(v) => updateStatus(goal.id, v)}>
                    <SelectTrigger className="h-6 w-auto text-[10px] font-mono uppercase tracking-wider border-0 p-0 pr-5">
                      <span className={`px-2 py-0.5 rounded-full ${cfg.cls}`}>{cfg.label}</span>
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {goal.description && <p className="font-sans text-sm text-muted-foreground mb-3 ml-6">{goal.description}</p>}
                <div className="flex items-center gap-4 ml-6 text-xs font-sans text-muted-foreground">
                  {goal.target_year && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{goal.target_year}</span>}
                  {goal.estimated_budget && <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />${Number(goal.estimated_budget).toLocaleString()}</span>}
                </div>
              </Card>
            );
          })}
          {completedGoals.map((goal) => (
            <Card key={goal.id} className="p-5 opacity-60">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent" />
                <h3 className="font-display text-base text-foreground line-through">{goal.title}</h3>
                <span className="font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent/20 text-accent ml-auto">Complete</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default HomeGoals;
