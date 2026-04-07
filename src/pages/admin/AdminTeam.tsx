import AdminHeader from "@/components/admin/AdminHeader";
import { Users, UserPlus, Smartphone, Camera, FileText, DollarSign, Sparkles, Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const ROLES = [
  { role: "Creator", desc: "Full access — billing, settings, all clients", you: true },
  { role: "Sub-Admin", desc: "All clients, scheduling, invoicing — no billing settings", you: false },
  { role: "Field Employee", desc: "Assigned jobs, photo upload, daily logs, change orders", you: false },
  { role: "Trade Partner", desc: "View assigned jobs and submit bids only", you: false },
];

const FIELD_FEATURES = [
  { icon: Smartphone, title: "Daily Schedule", desc: "See their jobs for today with address, scope, and contact info" },
  { icon: Camera, title: "Photo Upload", desc: "Upload site photos directly to the client's file manager" },
  { icon: FileText, title: "Daily Logs", desc: "Submit end-of-day notes tied to the project" },
  { icon: DollarSign, title: "Change Orders", desc: "Request change orders — you approve before they're issued" },
  { icon: Sparkles, title: "Bobby AI", desc: "Bobby helps field staff write notes, draft messages, and log issues" },
];

const AdminTeam = () => (
  <div>
    <AdminHeader breadcrumbs={[{ label: "Team" }]} />
    <div className="p-8 max-w-4xl mx-auto space-y-8">

      {/* Header */}
      <div>
        <h1 className="font-display text-2xl text-foreground mb-1">Team & Employees</h1>
        <p className="font-sans text-sm text-muted-foreground">Manage your team, roles, and field staff access.</p>
      </div>

      {/* Role Hierarchy */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-sans font-semibold text-foreground">Role Hierarchy</h2>
        </div>
        <div className="space-y-2">
          {ROLES.map((r) => (
            <div key={r.role} className="flex items-center justify-between py-3 border-b border-border last:border-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-sans font-medium text-foreground">{r.role}</span>
                  {r.you && <Badge variant="default" className="text-[10px]">You</Badge>}
                </div>
                <p className="text-xs font-sans text-muted-foreground mt-0.5">{r.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Current Team */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-sans font-semibold text-foreground">Your Team</h2>
          <button
            disabled
            className="flex items-center gap-1.5 text-xs font-sans bg-muted text-muted-foreground px-3 py-1.5 rounded-md cursor-not-allowed opacity-60"
          >
            <UserPlus className="w-3.5 h-3.5" /> Invite Employee — Coming Soon
          </button>
        </div>
        <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
          <Users className="w-8 h-8 text-muted-foreground/30" />
          <p className="text-sm font-sans text-muted-foreground">You're the only team member right now.</p>
          <p className="text-xs font-sans text-muted-foreground max-w-sm">When you're ready to add field employees or a sub-admin, use the Invite Employee button above.</p>
        </div>
      </Card>

      {/* Field Employee Portal Preview */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-sans font-semibold text-foreground">Field Employee Portal</h2>
          <Badge variant="outline" className="text-[10px] gap-1"><Lock className="w-2.5 h-2.5" />Coming Soon</Badge>
        </div>
        <p className="text-xs font-sans text-muted-foreground">When you add field employees, they'll get their own login with access to:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {FIELD_FEATURES.map((f) => (
            <div key={f.title} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <f.icon className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-sans font-medium text-foreground">{f.title}</p>
                <p className="text-[11px] font-sans text-muted-foreground">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  </div>
);

export default AdminTeam;
