import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, Award, DollarSign, Hammer, Calendar } from "lucide-react";

interface AnnualReportCardProps {
  propertyId: string;
}

const AnnualReportCard = ({ propertyId }: AnnualReportCardProps) => {
  const { data, isLoading } = useQuery({
    queryKey: ["annual-report-card", propertyId],
    enabled: !!propertyId && !propertyId.startsWith("mock-"),
    queryFn: async () => {
      // Get invoices for this property
      const { data: invoices } = await supabase.from("invoices").select("id").eq("property_id", propertyId);
      const invIds = invoices?.map((i) => i.id) || [];

      let totalSpent = 0;
      if (invIds.length > 0) {
        const { data: payments } = await supabase.from("payments_posted").select("amount").in("invoice_id", invIds);
        totalSpent = (payments || []).reduce((s, p) => s + Number(p.amount), 0);
      }

      const { data: projects } = await supabase.from("projects").select("title, status, estimated_cost, value_contribution_estimate").eq("property_id", propertyId);
      const { data: valueHistory } = await supabase.from("home_value_history").select("estimated_value, recorded_at").eq("property_id", propertyId).order("recorded_at", { ascending: true });
      const { data: valuation } = await supabase.from("property_valuations").select("price").eq("property_id", propertyId).order("fetched_at", { ascending: false }).limit(1);

      const completedProjects = (projects || []).filter((p) => p.status === "complete" || p.status === "completed");
      const activeProjects = (projects || []).filter((p) => p.status !== "complete" && p.status !== "completed" && p.status !== "cancelled");
      const totalValueContribution = completedProjects.reduce((s, p) => s + Number(p.value_contribution_estimate || 0), 0);

      const currentValue = valuation?.[0]?.price || null;
      const history = valueHistory || [];
      const firstValue = history.length > 0 ? Number(history[0].estimated_value) : null;
      const valueChange = currentValue && firstValue ? currentValue - firstValue : null;
      const valueChangePct = firstValue && valueChange ? ((valueChange / firstValue) * 100).toFixed(1) : null;

      return {
        totalSpent,
        completedCount: completedProjects.length,
        activeCount: activeProjects.length,
        totalValueContribution,
        currentValue,
        valueChange,
        valueChangePct,
        completedProjects: completedProjects.slice(0, 5).map((p) => ({
          title: p.title,
          cost: p.estimated_cost,
          valueContribution: p.value_contribution_estimate,
        })),
      };
    },
  });

  if (isLoading || !data) return null;
  if (data.completedCount === 0 && data.totalSpent === 0 && !data.currentValue) return null;

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-5">
        <Award className="w-4 h-4 text-accent" />
        <h3 className="font-display text-lg text-foreground">Annual Home Report Card</h3>
        <span className="text-[10px] font-mono text-muted-foreground ml-auto">{new Date().getFullYear()}</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {data.currentValue && (
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <p className="text-lg font-mono font-bold text-foreground">${data.currentValue.toLocaleString()}</p>
            <p className="text-[10px] font-sans text-muted-foreground">Current Value</p>
            {data.valueChange !== null && (
              <div className={`flex items-center justify-center gap-1 mt-1 ${Number(data.valueChange) >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                {Number(data.valueChange) >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                <span className="text-[10px] font-mono">{data.valueChangePct}%</span>
              </div>
            )}
          </div>
        )}
        <div className="text-center p-3 bg-muted/30 rounded-lg">
          <p className="text-lg font-mono font-bold text-foreground">${data.totalSpent.toLocaleString()}</p>
          <p className="text-[10px] font-sans text-muted-foreground">Total Invested</p>
        </div>
        <div className="text-center p-3 bg-muted/30 rounded-lg">
          <p className="text-lg font-mono font-bold text-foreground">{data.completedCount}</p>
          <p className="text-[10px] font-sans text-muted-foreground">Projects Done</p>
        </div>
        <div className="text-center p-3 bg-muted/30 rounded-lg">
          <p className="text-lg font-mono font-bold text-foreground">{data.activeCount}</p>
          <p className="text-[10px] font-sans text-muted-foreground">In Progress</p>
        </div>
      </div>

      {data.completedProjects.length > 0 && (
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-accent mb-3">Completed Projects</p>
          <div className="space-y-2">
            {data.completedProjects.map((p, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 rounded-md bg-muted/20">
                <span className="text-xs font-sans text-foreground truncate flex-1">{p.title}</span>
                <div className="flex items-center gap-3 shrink-0">
                  {p.cost && <span className="text-[10px] font-mono text-muted-foreground">${Number(p.cost).toLocaleString()}</span>}
                  {p.valueContribution && (
                    <span className="text-[10px] font-mono text-emerald-600">+${Number(p.valueContribution).toLocaleString()}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

export default AnnualReportCard;
