import { useEffect, lazy, Suspense, Component, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Users, FileText, HelpCircle, CheckCircle, BookOpen, AlertTriangle, Plus, Loader2, DollarSign, TrendingUp, CreditCard, MessageSquare, UserPlus, Clock, Command } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import AdminHeader from "@/components/admin/AdminHeader";
import StatsCard from "@/components/admin/StatsCard";
import ActivityFeed from "@/components/admin/ActivityFeed";
import ClientTable from "@/components/admin/ClientTable";
import RevenueAnalytics from "@/components/admin/RevenueAnalytics";
import TasksSection from "@/components/admin/TasksSection";
import NPSOverviewCard from "@/components/admin/NPSOverviewCard";
import OverdueActionCenter from "@/components/admin/OverdueActionCenter";
import CrossReportAnalytics from "@/components/admin/CrossReportAnalytics";
import WeeklyDigestWidget from "@/components/admin/WeeklyDigestWidget";
import EquipmentWarrantyCalendar from "@/components/admin/EquipmentWarrantyCalendar";
import PortfolioHealthDashboard from "@/components/admin/PortfolioHealthDashboard";
import CrossClientInsightsCard from "@/components/admin/CrossClientInsightsCard";
import AdminSetupChecklist from "@/components/admin/AdminSetupChecklist";
import ServiceRequestsManager from "@/components/admin/ServiceRequestsManager";
import DailyBrief from "@/components/admin/DailyBrief";
import CRMDashboardWidget from "@/components/admin/CRMDashboardWidget";
import SubscriptionDashboardWidget from "@/components/admin/SubscriptionDashboardWidget";
import { useAdminClients, useAdminStats, useAdminActivityLog, useClientsNeedingAttention } from "@/hooks/useAdminData";
import { useWeeklyTimeEntries } from "@/hooks/useTimeTracking";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

const PropertyMap = lazy(() => import("@/components/admin/PropertyMap"));

class WidgetErrorBoundary extends Component<{ name: string; children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(err: any) { console.error(`[Dashboard] Widget "${this.props.name}" crashed:`, err); }
  render() {
    if (this.state.hasError) return (
      <Card className="p-4 border-destructive/30">
        <p className="text-xs text-destructive font-sans">⚠️ "{this.props.name}" failed to load.</p>
      </Card>
    );
    return this.props.children;
  }
}

