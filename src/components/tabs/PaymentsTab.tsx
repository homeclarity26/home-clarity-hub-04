import { useState, useEffect, useMemo, useCallback } from "react";
import { Receipt, ShieldCheck, Calendar, List, MessageCircle, FileText, ChevronRight, Eye, CreditCard, Loader2 } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, isPast } from "date-fns";
import { toast } from "sonner";

interface PaymentsTabProps {
  propertyId?: string;
  onTabChange?: (tab: string) => void;
}

interface Invoice {
  id: string;
  invoice_number: string | null;
  title: string | null;
  type: string;
  description: string;
  amount: number;
  status: string;
  due_date: string | null;
  paid_date: string | null;
  subtotal: number;
  tax: number;
  total: number;
  balance_due: number;
  notes: string | null;
  ai_summary: string | null;
  issue_date: string | null;
  created_at: string;
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
}

interface PaymentPosted {
  id: string;
  invoice_id: string;
  amount: number;
  payment_date: string;
  method: string;
  notes: string | null;
}

const PayNowButton = ({ invoice }: { invoice: Invoice }) => {
  const [loading, setLoading] = useState(false);
  const handlePay = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          invoice_id: invoice.id,
          amount: Number(invoice.balance_due),
          title: invoice.title || invoice.description || `Invoice ${invoice.invoice_number}`,
          success_url: `${window.location.origin}${window.location.pathname}?payment=success`,
          cancel_url: `${window.location.origin}${window.location.pathname}?payment=cancelled`,
        },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err) {
      console.error("Checkout error:", err);
      toast.error("Unable to start payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <Button onClick={handlePay} disabled={loading} className="w-full mt-4 gap-2 font-sans">
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
      {loading ? "Redirecting..." : `Pay ${fmt(Number(invoice.balance_due))} Now`}
    </Button>
  );
};

const cardBase = "group bg-card rounded-lg p-8 shadow-hbc-sm hover:shadow-hbc-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col gap-3 border border-border text-left w-full";
const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-blue-100 text-blue-800",
  viewed: "bg-purple-100 text-purple-800",
  partially_paid: "bg-accent/20 text-accent-foreground",
  paid: "bg-green-100 text-green-800",
  overdue: "bg-destructive/10 text-destructive",
  pending: "bg-accent/20 text-accent-foreground",
};

