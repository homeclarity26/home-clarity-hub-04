import { useNavigate } from "react-router-dom";
import { Users, FileText, HelpCircle, CheckCircle, BookOpen, AlertTriangle, Plus, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AdminHeader from "@/components/admin/AdminHeader";
import StatsCard from "@/components/admin/StatsCard";
import ActivityFeed from "@/components/admin/ActivityFeed";
import ClientTable from "@/components/admin/ClientTable";
import { useAdminClients, useAdminStats, useAdminActivityLog } from "@/hooks/useAdminData";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: clients, isLoading: clientsLoading } = useAdminClients();
  const { data: activities } = useAdminActivityLog(10);

  const isLoading = statsLoading || clientsLoading;

  return (
    <div>
      <AdminHeader breadcrumbs={[{ label: "Dashboard" }]} />
      <div className="p-6 space-y-6 max-w-7xl">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard label="Active Clients" value={stats?.activeClients ?? 0} icon={Users} />
          <StatsCard label="Reports in Progress" value={stats?.reportsInProgress ?? 0} icon={FileText} />
          <StatsCard label="Unanswered Questions" value={stats?.unansweredQuestions ?? 0} icon={HelpCircle} alert={!!stats && stats.unansweredQuestions > 0} />
          <StatsCard label="Published Reports" value={stats?.publishedReports ?? 0} icon={CheckCircle} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 p-5">
            <h2 className="text-sm font-sans font-semibold text-foreground mb-4">Recent Activity</h2>
            <ActivityFeed activities={activities || []} limit={6} />
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-sans font-semibold text-foreground mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start gap-2 text-sm font-sans" onClick={() => navigate("/admin/clients/new")}>
                <Plus className="w-4 h-4" />
                Create New Report
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2 text-sm font-sans" onClick={() => navigate("/admin/knowledge-base")}>
                <BookOpen className="w-4 h-4" />
                View Knowledge Base
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2 text-sm font-sans">
                <AlertTriangle className="w-4 h-4 text-accent" />
                Review Flagged Items
                <span className="ml-auto text-xs text-accent font-medium">{stats?.unansweredQuestions ?? 0}</span>
              </Button>
            </div>
          </Card>
        </div>

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
