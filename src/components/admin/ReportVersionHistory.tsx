import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, Loader2, RotateCcw, Eye, GitCompare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";

interface ReportVersionHistoryProps {
  propertyId: string;
  reportId: string;
  currentPages?: any[];
}

const ReportVersionHistory = ({ propertyId, reportId, currentPages }: ReportVersionHistoryProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [previewVersion, setPreviewVersion] = useState<any>(null);
  const [compareVersion, setCompareVersion] = useState<any>(null);

  const { data: versions, isLoading } = useQuery({
    queryKey: ["report-versions", propertyId],
    enabled: open,
    queryFn: async () => {
      const { data } = await supabase.from("report_versions").select("*").eq("client_id", propertyId).order("saved_at", { ascending: false });
      return data || [];
    },
  });

  const saveVersion = async (notes?: string) => {
    if (!currentPages || !user) return;
    const lastVersion = versions?.[0]?.version_number || 0;
    await supabase.from("report_versions").insert({
      client_id: propertyId,
      version_number: lastVersion + 1,
      report_snapshot_json: { pages: currentPages },
      saved_by_admin_id: user.id,
      change_notes: notes || "Manual save",
      is_published: false,
    });
    queryClient.invalidateQueries({ queryKey: ["report-versions", propertyId] });
    toast.success("Version saved");
  };

  const restoreVersion = async (version: any) => {
    // Save current first
    await saveVersion("Auto-save before restore");
    // Then restore pages from snapshot
    const snapshot = version.report_snapshot_json;
    if (snapshot?.pages) {
      for (const page of snapshot.pages) {
        await supabase.from("report_pages").update({
          narrative: page.narrative,
          condition_rating: page.condition_rating,
          specs: page.specs,
          tiers: page.tiers,
          key_observations: page.key_observations,
          risks: page.risks,
        }).eq("id", page.id);
      }
    }
    toast.success(`Restored to v${version.version_number}`);
    queryClient.invalidateQueries({ queryKey: ["admin-report-pages", reportId] });
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-1 text-xs">
        <Clock className="w-3.5 h-3.5" />Version History
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />Version History
            </DialogTitle>
          </DialogHeader>

          <div className="flex gap-2 mb-4">
            <Button size="sm" onClick={() => saveVersion()} className="gap-1 text-xs">Save Current Version</Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : (versions || []).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No versions saved yet. Click "Save Current Version" to create a snapshot.</p>
          ) : (
            <ScrollArea className="max-h-[400px]">
              <div className="space-y-2">
                {(versions || []).map((v: any) => (
                  <Card key={v.id} className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">v{v.version_number}</Badge>
                          {v.is_published && <Badge variant="default" className="text-[10px]">Published</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{format(new Date(v.saved_at), "MMM d, yyyy h:mm a")}</p>
                        {v.change_notes && <p className="text-xs text-foreground mt-0.5">{v.change_notes}</p>}
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setPreviewVersion(v)} className="text-xs gap-1">
                          <Eye className="w-3.5 h-3.5" />Preview
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => restoreVersion(v)} className="text-xs gap-1">
                          <RotateCcw className="w-3.5 h-3.5" />Restore
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={!!previewVersion} onOpenChange={() => setPreviewVersion(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader><DialogTitle>Version {previewVersion?.version_number} Preview</DialogTitle></DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            {previewVersion?.report_snapshot_json?.pages?.map((page: any) => (
              <Card key={page.id} className="p-3 mb-2">
                <p className="text-sm font-semibold text-foreground">{page.title}</p>
                {page.condition_rating && <Badge variant="secondary" className="text-[10px] mt-1">{page.condition_rating}</Badge>}
                {page.narrative && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    {(Array.isArray(page.narrative) ? page.narrative : [page.narrative]).map((n: string, i: number) => <p key={i} className="mb-1">{typeof n === 'string' ? n : JSON.stringify(n)}</p>)}
                  </div>
                )}
              </Card>
            ))}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ReportVersionHistory;
