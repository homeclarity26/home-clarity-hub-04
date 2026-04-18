import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Copy, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminClients } from "@/hooks/useAdminData";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface ReportCloneDialogProps {
  sourceReportId: string;
  sourcePropertyName: string;
}

const ReportCloneDialog = ({ sourceReportId, sourcePropertyName }: ReportCloneDialogProps) => {
  const [open, setOpen] = useState(false);
  const [targetPropertyId, setTargetPropertyId] = useState("");
  const [isCloning, setIsCloning] = useState(false);
  const { data: clients } = useAdminClients();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const handleClone = async () => {
    if (!targetPropertyId || !user) return;
    setIsCloning(true);
    try {
      // Fetch source pages
      const { data: sourcePages, error: pagesErr } = await supabase
        .from("report_pages")
        .select("*")
        .eq("report_id", sourceReportId)
        .order("sort_order");
      if (pagesErr) throw pagesErr;

      // Create new report
      const { data: newReport, error: reportErr } = await supabase
        .from("reports")
        .insert({ property_id: targetPropertyId, created_by: user.id, title: "Home Clarity Report", status: "draft" })
        .select()
        .single();
      if (reportErr) throw reportErr;

      // Clone pages
      if (sourcePages && sourcePages.length > 0) {
        const clonedPages = sourcePages.map((p) => ({
          report_id: newReport.id,
          page_key: p.page_key,
          title: p.title,
          group_name: p.group_name,
          sort_order: p.sort_order,
          block_config: p.block_config,
          template_id: p.template_id,
          narrative: p.narrative,
          specs: p.specs,
          tiers: p.tiers,
          timing: p.timing,
          recommendations: p.recommendations,
          key_observations: p.key_observations,
          risks: p.risks,
          dependencies: p.dependencies,
          maintenance: p.maintenance,
          health_bar: p.health_bar,
          status: "draft" as const,
          condition_rating: null as string | null,
          creator_notes: null as string | null,
          findings: p.findings,
        }));
        const { error: insertErr } = await supabase.from("report_pages").insert(clonedPages);
        if (insertErr) throw insertErr;
      }

      await queryClient.invalidateQueries({ queryKey: ["admin-clients"] });
      toast.success(`Report cloned with ${sourcePages?.length || 0} pages`);
      setOpen(false);
    } catch (err) {
      console.error("Clone failed:", err);
      toast.error("Failed to clone report");
    } finally {
      setIsCloning(false);
    }
  };

  // Filter to properties without reports
  const availableTargets = clients?.filter((c) => !c.reportId && c.propertyId !== targetPropertyId) || [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs font-sans">
          <Copy className="w-3.5 h-3.5" />
          Clone Report
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-sans">Clone Report</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground font-sans">
          Clone all pages from <strong>{sourcePropertyName}</strong> to another property as a starting point.
        </p>
        <div className="space-y-3 mt-2">
          <Label className="font-sans text-sm">Target Property</Label>
          {availableTargets.length > 0 ? (
            <Select value={targetPropertyId} onValueChange={setTargetPropertyId}>
              <SelectTrigger><SelectValue placeholder="Select a property…" /></SelectTrigger>
              <SelectContent>
                {availableTargets.map((c) => (
                  <SelectItem key={c.propertyId} value={c.propertyId} className="text-sm font-sans">
                    {c.propertyName} — {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p className="text-xs text-muted-foreground font-sans">No properties without reports available.</p>
          )}
          <Button onClick={handleClone} disabled={!targetPropertyId || isCloning} className="w-full gap-1.5 font-sans">
            {isCloning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
            {isCloning ? "Cloning…" : "Clone Report"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReportCloneDialog;
