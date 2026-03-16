import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExternalLink, CheckCircle, Edit, AlertTriangle, XCircle, Loader2 } from "lucide-react";
import { useAdminReportPages } from "@/hooks/useAdminData";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const statusConfig: Record<string, { icon: typeof CheckCircle; label: string; className: string }> = {
  complete: { icon: CheckCircle, label: "Complete", className: "bg-emerald-100 text-emerald-700" },
  published: { icon: CheckCircle, label: "Published", className: "bg-primary/10 text-primary" },
  draft: { icon: Edit, label: "Draft", className: "bg-muted text-muted-foreground" },
  needs_review: { icon: AlertTriangle, label: "Needs Review", className: "bg-accent/20 text-accent-foreground" },
  inactive: { icon: XCircle, label: "Inactive", className: "bg-muted/50 text-muted-foreground" },
};

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "needs_review", label: "Needs Review" },
  { value: "complete", label: "Complete" },
  { value: "published", label: "Published" },
  { value: "inactive", label: "Inactive" },
];

interface ReportPageManagerProps {
  propertyId?: string;
  reportId?: string | null;
}

async function recalculateCompletion(reportId: string) {
  try {
    const { data: pages } = await supabase
      .from("report_pages")
      .select("status")
      .eq("report_id", reportId);

    if (!pages || pages.length === 0) return;

    const done = pages.filter((p) => p.status === "complete" || p.status === "published").length;
    const pct = Math.round((done / pages.length) * 100);

    await supabase.from("reports").update({ completion_percent: pct }).eq("id", reportId);
  } catch (err) {
    console.error("Failed to recalculate completion:", err);
  }
}

const ReportPageManager = ({ propertyId, reportId }: ReportPageManagerProps) => {
  const { data: pages, isLoading } = useAdminReportPages(reportId);
  const queryClient = useQueryClient();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleStatusChange = async (pageId: string, newStatus: string) => {
    setUpdatingId(pageId);
    try {
      const { error } = await supabase
        .from("report_pages")
        .update({ status: newStatus })
        .eq("id", pageId);

      if (error) throw error;

      // Recalculate completion % on the parent report
      if (reportId) await recalculateCompletion(reportId);

      // Invalidate queries so UI refreshes
      await queryClient.invalidateQueries({ queryKey: ["admin-report-pages", reportId] });
      await queryClient.invalidateQueries({ queryKey: ["admin-clients"] });

      toast.success(`Page marked as ${STATUS_OPTIONS.find((s) => s.value === newStatus)?.label}`);
    } catch (err) {
      console.error("Status update failed:", err);
      toast.error("Failed to update page status");
    } finally {
      setUpdatingId(null);
    }
  };

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

  // Completion summary
  const totalPages = pages.length;
  const donePages = pages.filter((p) => p.status === "complete" || p.status === "published").length;
  const needsReviewPages = pages.filter((p) => p.status === "needs_review").length;
  const completionPct = totalPages > 0 ? Math.round((donePages / totalPages) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-sans font-semibold text-foreground">Report Pages</h3>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-muted-foreground">
              {donePages}/{totalPages} complete
            </span>
            {needsReviewPages > 0 && (
              <Badge className="bg-accent/20 text-accent-foreground text-[10px] font-mono border-none">
                {needsReviewPages} need review
              </Badge>
            )}
            <div className="h-1.5 w-20 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all duration-500"
                style={{ width: `${completionPct}%` }}
              />
            </div>
            <span className="font-mono text-[10px] text-muted-foreground">{completionPct}%</span>
          </div>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs font-sans" onClick={() => window.open(`/portal/${propertyId}?edit=true`, "_blank")}>
          <ExternalLink className="w-3.5 h-3.5" />
          Open in Portal
        </Button>
      </div>

      {groups.map((group) => (
        <div key={group}>
          <h4 className="text-xs font-sans font-semibold text-muted-foreground uppercase tracking-wider mb-2">{group}</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-sans text-xs">Page</TableHead>
                <TableHead className="font-sans text-xs w-[180px]">Status</TableHead>
                <TableHead className="font-sans text-xs hidden sm:table-cell">Last Edited</TableHead>
                <TableHead className="font-sans text-xs text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pages
                .filter((p) => p.group_name === group)
                .map((page) => {
                  const status = statusConfig[page.status] || statusConfig.draft;
                  const StatusIcon = status.icon;
                  const isUpdating = updatingId === page.id;

                  return (
                    <TableRow key={page.id}>
                      <TableCell className="font-sans text-sm font-medium">{page.title}</TableCell>
                      <TableCell>
                        {isUpdating ? (
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span className="text-xs font-sans">Saving…</span>
                          </div>
                        ) : (
                          <Select
                            value={page.status || "draft"}
                            onValueChange={(val) => handleStatusChange(page.id, val)}
                          >
                            <SelectTrigger className="h-7 text-xs font-sans border-none bg-transparent px-0 w-auto gap-1.5 focus:ring-0 focus:ring-offset-0 [&>svg]:hidden">
                              <Badge className={`${status.className} text-[11px] font-sans font-medium border-none gap-1 cursor-pointer`}>
                                <StatusIcon className="w-3 h-3" />
                                {status.label}
                              </Badge>
                            </SelectTrigger>
                            <SelectContent>
                              {STATUS_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value} className="text-xs font-sans">
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                      <TableCell className="font-sans text-sm text-muted-foreground hidden sm:table-cell">
                        {new Date(page.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs font-sans"
                          onClick={() => window.open(`/portal/${propertyId}?edit=true&page=${page.page_key}`, "_blank")}
                        >
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