const PaymentsTab = ({ propertyId, onTabChange }: PaymentsTabProps) => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [changeOrders, setChangeOrders] = useState<ChangeOrder[]>([]);
  const [paymentsPosted, setPaymentsPosted] = useState<PaymentPosted[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const loadData = useCallback(async () => {
    if (!propertyId) { setLoading(false); return; }

    if (propertyId.startsWith("mock-")) {
      setInvoices([
        { id: "inv-1", invoice_number: "HBC-0001", title: "Home Clarity Report — Johnson Residence", type: "invoice", description: "Home Clarity Report", amount: 2500, status: "paid", due_date: "2026-01-15", paid_date: "2026-01-12", subtotal: 2500, tax: 0, total: 2500, balance_due: 0, notes: null, ai_summary: null, issue_date: "2026-01-01", created_at: "2026-01-01T00:00:00Z" },
        { id: "inv-2", invoice_number: "HBC-0002", title: "Annual Membership — Year 1", type: "invoice", description: "Annual Membership", amount: 750, status: "paid", due_date: "2026-02-01", paid_date: "2026-01-28", subtotal: 750, tax: 0, total: 750, balance_due: 0, notes: null, ai_summary: null, issue_date: "2026-01-20", created_at: "2026-01-20T00:00:00Z" },
        { id: "inv-3", invoice_number: "HBC-0003", title: "Furnace Consultation & Vendor Coordination", type: "invoice", description: "Furnace Consultation", amount: 350, status: "sent", due_date: "2026-04-01", paid_date: null, subtotal: 350, tax: 0, total: 350, balance_due: 350, notes: null, ai_summary: null, issue_date: "2026-03-10", created_at: "2026-03-10T00:00:00Z" },
      ]);
      setLoading(false);
      return;
    }

    const [invRes, liRes, coRes, pRes] = await Promise.all([
      (supabase.from("invoices" as any) as any).select("*").eq("property_id", propertyId).order("created_at", { ascending: false }),
      (supabase.from("invoice_line_items" as any) as any).select("*"),
      (supabase.from("change_orders" as any) as any).select("*"),
      (supabase.from("payments_posted" as any) as any).select("*"),
    ]);
    if (invRes.data) setInvoices(invRes.data);
    if (liRes.data) setLineItems(liRes.data);
    if (coRes.data) setChangeOrders(coRes.data);
    if (pRes.data) setPaymentsPosted(pRes.data);
    setLoading(false);
  }, [propertyId]);

  useEffect(() => { loadData(); }, [loadData]);

  // Realtime
  useEffect(() => {
    if (!propertyId || propertyId.startsWith("mock-")) return;
    const channel = supabase
      .channel(`payments-client-${propertyId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "invoices" }, () => loadData())
      .on("postgres_changes", { event: "*", schema: "public", table: "invoice_line_items" }, () => loadData())
      .on("postgres_changes", { event: "*", schema: "public", table: "change_orders" }, () => loadData())
      .on("postgres_changes", { event: "*", schema: "public", table: "payments_posted" }, () => loadData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [propertyId, loadData]);

  // Mark as viewed when client opens an invoice
  const handleViewInvoice = async (inv: Invoice) => {
    setSelectedInvoice(inv);
    setAiSummary(inv.ai_summary);

    // Mark as viewed if status is "sent"
    if (inv.status === "sent" && !propertyId?.startsWith("mock-")) {
      await (supabase.from("invoices" as any) as any).update({ status: "viewed" }).eq("id", inv.id);
      loadData();
    }

    // Generate AI summary if not cached
    if (!inv.ai_summary && !propertyId?.startsWith("mock-")) {
      setSummaryLoading(true);
      try {
        const invLineItems = lineItems.filter(l => l.invoice_id === inv.id);
        const totalPaid = paymentsPosted.filter(p => p.invoice_id === inv.id).reduce((s, p) => s + Number(p.amount), 0);
        const { data, error } = await supabase.functions.invoke("ai-invoice-assistant", {
          body: {
            task: "invoice_summary",
            context: {
              invoiceTitle: inv.title || inv.description,
              description: inv.description,
              lineItems: invLineItems.map(l => ({ description: l.description, total: l.total })),
              total: inv.total,
              balanceDue: inv.balance_due,
              dueDate: inv.due_date,
              totalPaid,
            },
          },
        });
        if (!error && data?.summary) {
          setAiSummary(data.summary);
          // Cache it
          await (supabase.from("invoices" as any) as any).update({ ai_summary: data.summary }).eq("id", inv.id);
        }
      } catch {
        // Silent fail
      } finally {
        setSummaryLoading(false);
      }
    }
  };

  // Computed values
  const balance = useMemo(() => invoices.reduce((s, i) => s + Number(i.balance_due || 0), 0), [invoices]);
  const totalPaid = useMemo(() => paymentsPosted.reduce((s, p) => s + Number(p.amount), 0) + invoices.filter(i => i.status === "paid" && propertyId?.startsWith("mock-")).reduce((s, i) => s + Number(i.total), 0), [invoices, paymentsPosted, propertyId]);
  const nextPayment = useMemo(() => {
    return invoices
      .filter(i => i.due_date && Number(i.balance_due) > 0 && i.status !== "paid" && i.status !== "draft")
      .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())[0] || null;
  }, [invoices]);

  const visibleInvoices = useMemo(() => invoices.filter(i => i.status !== "draft"), [invoices]);

  // ─── DETAIL VIEW ───
  if (selectedInvoice) {
    const inv = invoices.find(i => i.id === selectedInvoice.id) || selectedInvoice;
    const lis = lineItems.filter(l => l.invoice_id === inv.id).sort((a, b) => a.sort_order - b.sort_order);
    const cos = changeOrders.filter(c => c.invoice_id === inv.id && c.status === "approved");
    const ps = paymentsPosted.filter(p => p.invoice_id === inv.id);
    const coTotal = cos.reduce((s, c) => s + Number(c.amount), 0);
    const paidTotal = ps.reduce((s, p) => s + Number(p.amount), 0);

    return (
      <div>
        <section className="text-center py-8 md:py-12 px-6 md:px-20 max-w-4xl mx-auto">
          <button onClick={() => setSelectedInvoice(null)} className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent hover:text-accent/80 transition-colors mb-4 inline-block">
            ← Back to Payments
          </button>
          <h1 className="font-display text-2xl md:text-3xl text-foreground mb-2">
            {inv.type === "estimate" ? "Estimate" : "Invoice"} {inv.invoice_number || ""}
          </h1>
          <p className="font-sans text-base text-muted-foreground">{inv.title || inv.description}</p>
          <Badge className={`mt-3 ${statusColors[inv.status] || "bg-muted"}`}>{inv.status.replace("_", " ").toUpperCase()}</Badge>
        </section>

        <div className="max-w-[900px] mx-auto px-6 md:px-20 pb-16 flex flex-col gap-8">
          {/* AI Summary Callout */}
          {(aiSummary || summaryLoading) && (
            <div className="bg-accent/10 border border-accent/30 rounded-lg p-5">
              {summaryLoading ? (
                <p className="font-sans text-sm text-muted-foreground animate-pulse">Generating summary...</p>
              ) : (
                <p className="font-sans text-sm text-foreground leading-relaxed">{aiSummary}</p>
              )}
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Issue Date</p>
              <p className="font-sans text-sm mt-1">{inv.issue_date ? format(new Date(inv.issue_date), "MMM d, yyyy") : "—"}</p>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Due Date</p>
              <p className={`font-sans text-sm mt-1 ${inv.due_date && isPast(new Date(inv.due_date)) && Number(inv.balance_due) > 0 ? "text-destructive font-medium" : ""}`}>
                {inv.due_date ? format(new Date(inv.due_date), "MMM d, yyyy") : "—"}
              </p>
            </div>
          </div>

          {/* Line Items */}
          {lis.length > 0 && (
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent mb-4">Line Items</p>
              <div className={`${cardBase} cursor-default`}>
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground text-left pb-3 border-b border-border">Description</th>
                      <th className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground text-right pb-3 border-b border-border">Qty</th>
                      <th className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground text-right pb-3 border-b border-border">Price</th>
                      <th className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground text-right pb-3 border-b border-border">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lis.map(li => (
                      <tr key={li.id}>
                        <td className="text-sm font-sans py-3 border-b border-border/50">{li.description}</td>
                        <td className="text-sm font-sans py-3 border-b border-border/50 text-right text-muted-foreground">{li.quantity}</td>
                        <td className="text-sm font-sans py-3 border-b border-border/50 text-right text-muted-foreground">{fmt(Number(li.unit_price))}</td>
                        <td className="text-sm font-sans py-3 border-b border-border/50 text-right font-medium">{fmt(Number(li.total))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Change Orders */}
          {cos.length > 0 && (
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent mb-4">Change Orders</p>
              <div className="space-y-2">
                {cos.map(co => (
                  <div key={co.id} className={`${cardBase} cursor-default flex-row items-center justify-between`}>
                    <div>
                      <p className="font-sans text-sm font-medium">{co.title}</p>
                      {co.description && <p className="font-sans text-xs text-muted-foreground">{co.description}</p>}
                    </div>
                    <span className="font-sans text-sm font-medium">{fmt(Number(co.amount))}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payments Received */}
          {ps.length > 0 && (
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent mb-4">Payments Received</p>
              <div className="space-y-2">
                {ps.map(p => (
                  <div key={p.id} className={`${cardBase} cursor-default flex-row items-center justify-between`}>
                    <div>
                      <p className="font-sans text-sm">{format(new Date(p.payment_date), "MMM d, yyyy")} — {p.method}</p>
                      {p.notes && <p className="font-sans text-xs text-muted-foreground">{p.notes}</p>}
                    </div>
                    <span className="font-sans text-sm font-medium text-green-700">-{fmt(Number(p.amount))}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Financial Summary */}
          <div className={`${cardBase} cursor-default bg-muted/30`}>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent mb-3">Summary</p>
            <div className="space-y-2 text-sm font-sans">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{fmt(Number(inv.subtotal))}</span></div>
              {coTotal > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Change Orders</span><span>{fmt(coTotal)}</span></div>}
              <div className="flex justify-between border-t border-border pt-2"><span className="font-medium">Total</span><span className="font-medium">{fmt(Number(inv.total))}</span></div>
              {paidTotal > 0 && <div className="flex justify-between text-green-700"><span>Payments</span><span>-{fmt(paidTotal)}</span></div>}
              <div className="flex justify-between border-t border-border pt-2">
                <span className="font-display text-lg">Balance Due</span>
                <span className={`font-display text-lg ${Number(inv.balance_due) > 0 ? "text-destructive" : "text-green-700"}`}>{fmt(Number(inv.balance_due))}</span>
              </div>
            </div>
            {Number(inv.balance_due) > 0 && inv.status !== "draft" && (
              <PayNowButton invoice={inv} />
            )}
          </div>

          {inv.notes && (
            <div className={`${cardBase} cursor-default`}>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-2">Notes</p>
              <p className="font-sans text-sm text-muted-foreground">{inv.notes}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── MAIN VIEW ───
  return (
    <div>
      {/* Hero */}
      <section className="text-center py-12 md:py-16 px-6 md:px-20 max-w-4xl mx-auto">
        <h1 className="font-display text-3xl md:text-[36px] text-foreground mb-3">Payments & Invoices</h1>
        <p className="font-sans text-base text-muted-foreground">
          Manage your account and review transaction history with Home Clarity Hub.
        </p>
      </section>

      <div className="max-w-[1400px] mx-auto px-6 md:px-20 pb-16 flex flex-col gap-10">

        {/* Financial Status Cards */}
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent mb-6">Financial Status</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className={`${cardBase} border-l-[3px] border-l-accent cursor-default`}>
              <Receipt className="w-5 h-5 text-accent" />
              <h2 className="font-display text-xl text-foreground mb-1">Current Balance</h2>
              <p className="font-sans text-sm text-muted-foreground">Outstanding balance</p>
              <p className="font-display text-3xl text-foreground mt-2">{loading ? "..." : fmt(balance)}</p>
              {balance > 0 ? (
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-accent">
                  {visibleInvoices.filter(i => Number(i.balance_due) > 0).length} pending
                </span>
              ) : (
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">All clear</span>
              )}
            </div>
            <div className={`${cardBase} cursor-default`}>
              <ShieldCheck className="w-5 h-5 text-accent" />
              <h2 className="font-display text-xl text-foreground mb-1">Total Paid</h2>
              <p className="font-sans text-sm text-muted-foreground">Payments to date</p>
              <p className="font-display text-3xl text-foreground mt-2">{loading ? "..." : fmt(totalPaid)}</p>
            </div>
            <div className={`${cardBase} cursor-default`}>
              <Calendar className="w-5 h-5 text-accent" />
              <h2 className="font-display text-xl text-foreground mb-1">Next Payment</h2>
              <p className="font-sans text-sm text-muted-foreground">Upcoming due date</p>
              {nextPayment ? (
                <>
                  <p className="font-display text-3xl text-foreground mt-2">{fmt(Number(nextPayment.balance_due))}</p>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                    Due {format(new Date(nextPayment.due_date!), "MMM d")}
                  </span>
                </>
              ) : (
                <p className="font-sans text-sm text-muted-foreground mt-2">None scheduled</p>
              )}
            </div>
          </div>
        </div>

        {/* Tabs: Invoices & Estimates / Transaction History */}
        <Tabs defaultValue="invoices">
          <TabsList className="bg-muted/50 border border-border">
            <TabsTrigger value="invoices" className="font-sans text-sm">Invoices & Estimates</TabsTrigger>
            <TabsTrigger value="history" className="font-sans text-sm">Transaction History</TabsTrigger>
          </TabsList>

          <TabsContent value="invoices" className="mt-6">
            <div className={`${cardBase} cursor-default`}>
              {loading ? (
                <p className="font-sans text-sm text-muted-foreground">Loading...</p>
              ) : visibleInvoices.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="No Invoices Yet"
                  description="Your invoices and estimates will appear here once your advisor creates them."
                />
              ) : (
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground text-left pb-4 border-b border-border">Invoice</th>
                      <th className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground text-left pb-4 border-b border-border hidden sm:table-cell">Due Date</th>
                      <th className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground text-right pb-4 border-b border-border">Balance</th>
                      <th className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground text-right pb-4 border-b border-border">Status</th>
                      <th className="pb-4 border-b border-border w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleInvoices.map(inv => {
                      const isOverdue = inv.status === "overdue";
                      return (
                        <tr key={inv.id} className={`${isOverdue ? "bg-destructive/5" : ""} hover:bg-muted/30 cursor-pointer transition-colors`} onClick={() => handleViewInvoice(inv)}>
                          <td className={`text-sm py-5 border-b border-border ${isOverdue ? "text-destructive font-medium" : "text-foreground"}`}>
                            <div>
                              <span className="font-mono text-[10px] text-muted-foreground">{inv.invoice_number || ""} </span>
                              {inv.title || inv.description}
                            </div>
                          </td>
                          <td className="text-sm text-muted-foreground py-5 border-b border-border hidden sm:table-cell">
                            {inv.due_date ? format(new Date(inv.due_date), "MMM d, yyyy") : "—"}
                          </td>
                          <td className={`text-sm py-5 border-b border-border text-right font-medium ${isOverdue ? "text-destructive" : Number(inv.balance_due) > 0 ? "text-foreground" : "text-green-700"}`}>
                            {fmt(Number(inv.balance_due))}
                          </td>
                          <td className="text-sm py-5 border-b border-border text-right">
                            <Badge className={`text-[10px] ${statusColors[inv.status] || "bg-muted"}`}>
                              {inv.status.replace("_", " ")}
                            </Badge>
                          </td>
                          <td className="py-5 border-b border-border">
                            <Eye className="w-4 h-4 text-muted-foreground/40" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <div className={`${cardBase} cursor-default`}>
              {loading ? (
                <p className="font-sans text-sm text-muted-foreground">Loading...</p>
              ) : paymentsPosted.length === 0 && invoices.filter(i => i.status === "paid").length === 0 ? (
                <div className="flex flex-col items-center text-center py-8 gap-3">
                  <List className="w-6 h-6 text-accent" />
                  <h3 className="font-display text-xl text-foreground">No Transactions Yet</h3>
                  <p className="font-sans text-sm text-muted-foreground max-w-[40ch]">Your payment history will appear here.</p>
                </div>
              ) : (
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground text-left pb-4 border-b border-border">Date</th>
                      <th className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground text-left pb-4 border-b border-border">Description</th>
                      <th className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground text-left pb-4 border-b border-border hidden sm:table-cell">Method</th>
                      <th className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground text-right pb-4 border-b border-border">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentsPosted
                      .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())
                      .map(p => {
                        const inv = invoices.find(i => i.id === p.invoice_id);
                        return (
                          <tr key={p.id}>
                            <td className="text-sm font-sans py-4 border-b border-border text-muted-foreground">{format(new Date(p.payment_date), "MMM d, yyyy")}</td>
                            <td className="text-sm font-sans py-4 border-b border-border">Payment — {inv?.title || inv?.description || "Invoice"}</td>
                            <td className="text-sm font-sans py-4 border-b border-border text-muted-foreground hidden sm:table-cell capitalize">{p.method}</td>
                            <td className="text-sm font-sans py-4 border-b border-border text-right font-medium text-green-700">{fmt(Number(p.amount))}</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent mb-6">Quick Actions</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <button onClick={() => onTabChange?.("contacts")} className={cardBase}>
              <MessageCircle className="w-5 h-5 text-accent" />
              <h2 className="font-display text-xl text-foreground mb-1">Contact About Billing</h2>
              <p className="font-sans text-sm text-muted-foreground">Reach your HBC advisor about account questions</p>
              <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-accent self-end transition-colors" />
            </button>
            <button onClick={() => onTabChange?.("report")} className={cardBase}>
              <FileText className="w-5 h-5 text-accent" />
              <h2 className="font-display text-xl text-foreground mb-1">View Your Report</h2>
              <p className="font-sans text-sm text-muted-foreground">Review the services included in your membership</p>
              <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-accent self-end transition-colors" />
            </button>
            {nextPayment ? (
              <PayNowButton invoice={nextPayment} />
            ) : (
              <div className={`${cardBase} cursor-default`}>
                <CreditCard className="w-5 h-5 text-accent" />
                <h2 className="font-display text-xl text-foreground mb-1">Make a Payment</h2>
                <p className="font-sans text-sm text-muted-foreground">No outstanding invoices — you're all set!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentsTab;
