import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, FileText, HelpCircle, CheckCircle, BookOpen, AlertTriangle, Plus, Loader2, DollarSign, TrendingUp, CreditCard, MessageSquare, UserPlus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AdminHeader from "@/components/admin/AdminHeader";
import StatsCard from "@/components/admin/StatsCard";
import ActivityFeed from "@/components/admin/ActivityFeed";
import ClientTable from "@/components/admin/ClientTable";
import { useAdminClients, useAdminStats, useAdminActivityLog, useClientsNeedingAttention } from "@/hooks/useAdminData";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

const fmt = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n.toFixed(0)}`;

const AdminDashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: clients, isLoading: clientsLoading } = useAdminClients();
  const { data: activities } = useAdminActivityLog(10);
  const { data: attentionClients } = useClientsNeedingAttention();

  const isLoading = statsLoading || clientsLoading;

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
        {/* Primary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard label="Active Clients" value={stats?.activeClients ?? 0} icon={Users} />
          <StatsCard label="Reports in Progress" value={stats?.reportsInProgress ?? 0} icon={FileText} />
          <StatsCard label="Unanswered Questions" value={stats?.unansweredQuestions ?? 0} icon={HelpCircle} alert={!!stats && stats.unansweredQuestions > 0} />
          <StatsCard label="Published Reports" value={stats?.publishedReports ?? 0} icon={CheckCircle} />
        </div>

        {/* Revenue Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard label="Total Invoiced" value={fmt(stats?.totalInvoiced ?? 0)} icon={DollarSign} />
          <StatsCard label="Total Collected" value={fmt(stats?.totalCollected ?? 0)} icon={TrendingUp} />
          <StatsCard label="Outstanding" value={fmt(stats?.totalOutstanding ?? 0)} icon={CreditCard} alert={!!stats && stats.totalOutstanding > 0} />
          <StatsCard label="Overdue Invoices" value={stats?.overdueInvoices ?? 0} icon={AlertTriangle} alert={!!stats && stats.overdueInvoices > 0} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <Card className="lg:col-span-2 p-5">
            <h2 className="text-sm font-sans font-semibold text-foreground mb-4">Recent Activity</h2>
            <ActivityFeed activities={activities || []} limit={6} />
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
                  <Plus className="w-4 h-4" />Create New Report
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2 text-sm font-sans" onClick={() => navigate("/admin/knowledge-base")}>
                  <BookOpen className="w-4 h-4" />View Knowledge Base
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2 text-sm font-sans" onClick={() => navigate("/admin/clients?status=review")}>
                  <AlertTriangle className="w-4 h-4 text-accent" />Review Flagged Items
                  <span className="ml-auto text-xs text-accent font-medium">{stats?.unansweredQuestions ?? 0}</span>
                </Button>
              </div>
            </Card>
          </div>
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
