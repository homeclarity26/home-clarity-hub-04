import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, addMonths, setDate } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pause, Play, Trash2, RefreshCw } from "lucide-react";

interface RecurringPlanManagerProps {
  propertyId: string;
  clientName?: string;
}

interface RecurringPlan {
  id: string;
  property_id: string;
  plan_name: string;
  monthly_amount: number;
  billing_day: number;
  next_billing_date: string | null;
  status: string;
  description: string | null;
  payment_method: string | null;
  start_date: string | null;
  created_at: string;
}

interface VendorInvoiceEntry {
  vendorName: string;
  amount: string;
}

const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

const MARKUP_RATE = 0.20;

const computeNextBillingDate = (billingDay: number, startDate?: string): string => {
  const today = new Date();
  const start = startDate ? new Date(startDate) : today;
  const refDate = start > today ? start : today;
  let next = setDate(new Date(refDate.getFullYear(), refDate.getMonth(), 1), billingDay);
  if (next <= today) next = setDate(new Date(refDate.getFullYear(), refDate.getMonth() + 1, 1), billingDay);
  return next.toISOString().split("T")[0];
};

export default function RecurringPlanManager({ propertyId, clientName }: RecurringPlanManagerProps) {
  const [plans, setPlans] = useState<RecurringPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [vendorOpen, setVendorOpen] = useState<string | null>(null); // planId
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    plan_name: "",
    monthly_amount: "",
    billing_day: "1",
    start_date: new Date().toISOString().split("T")[0],
    description: "",
    payment_method: "stripe",
  });

  const [vendorForm, setVendorForm] = useState<VendorInvoiceEntry>({ vendorName: "", amount: "" });

  const loadPlans = useCallback(async () => {
    setLoading(true);
    const { data, error } = await (supabase.from("recurring_invoice_schedules" as any) as any)
      .select("*")
      .eq("property_id", propertyId)
      .order("created_at", { ascending: false });
    if (data) setPlans(data);
    setLoading(false);
  }, [propertyId]);

  useEffect(() => { loadPlans(); }, [loadPlans]);

  const handleCreate = async () => {
    if (!form.plan_name || !form.monthly_amount) { toast.error("Plan name and amount required"); return; }
    setSaving(true);
    try {
      const billingDay = parseInt(form.billing_day) || 1;
      const nextBillingDate = computeNextBillingDate(billingDay, form.start_date);
      const { error } = await (supabase.from("recurring_invoice_schedules" as any) as any).insert({
        property_id: propertyId,
        plan_name: form.plan_name,
        monthly_amount: parseFloat(form.monthly_amount),
        billing_day: billingDay,
        next_billing_date: nextBillingDate,
        start_date: form.start_date || null,
        description: form.description || null,
        payment_method: form.payment_method,
        status: "active",
      });
      if (error) throw error;
      toast.success("Recurring plan created");
      setCreateOpen(false);
      setForm({ plan_name: "", monthly_amount: "", billing_day: "1", start_date: new Date().toISOString().split("T")[0], description: "", payment_method: "stripe" });
      loadPlans();
    } catch (err: any) {
      toast.error(err?.message || "Failed to create plan");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusToggle = async (plan: RecurringPlan) => {
    const newStatus = plan.status === "active" ? "paused" : "active";
    await (supabase.from("recurring_invoice_schedules" as any) as any).update({ status: newStatus }).eq("id", plan.id);
    toast.success(`Plan ${newStatus}`);
    loadPlans();
  };

  const handleDelete = async (planId: string) => {
    await (supabase.from("recurring_invoice_schedules" as any) as any).delete().eq("id", planId);
    toast.success("Plan deleted");
    loadPlans();
  };

  const handleAddVendorInvoice = async () => {
    if (!vendorOpen || !vendorForm.vendorName || !vendorForm.amount) {
      toast.error("Vendor name and amount required");
      return;
    }
    const vendorAmount = parseFloat(vendorForm.amount);
    const markup = vendorAmount * MARKUP_RATE;
    const clientCharge = vendorAmount * (1 + MARKUP_RATE);

    // Create an invoice for the vendor pass-through
    const plan = plans.find(p => p.id === vendorOpen);
    if (!plan) return;

    setSaving(true);
    try {
      const { data: inv, error: invErr } = await (supabase.from("invoices" as any) as any).insert({
        property_id: propertyId,
        title: `Vendor Invoice — ${vendorForm.vendorName}`,
        description: `Vendor pass-through: ${vendorForm.vendorName}`,
        type: "invoice",
        status: "draft",
        issue_date: new Date().toISOString().split("T")[0],
        subtotal: clientCharge,
        tax: 0,
        total: clientCharge,
        balance_due: clientCharge,
        amount: clientCharge,
        notes: `Vendor: ${vendorForm.vendorName} — Vendor amount: ${fmt(vendorAmount)} + 20% coordination fee`,
      }).select().single();

      if (invErr || !inv) throw invErr || new Error("Failed to create invoice");

      // Add line items
      await (supabase.from("invoice_line_items" as any) as any).insert([
        {
          invoice_id: inv.id,
          description: `${vendorForm.vendorName} — Materials & Services`,
          quantity: 1,
          unit_price: vendorAmount,
          total: vendorAmount,
          item_type: "vendor",
          sort_order: 0,
        },
        {
          invoice_id: inv.id,
          description: "Coordination & Management Fee",
          quantity: 1,
          unit_price: markup,
          total: markup,
          item_type: "service",
          sort_order: 1,
        },
      ]);

      toast.success(`Vendor invoice created: ${fmt(clientCharge)} (includes ${fmt(markup)} management fee)`);
      setVendorOpen(null);
      setVendorForm({ vendorName: "", amount: "" });
    } catch (err: any) {
      toast.error(err?.message || "Failed to add vendor invoice");
    } finally {
      setSaving(false);
    }
  };

  const vendorAmount = parseFloat(vendorForm.amount) || 0;
  const vendorMarkup = vendorAmount * MARKUP_RATE;
  const vendorClientCharge = vendorAmount * (1 + MARKUP_RATE);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg text-foreground">Recurring Plans</h3>
          {clientName && (
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5">{clientName}</p>
          )}
        </div>
        <Button
          size="sm"
          className="gap-1.5 font-sans bg-accent hover:bg-accent/90 text-white"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="w-4 h-4" /> Add Plan
        </Button>
      </div>

      {/* Plans List */}
      {loading ? (
        <p className="font-sans text-sm text-muted-foreground animate-pulse">Loading plans...</p>
      ) : plans.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="font-sans text-sm text-muted-foreground">No recurring plans yet.</p>
          <Button variant="outline" className="mt-4 gap-1.5 font-sans text-sm" onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4" /> Create First Plan
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {plans.map(plan => (
            <Card key={plan.id} className="p-5 shadow-[0_2px_8px_rgba(27,43,77,0.04)]">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <h4 className="font-display text-base text-foreground">{plan.plan_name}</h4>
                    <Badge className={`text-[10px] flex-shrink-0 ${
                      plan.status === "active" ? "bg-green-100 text-green-800" :
                      plan.status === "paused" ? "bg-amber-100 text-amber-800" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {plan.status}
                    </Badge>
                  </div>
                  {plan.description && (
                    <p className="font-sans text-sm text-muted-foreground mt-1">{plan.description}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Monthly</p>
                  <p className="font-sans text-lg font-semibold mt-1">{fmt(Number(plan.monthly_amount))}</p>
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Billing Day</p>
                  <p className="font-sans text-base font-semibold mt-1">Day {plan.billing_day}</p>
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Next Bill</p>
                  <p className="font-sans text-base font-semibold mt-1">
                    {plan.next_billing_date ? format(new Date(plan.next_billing_date), "MMM d, yyyy") : "—"}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-xs font-sans"
                  onClick={() => setVendorOpen(plan.id)}
                >
                  <Plus className="w-3.5 h-3.5" /> Add Vendor Invoice
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-xs font-sans"
                  onClick={() => handleStatusToggle(plan)}
                >
                  {plan.status === "active" ? (
                    <><Pause className="w-3.5 h-3.5" /> Pause</>
                  ) : (
                    <><Play className="w-3.5 h-3.5" /> Resume</>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-xs font-sans text-destructive hover:text-destructive"
                  onClick={() => handleDelete(plan.id)}
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Plan Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Create Recurring Plan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="font-sans text-sm">Plan Name</Label>
              <Input
                value={form.plan_name}
                onChange={e => setForm(f => ({ ...f, plan_name: e.target.value }))}
                placeholder="e.g. Monthly Maintenance Plan"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="font-sans text-sm">Monthly Amount ($)</Label>
              <Input
                type="number"
                value={form.monthly_amount}
                onChange={e => setForm(f => ({ ...f, monthly_amount: e.target.value }))}
                placeholder="299.00"
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="font-sans text-sm">Billing Day of Month</Label>
                <Select value={form.billing_day} onValueChange={v => setForm(f => ({ ...f, billing_day: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (
                      <SelectItem key={d} value={String(d)}>Day {d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="font-sans text-sm">Start Date</Label>
                <Input
                  type="date"
                  value={form.start_date}
                  onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label className="font-sans text-sm">Description</Label>
              <Textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="What does this plan include?"
                className="mt-1"
                rows={3}
              />
            </div>
            <div>
              <Label className="font-sans text-sm">Payment Method</Label>
              <Select value={form.payment_method} onValueChange={v => setForm(f => ({ ...f, payment_method: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="stripe">Stripe Auto-charge</SelectItem>
                  <SelectItem value="check">Manual Check</SelectItem>
                  <SelectItem value="ach">ACH Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleCreate}
              disabled={saving}
              className="w-full bg-accent hover:bg-accent/90 text-white font-sans"
            >
              Create Plan
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Vendor Invoice Dialog */}
      <Dialog open={!!vendorOpen} onOpenChange={() => setVendorOpen(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Add Vendor Invoice</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="font-sans text-sm text-muted-foreground">
              A 20% coordination &amp; management fee will be automatically applied to the client charge.
            </p>
            <div>
              <Label className="font-sans text-sm">Vendor Name</Label>
              <Input
                value={vendorForm.vendorName}
                onChange={e => setVendorForm(f => ({ ...f, vendorName: e.target.value }))}
                placeholder="e.g. Smith Plumbing Co."
                className="mt-1"
              />
            </div>
            <div>
              <Label className="font-sans text-sm">Vendor Invoice Amount ($)</Label>
              <Input
                type="number"
                value={vendorForm.amount}
                onChange={e => setVendorForm(f => ({ ...f, amount: e.target.value }))}
                placeholder="500.00"
                className="mt-1"
              />
            </div>

            {vendorAmount > 0 && (
              <div className="bg-[#F2EFEB] rounded p-4 space-y-2 text-sm font-sans">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vendor amount</span>
                  <span>{fmt(vendorAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Coordination &amp; Management Fee (20%)</span>
                  <span>{fmt(vendorMarkup)}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-2 font-semibold">
                  <span>Client charge</span>
                  <span>{fmt(vendorClientCharge)}</span>
                </div>
              </div>
            )}

            <Button
              onClick={handleAddVendorInvoice}
              disabled={saving || !vendorForm.vendorName || !vendorForm.amount}
              className="w-full bg-accent hover:bg-accent/90 text-white font-sans"
            >
              Create Vendor Invoice
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