const fmt = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n.toFixed(0)}`;

const AdminDashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: clients, isLoading: clientsLoading } = useAdminClients();
  const { data: activities } = useAdminActivityLog(10);
  const { data: attentionClients } = useClientsNeedingAttention();
  const { data: weeklyTime } = useWeeklyTimeEntries();
  const [referenceOpen, setReferenceOpen] = useState(false);

  const isLoading = statsLoading || clientsLoading;

  const weeklyHours = (weeklyTime || []).reduce((s: number, e: any) => s + Number(e.hours), 0);
  const weeklyByClient: Record<string, { name: string; hours: number }> = {};
  (weeklyTime || []).forEach((e: any) => {
    const name = e.properties?.property_name || e.properties?.address || "Unknown";
    if (!weeklyByClient[e.client_id]) weeklyByClient[e.client_id] = { name, hours: 0 };
    weeklyByClient[e.client_id].hours += Number(e.hours);
  });
  const weeklyRanked = Object.values(weeklyByClient).sort((a, b) => b.hours - a.hours).slice(0, 5);

  useEffect(() => {
    const channel = supabase
      .channel("activity-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "activity_log" }, () => {
        queryClient.invalidateQueries({ queryKey: ["admin-activity-log"] });
        queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  return (
    <div>
      <AdminHeader breadcrumbs={[{ label: "Dashboard" }]} />
      <div className="p-6 space-y-6 max-w-7xl">

        {/* ═══ ZONE 1: BRIEFING ═══ */}
        <WidgetErrorBoundary name="DailyBrief">
          <DailyBrief />
        </WidgetErrorBoundary>

        <WidgetErrorBoundary name="AdminSetupChecklist">
          <AdminSetupChecklist />
        </WidgetErrorBoundary>

        {/* Primary Stats */}
        {statsLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-muted animate-pulse" />
                <div className="space-y-2">
                  <div className="h-6 w-12 bg-muted animate-pulse rounded" />
                  <div className="h-3 w-20 bg-muted animate-pulse rounded" />
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard label="Active Clients" value={stats?.activeClients ?? 0} icon={Users} />
            <StatsCard label="Reports in Progress" value={stats?.reportsInProgress ?? 0} icon={FileText} />
            <StatsCard label="Unanswered Questions" value={stats?.unansweredQuestions ?? 0} icon={HelpCircle} alert={!!stats && stats.unansweredQuestions > 0} />
            <StatsCard label="Published Reports" value={stats?.publishedReports ?? 0} icon={CheckCircle} />
          </div>
        )}

        {/* Portfolio Health Dashboard */}
        {clients && clients.length > 0 && (
          <WidgetErrorBoundary name="PortfolioHealthDashboard">
            <PortfolioHealthDashboard clients={clients} />
          </WidgetErrorBoundary>
        )}

        {/* ═══ ZONE 2: ACTION — Things requiring clicks ═══ */}
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-3">Action Required</p>
          <div className="space-y-4">
            <WidgetErrorBoundary name="OverdueActionCenter">
              <OverdueActionCenter />
            </WidgetErrorBoundary>

            <WidgetErrorBoundary name="ServiceRequestsManager">
              <ServiceRequestsManager />
            </WidgetErrorBoundary>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* My Tasks */}
              <Card className="lg:col-span-2 p-5">
                <TasksSection compact />
              </Card>

              {/* Clients Needing Attention + Quick Actions */}
              <div className="space-y-6">
                {attentionClients && attentionClients.length > 0 && (
                  <Card className="p-5">
                    <h2 className="text-sm font-sans font-semibold text-foreground mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-accent" />
                      Needs Attention
                    </h2>
                    <div className="space-y-2">
                      {attentionClients.slice(0, 5).map((c) => (
                        <button
                          key={c.propertyId}
                          onClick={() => navigate(`/admin/clients/${c.propertyId}`)}
                          className="w-full text-left bg-transparent border-none cursor-pointer p-2.5 rounded-md hover:bg-muted/50 transition-colors"
                        >
                          <p className="text-sm font-sans font-medium text-foreground truncate">{c.propertyName}</p>
                          <div className="flex gap-2 mt-1 flex-wrap">
                            {c.unreadMessages > 0 && (
                              <Badge variant="secondary" className="text-[10px] gap-1 h-5">
                                <MessageSquare className="w-3 h-3" />{c.unreadMessages} unread
                              </Badge>
                            )}
                            {c.openQuestions > 0 && (
                              <Badge variant="secondary" className="text-[10px] gap-1 h-5">
                                <HelpCircle className="w-3 h-3" />{c.openQuestions} questions
                              </Badge>
                            )}
                            {c.overdueInvoices > 0 && (
                              <Badge variant="destructive" className="text-[10px] gap-1 h-5">
                                <AlertTriangle className="w-3 h-3" />{c.overdueInvoices} overdue
                              </Badge>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </Card>
                )}

                <Card className="p-5">
                  <h2 className="text-sm font-sans font-semibold text-foreground mb-4">Quick Actions</h2>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start gap-2 text-sm font-sans" onClick={() => navigate("/admin/clients/new")}>
                      <Plus className="w-4 h-4" />New Client
                    </Button>
                    <Button variant="outline" className="w-full justify-start gap-2 text-sm font-sans" onClick={() => {
                      window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
                    }}>
                      <Command className="w-4 h-4" />Quick Search (⌘K)
                    </Button>
                    <Button variant="outline" className="w-full justify-start gap-2 text-sm font-sans" onClick={() => navigate("/admin/clients?status=review")}>
                      <AlertTriangle className="w-4 h-4 text-accent" />Review Flagged Items
                      <span className="ml-auto text-xs text-accent font-medium">{stats?.unansweredQuestions ?? 0}</span>
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ ZONE 3: INSIGHTS — Read-only monitoring ═══ */}
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-3">Insights</p>
          <div className="space-y-4">
            <WidgetErrorBoundary name="RevenueAnalytics">
              <RevenueAnalytics />
            </WidgetErrorBoundary>

            <WidgetErrorBoundary name="SubscriptionDashboard">
              <SubscriptionDashboardWidget />
            </WidgetErrorBoundary>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <WidgetErrorBoundary name="WeeklyDigestWidget">
                  <WeeklyDigestWidget />
                </WidgetErrorBoundary>
              </div>
              <Card className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <h3 className="text-sm font-sans font-semibold text-foreground">Time This Week</h3>
                </div>
                <p className="text-2xl font-sans font-bold text-foreground">{weeklyHours.toFixed(1)}h</p>
                {weeklyRanked.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {weeklyRanked.map((c) => (
                      <div key={c.name} className="flex items-center justify-between">
                        <span className="text-xs font-sans text-muted-foreground truncate max-w-[150px]">{c.name}</span>
                        <span className="text-xs font-mono text-foreground">{c.hours.toFixed(1)}h</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            <WidgetErrorBoundary name="CRMDashboardWidget">
              <CRMDashboardWidget />
            </WidgetErrorBoundary>

            <WidgetErrorBoundary name="CrossClientInsightsCard">
              <CrossClientInsightsCard />
            </WidgetErrorBoundary>

            <WidgetErrorBoundary name="CrossReportAnalytics">
              <CrossReportAnalytics />
            </WidgetErrorBoundary>
          </div>
        </div>

        {/* ═══ ZONE 4: REFERENCE — Collapsed by default ═══ */}
        <Collapsible open={referenceOpen} onOpenChange={setReferenceOpen}>
          <CollapsibleTrigger className="w-full flex items-center gap-2 py-2 border-none bg-transparent cursor-pointer text-left">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Reference & Tools</p>
            <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${referenceOpen ? "rotate-180" : ""}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 mt-3">
            <WidgetErrorBoundary name="PropertyMap">
              <Suspense fallback={<Card className="p-5 h-64 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></Card>}>
                <PropertyMap />
              </Suspense>
            </WidgetErrorBoundary>

            <WidgetErrorBoundary name="NPSOverviewCard">
              <NPSOverviewCard />
            </WidgetErrorBoundary>

            <WidgetErrorBoundary name="EquipmentWarrantyCalendar">
              <EquipmentWarrantyCalendar />
            </WidgetErrorBoundary>
          </CollapsibleContent>
        </Collapsible>

        {/* Recent Activity + Clients */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 p-5">
            <h2 className="text-sm font-sans font-semibold text-foreground mb-4">Recent Activity</h2>
            <ActivityFeed activities={activities || []} limit={6} />
          </Card>
        </div>

        {/* Recent Clients */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-sans font-semibold text-foreground">Recent Clients</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin/clients")} className="text-xs font-sans">View All →</Button>
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : clients && clients.length > 0 ? (
            <ClientTable clients={clients.slice(0, 5)} compact />
          ) : (
            <p className="text-sm font-sans text-muted-foreground text-center py-8">No clients yet. Create your first report to get started.</p>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
