import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ExternalLink, MapPin, FileText, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ClientTags from "@/components/admin/ClientTags";
import ClientHealthBadge from "@/components/admin/ClientHealthBadge";
import type { AdminClient } from "@/hooks/useAdminData";

interface WorkspaceContextCardProps {
  client: AdminClient;
  invoiceCount?: number;
  overdueCount?: number;
  projectCount?: number;
  reportCompletion?: number;
}

const WorkspaceContextCard = ({ client, invoiceCount = 0, overdueCount = 0, projectCount = 0, reportCompletion = 0 }: WorkspaceContextCardProps) => {
  const navigate = useNavigate();

  return (
    <div className="shrink-0 w-[220px] border-r border-border bg-card p-4 space-y-4 overflow-y-auto">
      {/* Client identity */}
      <div>
        <h2 className="text-sm font-sans font-bold text-foreground truncate">{client.propertyName}</h2>
        <p className="text-xs font-sans text-muted-foreground truncate">{client.name}</p>
        {client.address && (
          <p className="text-[11px] font-sans text-muted-foreground mt-1 flex items-start gap-1">
            <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
            <span className="truncate">{client.address}</span>
          </p>
        )}
      </div>

      {/* Tags */}
      <ClientTags propertyId={client.propertyId} />

      {/* Health & Status */}
      <div className="space-y-2">
        <ClientHealthBadge client={client} />

        <div className="grid grid-cols-2 gap-2">
          <Card className="p-2 text-center">
            <p className="text-lg font-sans font-bold text-foreground">{projectCount}</p>
            <p className="text-[10px] font-sans text-muted-foreground">Projects</p>
          </Card>
          <Card className="p-2 text-center">
            <p className="text-lg font-sans font-bold text-foreground">{invoiceCount}</p>
            <p className="text-[10px] font-sans text-muted-foreground">Invoices</p>
          </Card>
        </div>

        {overdueCount > 0 && (
          <div className="text-[11px] font-sans text-destructive bg-destructive/10 rounded px-2 py-1">
            ⚠️ {overdueCount} overdue invoice{overdueCount > 1 ? "s" : ""}
          </div>
        )}

        {/* Report progress */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-sans text-muted-foreground">Report</span>
            <span className="text-[10px] font-sans font-medium text-foreground">{reportCompletion}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${reportCompletion}%` }}
            />
          </div>
          <Badge variant="outline" className="text-[9px] mt-1">
            {client.reportStatus === "published" ? "Published" : client.reportStatus === "review" ? "In Review" : "Draft"}
          </Badge>
        </div>
      </div>

      {/* Quick actions */}
      <div className="space-y-1.5 pt-2 border-t border-border">
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2 text-xs font-sans h-8"
          onClick={() => {
            // Preview the client portal in a new tab so the admin keeps their
            // admin session and doesn't lose context. `preview=admin` flags
            // the portal to render the "Admin Preview" banner — it's a clear
            // signal that this is NOT a true client session.
            const url = `/portal/${client.propertyId}?preview=admin`;
            window.open(url, "_blank", "noopener,noreferrer");
          }}
          title="Preview the client portal in a new tab. You stay logged in as admin."
        >
          <ExternalLink className="w-3.5 h-3.5" /> Preview Portal
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2 text-xs font-sans h-8"
          onClick={() => navigate(`/admin/inspect/${client.propertyId}`)}
        >
          <MapPin className="w-3.5 h-3.5" /> Field Inspect
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2 text-xs font-sans h-8"
          onClick={() => navigate(`/admin/crm/clients/${client.propertyId}`)}
        >
          <FileText className="w-3.5 h-3.5" /> CRM Profile
        </Button>
      </div>
    </div>
  );
};

export default WorkspaceContextCard;
