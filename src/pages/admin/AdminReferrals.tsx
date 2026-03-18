import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Loader2, Users, DollarSign, TrendingUp, Share2, GripVertical } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";

const STATUSES = ["lead", "contacted", "consultation_scheduled", "report_completed", "converted", "not_converted"];
const STATUS_LABELS: Record<string, string> = { lead: "Lead", contacted: "Contacted", consultation_scheduled: "Consultation", report_completed: "Report Done", converted: "Converted", not_converted: "Not Converted" };
const STATUS_COLORS: Record<string, string> = { lead: "bg-muted", contacted: "bg-blue-50", consultation_scheduled: "bg-accent/10", report_completed: "bg-primary/10", converted: "bg-green-50", not_converted: "bg-destructive/5" };

const AdminReferrals = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [view, setView] = useState<"kanban" | "table">("kanban");
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState<any>({});
  const [dragId, setDragId] = useState<string | null>(null);

  const { data: referrals, isLoading } = useQuery({
    queryKey: ["referrals"],
    queryFn: async () => {
      const { data, error } = await (supabase.from("referrals") as any).select("*").order("created_at", { ascending: false });
      if (error) throw error;
      // Join with profiles for referring client name
      const clientIds = [...new Set((data || []).map((r: any) => r.referring_client_id))];
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name");
      const nameMap: Record<string, string> = {};
      profiles?.forEach(p => { nameMap[p.user_id] = p.full_name || "Unknown"; });
      return (data || []).map((r: any) => ({ ...r, referring_client_name: nameMap[r.referring_client_id] || "Unknown" }));
    },
  });

  const { data: clients } = useQuery({
    queryKey: ["admin-clients-select"],
    queryFn: async () => {
      const { data: props } = await supabase.from("properties").select("id, property_name, address, client_user_id");
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name");
      const nameMap: Record<string, string> = {};
      profiles?.forEach(p => { nameMap[p.user_id] = p.full_name || "Unknown"; });
      return (props || []).map(p => ({ id: p.client_user_id, name: nameMap[p.client_user_id] || p.property_name || p.address }));
    },
  });

  const totalReferrals = (referrals || []).length;
  const converted = (referrals || []).filter((r: any) => r.status === "converted").length;
  const conversionRate = totalReferrals > 0 ? Math.round((converted / totalReferrals) * 100) : 0;
  const totalRewards = (referrals || []).filter((r: any) => r.reward_status === "applied").reduce((s: number, r: any) => s + Number(r.reward_amount || 0), 0);

  const saveReferral = async () => {
    if (!form.referred_name?.trim() || !form.referring_client_id) return;
    const payload = { referring_client_id: form.referring_client_id, referred_name: form.referred_name, referred_email: form.referred_email || null, referred_phone: form.referred_phone || null, status: form.status || "lead", reward_status: form.reward_status || "pending", reward_amount: form.reward_amount || 250, notes: form.notes || null, admin_id: user?.id };
    if (form.id) {
      await (supabase.from("referrals") as any).update(payload).eq("id", form.id);
    } else {
      await (supabase.from("referrals") as any).insert(payload);
    }
    setEditOpen(false); setForm({});
    queryClient.invalidateQueries({ queryKey: ["referrals"] });
    toast.success("Referral saved");
  };

  const updateStatus = async (id: string, status: string) => {
    await (supabase.from("referrals") as any).update({ status }).eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["referrals"] });
  };

  return (
    <div>
      <AdminHeader breadcrumbs={[{ label: "Referrals" }]} />
      <div className="p-6 max-w-7xl space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="p-4"><div className="flex items-center gap-3"><Users className="w-8 h-8 text-primary" /><div><p className="text-2xl font-bold">{totalReferrals}</p><p className="text-xs text-muted-foreground">Total Referrals</p></div></div></Card>
          <Card className="p-4"><div className="flex items-center gap-3"><TrendingUp className="w-8 h-8 text-accent" /><div><p className="text-2xl font-bold">{conversionRate}%</p><p className="text-xs text-muted-foreground">Conversion Rate</p></div></div></Card>
          <Card className="p-4"><div className="flex items-center gap-3"><DollarSign className="w-8 h-8 text-green-600" /><div><p className="text-2xl font-bold">${totalRewards.toLocaleString()}</p><p className="text-xs text-muted-foreground">Rewards Issued</p></div></div></Card>
          <Card className="p-4"><div className="flex items-center gap-3"><Share2 className="w-8 h-8 text-muted-foreground" /><div><p className="text-2xl font-bold">{converted}</p><p className="text-xs text-muted-foreground">Converted</p></div></div></Card>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button variant={view === "kanban" ? "default" : "outline"} size="sm" onClick={() => setView("kanban")}>Pipeline</Button>
            <Button variant={view === "table" ? "default" : "outline"} size="sm" onClick={() => setView("table")}>Table</Button>
          </div>
          <Button onClick={() => { setForm({ reward_amount: 250 }); setEditOpen(true); }} className="gap-1.5"><Plus className="w-4 h-4" />Log Referral</Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : view === "kanban" ? (
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 overflow-x-auto">
            {STATUSES.map(status => (
              <div key={status} className={`rounded-lg p-2 min-h-[300px] ${STATUS_COLORS[status]}`} onDragOver={e => e.preventDefault()} onDrop={() => { if (dragId) { updateStatus(dragId, status); setDragId(null); } }}>
                <h4 className="text-xs font-semibold text-foreground mb-2">{STATUS_LABELS[status]} <Badge variant="secondary" className="text-[10px] ml-1">{(referrals || []).filter((r: any) => r.status === status).length}</Badge></h4>
                <div className="space-y-2">
                  {(referrals || []).filter((r: any) => r.status === status).map((r: any) => (
                    <Card key={r.id} className="p-2.5 cursor-grab" draggable onDragStart={() => setDragId(r.id)} onClick={() => { setForm(r); setEditOpen(true); }}>
                      <p className="text-xs font-medium text-foreground">{r.referred_name}</p>
                      <p className="text-[10px] text-muted-foreground">via {r.referring_client_name}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{format(new Date(r.created_at), "MMM d, yyyy")}</p>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="border-b"><th className="text-left p-3 text-xs">Referred</th><th className="text-left p-3 text-xs">By</th><th className="text-left p-3 text-xs">Status</th><th className="text-left p-3 text-xs">Reward</th><th className="text-left p-3 text-xs">Date</th></tr></thead>
              <tbody>
                {(referrals || []).map((r: any) => (
                  <tr key={r.id} className="border-b hover:bg-muted/50 cursor-pointer" onClick={() => { setForm(r); setEditOpen(true); }}>
                    <td className="p-3"><p className="font-medium">{r.referred_name}</p><p className="text-xs text-muted-foreground">{r.referred_email}</p></td>
                    <td className="p-3 text-muted-foreground">{r.referring_client_name}</td>
                    <td className="p-3"><Badge variant="secondary" className="text-[10px]">{STATUS_LABELS[r.status]}</Badge></td>
                    <td className="p-3"><Badge variant={r.reward_status === "applied" ? "default" : "outline"} className="text-[10px]">${r.reward_amount} · {r.reward_status}</Badge></td>
                    <td className="p-3 text-muted-foreground text-xs">{format(new Date(r.created_at), "MMM d, yyyy")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{form.id ? "Edit Referral" : "Log Referral"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Referring Client *</Label>
              <Select value={form.referring_client_id || ""} onValueChange={v => setForm({ ...form, referring_client_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                <SelectContent>{(clients || []).map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Referred Person's Name *</Label><Input value={form.referred_name || ""} onChange={e => setForm({ ...form, referred_name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Email</Label><Input value={form.referred_email || ""} onChange={e => setForm({ ...form, referred_email: e.target.value })} /></div>
              <div><Label>Phone</Label><Input value={form.referred_phone || ""} onChange={e => setForm({ ...form, referred_phone: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Status</Label>
                <Select value={form.status || "lead"} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Reward ($)</Label><Input type="number" value={form.reward_amount || 250} onChange={e => setForm({ ...form, reward_amount: Number(e.target.value) })} /></div>
            </div>
            <div><Label>Reward Status</Label>
              <Select value={form.reward_status || "pending"} onValueChange={v => setForm({ ...form, reward_status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="pending">Pending</SelectItem><SelectItem value="applied">Applied</SelectItem><SelectItem value="n/a">N/A</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label>Notes</Label><Textarea value={form.notes || ""} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
            <Button onClick={saveReferral} className="w-full">Save Referral</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminReferrals;
