import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { DollarSign, TrendingUp, Percent, Receipt } from "lucide-react";
import { format, subMonths, startOfMonth } from "date-fns";

function useRevenueData() {
  return useQuery({
    queryKey: ["revenue-analytics"],
    queryFn: async () => {
      const [{ data: invoices }, { data: payments }] = await Promise.all([
        supabase.from("invoices").select("total, balance_due, status, created_at, due_date, property_id"),
        supabase.from("payments_posted").select("amount, payment_date"),
      ]);

      // Monthly revenue chart (last 12 months)
      const months: { month: string; invoiced: number; collected: number }[] = [];
      const now = new Date();
      for (let i = 11; i >= 0; i--) {
        const d = subMonths(now, i);
        const key = format(d, "yyyy-MM");
        const label = format(d, "MMM");
        const monthInvoiced = (invoices || [])
          .filter((inv) => inv.created_at?.startsWith(key))
          .reduce((s, inv) => s + Number(inv.total), 0);
        const monthCollected = (payments || [])
          .filter((p) => p.payment_date?.startsWith(key))
          .reduce((s, p) => s + Number(p.amount), 0);
        months.push({ month: label, invoiced: monthInvoiced, collected: monthCollected });
      }

      // KPIs
      const totalInvoiced = (invoices || []).reduce((s, i) => s + Number(i.total), 0);
      const totalCollected = (payments || []).reduce((s, p) => s + Number(p.amount), 0);
      const collectionRate = totalInvoiced > 0 ? Math.round((totalCollected / totalInvoiced) * 100) : 0;
      const invoiceCount = (invoices || []).length;
      const avgInvoiceValue = invoiceCount > 0 ? Math.round(totalInvoiced / invoiceCount) : 0;

      // Revenue by client (top 5)
      const byClient: Record<string, number> = {};
      (invoices || []).forEach((inv) => {
        byClient[inv.property_id] = (byClient[inv.property_id] || 0) + Number(inv.total);
      });

      return { months, totalInvoiced, totalCollected, collectionRate, avgInvoiceValue };
    },
  });
}

const fmt = (n: number) => (n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n.toFixed(0)}`);

const RevenueAnalytics = () => {
  const { data, isLoading } = useRevenueData();

  if (isLoading || !data) return null;

  return (
    <Card className="p-5">
      <h2 className="text-sm font-sans font-semibold text-foreground mb-4">Revenue Analytics</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-primary/10">
            <DollarSign className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-lg font-mono font-bold text-foreground">{fmt(data.totalInvoiced)}</p>
            <p className="text-[10px] font-sans text-muted-foreground">Total Invoiced</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-emerald-500/10">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <p className="text-lg font-mono font-bold text-foreground">{fmt(data.totalCollected)}</p>
            <p className="text-[10px] font-sans text-muted-foreground">Total Collected</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-accent/10">
            <Percent className="w-4 h-4 text-accent" />
          </div>
          <div>
            <p className="text-lg font-mono font-bold text-foreground">{data.collectionRate}%</p>
            <p className="text-[10px] font-sans text-muted-foreground">Collection Rate</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-muted">
            <Receipt className="w-4 h-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-lg font-mono font-bold text-foreground">{fmt(data.avgInvoiceValue)}</p>
            <p className="text-[10px] font-sans text-muted-foreground">Avg Invoice</p>
          </div>
        </div>
      </div>

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.months} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="month" tick={{ fontSize: 10, fontFamily: "var(--font-sans)" }} className="text-muted-foreground" />
            <YAxis tick={{ fontSize: 10, fontFamily: "var(--font-mono)" }} tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} className="text-muted-foreground" />
            <Tooltip
              formatter={(value: number) => [`$${value.toLocaleString()}`, ""]}
              contentStyle={{ fontSize: 12, fontFamily: "var(--font-sans)", borderRadius: 8, border: "1px solid hsl(var(--border))" }}
            />
            <Bar dataKey="invoiced" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} name="Invoiced" />
            <Bar dataKey="collected" fill="hsl(var(--accent))" radius={[3, 3, 0, 0]} name="Collected" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default RevenueAnalytics;
