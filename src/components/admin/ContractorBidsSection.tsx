import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Star, Check, X } from "lucide-react";
import { toast } from "sonner";

interface Bid {
  id: string;
  project_id: string;
  contractor_name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  scope_of_work: string | null;
  bid_amount: number;
  estimated_timeline: string | null;
  warranty_offered: string | null;
  bid_date: string | null;
  notes: string | null;
  status: string;
  created_at: string;
}

interface ContractorBidsSectionProps {
  projectId: string;
  projectTitle: string;
  isAdmin?: boolean;
}

const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

const defaultForm = {
  contractor_name: "", contact_name: "", phone: "", email: "",
  scope_of_work: "", bid_amount: "", estimated_timeline: "",
  warranty_offered: "", bid_date: new Date().toISOString().split("T")[0], notes: "",
};

const ContractorBidsSection = ({ projectId, projectTitle, isAdmin = false }: ContractorBidsSectionProps) => {
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(defaultForm);

  const loadBids = async () => {
    const { data } = await supabase.from("contractor_bids")
      .select("*")
      .eq("project_id", projectId)
      .order("bid_amount", { ascending: true });
    setBids(data || []);
    setLoading(false);
  };

  useEffect(() => { loadBids(); }, [projectId]);

  const createBid = async () => {
    if (!form.contractor_name || !form.bid_amount) return;
    const { error } = await supabase.from("contractor_bids").insert({
      project_id: projectId,
      contractor_name: form.contractor_name,
      contact_name: form.contact_name || null,
      phone: form.phone || null,
      email: form.email || null,
      scope_of_work: form.scope_of_work || null,
      bid_amount: parseFloat(form.bid_amount),
      estimated_timeline: form.estimated_timeline || null,
      warranty_offered: form.warranty_offered || null,
      bid_date: form.bid_date || null,
      notes: form.notes || null,
    });
    if (error) { toast.error("Failed to add bid"); return; }
    toast.success("Bid added");
    setCreateOpen(false);
    setForm(defaultForm);
    loadBids();
  };

  const selectBid = async (bidId: string) => {
    // Reset all bids to pending, then set selected
    await supabase.from("contractor_bids")
      .update({ status: "pending" })
      .eq("project_id", projectId);
    await supabase.from("contractor_bids")
      .update({ status: "selected" })
      .eq("id", bidId);
    toast.success("Bid selected as recommended");
    loadBids();
  };

  const rejectBid = async (bidId: string) => {
    await supabase.from("contractor_bids")
      .update({ status: "rejected" })
      .eq("id", bidId);
    toast.success("Bid rejected");
    loadBids();
  };

  const deleteBid = async (bidId: string) => {
    await supabase.from("contractor_bids").delete().eq("id", bidId);
    toast.success("Bid removed");
    loadBids();
  };

  const lowestAmount = bids.length > 0 ? Math.min(...bids.map(b => b.bid_amount)) : 0;

  if (loading) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-sans font-semibold text-foreground">Contractor Bids</h4>
        {isAdmin && (
          <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) setForm(defaultForm); }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 text-xs font-sans"><Plus className="w-3.5 h-3.5" />Add Bid</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle className="font-sans">Add Contractor Bid: {projectTitle}</DialogTitle></DialogHeader>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="font-sans text-xs">Contractor Name *</Label><Input value={form.contractor_name} onChange={(e) => setForm({ ...form, contractor_name: e.target.value })} /></div>
                  <div><Label className="font-sans text-xs">Contact Name</Label><Input value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="font-sans text-xs">Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                  <div><Label className="font-sans text-xs">Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                </div>
                <div><Label className="font-sans text-xs">Scope of Work</Label><Textarea value={form.scope_of_work} onChange={(e) => setForm({ ...form, scope_of_work: e.target.value })} rows={2} /></div>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label className="font-sans text-xs">Bid Amount ($) *</Label><Input type="number" value={form.bid_amount} onChange={(e) => setForm({ ...form, bid_amount: e.target.value })} /></div>
                  <div><Label className="font-sans text-xs">Timeline</Label><Input value={form.estimated_timeline} onChange={(e) => setForm({ ...form, estimated_timeline: e.target.value })} placeholder="e.g. 2 weeks" /></div>
                  <div><Label className="font-sans text-xs">Warranty</Label><Input value={form.warranty_offered} onChange={(e) => setForm({ ...form, warranty_offered: e.target.value })} placeholder="e.g. 1 year" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="font-sans text-xs">Bid Date</Label><Input type="date" value={form.bid_date} onChange={(e) => setForm({ ...form, bid_date: e.target.value })} /></div>
                </div>
                <div><Label className="font-sans text-xs">Advisor Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
              </div>
              <Button onClick={createBid} className="w-full font-sans">Add Bid</Button>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {bids.length === 0 ? (
        <Card className="p-6 text-center">
          <p className="text-sm font-sans text-muted-foreground">No bids yet.{isAdmin ? " Add contractor bids for comparison." : ""}</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-sans text-xs">Contractor</TableHead>
                <TableHead className="font-sans text-xs">Scope</TableHead>
                <TableHead className="font-sans text-xs text-right">Amount</TableHead>
                <TableHead className="font-sans text-xs">Timeline</TableHead>
                <TableHead className="font-sans text-xs">Warranty</TableHead>
                {isAdmin && <TableHead className="font-sans text-xs">Notes</TableHead>}
                <TableHead className="font-sans text-xs w-24">Status</TableHead>
                {isAdmin && <TableHead className="font-sans text-xs w-28"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {bids.map((bid) => {
                const isLowest = bid.bid_amount === lowestAmount && bids.length > 1;
                const isSelected = bid.status === "selected";
                const isRejected = bid.status === "rejected";
                return (
                  <TableRow key={bid.id} className={`${isSelected ? "bg-accent/10" : isLowest ? "bg-green-50 dark:bg-green-900/10" : ""} ${isRejected ? "opacity-50" : ""}`}>
                    <TableCell className="font-sans text-sm">
                      <div>
                        <p className="font-medium">{bid.contractor_name}</p>
                        {bid.contact_name && <p className="text-xs text-muted-foreground">{bid.contact_name}</p>}
                        {(bid.phone || bid.email) && (
                          <p className="text-xs text-muted-foreground">{[bid.phone, bid.email].filter(Boolean).join(" · ")}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-sans text-xs text-muted-foreground max-w-[200px] truncate">{bid.scope_of_work || "—"}</TableCell>
                    <TableCell className="font-mono text-sm text-right font-medium">
                      {fmt(bid.bid_amount)}
                      {isLowest && <Badge className="ml-2 bg-green-100 text-green-800 text-[9px]">Lowest</Badge>}
                    </TableCell>
                    <TableCell className="font-sans text-xs text-muted-foreground">{bid.estimated_timeline || "—"}</TableCell>
                    <TableCell className="font-sans text-xs text-muted-foreground">{bid.warranty_offered || "—"}</TableCell>
                    {isAdmin && <TableCell className="font-sans text-xs text-muted-foreground max-w-[150px] truncate">{bid.notes || "—"}</TableCell>}
                    <TableCell>
                      {isSelected ? (
                        <Badge className="bg-accent/20 text-accent text-[9px] gap-1"><Star className="w-3 h-3" />HBC Recommended</Badge>
                      ) : isRejected ? (
                        <Badge variant="secondary" className="text-[9px]">Rejected</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[9px]">Pending</Badge>
                      )}
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {!isSelected && !isRejected && (
                            <Button variant="ghost" size="sm" onClick={() => selectBid(bid.id)} title="Select as recommended">
                              <Check className="w-3.5 h-3.5 text-accent" />
                            </Button>
                          )}
                          {!isRejected && !isSelected && (
                            <Button variant="ghost" size="sm" onClick={() => rejectBid(bid.id)} title="Reject">
                              <X className="w-3.5 h-3.5 text-muted-foreground" />
                            </Button>
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm"><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle className="font-sans">Delete bid?</AlertDialogTitle>
                                <AlertDialogDescription className="font-sans">Remove {bid.contractor_name}'s bid from this project.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="font-sans">Cancel</AlertDialogCancel>
                                <AlertDialogAction className="font-sans bg-destructive text-destructive-foreground" onClick={() => deleteBid(bid.id)}>Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
};

export default ContractorBidsSection;
