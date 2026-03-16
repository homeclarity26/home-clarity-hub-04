import { useState, useEffect, useMemo } from "react";
import { Receipt, ShieldCheck, Calendar, List, MessageCircle, FileText, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface PaymentsTabProps {
  propertyId?: string;
  onTabChange?: (tab: string) => void;
}

interface Invoice {
  id: string;
  description: string;
  amount: number;
  status: string;
  due_date: string | null;
  paid_date: string | null;
  created_at: string;
}

const cardBase = "group bg-card rounded-lg p-8 shadow-hbc-sm hover:shadow-hbc-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col gap-3 border border-border text-left w-full";

const PaymentsTab = ({ propertyId, onTabChange }: PaymentsTabProps) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!propertyId) { setLoading(false); return; }

    // Demo data for dev bypass
    if (propertyId.startsWith("mock-")) {
      setInvoices([
        { id: "inv-1", description: "Home Clarity Report — Johnson Residence", amount: 2500, status: "paid", due_date: "2026-01-15", paid_date: "2026-01-12", created_at: "2026-01-01T00:00:00Z" },
        { id: "inv-2", description: "Annual Membership — Year 1", amount: 750, status: "paid", due_date: "2026-02-01", paid_date: "2026-01-28", created_at: "2026-01-20T00:00:00Z" },
        { id: "inv-3", description: "Furnace Consultation & Vendor Coordination", amount: 350, status: "pending", due_date: "2026-04-01", paid_date: null, created_at: "2026-03-10T00:00:00Z" },
      ]);
      setLoading(false);
      return;
    }

    supabase.from("invoices").select("*").eq("property_id", propertyId).order("created_at", { ascending: false })
      .then(({ data }) => { if (data) setInvoices(data as Invoice[]); setLoading(false); });
  }, [propertyId]);

  const balance = useMemo(() => {
    const computed = invoices
      .filter((i) => i.status === "pending" || i.status === "overdue")
      .reduce((sum, i) => sum + Number(i.amount), 0);
    return computed;
  }, [invoices]);

  const totalPaid = useMemo(() => {
    return invoices.filter((i) => i.status === "paid").reduce((sum, i) => sum + Number(i.amount), 0);
  }, [invoices]);

  const nextPayment = useMemo(() => {
    const pending = invoices.filter((i) => i.due_date && (i.status === "pending" || i.status === "overdue"))
      .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime());
    return pending[0] || null;
  }, [invoices]);

  const fmt = (amount: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

  const statusDot: Record<string, string> = {
    pending: "bg-accent",
    paid: "bg-foreground",
    overdue: "bg-destructive",
  };

  return (
    <div>
      {/* Hero */}
      <section className="text-center py-12 md:py-16 px-6 md:px-20 max-w-4xl mx-auto">
        <h1 className="font-display text-3xl md:text-[36px] text-foreground mb-3">Payments & Financial History</h1>
        <p className="font-sans text-base text-muted-foreground">
          Manage your account and review transaction history with Home Clarity Hub.
        </p>
      </section>

      <div className="max-w-[1400px] mx-auto px-6 md:px-20 pb-16 flex flex-col gap-10">

        {/* Row 1: Financial Status */}
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent mb-6">Financial Status</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className={`${cardBase} border-l-[3px] border-l-accent cursor-default`}>
              <Receipt className="w-5 h-5 text-accent" />
              <h2 className="font-display text-xl text-foreground mb-1">Current Balance</h2>
              <p className="font-sans text-sm text-muted-foreground">Outstanding balance with HBC</p>
              <p className="font-display text-3xl text-foreground mt-2">{loading ? "..." : fmt(balance)}</p>
              {balance > 0 ? (
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-accent">
                  {invoices.filter((i) => i.status === "pending").length || 1} pending
                </span>
              ) : (
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                  No outstanding balance
                </span>
              )}
            </div>

            <div className={`${cardBase} cursor-default`}>
              <ShieldCheck className="w-5 h-5 text-accent" />
              <h2 className="font-display text-xl text-foreground mb-1">Total Paid</h2>
              <p className="font-sans text-sm text-muted-foreground">Total payments made to date</p>
              <p className="font-display text-3xl text-foreground mt-2">{loading ? "..." : fmt(totalPaid)}</p>
            </div>

            <div className={`${cardBase} cursor-default`}>
              <Calendar className="w-5 h-5 text-accent" />
              <h2 className="font-display text-xl text-foreground mb-1">Next Payment</h2>
              <p className="font-sans text-sm text-muted-foreground">Upcoming scheduled payment</p>
              {nextPayment ? (
                <>
                  <p className="font-display text-3xl text-foreground mt-2">{fmt(nextPayment.amount)}</p>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                    Due {new Date(nextPayment.due_date!).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </>
              ) : (
                <p className="font-sans text-sm text-muted-foreground mt-2">None scheduled</p>
              )}
            </div>
          </div>
        </div>

        {/* Row 2: Transaction History */}
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent mb-6">Transaction History</p>
          <div className={`${cardBase} cursor-default`}>
            {loading ? (
              <p className="font-sans text-sm text-muted-foreground">Loading...</p>
            ) : invoices.length === 0 ? (
              <div className="flex flex-col items-center text-center py-8 gap-3">
                <List className="w-6 h-6 text-accent" />
                <h3 className="font-display text-xl text-foreground">No Transactions Yet</h3>
                <p className="font-sans text-sm text-muted-foreground max-w-[40ch]">
                  Your payment history will appear here once transactions are recorded.
                </p>
              </div>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground text-left pb-4 border-b border-border">Date</th>
                    <th className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground text-left pb-4 border-b border-border">Description</th>
                    <th className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground text-right pb-4 border-b border-border">Amount</th>
                    <th className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground text-right pb-4 border-b border-border">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id}>
                      <td className="text-sm text-foreground py-5 border-b border-border">
                        {new Date(inv.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                      <td className="text-sm text-foreground py-5 border-b border-border">{inv.description}</td>
                      <td className="text-sm text-foreground py-5 border-b border-border text-right">{fmt(inv.amount)}</td>
                      <td className="text-sm py-5 border-b border-border text-right">
                        <span className="inline-flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${statusDot[inv.status] || "bg-muted"}`} />
                          {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Row 3: Quick Actions */}
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent mb-6">Quick Actions</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentsTab;
