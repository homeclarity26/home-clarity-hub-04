import { useState, useEffect, useMemo, useCallback } from "react";
import { Receipt, ShieldCheck, Calendar, List, MessageCircle, FileText, ChevronRight, Eye, CreditCard, Loader2, ChevronDown, ChevronUp, Send } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, isPast, differenceInDays } from "date-fns";
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
}

interface PaymentPosted {
  id: string;
  invoice_id: string;
  amount: number;
  payment_date: string;
  method: string;
  notes: string | null;
}

const PayNowButton = ({ invoice, fullWidth = false }: { invoice: Invoice; fullWidth?: boolean }) => {
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
    <Button
      onClick={handlePay}
      disabled={loading}
      className={`gap-2 font-sans bg-accent hover:bg-accent/90 text-white ${fullWidth ? "w-full" : ""}`}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
      {loading ? "Redirecting..." : `Pay ${fmt(Number(invoice.balance_due))} Now`}
    </Button>
  );
};

const cardBase = "group bg-card rounded-lg p-5 sm:p-8 shadow-hbc-sm hover:shadow-hbc-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col gap-3 border border-border text-left w-full";
const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-blue-100 text-blue-800",
  viewed: "bg-purple-100 text-purple-800",
  partially_paid: "bg-amber-100 text-amber-800",
  paid: "bg-green-100 text-green-800",
  overdue: "bg-red-100 text-red-800",
  pending: "bg-amber-100 text-amber-800",
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
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [aiQuestion, setAiQuestion] = useState("");

  const loadData = useCallback(async () => {
    if (!propertyId) { setLoading(false); return; }

    if (propertyId.startsWith("mock-")) {
      setInvoices([
        { id: "inv-1", invoice_number: "HBC-0001", title: "Home Clarity Report: Johnson Residence", type: "invoice", description: "Home Clarity Report", amount: 2500, status: "paid", due_date: "2026-01-15", paid_date: "2026-01-12", subtotal: 2500, tax: 0, total: 2500, balance_due: 0, notes: null, ai_summary: null, issue_date: "2026-01-01", created_at: "2026-01-01T00:00:00Z" },
        { id: "inv-2", invoice_number: "HBC-0002", title: "Annual Membership: Year 1", type: "invoice", description: "Annual Membership", amount: 750, status: "paid", due_date: "2026-02-01", paid_date: "2026-01-28", subtotal: 750, tax: 0, total: 750, balance_due: 0, notes: null, ai_summary: null, issue_date: "2026-01-20", created_at: "2026-01-20T00:00:00Z" },
        { id: "inv-3", invoice_number: "HBC-0003", title: "Furnace Consultation & Vendor Coordination", type: "invoice", description: "Furnace Consultation", amount: 350, status: "sent", due_date: "2026-04-01", paid_date: null, subtotal: 350, tax: 0, total: 350, balance_due: 350, notes: null, ai_summary: null, issue_date: "2026-03-10", created_at: "2026-03-10T00:00:00Z" },
      ]);
      setLoading(false);
      return;
    }

    try {
      // allSettled so one failing query doesn't take the rest down.
      const [invRes, liRes, coRes, pRes] = await Promise.allSettled([
        supabase.from("invoices").select("*").eq("property_id", propertyId).order("created_at", { ascending: false }),
        supabase.from("invoice_line_items").select("*"),
        supabase.from("change_orders").select("*"),
        supabase.from("payments_posted").select("*"),
      ]);
      if (invRes.status === "fulfilled" && invRes.value?.data) setInvoices(invRes.value.data);
      if (liRes.status === "fulfilled" && liRes.value?.data) setLineItems(liRes.value.data);
      if (coRes.status === "fulfilled" && coRes.value?.data) setChangeOrders(coRes.value.data);
      if (pRes.status === "fulfilled" && pRes.value?.data) setPaymentsPosted(pRes.value.data);
      if (invRes.status === "rejected") {
        console.error("Failed to load invoices:", invRes.reason);
        toast.error("Couldn't load invoices. Please refresh.");
      }
    } catch (err) {
      console.error("PaymentsTab load error:", err);
      toast.error("Couldn't load payments data.");
    } finally {
      setLoading(false);
    }
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
    setSummaryError(null);

    if (inv.status === "sent" && !propertyId?.startsWith("mock-")) {
      await supabase.from("invoices").update({ status: "viewed" }).eq("id", inv.id);
      loadData();
    }

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
        if (error) {
          console.error("ai-invoice-assistant summary error:", error);
          setSummaryError("AI summary didn't load. You can still read the line items below.");
        } else if (data?.summary) {
          setAiSummary(data.summary);
          await supabase.from("invoices").update({ ai_summary: data.summary }).eq("id", inv.id);
        } else {
          setSummaryError("AI summary didn't load. You can still read the line items below.");
        }
      } catch (err) {
        console.error("ai-invoice-assistant summary failed:", err);
        setSummaryError("AI summary didn't load. You can still read the line items below.");
      } finally {
        setSummaryLoading(false);
      }
    }
  };

  // C7 — Hand off invoice questions to the consolidated ConciergePanel
  // (hbc-agent backend) instead of the legacy chat-assistant function.
  // We prepend invoice context so the agent can answer specifically;
  // the user can edit before sending.
  const handleAskConcierge = () => {
    if (!aiQuestion.trim() || !nextPayment) return;
    const ctx = `Re: invoice "${nextPayment.title || nextPayment.description}" (balance ${fmt(Number(nextPayment.balance_due))}${nextPayment.due_date ? `, due ${format(new Date(nextPayment.due_date), "MMM d, yyyy")}` : ""}). ${aiQuestion.trim()}`;
    window.dispatchEvent(
      new CustomEvent("concierge:open", { detail: { prompt: ctx } })
    );
    setAiQuestion("");
  };

  const handleRequestACH = async () => {
    if (!propertyId || propertyId.startsWith("mock-")) {
      toast.success("ACH request sent. We'll be in touch with bank transfer details.");
      return;
    }
    try {
      await supabase.functions.invoke("send-notification-email", {
        body: {
          type: "ach_request",
          propertyId,
          message: "Client requested ACH payment details for invoice.",
        },
      });
      toast.success("ACH request sent. We'll respond shortly with bank transfer details.");
    } catch (err) {
      console.error("ACH request failed:", err);
      toast.error("Could not send ACH request. Please try again or message your advisor.");
    }
  };

  // Computed values
  const visibleInvoices = useMemo(() => invoices.filter(i => i.status !== "draft"), [invoices]);

  const approvedCOs = useMemo(() => changeOrders.filter(co => co.status === "approved"), [changeOrders]);
  const totalCOAmount = useMemo(() => approvedCOs.reduce((s, co) => s + Number(co.amount), 0), [approvedCOs]);
  const originalContractTotal = useMemo(() => {
    return invoices.reduce((s, inv) => s + Number(inv.original_total ?? inv.subtotal), 0);
  }, [invoices]);
  const grandTotal = originalContractTotal + totalCOAmount;
  const totalPaid = useMemo(() =>
    paymentsPosted.reduce((s, p) => s + Number(p.amount), 0) +
    (propertyId?.startsWith("mock-") ? invoices.filter(i => i.status === "paid").reduce((s, i) => s + Number(i.total), 0) : 0),
    [invoices, paymentsPosted, propertyId]
  );
  const balance = useMemo(() => invoices.reduce((s, i) => s + Number(i.balance_due || 0), 0), [invoices]);

  const nextPayment = useMemo(() => {
    return invoices
      .filter(i => i.due_date && Number(i.balance_due) > 0 && i.status !== "paid" && i.status !== "draft")
      .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())[0] || null;
  }, [invoices]);

  const balanceStatus = useMemo(() => {
    if (balance === 0) return { label: "Up to Date", color: "text-green-600", bg: "bg-green-50 border-green-200" };
    const overdueInv = invoices.find(i => i.due_date && isPast(new Date(i.due_date)) && Number(i.balance_due) > 0);
    if (overdueInv) return { label: "Overdue", color: "text-[#B5450B]", bg: "bg-red-50 border-red-200" };
    return { label: "Payment Due", color: "text-amber-600", bg: "bg-amber-50 border-amber-200" };
  }, [balance, invoices]);

  const nextDueDays = useMemo(() => {
    if (!nextPayment?.due_date) return null;
    return differenceInDays(new Date(nextPayment.due_date), new Date());
  }, [nextPayment]);

  // ─── DETAIL VIEW ───
  if (selectedInvoice) {
    const inv = invoices.find(i => i.id === selectedInvoice.id) || selectedInvoice;
    const lis = lineItems.filter(l => l.invoice_id === inv.id).sort((a, b) => a.sort_order - b.sort_order);
    const cos = changeOrders.filter(c => c.invoice_id === inv.id && c.status === "approved");
    const ps = paymentsPosted.filter(p => p.invoice_id === inv.id);
    const coTotal = cos.reduce((s, c) => s + Number(c.amount), 0);
    const paidTotal = ps.reduce((s, p) => s + Number(p.amount), 0);
    const origTotal = Number(inv.original_total ?? inv.subtotal);

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
          {/* AI Summary */}
          {(aiSummary || summaryLoading || summaryError) && (
            <div className="bg-accent/10 border border-accent/30 rounded-lg p-5">
              {summaryLoading ? (
                <p className="font-sans text-sm text-muted-foreground animate-pulse">Generating summary...</p>
              ) : aiSummary ? (
                <p className="font-sans text-sm text-foreground leading-relaxed">{aiSummary}</p>
              ) : (
                <p className="font-sans text-sm text-muted-foreground">{summaryError}</p>
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
              <p className={`font-sans text-sm mt-1 ${inv.due_date && isPast(new Date(inv.due_date)) && Number(inv.balance_due) > 0 ? "text-[#B5450B] font-medium" : ""}`}>
                {inv.due_date ? format(new Date(inv.due_date), "MMM d, yyyy") : "—"}
              </p>
            </div>
          </div>

          {/* Line Items */}
          {lis.length > 0 && (
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent mb-4">Line Items</p>
              <div className={`${cardBase} cursor-default`}>
                <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-[360px]">
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
                      {co.description && <p className="font-sans text-sm text-muted-foreground">{co.description}</p>}
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
                      <p className="font-sans text-sm">{format(new Date(p.payment_date), "MMM d, yyyy")}, {p.method}</p>
                      {p.notes && <p className="font-sans text-sm text-muted-foreground">{p.notes}</p>}
                    </div>
                    <span className="font-sans text-sm font-medium text-green-700">-{fmt(Number(p.amount))}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Enhanced Financial Summary */}
          <div className={`${cardBase} cursor-default bg-muted/30`}>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent mb-3">Summary</p>
            <div className="space-y-2 text-sm font-sans">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Original Contract</span>
                <span>{fmt(origTotal)}</span>
              </div>
              {coTotal > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Change Orders</span>
                  <span>+{fmt(coTotal)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-border pt-2">
                <span className="font-medium">Total</span>
                <span className="font-medium">{fmt(origTotal + coTotal)}</span>
              </div>
              {paidTotal > 0 && (
                <div className="flex justify-between text-green-700">
                  <span>Paid</span>
                  <span>-{fmt(paidTotal)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-border pt-2">
                <span className="font-display text-lg">Balance Due</span>
                <span className={`font-display text-lg ${Number(inv.balance_due) > 0 ? "text-[#B5450B]" : "text-green-700"}`}>{fmt(Number(inv.balance_due))}</span>
              </div>
            </div>
            {Number(inv.balance_due) > 0 && inv.status !== "draft" && (
              <PayNowButton invoice={inv} fullWidth />
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
      {/* Hero — Your Project Balance */}
      <section className="text-center py-12 md:py-16 px-6 md:px-20 max-w-4xl mx-auto">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent mb-3">Your Project Balance</p>
        <p className={`font-display text-5xl md:text-6xl ${balanceStatus.color} mb-3`}>
          {loading ? "..." : fmt(balance)}
        </p>
        <span className={`inline-flex items-center px-4 py-1.5 rounded-full border text-sm font-sans font-medium ${balanceStatus.bg} ${balanceStatus.color}`}>
          {balanceStatus.label}
        </span>
        {nextDueDays !== null && nextDueDays >= 0 && balance > 0 && (
          <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground mt-3">
            Due in {nextDueDays} day{nextDueDays !== 1 ? "s" : ""}
          </p>
        )}
      </section>

      <div className="max-w-[1400px] mx-auto px-6 md:px-20 pb-16 flex flex-col gap-10">

        {/* Current Milestone Card */}
        {nextPayment && (
          <Card className="p-6 md:p-8 shadow-[0_4px_12px_rgba(27,43,77,0.08)] border-l-4 border-accent">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent mb-4">Current Milestone</p>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex-1">
                <h2 className="font-display text-2xl text-foreground mb-1">
                  {nextPayment.title || nextPayment.description}
                </h2>
                {nextPayment.due_date && (
                  <p className="font-sans text-sm text-muted-foreground">
                    Due {format(new Date(nextPayment.due_date), "MMMM d, yyyy")}
                    {nextDueDays !== null && nextDueDays < 7 && nextDueDays >= 0 && (
                      <span className="ml-2 text-amber-600 font-medium">({nextDueDays === 0 ? "due today" : `in ${nextDueDays} days`})</span>
                    )}
                    {nextDueDays !== null && nextDueDays < 0 && (
                      <span className="ml-2 text-[#B5450B] font-medium">(overdue)</span>
                    )}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-start md:items-end gap-3">
                <p className="font-display text-3xl text-foreground">{fmt(Number(nextPayment.balance_due))}</p>
                <PayNowButton invoice={nextPayment} fullWidth />
              </div>
            </div>

            {/* Payment Method Options */}
            <div className="mt-6 pt-6 border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-[#F2EFEB] rounded-lg p-4">
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Check Payable To</p>
                <p className="font-sans text-sm font-medium text-foreground">Hometown Builders Club LLC</p>
                <p className="font-sans text-sm text-muted-foreground mt-1">or AK Renovations</p>
                <p className="font-mono text-[10px] text-muted-foreground mt-2">(330) 203-1331</p>
              </div>
              <div className="bg-[#F2EFEB] rounded-lg p-4 flex flex-col justify-between">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">ACH / Bank Transfer</p>
                  <p className="font-sans text-sm text-muted-foreground">Prefer bank transfer? We'll send you the account details.</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 gap-1.5 text-xs font-sans self-start"
                  onClick={handleRequestACH}
                >
                  <Send className="w-3.5 h-3.5" /> Request ACH Details
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Financial Breakdown */}
        {(originalContractTotal > 0 || totalCOAmount > 0) && (
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent mb-4">Financial Breakdown</p>
            <Card className="p-6 shadow-[0_2px_8px_rgba(27,43,77,0.04)]">
              <div className="space-y-3 text-sm font-sans">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Original Contract</span>
                  <span className="font-medium">{fmt(originalContractTotal)}</span>
                </div>
                {totalCOAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Change Orders</span>
                    <span>+{fmt(totalCOAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-border pt-3">
                  <span className="font-medium">Total</span>
                  <span className="font-medium">{fmt(grandTotal)}</span>
                </div>
                {totalPaid > 0 && (
                  <div className="flex justify-between text-green-700">
                    <span>Paid</span>
                    <span>-{fmt(totalPaid)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-border pt-3">
                  <span className="font-display text-base">Balance Due</span>
                  <span className={`font-display text-base ${balance === 0 ? "text-green-700" : "text-[#B5450B]"}`}>{fmt(balance)}</span>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Tabs: Invoices / Transaction History */}
        <Tabs defaultValue="invoices">
          <TabsList className="bg-muted/50 border border-border">
            <TabsTrigger value="invoices" className="font-sans text-sm">Invoices</TabsTrigger>
            <TabsTrigger value="history" className="font-sans text-sm">Transaction History</TabsTrigger>
          </TabsList>

          <TabsContent value="invoices" className="mt-6">
            {/* Draw Schedule Bar */}
            {visibleInvoices.length >= 2 && (() => {
              const barTotal = visibleInvoices.reduce((s, inv) => s + Number(inv.total), 0);
              if (barTotal <= 0) return null;
              return (
                <div className="mb-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-2">Draw Schedule</p>
                  <div className="flex w-full h-8 rounded-md overflow-hidden border border-border">
                    {visibleInvoices.map((inv) => {
                      const pct = (Number(inv.total) / barTotal) * 100;
                      const isPaid = inv.status === "paid";
                      const isOverdue = inv.status === "overdue" || (inv.status === "sent" && inv.due_date && isPast(new Date(inv.due_date)));
                      const bg = isPaid ? "bg-accent" : isOverdue ? "bg-[hsl(16_86%_39%)]" : "bg-muted";
                      const textColor = isPaid || isOverdue ? "text-white" : "text-muted-foreground";
                      return (
                        <div
                          key={inv.id}
                          className={`${bg} ${textColor} flex items-center justify-center text-[10px] font-mono font-medium transition-all`}
                          style={{ width: `${pct}%` }}
                          title={`${inv.title || inv.invoice_number || "Invoice"}: ${fmt(Number(inv.total))} (${inv.status})`}
                        >
                          {pct > 15 ? fmt(Number(inv.total)) : ""}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
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
                <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-[320px]">
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
                        <tr key={inv.id} className={`${isOverdue ? "bg-red-50/50" : ""} hover:bg-muted/30 cursor-pointer transition-colors`} onClick={() => handleViewInvoice(inv)}>
                          <td className={`text-sm py-5 border-b border-border ${isOverdue ? "text-[#B5450B] font-medium" : "text-foreground"}`}>
                            <div>
                              <span className="font-mono text-[10px] text-muted-foreground">{inv.invoice_number || ""} </span>
                              {inv.title || inv.description}
                            </div>
                          </td>
                          <td className="text-sm text-muted-foreground py-5 border-b border-border hidden sm:table-cell">
                            {inv.due_date ? format(new Date(inv.due_date), "MMM d, yyyy") : "—"}
                          </td>
                          <td className={`text-sm py-5 border-b border-border text-right font-medium ${isOverdue ? "text-[#B5450B]" : Number(inv.balance_due) > 0 ? "text-foreground" : "text-green-700"}`}>
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
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <div className={`${cardBase} cursor-default`}>
              {loading ? (
                <p className="font-sans text-sm text-muted-foreground">Loading...</p>
              ) : paymentsPosted.length === 0 && invoices.filter(i => i.status === "paid").length === 0 ? (
                <EmptyState icon={List} title="No Transactions Yet" description="Your payment history will appear here." />
              ) : (
                <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-[280px]">
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
                            <td className="text-sm font-sans py-4 border-b border-border">Payment: {inv?.title || inv?.description || "Invoice"}</td>
                            <td className="text-sm font-sans py-4 border-b border-border text-muted-foreground hidden sm:table-cell capitalize">{p.method}</td>
                            <td className="text-sm font-sans py-4 border-b border-border text-right font-medium text-green-700">{fmt(Number(p.amount))}</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Payment History Accordion */}
        {paymentsPosted.length > 0 && (
          <div>
            <button
              className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-accent hover:text-accent/80 transition-colors"
              onClick={() => setHistoryExpanded(!historyExpanded)}
            >
              {historyExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              Payment History
              <span className="font-sans text-xs normal-case tracking-normal text-muted-foreground ml-1">
                ({paymentsPosted.length} record{paymentsPosted.length !== 1 ? "s" : ""})
              </span>
            </button>
            {historyExpanded && (
              <Card className="mt-4 p-5 shadow-[0_2px_8px_rgba(27,43,77,0.04)]">
                <div className="space-y-3">
                  {[...paymentsPosted]
                    .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())
                    .map(p => {
                      const inv = invoices.find(i => i.id === p.invoice_id);
                      return (
                        <div key={p.id} className="flex items-center justify-between py-2 border-b border-border/50">
                          <div>
                            <p className="font-sans text-sm">{format(new Date(p.payment_date), "MMMM d, yyyy")}</p>
                            <p className="font-sans text-sm text-muted-foreground capitalize">{p.method}, {inv?.title || "Invoice"}</p>
                          </div>
                          <span className="font-sans text-sm font-medium text-green-600">{fmt(Number(p.amount))}</span>
                        </div>
                      );
                    })}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* AI Payment Assistant */}
        {nextPayment && (
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent mb-4">Questions about your invoice?</p>
            <Card className="p-5 shadow-[0_2px_8px_rgba(27,43,77,0.04)]">
              <div className="flex gap-3">
                <Input
                  value={aiQuestion}
                  onChange={e => setAiQuestion(e.target.value)}
                  placeholder="e.g. What does this payment cover?"
                  className="font-sans text-sm flex-1"
                  onKeyDown={e => e.key === "Enter" && handleAskConcierge()}
                />
                <Button
                  size="sm"
                  onClick={handleAskConcierge}
                  disabled={!aiQuestion.trim()}
                  className="bg-accent hover:bg-accent/90 text-white font-sans flex-shrink-0"
                >
                  Ask Bobby
                </Button>
              </div>
            </Card>
          </div>
        )}

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
              <div className={`${cardBase} cursor-default`}>
                <CreditCard className="w-5 h-5 text-accent" />
                <h2 className="font-display text-xl text-foreground mb-1">Make a Payment</h2>
                <p className="font-sans text-sm text-muted-foreground">{fmt(Number(nextPayment.balance_due))} due on {nextPayment.due_date ? format(new Date(nextPayment.due_date), "MMM d") : "—"}</p>
                <PayNowButton invoice={nextPayment} fullWidth />
              </div>
            ) : (
              <div className={`${cardBase} cursor-default`}>
                <CreditCard className="w-5 h-5 text-accent" />
                <h2 className="font-display text-xl text-foreground mb-1">Make a Payment</h2>
                <p className="font-sans text-sm text-muted-foreground">No outstanding invoices. You're all set!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentsTab;
