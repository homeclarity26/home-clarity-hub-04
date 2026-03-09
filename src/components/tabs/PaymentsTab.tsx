import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface PaymentsTabProps {
  propertyId?: string;
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

const PaymentsTab = ({ propertyId }: PaymentsTabProps) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!propertyId) {
      setLoading(false);
      return;
    }
    supabase
      .from("invoices")
      .select("*")
      .eq("property_id", propertyId)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setInvoices(data as Invoice[]);
        setLoading(false);
      });
  }, [propertyId]);

  const balance = useMemo(() => {
    return invoices
      .filter((i) => i.status === "pending" || i.status === "overdue")
      .reduce((sum, i) => sum + Number(i.amount), 0);
  }, [invoices]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

  const statusDot: Record<string, string> = {
    pending: "bg-accent",
    paid: "bg-foreground",
    overdue: "bg-destructive",
  };

  return (
    <div>
      <div className="py-16 md:py-24 px-6 md:px-20 max-w-[1400px] mx-auto">
        <h1 className="font-display text-3xl text-foreground mb-6">Payments & Financial History</h1>
        <p className="text-base text-muted-foreground max-w-[60ch]">
          Manage your account and review transaction history with Hometown Builders Club.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 max-w-[1400px] mx-auto px-6 md:px-20 pb-16">
        <Card className="p-8 md:p-10 shadow-hbc-sm hover:shadow-hbc-md transition-all hover:-translate-y-0.5">
          <h2 className="font-display text-2xl text-foreground mb-6">Current Balance</h2>
          <p className="font-display text-4xl text-foreground mb-4">
            {loading ? "..." : formatCurrency(balance)}
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            {balance > 0
              ? `${invoices.filter((i) => i.status === "pending").length} pending invoice(s)`
              : "No outstanding balance"}
          </p>
          {balance > 0 && (
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              Make Payment
            </Button>
          )}
        </Card>

        <Card className="md:col-span-1 p-8 md:p-10 shadow-hbc-sm hover:shadow-hbc-md transition-all hover:-translate-y-0.5">
          <h2 className="font-display text-2xl text-foreground mb-6">Transaction History</h2>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : invoices.length === 0 ? (
            <p className="text-sm text-muted-foreground">No transactions yet.</p>
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
                    <td className="text-sm text-foreground py-5 border-b border-border text-right">{formatCurrency(inv.amount)}</td>
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
        </Card>
      </div>
    </div>
  );
};

export default PaymentsTab;
