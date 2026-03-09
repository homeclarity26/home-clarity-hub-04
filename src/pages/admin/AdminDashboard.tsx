import { useNavigate } from "react-router-dom";
import { Users, FileText, HelpCircle, CheckCircle, BookOpen, AlertTriangle, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AdminHeader from "@/components/admin/AdminHeader";
import StatsCard from "@/components/admin/StatsCard";
import ActivityFeed from "@/components/admin/ActivityFeed";
import ClientTable from "@/components/admin/ClientTable";
import { mockStats, mockActivities, mockClients } from "@/data/adminMockData";

const AdminDashboard = () => {
  const navigate = useNavigate();

  return (
    <div>
      <AdminHeader breadcrumbs={[{ label: "Dashboard" }]} />
      <div className="p-6 space-y-6 max-w-7xl">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard label="Active Clients" value={mockStats.activeClients} icon={Users} />
          <StatsCard label="Reports in Progress" value={mockStats.reportsInProgress} icon={FileText} />
          <StatsCard label="Unanswered Questions" value={mockStats.unansweredQuestions} icon={HelpCircle} alert />
          <StatsCard label="Published Reports" value={mockStats.publishedReports} icon={CheckCircle} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Activity Feed */}
          <Card className="lg:col-span-2 p-5">
            <h2 className="text-sm font-sans font-semibold text-foreground mb-4">Recent Activity</h2>
            <ActivityFeed activities={mockActivities} limit={6} />
          </Card>

          {/* Quick Actions */}
          <Card className="p-5">
            <h2 className="text-sm font-sans font-semibold text-foreground mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start gap-2 text-sm font-sans"
                onClick={() => navigate("/admin/clients/new")}
              >
                <Plus className="w-4 h-4" />
                Create New Report
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-2 text-sm font-sans"
                onClick={() => navigate("/admin/knowledge-base")}
              >
                <BookOpen className="w-4 h-4" />
                View Knowledge Base
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-2 text-sm font-sans"
              >
                <AlertTriangle className="w-4 h-4 text-accent" />
                Review Flagged Items
                <span className="ml-auto text-xs text-accent font-medium">4</span>
              </Button>
            </div>
          </Card>
        </div>

        {/* Recent Clients */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-sans font-semibold text-foreground">Recent Clients</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin/clients")} className="text-xs font-sans">
              View All →
            </Button>
          </div>
          <ClientTable clients={mockClients.slice(0, 5)} compact />
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
