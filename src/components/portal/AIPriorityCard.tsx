import { useState, useEffect } from "react";
import { Sparkles, RefreshCw, AlertTriangle, Wrench, CreditCard, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { ReportPageData } from "@/data/reportContent";

interface Priority {
  title: string;
  description: string;
  category: string;
}

interface AIPriorityCardProps {
  propertyId: string;
  reportPages?: Record<string, ReportPageData>;
}

const categoryIcons: Record<string, typeof AlertTriangle> = {
  maintenance: Wrench,
  financial: CreditCard,
  safety: AlertTriangle,
};

const AIPriorityCard = ({ propertyId, reportPages }: AIPriorityCardProps) => {
  const { user } = useAuth();
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadExisting = async () => {
    if (!user || propertyId.startsWith("mock-")) {
      setPriorities([
        { title: "Schedule your furnace inspection", description: "Your furnace was last serviced over 12 months ago. Schedule a tune-up before heating season to ensure safe operation.", category: "maintenance" },
        { title: "Review your roof assessment", description: "Your roof was rated 'Fair' — consider getting quotes for repairs within the next 12 months to prevent water damage.", category: "safety" },
        { title: "Pay outstanding invoice HBC-0001", description: "You have a $2,500 invoice due within 14 days. Staying current helps us keep your projects on track.", category: "financial" },
      ]);
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("ai_priority_cards" as any)
      .select("*")
      .eq("property_id", propertyId)
      .order("generated_at", { ascending: false })
      .limit(1) as any;

    if (data && data.length > 0) {
      setPriorities(data[0].priorities_json as Priority[]);
    }
    setLoading(false);
  };

  useEffect(() => { loadExisting(); }, [propertyId, user]);

  const handleRefresh = async () => {
    if (!user || propertyId.startsWith("mock-")) return;
    setRefreshing(true);
    try {
      const pagesContext = reportPages
        ? Object.entries(reportPages).map(([key, p]) => ({
            key,
            title: p.title,
            conditionRating: p.conditionRating,
            timing: p.timing,
          }))
        : [];

      const { data, error } = await supabase.functions.invoke("ai-priority-recommendations", {
        body: { propertyId, clientId: user.id, pages: pagesContext },
      });

      if (error) throw error;
      if (data?.priorities) {
        setPriorities(data.priorities);
        toast.success("Priorities refreshed");
      }
    } catch {
      toast.error("Could not refresh priorities");
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-card rounded-lg p-8 border border-border shadow-hbc-sm animate-pulse">
        <div className="h-6 bg-muted rounded w-1/3 mb-4" />
        <div className="space-y-3">
          <div className="h-16 bg-muted rounded" />
          <div className="h-16 bg-muted rounded" />
          <div className="h-16 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (priorities.length === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent">Your Top 3 Priorities Right Now</p>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground hover:text-accent transition-colors bg-transparent border-none cursor-pointer disabled:opacity-50"
        >
          {refreshing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          Refresh
        </button>
      </div>

      <div className="bg-card rounded-lg border border-border shadow-hbc-sm overflow-hidden">
        <div className="bg-primary px-6 py-4 flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-accent" />
          <h3 className="font-display text-lg text-primary-foreground">What Should You Do First?</h3>
        </div>

        <div className="divide-y divide-border">
          {priorities.map((p, i) => {
            const Icon = categoryIcons[p.category] || Sparkles;
            return (
              <div key={i} className="px-6 py-5 flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-accent/15 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="font-display text-sm text-accent font-bold">{i + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="w-3.5 h-3.5 text-accent shrink-0" />
                    <h4 className="font-display text-base text-foreground">{p.title}</h4>
                  </div>
                  <p className="font-sans text-sm text-muted-foreground leading-relaxed">{p.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AIPriorityCard;
