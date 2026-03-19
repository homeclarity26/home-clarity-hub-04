import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Building2, Mail } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface BidRequestFlowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectTitle: string;
}

const BidRequestFlow = ({ open, onOpenChange, projectId, projectTitle }: BidRequestFlowProps) => {
  const { user } = useAuth();
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [coverNote, setCoverNote] = useState(
    `We are requesting bids for the following project: ${projectTitle}.\n\nPlease review the attached Scope of Work and submit your bid using the provided response template.\n\nThank you,\nHometown Builders Club`
  );
  const [sending, setSending] = useState(false);

  const { data: vendors } = useQuery({
    queryKey: ["central-vendors-for-bids"],
    enabled: open,
    queryFn: async () => {
      const { data } = await (supabase.from("central_vendors" as any) as any)
        .select("*")
        .eq("status", "active")
        .order("company_name");
      return data || [];
    },
  });

  const { data: currentScope } = useQuery({
    queryKey: ["project-scope-current", projectId],
    enabled: open,
    queryFn: async () => {
      const { data } = await (supabase.from("project_scopes" as any) as any)
        .select("*")
        .eq("project_id", projectId)
        .eq("is_current", true)
        .single();
      return data;
    },
  });

  const toggleVendor = (id: string) => {
    setSelectedVendors((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };

  const handleSendBidRequests = async () => {
    if (!selectedVendors.length) { toast.error("Select at least one contractor"); return; }
    if (!currentScope) { toast.error("Generate a scope of work first"); return; }

    setSending(true);
    try {
      // Create bid entries for each selected vendor
      const selectedVendorData = vendors?.filter((v: any) => selectedVendors.includes(v.id)) || [];
      const bidInserts = selectedVendorData.map((v: any) => ({
        project_id: projectId,
        contractor_name: v.company_name,
        contact_name: v.contact_name || null,
        phone: v.phone || null,
        email: v.email || null,
        scope_of_work: currentScope.formatted_markdown?.slice(0, 500) || "See attached scope",
        bid_amount: 0,
        status: "pending",
        notes: `Bid request sent with SOW v${currentScope.version_number}`,
      }));

      const { error } = await (supabase.from("contractor_bids" as any) as any).insert(bidInserts);
      if (error) throw error;

      toast.success(`Bid requests created for ${selectedVendorData.length} contractor(s)`);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to send bid requests");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-sans flex items-center gap-2">
            <Send className="w-5 h-5 text-primary" />Send for Bids — {projectTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {!currentScope && (
          <Card className="p-4 border-destructive/30 bg-destructive/5">
              <p className="text-sm font-sans text-destructive">
                No scope of work found. Generate a scope first before sending bid requests.
              </p>
            </Card>
          )}

          {currentScope && (
            <Card className="p-3 flex items-center gap-3">
              <Badge variant="secondary" className="text-[10px] font-sans">SOW v{currentScope.version_number}</Badge>
              <span className="text-xs text-muted-foreground font-sans">{currentScope.detail_level} · {new Date(currentScope.created_at).toLocaleDateString()}</span>
            </Card>
          )}

          <div>
            <Label className="font-sans text-xs font-semibold">Select Contractors</Label>
            <ScrollArea className="h-[200px] border rounded-md mt-1">
              <div className="p-2 space-y-1">
                {vendors?.length ? vendors.map((v: any) => (
                  <label key={v.id} className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer">
                    <Checkbox
                      checked={selectedVendors.includes(v.id)}
                      onCheckedChange={() => toggleVendor(v.id)}
                    />
                    <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-sans font-medium text-foreground truncate">{v.company_name}</p>
                      <p className="text-[10px] text-muted-foreground font-sans">
                        {v.specialties?.join(", ") || "General"}{v.email ? ` · ${v.email}` : ""}
                      </p>
                    </div>
                  </label>
                )) : (
                  <p className="text-sm text-muted-foreground font-sans p-4 text-center">No contractors in vendor directory.</p>
                )}
              </div>
            </ScrollArea>
            {selectedVendors.length > 0 && (
              <p className="text-[10px] text-muted-foreground font-sans mt-1">{selectedVendors.length} selected</p>
            )}
          </div>

          <div>
            <Label className="font-sans text-xs font-semibold">Cover Note</Label>
            <Textarea
              value={coverNote}
              onChange={(e) => setCoverNote(e.target.value)}
              rows={4}
              className="font-sans text-sm mt-1"
            />
          </div>

          <Button
            onClick={handleSendBidRequests}
            disabled={!selectedVendors.length || !currentScope || sending}
            className="w-full gap-2 font-sans"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            Create Bid Requests ({selectedVendors.length})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};


export default BidRequestFlow;
