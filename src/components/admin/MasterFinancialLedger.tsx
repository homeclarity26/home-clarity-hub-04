import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, isPast, addDays } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, ChevronUp, DollarSign, TrendingUp, CreditCard, AlertCircle, CheckCircle, Circle, Send, Plus } from "lucide-react";

interface MasterFinancialLedgerProps {
  propertyId: string;
  propertyName?: string;
  clientName?: string;
}

interface Invoice {
  id: string;
  invoice_number: string | null;
  title: string | null;
  description: string;
  status: string;
  issue_date: string | null;
  due_date: string | null;
  subtotal: number;
  tax: number;
  total: number;
  balance_due: number;
  notes: string | null;
  created_at: string;
  original_total?: number | null;
  co_total?: number | null;
}

interface LineItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  item_type: string;
  sort_order: number;
}

interface ChangeOrder {
  id: string;
  invoice_id: string;
  title: string;
  description: string | null;
  amount: number;
  status: string;
  co_mode?: string;
  created_at: string;
}

interface PaymentPosted {
  id: string;
  invoice_id: string;
  amount: number;
  payment_date: string;
  method: string;
  notes: string | null;
}

interface RecurringSchedule {
  id: string;
  property_id: string;
  plan_name: string;
  monthly_amount: number;
  billing_day: number;
  next_billing_date: string | null;
  status: string;
  description: string | null;
}

const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-blue-100 text-blue-800",
  viewed: "bg-purple-100 text-purple-800",
  partially_paid: "bg-amber-100 text-amber-800",
  paid: "bg-green-100 text-green-800",
  overdue: "bg-red-100 text-red-800",
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-muted text-muted-foreground",
  verbal: "bg-blue-100 text-blue-800",
};

const coStatusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-muted text-muted-foreground",
  verbal: "bg-blue-100 text-blue-800",
  formal: "bg-purple-100 text-purple-800",
};

