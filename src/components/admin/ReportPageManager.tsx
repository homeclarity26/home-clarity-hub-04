import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExternalLink, Plus, CheckCircle, Edit, AlertTriangle, XCircle, Sparkles } from "lucide-react";
import { mockReportPages } from "@/data/adminMockData";

const statusConfig: Record<string, { icon: typeof CheckCircle; label: string; className: string }> = {
  complete: { icon: CheckCircle, label: "Complete", className: "bg-primary/10 text-foreground" },
  draft: { icon: Edit, label: "Draft", className: "bg-muted text-muted-foreground" },
  needs_review: { icon: AlertTriangle, label: "Needs Review", className: "bg-accent/20 text-accent-foreground" },
  inactive: { icon: XCircle, label: "Inactive", className: "bg-muted/50 text-muted-foreground" },
};

interface ReportPageManagerProps {
  propertyId?: string;
}

const ReportPageManager = ({ propertyId }: ReportPageManagerProps) => {
  const groups = [...new Set(mockReportPages.map((p) => p.group))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-sans font-semibold text-foreground">Report Pages</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs font-sans" onClick={() => window.open(`/portal/${propertyId || "prop-1"}?edit=true`, "_blank")}>
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
                <TableHead className="font-sans text-xs">AI</TableHead>
                <TableHead className="font-sans text-xs">Last Edited</TableHead>
                <TableHead className="font-sans text-xs text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockReportPages
                .filter((p) => p.group === group)
                .map((page) => {
                  const status = statusConfig[page.status];
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
                      <TableCell>
                        {page.aiGenerated && (
                          <Sparkles className="w-3.5 h-3.5 text-accent" />
                        )}
                      </TableCell>
                      <TableCell className="font-sans text-sm text-muted-foreground">{page.lastEdited}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="text-xs font-sans">
                          Edit
                        </Button>
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
