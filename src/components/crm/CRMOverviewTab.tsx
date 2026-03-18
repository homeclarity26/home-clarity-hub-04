import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, DollarSign, Calendar, Activity } from "lucide-react";
import { format } from "date-fns";
import type { CRMContact, CRMActivityEntry } from "@/hooks/useCRMData";

interface Props {
  contact: CRMContact;
  client: any;
  projects: any[] | undefined;
  invoices: any[] | undefined;
  activities: CRMActivityEntry[] | undefined;
}

const CRMOverviewTab = ({ contact, client, projects, invoices, activities }: Props) => {
  const activeProjects = (projects || []).filter(p => p.status !== "completed" && p.status !== "cancelled").length;
  const openInvoices = (invoices || []).filter(i => i.status !== "paid").length;
  const totalPaid = (invoices || []).filter(i => i.status === "paid").reduce((s, i) => s + (i.amount || 0), 0);
  const balanceDue = (invoices || []).filter(i => i.status !== "paid").reduce((s, i) => s + (i.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Briefcase} label="Active Projects" value={activeProjects} />
        <StatCard icon={DollarSign} label="Open Invoices" value={openInvoices} />
        <StatCard icon={DollarSign} label="Lifetime Value" value={`$${totalPaid.toLocaleString()}`} />
        <StatCard icon={Calendar} label="Last Contact" value={contact.last_contact_date ? format(new Date(contact.last_contact_date), "MMM d, yyyy") : "Never"} />
      </div>

      {/* AI Intelligence Card */}
      <Card className="p-5 border-accent/30 bg-accent/5">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4 text-accent" />
          <h3 className="font-sans font-semibold text-sm text-foreground">AI Insights</h3>
        </div>
        <div className="space-y-2 text-sm text-muted-foreground font-sans">
          {!contact.last_contact_date && <p>⚠️ This client has never been contacted — schedule a touchpoint.</p>}
          {balanceDue > 0 && <p>💰 ${balanceDue.toLocaleString()} outstanding — consider sending a reminder.</p>}
          {activeProjects === 0 && totalPaid > 0 && <p>📋 No active projects — this may be a good time to propose new work.</p>}
          {contact.tags?.length === 0 && <p>🏷️ No tags assigned — add tags for better organization.</p>}
          {!contact.last_contact_date && balanceDue === 0 && activeProjects === 0 && contact.tags?.length > 0 && <p>✅ This client looks good! Keep up the engagement.</p>}
        </div>
      </Card>

      {/* Property Snapshot */}
      {client && (
        <Card className="p-5">
          <h3 className="font-sans font-semibold text-sm text-foreground mb-3">Property Snapshot</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm font-sans">
            {client.yearBuilt && <div><span className="text-muted-foreground">Year Built</span><p className="font-medium">{client.yearBuilt}</p></div>}
            {client.sqft && <div><span className="text-muted-foreground">Sq Ft</span><p className="font-medium">{client.sqft?.toLocaleString()}</p></div>}
            {client.bedrooms && <div><span className="text-muted-foreground">Beds</span><p className="font-medium">{client.bedrooms}</p></div>}
            {client.bathrooms && <div><span className="text-muted-foreground">Baths</span><p className="font-medium">{client.bathrooms}</p></div>}
            {client.propertyType && <div><span className="text-muted-foreground">Type</span><p className="font-medium capitalize">{client.propertyType?.replace(/_/g, " ")}</p></div>}
            {client.address && <div className="col-span-2"><span className="text-muted-foreground">Address</span><p className="font-medium">{client.address}</p></div>}
          </div>
        </Card>
      )}

      {/* Recent Activity */}
      <Card className="p-5">
        <h3 className="font-sans font-semibold text-sm text-foreground mb-3">Recent Activity</h3>
        {(activities || []).length === 0 ? (
          <p className="text-sm text-muted-foreground font-sans">No activity recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {(activities || []).slice(0, 5).map(a => (
              <div key={a.id} className="flex items-start gap-3 text-sm font-sans">
                <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-foreground">{a.content_preview || a.activity_type}</p>
                  <p className="text-[11px] text-muted-foreground">{format(new Date(a.logged_at), "MMM d, h:mm a")}{a.channel ? ` · ${a.channel}` : ""}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Tags */}
      {contact.tags && contact.tags.length > 0 && (
        <Card className="p-5">
          <h3 className="font-sans font-semibold text-sm text-foreground mb-3">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {contact.tags.map(t => <Badge key={t} variant="outline" className="font-sans text-xs">{t}</Badge>)}
          </div>
        </Card>
      )}
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) => (
  <Card className="p-4">
    <div className="flex items-center gap-2 mb-1">
      <Icon className="w-4 h-4 text-muted-foreground" />
      <span className="text-[11px] text-muted-foreground font-sans uppercase tracking-wider">{label}</span>
    </div>
    <p className="text-xl font-sans font-bold text-foreground">{value}</p>
  </Card>
);

export default CRMOverviewTab;