export default function MasterFinancialLedger({ propertyId, propertyName, clientName }: MasterFinancialLedgerProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [changeOrders, setChangeOrders] = useState<ChangeOrder[]>([]);
  const [payments, setPayments] = useState<PaymentPosted[]>([]);
  const [recurringPlans, setRecurringPlans] = useState<RecurringSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedInvoices, setExpandedInvoices] = useState<Set<string>>(new Set());
  const [paymentModalInvoice, setPaymentModalInvoice] = useState<Invoice | null>(null);
  const [paymentForm, setPaymentForm] = useState({ amount: "", payment_date: new Date().toISOString().split("T")[0], method: "check", notes: "" });
  const [postingPayment, setPostingPayment] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [invRes, liRes, coRes, pRes, rRes] = await Promise.all([
      supabase.from("invoices").select("*").eq("property_id", propertyId).order("created_at", { ascending: true }),
      supabase.from("invoice_line_items").select("*"),
      supabase.from("change_orders").select("*"),
      supabase.from("payments_posted").select("*"),
      supabase.from("recurring_invoice_schedules").select("*").eq("property_id", propertyId),
    ]);
    if (invRes.data) setInvoices(invRes.data);
    if (liRes.data) setLineItems(liRes.data);
    if (coRes.data) setChangeOrders(coRes.data);
    if (pRes.data) setPayments(pRes.data);
    if (rRes.data) setRecurringPlans(rRes.data as any);
    setLoading(false);
  }, [propertyId]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    const channel = supabase
      .channel(`ledger-${propertyId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "invoices" }, () => loadData())
      .on("postgres_changes", { event: "*", schema: "public", table: "invoice_line_items" }, () => loadData())
      .on("postgres_changes", { event: "*", schema: "public", table: "change_orders" }, () => loadData())
      .on("postgres_changes", { event: "*", schema: "public", table: "payments_posted" }, () => loadData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [propertyId, loadData]);

  // Computed financial summary
  const originalContract = invoices.reduce((s, inv) => s + Number(inv.original_total ?? inv.total), 0);
  const approvedCOTotal = changeOrders.filter(co => co.status === "approved").reduce((s, co) => s + Number(co.amount), 0);
  const paidToDate = payments.reduce((s, p) => s + Number(p.amount), 0);
  const totalContract = originalContract + approvedCOTotal;
  const balanceDue = Math.max(0, totalContract - paidToDate);

  const getBalanceColor = () => {
    if (balanceDue === 0) return "text-green-600";
    const overdueInv = invoices.find(i => i.due_date && isPast(new Date(i.due_date)) && Number(i.balance_due) > 0);
    if (overdueInv) return "text-[#B5450B]"; // rust
    return "text-amber-600";
  };

  const toggleInvoice = (id: string) => {
    setExpandedInvoices(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleMarkSent = async (inv: Invoice) => {
    await supabase.from("invoices").update({ status: "sent" }).eq("id", inv.id);
    toast.success("Invoice marked as sent");
    loadData();
  };

  const handlePostPayment = async () => {
    if (!paymentModalInvoice) return;
    const amount = parseFloat(paymentForm.amount);
    if (!amount || amount <= 0) { toast.error("Enter a valid amount"); return; }
    setPostingPayment(true);
    try {
      await supabase.from("payments_posted").insert({
        invoice_id: paymentModalInvoice.id,
        amount,
        payment_date: paymentForm.payment_date,
        method: paymentForm.method,
        notes: paymentForm.notes || null,
      });
      // Recalculate invoice
      const invPayments = payments.filter(p => p.invoice_id === paymentModalInvoice.id);
      const newTotalPaid = invPayments.reduce((s, p) => s + Number(p.amount), 0) + amount;
      const newBalance = Math.max(0, Number(paymentModalInvoice.total) - newTotalPaid);
      const newStatus = newBalance === 0 ? "paid" : newTotalPaid > 0 ? "partially_paid" : paymentModalInvoice.status;
      await supabase.from("invoices").update({ balance_due: newBalance, status: newStatus }).eq("id", paymentModalInvoice.id);
      toast.success("Payment posted");
      setPaymentModalInvoice(null);
      setPaymentForm({ amount: "", payment_date: new Date().toISOString().split("T")[0], method: "check", notes: "" });
      loadData();
    } catch {
      toast.error("Failed to post payment");
    } finally {
      setPostingPayment(false);
    }
  };

  const getMilestoneCircle = (inv: Invoice, index: number) => {
    const isActive = ["sent", "viewed", "partially_paid"].includes(inv.status);
    const isPaid = inv.status === "paid";
    if (isPaid) return (
      <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
        <CheckCircle className="w-4 h-4 text-white" />
      </div>
    );
    if (isActive) return (
      <div className="w-8 h-8 rounded-full border-2 border-accent flex items-center justify-center flex-shrink-0 animate-pulse bg-accent/10">
        <span className="font-mono text-[11px] font-bold text-accent">{index + 1}</span>
      </div>
    );
    return (
      <div className="w-8 h-8 rounded-full border-2 border-border flex items-center justify-center flex-shrink-0">
        <span className="font-mono text-[11px] text-muted-foreground">{index + 1}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <p className="font-sans text-sm text-muted-foreground animate-pulse">Loading financial data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="font-display text-2xl text-foreground">
          {propertyName || "Project"} — Financial Ledger
        </h2>
        {clientName && (
          <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground mt-1">{clientName}</p>
        )}
      </div>

      {/* 1. Financial Summary Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-5 shadow-[0_2px_8px_rgba(27,43,77,0.04)]">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[#F2EFEB] flex items-center justify-center flex-shrink-0">
              <FileIcon className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Original Contract</p>
              <p className="font-display text-xl text-foreground mt-1">{fmt(originalContract)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-5 shadow-[0_2px_8px_rgba(27,43,77,0.04)]">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[#F2EFEB] flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Change Orders</p>
              <p className="font-display text-xl text-foreground mt-1">{fmt(approvedCOTotal)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-5 shadow-[0_2px_8px_rgba(27,43,77,0.04)]">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Paid to Date</p>
              <p className="font-display text-xl text-green-600 mt-1">{fmt(paidToDate)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-5 shadow-[0_2px_8px_rgba(27,43,77,0.04)]">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[#F2EFEB] flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Balance Due</p>
              <p className={`font-display text-xl mt-1 ${getBalanceColor()}`}>{fmt(balanceDue)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* 2. Milestone Progress Timeline */}
      {invoices.length > 0 && (
        <Card className="p-6 shadow-[0_2px_8px_rgba(27,43,77,0.04)]">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent mb-6">Milestone Progress</p>
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-4 top-4 bottom-4 w-px bg-border" />
            <div className="space-y-6">
              {invoices.map((inv, index) => (
                <div key={inv.id} className="flex items-start gap-4 relative">
                  {getMilestoneCircle(inv, index)}
                  <div className="flex-1 flex items-center justify-between min-w-0">
                    <div>
                      <p className="font-sans text-sm font-medium text-foreground">{inv.title || inv.description || `Milestone ${index + 1}`}</p>
                      {inv.due_date && (
                        <p className="font-mono text-[10px] text-muted-foreground mt-0.5">
                          Due {format(new Date(inv.due_date), "MMM d, yyyy")}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="font-sans text-sm font-semibold">{fmt(Number(inv.total))}</span>
                      <Badge className={`text-[10px] ${statusColors[inv.status] || "bg-muted"}`}>
                        {inv.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* 3. Invoice List */}
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent mb-4">Invoices</p>
        <div className="space-y-3">
          {invoices.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="font-sans text-sm text-muted-foreground">No invoices yet.</p>
            </Card>
          ) : invoices.map(inv => {
            const isExpanded = expandedInvoices.has(inv.id);
            const lis = lineItems.filter(l => l.invoice_id === inv.id).sort((a, b) => a.sort_order - b.sort_order);
            const cos = changeOrders.filter(c => c.invoice_id === inv.id);
            const ps = payments.filter(p => p.invoice_id === inv.id);
            const totalPaid = ps.reduce((s, p) => s + Number(p.amount), 0);
            const approvedCos = cos.filter(c => c.status === "approved");
            const coSum = approvedCos.reduce((s, c) => s + Number(c.amount), 0);
            return (
              <Card key={inv.id} className="overflow-hidden shadow-[0_2px_8px_rgba(27,43,77,0.04)]">
                {/* Collapsed Row */}
                <div
                  className="flex items-center gap-4 p-4 cursor-pointer hover:bg-[#F2EFEB]/50 transition-colors"
                  onClick={() => toggleInvoice(inv.id)}
                >
                  <button className="text-muted-foreground flex-shrink-0">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-muted-foreground">{inv.invoice_number || "DRAFT"}</span>
                      <span className="font-sans text-sm font-medium truncate">{inv.title || inv.description}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <span className="font-sans text-sm font-semibold hidden sm:block">{fmt(Number(inv.total))}</span>
                    <Badge className={`text-[10px] ${statusColors[inv.status] || "bg-muted"}`}>
                      {inv.status.replace("_", " ")}
                    </Badge>
                    <span className="font-mono text-[10px] text-muted-foreground hidden md:block">
                      {inv.due_date ? format(new Date(inv.due_date), "MMM d") : "—"}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs font-sans h-7 px-2"
                      onClick={(e) => { e.stopPropagation(); toggleInvoice(inv.id); }}
                    >
                      View
                    </Button>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-border p-5 space-y-5 bg-background">
                    {/* Line Items */}
                    {lis.length > 0 && (
                      <div>
                        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Line Items</p>
                        <table className="w-full border-collapse text-sm">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground pb-2">Description</th>
                              <th className="text-right font-mono text-[10px] uppercase tracking-wider text-muted-foreground pb-2">Qty</th>
                              <th className="text-right font-mono text-[10px] uppercase tracking-wider text-muted-foreground pb-2">Price</th>
                              <th className="text-right font-mono text-[10px] uppercase tracking-wider text-muted-foreground pb-2">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {lis.map((li, i) => (
                              <tr key={li.id} className={i % 2 === 0 ? "bg-white" : "bg-[#F2EFEB]"}>
                                <td className="py-2 font-sans">{li.description}</td>
                                <td className="py-2 font-sans text-right text-muted-foreground">{li.quantity}</td>
                                <td className="py-2 font-sans text-right text-muted-foreground">{fmt(Number(li.unit_price))}</td>
                                <td className="py-2 font-sans text-right font-medium">{fmt(Number(li.total))}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Change Orders */}
                    {cos.length > 0 && (
                      <div>
                        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Attached Change Orders</p>
                        <div className="space-y-2">
                          {cos.map(co => (
                            <div key={co.id} className="flex items-center justify-between bg-white rounded p-3 border border-border">
                              <div>
                                <p className="font-sans text-sm font-medium">{co.title}</p>
                                {co.description && <p className="font-sans text-xs text-muted-foreground">{co.description}</p>}
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="font-sans text-sm font-medium">{fmt(Number(co.amount))}</span>
                                <Badge className={`text-[10px] ${coStatusColors[co.status] || "bg-muted"}`}>{co.status}</Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Payments */}
                    {ps.length > 0 && (
                      <div>
                        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Payments Posted</p>
                        <div className="space-y-2">
                          {ps.map(p => (
                            <div key={p.id} className="flex items-center justify-between bg-white rounded p-3 border border-border">
                              <div>
                                <p className="font-sans text-sm">{format(new Date(p.payment_date), "MMM d, yyyy")} — <span className="capitalize">{p.method}</span></p>
                                {p.notes && <p className="font-sans text-xs text-muted-foreground">{p.notes}</p>}
                              </div>
                              <span className="font-sans text-sm font-medium text-green-600">{fmt(Number(p.amount))}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Balance Summary */}
                    <div className="bg-white rounded p-4 border border-border">
                      <div className="space-y-1 text-sm font-sans">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span>{fmt(Number(inv.subtotal))}</span>
                        </div>
                        {coSum > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Change Orders</span>
                            <span>+{fmt(coSum)}</span>
                          </div>
                        )}
                        {totalPaid > 0 && (
                          <div className="flex justify-between text-green-600">
                            <span>Paid</span>
                            <span>-{fmt(totalPaid)}</span>
                          </div>
                        )}
                        <div className="flex justify-between border-t border-border pt-2 font-display text-base">
                          <span>Balance Due</span>
                          <span className={Number(inv.balance_due) === 0 ? "text-green-600" : "text-[#B5450B]"}>
                            {fmt(Number(inv.balance_due))}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Admin Actions */}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        className="gap-1.5 text-xs font-sans bg-accent hover:bg-accent/90 text-white"
                        onClick={() => { setPaymentModalInvoice(inv); setPaymentForm(f => ({ ...f, amount: String(inv.balance_due) })); }}
                      >
                        <DollarSign className="w-3.5 h-3.5" /> Mark Payment Received
                      </Button>
                      {inv.status === "draft" && (
                        <Button size="sm" variant="outline" className="gap-1.5 text-xs font-sans" onClick={() => handleMarkSent(inv)}>
                          <Send className="w-3.5 h-3.5" /> Send to Client
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      {/* 4. Change Orders Panel */}
      {changeOrders.length > 0 && (
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent mb-4">Change Orders</p>
          <Card className="overflow-hidden shadow-[0_2px_8px_rgba(27,43,77,0.04)]">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border bg-[#F2EFEB]">
                  <th className="text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground p-4">Title</th>
                  <th className="text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground p-4 hidden sm:table-cell">Invoice</th>
                  <th className="text-right font-mono text-[10px] uppercase tracking-wider text-muted-foreground p-4">Amount</th>
                  <th className="text-right font-mono text-[10px] uppercase tracking-wider text-muted-foreground p-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {changeOrders.map((co, i) => {
                  const linkedInvoice = invoices.find(inv => inv.id === co.invoice_id);
                  return (
                    <tr key={co.id} className={i % 2 === 0 ? "bg-white" : "bg-[#F2EFEB]/50"}>
                      <td className="p-4">
                        <p className="font-sans text-sm font-medium">{co.title}</p>
                        {co.description && <p className="font-sans text-xs text-muted-foreground">{co.description}</p>}
                      </td>
                      <td className="p-4 hidden sm:table-cell">
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {linkedInvoice?.invoice_number || linkedInvoice?.title || "—"}
                        </span>
                      </td>
                      <td className="p-4 text-right font-sans text-sm font-medium">{fmt(Number(co.amount))}</td>
                      <td className="p-4 text-right">
                        <Badge className={`text-[10px] ${coStatusColors[co.status] || "bg-muted"}`}>{co.status}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {/* 5. Payment History */}
      {payments.length > 0 && (
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent mb-4">Payment History</p>
          <Card className="overflow-hidden shadow-[0_2px_8px_rgba(27,43,77,0.04)]">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border bg-[#F2EFEB]">
                  <th className="text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground p-4">Date</th>
                  <th className="text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground p-4">Method</th>
                  <th className="text-right font-mono text-[10px] uppercase tracking-wider text-muted-foreground p-4">Amount</th>
                  <th className="text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground p-4 hidden sm:table-cell">Invoice</th>
                  <th className="text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground p-4 hidden md:table-cell">Notes</th>
                </tr>
              </thead>
              <tbody>
                {[...payments].sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()).map((p, i) => {
                  const linkedInvoice = invoices.find(inv => inv.id === p.invoice_id);
                  return (
                    <tr key={p.id} className={i % 2 === 0 ? "bg-white" : "bg-[#F2EFEB]/50"}>
                      <td className="p-4 font-sans text-sm">{format(new Date(p.payment_date), "MMM d, yyyy")}</td>
                      <td className="p-4 font-sans text-sm capitalize">{p.method}</td>
                      <td className="p-4 font-sans text-sm text-right font-medium text-green-600">{fmt(Number(p.amount))}</td>
                      <td className="p-4 hidden sm:table-cell">
                        <span className="font-mono text-[10px] text-muted-foreground">{linkedInvoice?.invoice_number || "—"}</span>
                      </td>
                      <td className="p-4 font-sans text-xs text-muted-foreground hidden md:table-cell">{p.notes || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-border bg-[#F2EFEB]">
                  <td colSpan={2} className="p-4 font-sans text-sm font-semibold">Total Received</td>
                  <td className="p-4 font-sans text-sm font-semibold text-right text-green-600">{fmt(paidToDate)}</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </Card>
        </div>
      )}

      {/* 6. Recurring Plans */}
      {recurringPlans.length > 0 && (
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent mb-4">Maintenance Plan</p>
          <div className="grid gap-4">
            {recurringPlans.map(plan => (
              <Card key={plan.id} className="p-5 shadow-[0_2px_8px_rgba(27,43,77,0.04)]">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-display text-base text-foreground">{plan.plan_name}</p>
                    {plan.description && <p className="font-sans text-sm text-muted-foreground mt-1">{plan.description}</p>}
                  </div>
                  <Badge className={`text-[10px] ${plan.status === "active" ? "bg-green-100 text-green-800" : "bg-muted text-muted-foreground"}`}>
                    {plan.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Monthly</p>
                    <p className="font-sans text-base font-semibold mt-1">{fmt(Number(plan.monthly_amount))}</p>
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
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Payment Modal */}
      <Dialog open={!!paymentModalInvoice} onOpenChange={() => setPaymentModalInvoice(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Post Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="font-sans text-sm">Amount ($)</Label>
              <Input type="number" value={paymentForm.amount} onChange={e => setPaymentForm(f => ({ ...f, amount: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label className="font-sans text-sm">Payment Date</Label>
              <Input type="date" value={paymentForm.payment_date} onChange={e => setPaymentForm(f => ({ ...f, payment_date: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label className="font-sans text-sm">Method</Label>
              <Select value={paymentForm.method} onValueChange={v => setPaymentForm(f => ({ ...f, method: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="credit">Credit Card</SelectItem>
                  <SelectItem value="ach">ACH</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="font-sans text-sm">Notes</Label>
              <Textarea value={paymentForm.notes} onChange={e => setPaymentForm(f => ({ ...f, notes: e.target.value }))} className="mt-1" />
            </div>
            <Button onClick={handlePostPayment} disabled={postingPayment} className="w-full bg-accent hover:bg-accent/90 text-white font-sans">
              Post Payment
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Inline icon for file
function FileIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}
