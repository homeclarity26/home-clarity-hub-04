import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, DollarSign, FileText, CheckCircle, TrendingUp, Clock, BarChart3, PieChart, ArrowRight, Download } from "lucide-react";
import ExportMenu from "@/components/admin/ExportMenu";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell, FunnelChart, Funnel, LabelList } from "recharts";
import AdminHeader from "@/components/admin/AdminHeader";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const COLORS = ["hsl(143,55%,45%)", "hsl(43,41%,59%)", "hsl(25,80%,55%)", "hsl(0,70%,55%)"];

const AdminAnalytics = () => {
  const [dateRange, setDateRange] = useState("90");
  const [chartType, setChartType] = useState<"line" | "bar">("line");
  const navigate = useNavigate();

  const { data: stats } = useQuery({
    queryKey: ["analytics-stats", dateRange],
    queryFn: async () => {
      const { count: totalClients } = await supabase.from("properties").select("*", { count: "exact", head: true });
      const { data: invoices } = await supabase.from("invoices").select("total, balance_due, status, created_at, due_date, paid_date");
      const { data: payments } = await supabase.from("payments_posted").select("amount, payment_date");
      const { data: reports } = await supabase.from("reports").select("status, created_at");
      const { data: projects } = await supabase.from("projects").select("status, estimated_cost, created_at");

      const totalInvoiced = invoices?.reduce((s, i) => s + Number(i.total), 0) || 0;
      const totalCollected = payments?.reduce((s, p) => s + Number(p.amount), 0) || 0;
      const publishedReports = reports?.filter(r => r.status === "published").length || 0;
      const completedProjects = projects?.filter(p => p.status === "complete").length || 0;
      const collectionRate = totalInvoiced > 0 ? Math.round((totalCollected / totalInvoiced) * 100) : 0;
      const avgRevenuePerClient = totalClients && totalClients > 0 ? Math.round(totalCollected / totalClients) : 0;

      // Avg days to pay
      const paidInvoices = invoices?.filter(i => i.paid_date && i.due_date) || [];
      const avgDaysToPay = paidInvoices.length > 0 
        ? Math.round(paidInvoices.reduce((s, i) => {
            const due = new Date(i.due_date!);
            const paid = new Date(i.paid_date!);
            return s + Math.max(0, (paid.getTime() - due.getTime()) / 86400000);
          }, 0) / paidInvoices.length)
        : 0;

      return {
        totalClients: totalClients || 0,
        totalCollected,
        avgRevenuePerClient,
        publishedReports,
        completedProjects,
        collectionRate,
        avgDaysToPay,
      };
    },
  });

  const { data: revenueData } = useQuery({
    queryKey: ["analytics-revenue", dateRange],
    queryFn: async () => {
      const { data: invoices } = await supabase.from("invoices").select("total, created_at");
      const { data: payments } = await supabase.from("payments_posted").select("amount, payment_date");
      
      const months: Record<string, { invoiced: number; collected: number }> = {};
      const now = new Date();
      const rangeMonths = parseInt(dateRange) === 0 ? 24 : Math.ceil(parseInt(dateRange) / 30);
      
      for (let i = rangeMonths - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        months[key] = { invoiced: 0, collected: 0 };
      }

      invoices?.forEach(inv => {
        const key = inv.created_at.slice(0, 7);
        if (months[key]) months[key].invoiced += Number(inv.total);
      });
      payments?.forEach(p => {
        const key = p.payment_date.slice(0, 7);
        if (months[key]) months[key].collected += Number(p.amount);
      });

      return Object.entries(months).map(([month, data]) => ({
        month: new Date(month + "-01").toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
        invoiced: Math.round(data.invoiced),
        collected: Math.round(data.collected),
      }));
    },
  });

  const { data: projectPipeline } = useQuery({
    queryKey: ["analytics-pipeline"],
    queryFn: async () => {
      const { data: projects } = await supabase.from("projects").select("status, estimated_cost");
      const statusCounts: Record<string, { count: number; value: number }> = {
        planned: { count: 0, value: 0 },
        in_progress: { count: 0, value: 0 },
        complete: { count: 0, value: 0 },
        consideration: { count: 0, value: 0 },
      };
      projects?.forEach(p => {
        const key = p.status === "upcoming" ? "consideration" : (p.status || "planned");
        if (statusCounts[key]) {
          statusCounts[key].count++;
          statusCounts[key].value += Number(p.estimated_cost || 0);
        }
      });
      return Object.entries(statusCounts).map(([status, data]) => ({
        status: status.charAt(0).toUpperCase() + status.slice(1).replace("_", " "),
        count: data.count,
        value: data.value,
      }));
    },
  });

  const { data: engagementData } = useQuery({
    queryKey: ["analytics-engagement"],
    queryFn: async () => {
      const { data: sessions } = await supabase.from("client_sessions").select("client_id, login_at").order("login_at", { ascending: false });
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
      const activeIds = new Set(sessions?.filter(s => s.login_at > thirtyDaysAgo).map(s => s.client_id) || []);
      const allIds = new Set(sessions?.map(s => s.client_id) || []);
      return {
        active: activeIds.size,
        atRisk: allIds.size - activeIds.size,
      };
    },
  });

  const fmt = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n}`;

  // Health distribution — computed from real `reports` + `report_pages` by
  // the healthDistQuery below. Until that finishes loading (or if the user
  // has no published reports with condition ratings yet) the chart shows
  // an empty state instead of hardcoded demo numbers. We also surface the
  // overall average across all properties for the "Avg Health Score" stat
  // card so it reflects real data instead of a hardcoded 72.
  const { data: healthData } = useQuery({
    queryKey: ["analytics-health-distribution"],
    queryFn: async () => {
      const { data: pages } = await supabase
        .from("report_pages")
        .select("condition_rating, report_id, reports!inner(property_id, status)");
      const CONDITION_SCORE: Record<string, number> = {
        Excellent: 100, Good: 75, Fair: 50, Poor: 25, Critical: 10,
      };
      const byProperty = new Map<string, number[]>();
      for (const p of (pages ?? []) as Array<{ condition_rating: string | null; reports: { property_id: string; status: string } | null }>) {
        const r = p.reports;
        if (!r || r.status !== "published" || !p.condition_rating) continue;
        const score = CONDITION_SCORE[p.condition_rating];
        if (score == null) continue;
        if (!byProperty.has(r.property_id)) byProperty.set(r.property_id, []);
        byProperty.get(r.property_id)!.push(score);
      }
      const buckets = { excellent: 0, good: 0, fair: 0, belowAvg: 0, poor: 0 };
      const propertyAverages: number[] = [];
      for (const scores of byProperty.values()) {
        const avg = scores.reduce((s, n) => s + n, 0) / scores.length;
        propertyAverages.push(avg);
        if (avg >= 80) buckets.excellent++;
        else if (avg >= 60) buckets.fair++;
        else if (avg >= 40) buckets.belowAvg++;
        else buckets.poor++;
      }
      const distribution = [
        { name: "Excellent (80-100)", value: buckets.excellent, color: COLORS[0] },
        { name: "Fair (60-79)", value: buckets.fair, color: COLORS[1] },
        { name: "Below Avg (40-59)", value: buckets.belowAvg, color: COLORS[2] },
        { name: "Poor (<40)", value: buckets.poor, color: COLORS[3] },
      ];
      const avgHealthScore = propertyAverages.length > 0
        ? Math.round(propertyAverages.reduce((s, n) => s + n, 0) / propertyAverages.length)
        : null;
      return { distribution, avgHealthScore };
    },
  });
  const healthDistribution = healthData?.distribution ?? [];
  const hasHealthData = healthDistribution.some((d) => d.value > 0);
  const avgHealthScore = healthData?.avgHealthScore ?? null;

  const statCards = [
    { label: "Active Clients", value: stats?.totalClients ?? 0, icon: Users },
    { label: "Revenue Collected", value: fmt(stats?.totalCollected ?? 0), icon: DollarSign },
    { label: "Avg Revenue/Client", value: fmt(stats?.avgRevenuePerClient ?? 0), icon: TrendingUp },
    // This is the average home condition from published report condition
    // ratings — not to be confused with the Dashboard's "Portfolio Health"
    // card, which is a composite operational score (onboarding + engagement
    // + issue resolution + report completion). Renamed from "Avg Health
    // Score" to avoid the label collision with the Dashboard widget.
    { label: "Avg Home Condition", value: avgHealthScore ?? "—", icon: BarChart3 },
    { label: "Published Reports", value: stats?.publishedReports ?? 0, icon: FileText },
    { label: "Projects Completed", value: stats?.completedProjects ?? 0, icon: CheckCircle },
    { label: "Collection Rate", value: `${stats?.collectionRate ?? 0}%`, icon: DollarSign },
    { label: "Avg Days to Pay", value: stats?.avgDaysToPay ?? 0, icon: Clock },
  ];

  return (
    <div>
      <AdminHeader breadcrumbs={[{ label: "Analytics" }]} />
      <div className="p-6 space-y-6 max-w-7xl">
        {/* Date Range Filter */}
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl text-foreground">Business Intelligence</h2>
          <div className="flex items-center gap-3">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[180px] text-sm font-sans">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">Last 30 Days</SelectItem>
                <SelectItem value="90">Last 90 Days</SelectItem>
                <SelectItem value="365">Last 12 Months</SelectItem>
                <SelectItem value="0">All Time</SelectItem>
              </SelectContent>
            </Select>
            <ExportMenu />
            <Button variant="outline" size="sm" className="gap-1.5 text-xs font-sans">
              <Download className="w-3.5 h-3.5" />Export Report
            </Button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(card => (
            <Card key={card.label} className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <card.icon className="w-4 h-4 text-accent" />
                <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">{card.label}</span>
              </div>
              <p className="text-2xl font-sans font-bold text-foreground">{card.value}</p>
            </Card>
          ))}
        </div>

        {/* Revenue Chart */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-sans font-semibold text-foreground">Revenue Over Time</h3>
            <div className="flex gap-1">
              <Button variant={chartType === "line" ? "default" : "outline"} size="sm" className="h-7 text-xs" onClick={() => setChartType("line")}>Line</Button>
              <Button variant={chartType === "bar" ? "default" : "outline"} size="sm" className="h-7 text-xs" onClick={() => setChartType("bar")}>Bar</Button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            {chartType === "line" ? (
              <LineChart data={revenueData || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
                <Line type="monotone" dataKey="invoiced" stroke="hsl(var(--muted-foreground))" strokeWidth={2} name="Invoiced" />
                <Line type="monotone" dataKey="collected" stroke="hsl(var(--accent))" strokeWidth={2} name="Collected" />
              </LineChart>
            ) : (
              <BarChart data={revenueData || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
                <Bar dataKey="invoiced" fill="hsl(var(--muted-foreground))" name="Invoiced" />
                <Bar dataKey="collected" fill="hsl(var(--accent))" name="Collected" />
              </BarChart>
            )}
          </ResponsiveContainer>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Health Distribution */}
          <Card className="p-5">
            <h3 className="text-sm font-sans font-semibold text-foreground mb-4">Client Health Distribution</h3>
            {hasHealthData ? (
              <>
                <ResponsiveContainer width="100%" height={220}>
                  <RechartsPie>
                    <Pie data={healthDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                      {healthDistribution.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip />
                  </RechartsPie>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-3 mt-2 justify-center">
                  {healthDistribution.map(d => (
                    <div key={d.name} className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-[11px] font-sans text-muted-foreground">{d.name}: {d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-[220px] text-center">
                <p className="font-sans text-sm text-muted-foreground mb-1">No health data yet</p>
                <p className="font-sans text-xs text-muted-foreground/70">
                  Publish a report with condition-rated pages and this chart will populate.
                </p>
              </div>
            )}
          </Card>

          {/* Project Pipeline */}
          <Card className="p-5">
            <h3 className="text-sm font-sans font-semibold text-foreground mb-4">Project Pipeline</h3>
            <div className="space-y-3">
              {(projectPipeline || []).map(p => (
                <div key={p.status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] font-sans">{p.status}</Badge>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-sans font-medium">{p.count} projects</span>
                    <span className="text-xs font-mono text-muted-foreground">${p.value.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-xs font-sans text-muted-foreground">Total Pipeline Value</span>
                <span className="text-sm font-sans font-bold text-foreground">
                  ${(projectPipeline || []).reduce((s, p) => s + p.value, 0).toLocaleString()}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Engagement */}
        <Card className="p-5">
          <h3 className="text-sm font-sans font-semibold text-foreground mb-4">Client Retention & Engagement</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <p className="text-3xl font-sans font-bold text-foreground">{engagementData?.active ?? 0}</p>
              <p className="text-xs font-sans text-muted-foreground mt-1">Active (last 30 days)</p>
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <p className="text-3xl font-sans font-bold text-destructive">{engagementData?.atRisk ?? 0}</p>
              <p className="text-xs font-sans text-muted-foreground mt-1">At Risk (30+ days inactive)</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminAnalytics;
