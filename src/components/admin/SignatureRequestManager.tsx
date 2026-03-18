import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { PenTool, Plus, Send, Download, FileCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface SignatureRequestManagerProps {
  clientId: string;
  propertyId: string;
}

const SignatureRequestManager = ({ clientId, propertyId }: SignatureRequestManagerProps) => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [docType, setDocType] = useState("custom");
  const [content, setContent] = useState("");
  const [expiresIn, setExpiresIn] = useState(30);

  const { data: requests = [] } = useQuery({
    queryKey: ["signature-requests", clientId],
    queryFn: async () => {
      const { data } = await (supabase.from("signature_requests") as any)
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const create = async () => {
    if (!user || !title.trim() || !content.trim()) return;
    const expiresAt = new Date(Date.now() + expiresIn * 86400000).toISOString();
    await (supabase.from("signature_requests") as any).insert({
      client_id: clientId, admin_id: user.id, document_title: title.trim(),
      document_type: docType, document_content_html: content.trim(),
      status: "sent", sent_at: new Date().toISOString(), expires_at: expiresAt,
    });
    setCreateOpen(false); setTitle(""); setContent("");
    qc.invalidateQueries({ queryKey: ["signature-requests", clientId] });
    toast.success("Signature request sent");
  };

  const statusColors: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    sent: "bg-accent/20 text-accent",
    signed: "bg-green-100 text-green-800",
    declined: "bg-red-100 text-red-800",
    expired: "bg-muted text-muted-foreground",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PenTool className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-sans font-semibold text-foreground">E-Signatures</h3>
          <Badge variant="secondary" className="text-[10px]">{requests.length}</Badge>
        </div>
        <Button size="sm" className="gap-1.5 text-xs font-sans" onClick={() => setCreateOpen(true)}>
          <Plus className="w-3.5 h-3.5" />Request Signature
        </Button>
      </div>

      <div className="space-y-2">
        {requests.map((req: any) => (
          <Card key={req.id} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-sans font-medium text-foreground">{req.document_title}</span>
                  <Badge className={`text-[10px] border-none ${statusColors[req.status] || ""}`}>
                    {req.status}
                  </Badge>
                </div>
                <p className="text-[11px] font-mono text-muted-foreground mt-0.5">
                  {req.document_type.replace("_", " ")} · Sent {req.sent_at ? new Date(req.sent_at).toLocaleDateString() : "—"}
                  {req.signed_at && ` · Signed ${new Date(req.signed_at).toLocaleDateString()}`}
                </p>
              </div>
              {req.status === "signed" && req.signed_document_url && (
                <Button variant="outline" size="sm" className="gap-1 text-xs font-sans">
                  <Download className="w-3 h-3" />Download
                </Button>
              )}
            </div>
          </Card>
        ))}
        {requests.length === 0 && (
          <Card className="p-6 text-center">
            <FileCheck className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm font-sans text-muted-foreground">No signature requests yet.</p>
          </Card>
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="font-sans">Request Signature</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-sans">Document Title</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Service Agreement" className="font-sans" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-sans">Document Type</Label>
                <Select value={docType} onValueChange={setDocType}>
                  <SelectTrigger className="font-sans text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom">Custom Document</SelectItem>
                    <SelectItem value="project_approval">Project Approval</SelectItem>
                    <SelectItem value="service_agreement">Service Agreement</SelectItem>
                    <SelectItem value="membership_renewal">Membership Renewal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-sans">Document Content</Label>
              <Textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Write or paste document content..." className="font-sans min-h-[150px]" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-sans">Expires In (days)</Label>
              <Input type="number" value={expiresIn} onChange={e => setExpiresIn(Number(e.target.value))} className="font-mono w-24" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={create} disabled={!title.trim() || !content.trim()} className="gap-1.5 font-sans">
              <Send className="w-3.5 h-3.5" />Send for Signature
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SignatureRequestManager;
