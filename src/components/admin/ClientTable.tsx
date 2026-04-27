import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { ExternalLink, MessageSquare } from "lucide-react";
import type { AdminClient } from "@/hooks/useAdminData";
import BatchOperationsBar from "./BatchOperationsBar";

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

function getOnboardingProgress(client: AdminClient) {
  const steps = [
    !!client.address,
    !!client.discoveryNotes,
    client.digitalAssetsStatus === "complete",
    client.totalPages > 0,
    client.reportStatus === "published",
  ];
  return { completed: steps.filter(Boolean).length, total: 5 };
}

interface ClientTableProps {
  clients: AdminClient[];
  compact?: boolean;
}

const ClientTable = ({ clients, compact }: ClientTableProps) => {
  const navigate = useNavigate();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    setSelectedIds((prev) => prev.length === clients.length ? [] : clients.map((c) => c.id));
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-2">
      <BatchOperationsBar
        selectedIds={selectedIds}
        onClear={() => setSelectedIds([])}
        context="clients"
        clients={clients.map((c) => ({ id: c.id, name: c.name, email: c.email }))}
      />
      <Table>
        <TableHeader>
          <TableRow>
            {!compact && (
              <TableHead className="w-10">
                <Checkbox
                  checked={selectedIds.length === clients.length && clients.length > 0}
                  onCheckedChange={toggleAll}
                />
              </TableHead>
            )}
            <TableHead className="font-sans text-xs">Client</TableHead>
            <TableHead className="font-sans text-xs">Address</TableHead>
            <TableHead className="font-sans text-xs">Status</TableHead>
            {!compact && <TableHead className="font-sans text-xs">Onboarding</TableHead>}
            {!compact && <TableHead className="font-sans text-xs">Updated</TableHead>}
            {!compact && <TableHead className="font-sans text-xs">Comments</TableHead>}
            {!compact && <TableHead className="font-sans text-xs">Messages</TableHead>}
            <TableHead className="font-sans text-xs text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => {
            const onboarding = getOnboardingProgress(client);
            const isSelected = selectedIds.includes(client.id);
            return (
              <TableRow key={client.id} className={`cursor-pointer hover:bg-muted/50 ${isSelected ? "bg-primary/5" : ""}`} onClick={() => navigate(`/admin/clients/${client.id}`)}>
                {!compact && (
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox checked={isSelected} onCheckedChange={() => toggleSelect(client.id)} />
                  </TableCell>
                )}
                <TableCell className="font-sans text-sm font-medium">{client.name}</TableCell>
                <TableCell className="font-sans text-sm text-muted-foreground">{client.address}</TableCell>
                <TableCell>
                  <Badge className={`${statusStyles[client.reportStatus] || statusStyles.draft} text-[11px] font-sans font-medium border-none`}>
                    {statusLabels[client.reportStatus] || "Draft"}
                  </Badge>
                </TableCell>
                {!compact && (
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={(onboarding.completed / onboarding.total) * 100} className="h-1.5 w-16" />
                      <span className="font-mono text-[10px] text-muted-foreground">{onboarding.completed}/{onboarding.total}</span>
                    </div>
                  </TableCell>
                )}
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
                {!compact && (
                  <TableCell>
                    {client.unreadMessages > 0 ? (
                      <span className="flex items-center gap-1.5 text-destructive">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span className="text-sm font-sans font-medium">{client.unreadMessages}</span>
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
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default ClientTable;
