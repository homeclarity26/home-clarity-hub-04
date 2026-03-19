import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { CreditCard, Calendar, AlertTriangle, Loader2, Play, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";

const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

const statusColors: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
  trialing: "bg-blue-500/10 text-blue-700 border-blue-200",
  past_due: "bg-destructive/10 text-destructive border-destructive/20",
  canceled: "bg-muted text-muted-foreground border-border",
  none: "bg-muted text-muted-foreground border-border",
};

interface SubscriptionManagerProps {
  propertyId: string;
  clientUserId: string;
  clientEmail: string;
  clientName: string;
}

const SubscriptionManager = ({ propertyId, clientUserId, clientEmail, clientName }: SubscriptionManagerProps) => {
  const qc = useQueryClient();
  const [startOpen, setStartOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedTier, setSelectedTier] = useState("");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("annual");
  const [trialDays, setTrialDays] = useState(0);

  const { data: profile } = useQuery({
    queryKey: ["client-subscription", clientUserId],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("stripe_customer_id, stripe_subscription_id, subscription_status, subscription_current_period_end, subscription_plan_id, trial_ends_at")
        .eq("user_id", clientUserId)
        .single();
      return data;
    },
  });

  const { data: tiers = [] } = useQuery({
    queryKey: ["membership-tiers"],
    queryFn: async () => {
      const { data } = await (supabase.from("membership_tiers") as any).select("*").eq("is_active", true).order("sort_order");
      return data || [];
    },
  });

  const { data: membership } = useQuery({
    queryKey: ["client-membership", clientUserId],
    queryFn: async () => {
      const { data } = await supabase
        .from("client_memberships")
        .select("*, membership_tiers(*)")
        .eq("client_id", clientUserId)
        .neq("status", "canceled")
        .limit(1)
        .single();
      return data;
    },
  });

  const { data: events = [] } = useQuery({
    queryKey: ["subscription-events", clientUserId],
    queryFn: async () => {
      const { data } = await (supabase.from("subscription_events") as any)
        .select("*")
        .eq("client_id", clientUserId)
        .order("created_at", { ascending: false })
        .limit(10);
      return data || [];
    },
  });

  const status = profile?.subscription_status || "none";
  const hasActive = status === "active" || status === "trialing";
  const tierName = (membership as any)?.membership_tiers?.name || "None";

  const handleStartSubscription = async () => {
    if (!selectedTier) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-subscription", {
        body: {
          client_id: clientUserId,
          email: clientEmail,
          name: clientName,
          tier_id: selectedTier,
          billing_cycle: billingCycle,
          trial_days: trialDays || undefined,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("Subscription created successfully");
      setStartOpen(false);
      qc.invalidateQueries({ queryKey: ["client-subscription"] });
      qc.invalidateQueries({ queryKey: ["client-membership"] });
      qc.invalidateQueries({ queryKey: ["subscription-events"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to create subscription");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (immediately: boolean) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("cancel-subscription", {
        body: { client_id: clientUserId, immediately },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(immediately ? "Subscription canceled" : "Subscription will cancel at period end");
      setCancelOpen(false);
      qc.invalidateQueries({ queryKey: ["client-subscription"] });
      qc.invalidateQueries({ queryKey: ["client-membership"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel");
    } finally {
      setLoading(false);
    }
  };

  const daysRemaining = profile?.subscription_current_period_end
    ? differenceInDays(new Date(profile.subscription_current_period_end), new Date())
    : null;

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CreditCard className="w-4.5 h-4.5 text-accent" />
          <h3 className="text-sm font-sans font-semibold text-foreground">Subscription</h3>
        </div>
        <Badge className={`text-[10px] font-mono uppercase ${statusColors[status]}`}>
          {status === "none" ? "No Subscription" : status.replace("_", " ")}
        </Badge>
      </div>

      {hasActive && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider">Plan</p>
            <p className="text-sm font-sans font-medium text-foreground">{tierName}</p>
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider">Billing</p>
            <p className="text-sm font-sans font-medium text-foreground capitalize">
              {(membership as any)?.billing_cycle || "Annual"}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider">Next Billing</p>
            <p className="text-sm font-sans font-medium text-foreground">
              {profile?.subscription_current_period_end
                ? format(new Date(profile.subscription_current_period_end), "MMM d, yyyy")
                : "—"}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider">Days Remaining</p>
            <p className={`text-sm font-sans font-medium ${daysRemaining && daysRemaining < 30 ? "text-accent" : "text-foreground"}`}>
              {daysRemaining ?? "—"}
            </p>
          </div>
        </div>
      )}

      {status === "past_due" && (
        <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/5 border border-destructive/20">
          <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
          <p className="text-xs font-sans text-destructive">Payment failed. Client's subscription is past due.</p>
        </div>
      )}

      <div className="flex gap-2">
        {!hasActive && status !== "past_due" && (
          <Button size="sm" className="gap-1.5 text-xs font-sans" onClick={() => setStartOpen(true)}>
            <Play className="w-3.5 h-3.5" />Start Subscription
          </Button>
        )}
        {hasActive && (
          <Button size="sm" variant="outline" className="gap-1.5 text-xs font-sans text-destructive" onClick={() => setCancelOpen(true)}>
            <XCircle className="w-3.5 h-3.5" />Cancel
          </Button>
        )}
      </div>

      {/* Recent Events */}
      {events.length > 0 && (
        <div className="pt-3 border-t border-border">
          <p className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider mb-2">Recent Events</p>
          <div className="space-y-1.5">
            {events.slice(0, 5).map((ev: any) => (
              <div key={ev.id} className="flex items-center justify-between">
                <span className="text-xs font-sans text-foreground">{ev.event_type.replace(/_/g, " ")}</span>
                <div className="flex items-center gap-2">
                  {ev.amount_cents > 0 && (
                    <span className="text-xs font-mono text-muted-foreground">{fmt(ev.amount_cents / 100)}</span>
                  )}
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {format(new Date(ev.created_at), "MMM d")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Start Subscription Dialog */}
      <Dialog open={startOpen} onOpenChange={setStartOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-sans">Start Subscription</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-sans">Membership Tier</Label>
              <Select value={selectedTier} onValueChange={setSelectedTier}>
                <SelectTrigger className="font-sans"><SelectValue placeholder="Select tier..." /></SelectTrigger>
                <SelectContent>
                  {tiers.map((t: any) => (
                    <SelectItem key={t.id} value={t.id} className="font-sans">
                      {t.name} — {fmt(t.price_annually)}/yr
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-sans">Billing Cycle</Label>
              <Select value={billingCycle} onValueChange={(v) => setBillingCycle(v as "monthly" | "annual")}>
                <SelectTrigger className="font-sans"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="annual">Annual</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-sans">Trial Days (optional)</Label>
              <Input type="number" value={trialDays} onChange={(e) => setTrialDays(Number(e.target.value))} className="font-mono" min={0} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStartOpen(false)} className="font-sans">Cancel</Button>
            <Button onClick={handleStartSubscription} disabled={!selectedTier || loading} className="font-sans">
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
              Create Subscription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-sans">Cancel Subscription</DialogTitle>
          </DialogHeader>
          <p className="text-sm font-sans text-muted-foreground">
            Choose how to cancel {clientName}'s subscription:
          </p>
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start text-sm font-sans"
              disabled={loading}
              onClick={() => handleCancel(false)}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Cancel at period end
              {profile?.subscription_current_period_end && (
                <span className="ml-auto text-[10px] font-mono text-muted-foreground">
                  {format(new Date(profile.subscription_current_period_end), "MMM d, yyyy")}
                </span>
              )}
            </Button>
            <Button
              variant="destructive"
              className="w-full justify-start text-sm font-sans"
              disabled={loading}
              onClick={() => handleCancel(true)}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Cancel immediately
            </Button>
          </div>
          {loading && (
            <div className="flex items-center justify-center py-2">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default SubscriptionManager;
