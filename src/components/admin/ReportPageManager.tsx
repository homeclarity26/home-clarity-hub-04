import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExternalLink, Plus, CheckCircle, Edit, AlertTriangle, XCircle, Sparkles, Loader2 } from "lucide-react";
import { useAdminReportPages } from "@/hooks/useAdminData";

const statusConfig: Record<string, { icon: typeof CheckCircle; label: string; className: string }> = {
  complete: { icon: CheckCircle, label: "Complete", className: "bg-primary/10 text-foreground" },
  published: { icon: CheckCircle, label: "Published", className: "bg-primary/10 text-foreground" },
  draft: { icon: Edit, label: "Draft", className: "bg-muted text-muted-foreground" },
  needs_review: { icon: AlertTriangle, label: "Needs Review", className: "bg-accent/20 text-accent-foreground" },
  inactive: { icon: XCircle, label: "Inactive", className: "bg-muted/50 text-muted-foreground" },
};

interface ReportPageManagerProps {
  propertyId?: string;
  reportId?: string | null;
}

const ReportPageManager = ({ propertyId, reportId }: ReportPageManagerProps) => {
  const { data: pages, isLoading } = useAdminReportPages(reportId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!pages || pages.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm font-sans text-muted-foreground">No report pages yet.</p>
        <Button variant="outline" size="sm" className="mt-3 gap-1.5 text-xs font-sans" onClick={() => window.open(`/portal/${propertyId}?edit=true`, "_blank")}>
          <ExternalLink className="w-3.5 h-3.5" />
          Open in Portal to create pages
        </Button>
      </div>
    );
  }

  const groups = [...new Set(pages.map((p) => p.group_name))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-sans font-semibold text-foreground">Report Pages</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs font-sans" onClick={() => window.open(`/portal/${propertyId}?edit=true`, "_blank")}>
            <ExternalLink className="w-3.5 h-3.5" />
            Open in Portal
          </Button>
          <Button size="sm" className="gap-1.5 text-xs font-sans">
            <Plus className="w-3.5 h-3.5" />
            Add Page
          </Button>
        </div>
      </div>

      {groups.map((group) => (
        <div key={group}>
          <h4 className="text-xs font-sans font-semibold text-muted-foreground uppercase tracking-wider mb-2">{group}</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-sans text-xs">Page</TableHead>
                <TableHead className="font-sans text-xs">Status</TableHead>
                <TableHead className="font-sans text-xs">Last Edited</TableHead>
                <TableHead className="font-sans text-xs text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pages
                .filter((p) => p.group_name === group)
                .map((page) => {
                  const status = statusConfig[page.status] || statusConfig.draft;
                  const StatusIcon = status.icon;
                  return (
                    <TableRow key={page.id}>
                      <TableCell className="font-sans text-sm font-medium">{page.title}</TableCell>
                      <TableCell>
                        <Badge className={`${status.className} text-[11px] font-sans font-medium border-none gap-1`}>
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-sans text-sm text-muted-foreground">
                        {new Date(page.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="text-xs font-sans">Edit</Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </div>
      ))}
    </div>
  );
};

export default ReportPageManager;
