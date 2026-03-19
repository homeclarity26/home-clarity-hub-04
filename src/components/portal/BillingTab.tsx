import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, ExternalLink, Download, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { format, differenceInDays } from "date-fns";

const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

const statusColors: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
  trialing: "bg-blue-500/10 text-blue-700 border-blue-200",
  past_due: "bg-destructive/10 text-destructive border-destructive/20",
  canceled: "bg-muted text-muted-foreground border-border",
};

interface BillingTabProps {
  propertyId?: string;
}

const BillingTab = ({ propertyId }: BillingTabProps) => {
  const { user } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ["my-subscription", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("subscription_status, subscription_current_period_end, stripe_customer_id, trial_ends_at")
        .eq("user_id", user!.id)
        .single();
      return data;
    },
  });

  const { data: membership } = useQuery({
    queryKey: ["my-membership", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("client_memberships")
        .select("*, membership_tiers(name, price_monthly, price_annually, color_hex)")
        .eq("client_id", user!.id)
        .neq("status", "canceled")
        .limit(1)
        .single();
      return data;
    },
  });

  const { data: events = [] } = useQuery({
    queryKey: ["my-subscription-events", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await (supabase.from("subscription_events") as any)
        .select("*")
        .eq("client_id", user!.id)
        .eq("event_type", "payment_succeeded")
        .order("created_at", { ascending: false })
        .limit(20);
      return data || [];
    },
  });

  const status = profile?.subscription_status || "none";
  const tier = (membership as any)?.membership_tiers;
  const daysRemaining = profile?.subscription_current_period_end
    ? differenceInDays(new Date(profile.subscription_current_period_end), new Date())
    : null;

  const handleManagePayment = () => {
    // This would redirect to Stripe Customer Portal
    // Requires a backend endpoint to create a portal session
    window.open("https://billing.stripe.com/p/login/test", "_blank");
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 space-y-8">
      <div>
        <h2 className="font-display text-2xl text-foreground">Billing & Subscription</h2>
        <p className="text-sm font-sans text-muted-foreground mt-1">Manage your membership plan and payment history.</p>
      </div>

      {/* Current Plan */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-accent" />
            <h3 className="text-base font-sans font-semibold text-foreground">Current Plan</h3>
          </div>
          {status !== "none" && (
            <Badge className={`text-[10px] font-mono uppercase ${statusColors[status] || statusColors.canceled}`}>
              {status.replace("_", " ")}
            </Badge>
          )}
        </div>

        {status === "none" || !tier ? (
          <p className="text-sm font-sans text-muted-foreground">No active subscription. Contact your advisor to get started.</p>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-1 h-12 rounded-full" style={{ backgroundColor: tier.color_hex || "hsl(var(--accent))" }} />
              <div>
                <p className="text-lg font-sans font-bold text-foreground">{tier.name}</p>
                <p className="text-sm font-sans text-muted-foreground">
                  {(membership as any)?.billing_cycle === "monthly"
                    ? `${fmt(tier.price_monthly)}/month`
                    : `${fmt(tier.price_annually)}/year`}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border">
              <div>
                <p className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider">Next billing date</p>
                <p className="text-sm font-sans font-medium text-foreground mt-0.5">
                  {profile?.subscription_current_period_end
                    ? format(new Date(profile.subscription_current_period_end), "MMMM d, yyyy")
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider">Days remaining</p>
                <p className={`text-sm font-sans font-medium mt-0.5 ${daysRemaining && daysRemaining < 30 ? "text-accent" : "text-foreground"}`}>
                  {daysRemaining ?? "—"} days
                </p>
              </div>
            </div>

            {status === "trialing" && profile?.trial_ends_at && (
              <div className="p-3 rounded-md bg-blue-500/5 border border-blue-200">
                <p className="text-xs font-sans text-blue-700">
                  Your trial ends on {format(new Date(profile.trial_ends_at), "MMMM d, yyyy")}. Your card will be charged after the trial.
                </p>
              </div>
            )}

            {status === "past_due" && (
              <div className="p-3 rounded-md bg-destructive/5 border border-destructive/20">
                <p className="text-xs font-sans text-destructive">
                  Your last payment failed. Please update your payment method to avoid service interruption.
                </p>
              </div>
            )}
          </div>
        )}

        {profile?.stripe_customer_id && (
          <Button variant="outline" className="mt-4 gap-1.5 text-xs font-sans" onClick={handleManagePayment}>
            <CreditCard className="w-3.5 h-3.5" />Update Payment Method
            <ExternalLink className="w-3 h-3 ml-1 text-muted-foreground" />
          </Button>
        )}
      </Card>

      {/* Payment History */}
      {events.length > 0 && (
        <Card className="p-6">
          <h3 className="text-base font-sans font-semibold text-foreground mb-4">Payment History</h3>
          <div className="space-y-2">
            {events.map((ev: any) => (
              <div key={ev.id} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-sans text-foreground">Membership Payment</p>
                  <p className="text-[10px] font-mono text-muted-foreground">
                    {format(new Date(ev.created_at), "MMM d, yyyy")}
                    {ev.period_start && ev.period_end && (
                      <> · {format(new Date(ev.period_start), "MMM d")} – {format(new Date(ev.period_end), "MMM d, yyyy")}</>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono font-medium text-foreground">{fmt(ev.amount_cents / 100)}</span>
                  <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-200 text-[9px]">Paid</Badge>
                  {ev.invoice_url && (
                    <a href={ev.invoice_url} target="_blank" rel="noopener noreferrer">
                      <Download className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground transition-colors" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default BillingTab;
