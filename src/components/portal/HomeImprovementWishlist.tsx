import { useState, useEffect } from "react";
import { Star, Plus, Trash2, GripVertical, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface WishlistItem {
  id: string;
  title: string;
  estimated_budget: number | null;
  target_year: number | null;
  status: string;
  priority: number;
}

interface HomeImprovementWishlistProps {
  propertyId: string;
}

const PRIORITY_LABELS: Record<number, { label: string; cls: string }> = {
  1: { label: "Must Have", cls: "bg-destructive/10 text-destructive" },
  2: { label: "Want", cls: "bg-accent/20 text-accent-foreground" },
  3: { label: "Dream", cls: "bg-muted text-muted-foreground" },
};

const HomeImprovementWishlist = ({ propertyId }: HomeImprovementWishlistProps) => {
  const { user } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [newBudget, setNewBudget] = useState("");
  const [newPriority, setNewPriority] = useState(2);
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!user || propertyId.startsWith("mock-")) {
      setItems([
        { id: "w1", title: "Kitchen renovation", estimated_budget: 35000, target_year: 2027, status: "dreaming", priority: 1 },
        { id: "w2", title: "Backyard patio & fire pit", estimated_budget: 12000, target_year: 2027, status: "dreaming", priority: 2 },
        { id: "w3", title: "Smart home automation", estimated_budget: 5000, target_year: 2028, status: "dreaming", priority: 3 },
      ]);
      setLoading(false);
      return;
    }

    const load = async () => {
      const { data } = await supabase
        .from("home_goals")
        .select("*")
        .eq("client_id", user.id)
        .order("created_at", { ascending: true });
      if (data) {
        setItems(data.map((d, i) => ({
          id: d.id,
          title: d.title,
          estimated_budget: d.estimated_budget,
          target_year: d.target_year,
          status: d.status,
          priority: i + 1,
        })));
      }
      setLoading(false);
    };
    load();
  }, [user, propertyId]);

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    setAdding(true);
    try {
      if (propertyId.startsWith("mock-")) {
        setItems((prev) => [...prev, {
          id: `w-${Date.now()}`,
          title: newTitle,
          estimated_budget: newBudget ? parseInt(newBudget) : null,
          target_year: null,
          status: "dreaming",
          priority: newPriority,
        }]);
      } else {
        const { data, error } = await supabase.from("home_goals").insert({
          client_id: user!.id,
          title: newTitle,
          estimated_budget: newBudget ? parseInt(newBudget) : null,
          status: "dreaming",
        }).select().single();
        if (error) throw error;
        if (data) {
          setItems((prev) => [...prev, {
            id: data.id,
            title: data.title,
            estimated_budget: data.estimated_budget,
            target_year: data.target_year,
            status: data.status,
            priority: newPriority,
          }]);
        }
      }
      setNewTitle("");
      setNewBudget("");
      setShowForm(false);
      toast.success("Added to wishlist!");
    } catch {
      toast.error("Failed to add item.");
    }
    setAdding(false);
  };

  const handleRemove = async (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    if (!propertyId.startsWith("mock-")) {
      await supabase.from("home_goals").delete().eq("id", id);
    }
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  const totalBudget = items.reduce((s, i) => s + (i.estimated_budget || 0), 0);

  return (
    <div className="max-w-[1400px] mx-auto px-6 md:px-20">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent mb-6">Home Improvement Wishlist</p>
      <div className="bg-card rounded-lg border border-border shadow-hbc-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-accent" />
            <h3 className="font-display text-lg text-foreground">Your Dream List</h3>
          </div>
          {totalBudget > 0 && (
            <span className="font-mono text-[11px] text-muted-foreground">
              Est. total: ${totalBudget.toLocaleString()}
            </span>
          )}
        </div>

        {items.length === 0 ? (
          <p className="font-sans text-sm text-muted-foreground text-center py-6">
            No wishlist items yet. Start dreaming!
          </p>
        ) : (
          <div className="space-y-2 mb-4">
            {items.map((item) => {
              const pr = PRIORITY_LABELS[item.priority] || PRIORITY_LABELS[3];
              return (
                <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-accent/30 transition-all">
                  <Star className="w-4 h-4 text-accent/60 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-sans text-sm text-foreground truncate">{item.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {item.estimated_budget && (
                        <span className="font-mono text-[10px] text-muted-foreground">${item.estimated_budget.toLocaleString()}</span>
                      )}
                      {item.target_year && (
                        <span className="font-mono text-[10px] text-muted-foreground">Target: {item.target_year}</span>
                      )}
                    </div>
                  </div>
                  <span className={`font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full ${pr.cls}`}>
                    {pr.label}
                  </span>
                  <button onClick={() => handleRemove(item.id)} className="text-muted-foreground/40 hover:text-destructive transition-colors bg-transparent border-none cursor-pointer p-1">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {showForm ? (
          <div className="space-y-3 pt-3 border-t border-border">
            <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="What do you want to improve?" className="font-sans text-sm" />
            <div className="flex gap-2">
              <Input value={newBudget} onChange={(e) => setNewBudget(e.target.value)} placeholder="Est. budget ($)" className="font-sans text-sm w-40" type="number" />
              <div className="flex gap-1">
                {[1, 2, 3].map((p) => (
                  <Button
                    key={p}
                    variant={newPriority === p ? "default" : "outline"}
                    size="sm"
                    className="text-[10px] font-mono"
                    onClick={() => setNewPriority(p)}
                  >
                    {PRIORITY_LABELS[p].label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAdd} disabled={adding} className="font-sans text-xs gap-1">
                {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Add to Wishlist
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)} className="font-sans text-xs">Cancel</Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" size="sm" className="gap-1.5 font-sans text-xs w-full" onClick={() => setShowForm(true)}>
            <Plus className="w-3.5 h-3.5" /> Add to Wishlist
          </Button>
        )}
      </div>
    </div>
  );
};

export default HomeImprovementWishlist;
