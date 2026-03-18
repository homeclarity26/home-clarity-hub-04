import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { DollarSign, TrendingUp, Percent, Receipt, Calendar, ArrowRight, Plus } from "lucide-react";
import { format, subMonths, addMonths, differenceInDays } from "date-fns";
import { useNavigate } from "react-router-dom";

function useRevenueData() {
  return useQuery({
    queryKey: ["revenue-analytics"],
    queryFn: async () => {
      const [{ data: invoices }, { data: payments }, { data: profiles }, { data: properties }] = await Promise.all([
        supabase.from("invoices").select("id, total, balance_due, status, created_at, due_date, property_id"),
        supabase.from("payments_posted").select("amount, payment_date"),
        supabase.from("profiles").select("user_id, membership_end_date, full_name"),
        supabase.from("properties").select("id, property_name, address, client_user_id"),
      ]);

      const now = new Date();

      // Monthly revenue chart (last 12 months)
      const months: { month: string; invoiced: number; collected: number }[] = [];
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

      // Forecast: upcoming due invoices with outstanding balances (next 12 months)
      const forecast: { month: string; projected: number }[] = [];
      for (let i = 0; i < 6; i++) {
        const d = addMonths(now, i);
        const key = format(d, "yyyy-MM");
        const label = format(d, "MMM");
        const projected = (invoices || [])
          .filter((inv) => inv.due_date?.startsWith(key) && Number(inv.balance_due) > 0)
          .reduce((s, inv) => s + Number(inv.balance_due), 0);
        forecast.push({ month: label, projected });
      }

      // Renewals pipeline: clients whose membership expires within 90 days
      const renewals: { propertyId: string; propertyName: string; clientName: string; expiryDate: string; daysLeft: number }[] = [];
      if (profiles && properties) {
        for (const prof of profiles) {
          if (!prof.membership_end_date) continue;
          const expiry = new Date(prof.membership_end_date);
          const days = differenceInDays(expiry, now);
          if (days >= 0 && days <= 90) {
            const prop = properties.find((p) => p.client_user_id === prof.user_id);
            if (prop) {
              renewals.push({
                propertyId: prop.id,
                propertyName: prop.property_name || prop.address,
                clientName: prof.full_name || "Unknown",
                expiryDate: prof.membership_end_date,
                daysLeft: days,
              });
            }
          }
        }
        renewals.sort((a, b) => a.daysLeft - b.daysLeft);
      }

      // Overdue invoices with days overdue
      const overdueInvoices = (invoices || [])
        .filter((inv) => {
          if (!inv.due_date || Number(inv.balance_due) <= 0) return false;
          return new Date(inv.due_date) < now;
        })
        .map((inv) => {
          const prop = (properties || []).find((p) => p.id === inv.property_id);
          return {
            id: inv.id,
            propertyId: inv.property_id,
            propertyName: prop?.property_name || prop?.address || "Unknown",
            amount: Number(inv.balance_due),
            daysOverdue: differenceInDays(now, new Date(inv.due_date!)),
          };
        })
        .sort((a, b) => b.daysOverdue - a.daysOverdue);

      return { months, totalInvoiced, totalCollected, collectionRate, avgInvoiceValue, forecast, renewals, overdueInvoices };
    },
  });
}

const fmt = (n: number) => (n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n.toFixed(0)}`);

const RevenueAnalytics = () => {
  const { data, isLoading } = useRevenueData();
  const navigate = useNavigate();

  if (isLoading || !data) return null;

  const hasRevenue = data.totalInvoiced > 0 || data.months.some(m => m.invoiced > 0 || m.collected > 0);

  if (!hasRevenue) {
    return (
      <Card className="p-8 flex flex-col items-center justify-center text-center">
        <DollarSign className="w-10 h-10 text-muted-foreground/30 mb-3" />
        <h3 className="text-sm font-sans font-semibold text-foreground mb-1">No revenue data yet</h3>
        <p className="text-xs font-sans text-muted-foreground mb-4 max-w-sm">Add your first client and create an invoice to start tracking revenue here.</p>
        <Button variant="outline" size="sm" className="font-sans gap-1.5" onClick={() => navigate("/admin/clients/new")}>
          <Plus className="w-3.5 h-3.5" />New Client
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
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

      {/* Revenue Forecast */}
      {data.forecast.some((f) => f.projected > 0) && (
        <Card className="p-5">
          <h2 className="text-sm font-sans font-semibold text-foreground mb-4">Revenue Forecast (Next 6 Months)</h2>
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.forecast} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fontFamily: "var(--font-sans)" }} />
                <YAxis tick={{ fontSize: 10, fontFamily: "var(--font-mono)" }} tickFormatter={(v) => fmt(v)} />
                <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, "Projected"]} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="projected" fill="hsl(var(--primary) / 0.6)" radius={[3, 3, 0, 0]} name="Projected" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Renewals Pipeline */}
        {data.renewals.length > 0 && (
          <Card className="p-5">
            <h2 className="text-sm font-sans font-semibold text-foreground mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-accent" />
              Renewals Pipeline
            </h2>
            <div className="space-y-2">
              {data.renewals.slice(0, 5).map((r) => (
                <button
                  key={r.propertyId}
                  onClick={() => navigate(`/admin/clients/${r.propertyId}`)}
                  className="w-full flex items-center justify-between p-2.5 rounded-md hover:bg-muted/50 transition-colors bg-transparent border-none cursor-pointer text-left"
                >
                  <div>
                    <p className="text-sm font-sans font-medium text-foreground truncate">{r.propertyName}</p>
                    <p className="text-xs font-sans text-muted-foreground">{r.clientName}</p>
                  </div>
                  <Badge variant={r.daysLeft <= 14 ? "destructive" : "secondary"} className="text-[10px]">
                    {r.daysLeft === 0 ? "Today" : `${r.daysLeft}d left`}
                  </Badge>
                </button>
              ))}
            </div>
          </Card>
        )}

        {/* Overdue Invoices */}
        {data.overdueInvoices.length > 0 && (
          <Card className="p-5">
            <h2 className="text-sm font-sans font-semibold text-foreground mb-3 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-destructive" />
              Overdue Invoices
            </h2>
            <div className="space-y-2">
              {data.overdueInvoices.slice(0, 5).map((inv) => (
                <button
                  key={inv.id}
                  onClick={() => navigate(`/admin/clients/${inv.propertyId}`)}
                  className="w-full flex items-center justify-between p-2.5 rounded-md hover:bg-muted/50 transition-colors bg-transparent border-none cursor-pointer text-left"
                >
                  <div>
                    <p className="text-sm font-sans font-medium text-foreground truncate">{inv.propertyName}</p>
                    <p className="text-xs font-mono text-destructive">{fmt(inv.amount)} outstanding</p>
                  </div>
                  <Badge variant="destructive" className="text-[10px]">
                    {inv.daysOverdue}d overdue
                  </Badge>
                </button>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default RevenueAnalytics;
