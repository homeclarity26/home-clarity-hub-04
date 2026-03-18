import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExternalLink, MessageSquare } from "lucide-react";
import type { AdminClient } from "@/hooks/useAdminData";

const statusStyles: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  review: "bg-accent/20 text-accent-foreground",
  published: "bg-primary text-primary-foreground",
};

const statusLabels: Record<string, string> = {
  draft: "Draft",
  review: "In Review",
  published: "Published",
};

interface ClientTableProps {
  clients: AdminClient[];
  compact?: boolean;
}

const ClientTable = ({ clients, compact }: ClientTableProps) => {
  const navigate = useNavigate();

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return dateStr;
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="font-sans text-xs">Client</TableHead>
          <TableHead className="font-sans text-xs">Address</TableHead>
          <TableHead className="font-sans text-xs">Status</TableHead>
          <TableHead className="font-sans text-xs">Version</TableHead>
          {!compact && <TableHead className="font-sans text-xs">Updated</TableHead>}
          {!compact && <TableHead className="font-sans text-xs">Comments</TableHead>}
          {!compact && <TableHead className="font-sans text-xs">Messages</TableHead>}
          <TableHead className="font-sans text-xs text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {clients.map((client) => (
          <TableRow key={client.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/admin/clients/${client.id}`)}>
            <TableCell className="font-sans text-sm font-medium">{client.name}</TableCell>
            <TableCell className="font-sans text-sm text-muted-foreground">{client.address}</TableCell>
            <TableCell>
              <Badge className={`${statusStyles[client.reportStatus] || statusStyles.draft} text-[11px] font-sans font-medium border-none`}>
                {statusLabels[client.reportStatus] || "Draft"}
              </Badge>
            </TableCell>
            <TableCell className="font-sans text-sm text-muted-foreground">{client.reportVersion}</TableCell>
            {!compact && <TableCell className="font-sans text-sm text-muted-foreground">{formatDate(client.lastUpdated)}</TableCell>}
            {!compact && (
              <TableCell>
                {client.unreadComments > 0 ? (
                  <span className="flex items-center gap-1.5 text-accent">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span className="text-sm font-sans font-medium">{client.unreadComments}</span>
                  </span>
                ) : (
                  <span className="text-sm font-sans text-muted-foreground">—</span>
                )}
              </TableCell>
            )}
            <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm" onClick={() => navigate(`/portal/${client.propertyId}?edit=true`)} className="gap-1.5 text-xs font-sans">
                <ExternalLink className="w-3.5 h-3.5" />
                Portal
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default ClientTable;
