import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, TrendingUp, AlertTriangle, UserMinus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(n);

const SubscriptionDashboardWidget = () => {
  const { data: stats } = useQuery({
    queryKey: ["subscription-dashboard-stats"],
    queryFn: async () => {
      // Get all active memberships with tier pricing
      const { data: memberships } = await supabase
        .from("client_memberships")
        .select("*, membership_tiers(price_monthly, price_annually)")
        .eq("status", "active");

      const { data: pastDue } = await (supabase.from("profiles") as any)
        .select("user_id")
        .eq("subscription_status", "past_due");

      // Calculate MRR
      let mrr = 0;
      (memberships || []).forEach((m: any) => {
        const tier = m.membership_tiers;
        if (!tier) return;
        if (m.billing_cycle === "monthly") {
          mrr += Number(tier.price_monthly || 0);
        } else {
          mrr += Number(tier.price_annually || 0) / 12;
        }
      });

      // Churned this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: churned } = await (supabase.from("subscription_events") as any)
        .select("id")
        .in("event_type", ["subscription_deleted", "canceled_immediately"])
        .gte("created_at", startOfMonth.toISOString());

      return {
        mrr,
        activeCount: (memberships || []).length,
        pastDueCount: (pastDue || []).length,
        churnedCount: (churned || []).length,
      };
    },
  });

  if (!stats) return null;

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <CreditCard className="w-4 h-4 text-accent" />
        <h3 className="text-sm font-sans font-semibold text-foreground">Subscriptions</h3>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <p className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider">MRR</p>
          </div>
          <p className="text-xl font-sans font-bold text-foreground">{fmt(stats.mrr)}</p>
        </div>
        <div>
          <p className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider mb-1">Active</p>
          <p className="text-xl font-sans font-bold text-foreground">{stats.activeCount}</p>
        </div>
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <p className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider">Past Due</p>
            {stats.pastDueCount > 0 && (
              <Badge variant="destructive" className="text-[9px] h-4 px-1">{stats.pastDueCount}</Badge>
            )}
          </div>
          <p className={`text-xl font-sans font-bold ${stats.pastDueCount > 0 ? "text-destructive" : "text-foreground"}`}>
            {stats.pastDueCount}
          </p>
        </div>
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <UserMinus className="w-3.5 h-3.5 text-muted-foreground" />
            <p className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider">Churned (mo)</p>
          </div>
          <p className="text-xl font-sans font-bold text-foreground">{stats.churnedCount}</p>
        </div>
      </div>
    </Card>
  );
};

export default SubscriptionDashboardWidget;
