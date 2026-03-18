import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, CheckSquare, Calendar, FileText } from "lucide-react";

const TradePartnerDashboard = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-sans font-bold text-foreground">Trade Partner Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-3">
          <div className="p-2 rounded-md bg-primary/10"><Briefcase className="w-4 h-4 text-primary" /></div>
          <div>
            <p className="text-2xl font-bold font-sans text-foreground">0</p>
            <p className="text-xs text-muted-foreground font-sans">Active Projects</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="p-2 rounded-md bg-primary/10"><CheckSquare className="w-4 h-4 text-primary" /></div>
          <div>
            <p className="text-2xl font-bold font-sans text-foreground">0</p>
            <p className="text-xs text-muted-foreground font-sans">Open Tasks</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="p-2 rounded-md bg-primary/10"><Calendar className="w-4 h-4 text-primary" /></div>
          <div>
            <p className="text-2xl font-bold font-sans text-foreground">0</p>
            <p className="text-xs text-muted-foreground font-sans">Upcoming Work Days</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="p-2 rounded-md bg-primary/10"><FileText className="w-4 h-4 text-primary" /></div>
          <div>
            <p className="text-2xl font-bold font-sans text-foreground">0</p>
            <p className="text-xs text-muted-foreground font-sans">Documents</p>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-sm font-sans font-semibold text-foreground mb-3">My Projects</h2>
        <p className="text-sm text-muted-foreground font-sans text-center py-8">
          No projects assigned yet. You'll see your assigned projects here when a project manager adds you to a project.
        </p>
      </Card>

      <Card className="p-6">
        <h2 className="text-sm font-sans font-semibold text-foreground mb-3">Upcoming Tasks</h2>
        <p className="text-sm text-muted-foreground font-sans text-center py-8">
          No tasks assigned. Tasks from your active projects will appear here.
        </p>
      </Card>
    </div>
  );
};

export default TradePartnerDashboard;
