import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Search, Star, Loader2, Phone, Mail, MapPin, Clock } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const SPECIALTIES = ["HVAC", "Electrical", "Plumbing", "Roofing", "Painting", "Landscaping", "General Contractor", "Other"];
const LEAD_TIMES = ["Same Day", "1-3 Days", "1 Week", "2+ Weeks"];
const COST_TIERS = ["Budget", "Mid-Range", "Premium"];

const AdminVendorDirectory = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterSpecialty, setFilterSpecialty] = useState("all");
  const [filterTier, setFilterTier] = useState("all");
  const [filterStatus, setFilterStatus] = useState("active");
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState<any>({});

  const { data: vendors, isLoading } = useQuery({
    queryKey: ["central-vendors"],
    queryFn: async () => {
      const { data, error } = await (supabase.from("central_vendors") as any).select("*").order("company_name");
      if (error) throw error;
      return data || [];
    },
  });

  const filtered = (vendors || []).filter((v: any) => {
    if (search && !v.company_name.toLowerCase().includes(search.toLowerCase()) && !(v.contact_name || "").toLowerCase().includes(search.toLowerCase())) return false;
    if (filterSpecialty !== "all" && !(v.specialties || []).includes(filterSpecialty)) return false;
    if (filterTier !== "all" && v.cost_tier !== filterTier) return false;
    if (filterStatus !== "all" && v.status !== filterStatus) return false;
    return true;
  });

  const saveVendor = async () => {
    if (!form.company_name?.trim()) return;
    const payload = { company_name: form.company_name, contact_name: form.contact_name || null, phone: form.phone || null, email: form.email || null, specialties: form.specialties || [], service_area: form.service_area || null, lead_time: form.lead_time || "1-3 Days", cost_tier: form.cost_tier || "Mid-Range", rating: form.rating || 0, notes: form.notes || null, status: form.status || "active", admin_id: user?.id };
    if (form.id) {
      await (supabase.from("central_vendors") as any).update(payload).eq("id", form.id);
    } else {
      await (supabase.from("central_vendors") as any).insert(payload);
    }
    setEditOpen(false); setForm({});
    queryClient.invalidateQueries({ queryKey: ["central-vendors"] });
    toast.success("Vendor saved");
  };

  const renderStars = (rating: number, onClick?: (n: number) => void) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <Star key={n} className={`w-4 h-4 ${n <= rating ? "text-accent fill-accent" : "text-muted-foreground/30"} ${onClick ? "cursor-pointer" : ""}`} onClick={() => onClick?.(n)} />
      ))}
    </div>
  );

  return (
    <div>
      <AdminHeader breadcrumbs={[{ label: "Vendors" }]} />
      <div className="p-6 max-w-7xl space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search vendors..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 w-[220px] text-sm" />
            </div>
            <Select value={filterSpecialty} onValueChange={setFilterSpecialty}>
              <SelectTrigger className="w-[150px] text-sm"><SelectValue placeholder="Specialty" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Specialties</SelectItem>{SPECIALTIES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={filterTier} onValueChange={setFilterTier}>
              <SelectTrigger className="w-[140px] text-sm"><SelectValue placeholder="Cost Tier" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Tiers</SelectItem>{COST_TIERS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[120px] text-sm"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent>
            </Select>
          </div>
          <Button onClick={() => { setForm({ specialties: [] }); setEditOpen(true); }} className="gap-1.5"><Plus className="w-4 h-4" />Add Vendor</Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <Card className="p-8 text-center"><p className="text-sm text-muted-foreground">No vendors found. Add your first vendor to get started.</p></Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((v: any) => (
              <Card key={v.id} className="p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setForm(v); setEditOpen(true); }}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{v.company_name}</h3>
                    {v.contact_name && <p className="text-xs text-muted-foreground">{v.contact_name}</p>}
                  </div>
                  <Badge variant={v.status === "active" ? "default" : "secondary"} className="text-[10px]">{v.status}</Badge>
                </div>
                {renderStars(v.rating || 0)}
                <div className="mt-2 space-y-1">
                  {v.phone && <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" />{v.phone}</p>}
                  {v.email && <p className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3" />{v.email}</p>}
                  {v.service_area && <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />{v.service_area}</p>}
                  {v.lead_time && <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{v.lead_time}</p>}
                </div>
                <div className="flex gap-1 mt-2 flex-wrap">
                  {(v.specialties || []).map((s: string) => <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>)}
                </div>
                {v.cost_tier && <Badge variant="outline" className="text-[10px] mt-2">{v.cost_tier}</Badge>}
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{form.id ? "Edit Vendor" : "Add Vendor"}</DialogTitle></DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            <div><Label>Company Name *</Label><Input value={form.company_name || ""} onChange={e => setForm({ ...form, company_name: e.target.value })} /></div>
            <div><Label>Contact Name</Label><Input value={form.contact_name || ""} onChange={e => setForm({ ...form, contact_name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Phone</Label><Input value={form.phone || ""} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
              <div><Label>Email</Label><Input value={form.email || ""} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
            </div>
            <div><Label>Specialties</Label>
              <div className="flex gap-1 flex-wrap mt-1">
                {SPECIALTIES.map(s => (
                  <Badge key={s} variant={(form.specialties || []).includes(s) ? "default" : "outline"} className="cursor-pointer text-xs" onClick={() => {
                    const cur = form.specialties || [];
                    setForm({ ...form, specialties: cur.includes(s) ? cur.filter((x: string) => x !== s) : [...cur, s] });
                  }}>{s}</Badge>
                ))}
              </div>
            </div>
            <div><Label>Service Area</Label><Input value={form.service_area || ""} onChange={e => setForm({ ...form, service_area: e.target.value })} placeholder="e.g. Summit County, OH" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Lead Time</Label>
                <Select value={form.lead_time || "1-3 Days"} onValueChange={v => setForm({ ...form, lead_time: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{LEAD_TIMES.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Cost Tier</Label>
                <Select value={form.cost_tier || "Mid-Range"} onValueChange={v => setForm({ ...form, cost_tier: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{COST_TIERS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Rating</Label>{renderStars(form.rating || 0, n => setForm({ ...form, rating: n }))}</div>
            <div><Label>Status</Label>
              <Select value={form.status || "active"} onValueChange={v => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label>Notes</Label><Textarea value={form.notes || ""} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
            <Button onClick={saveVendor} className="w-full">Save Vendor</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminVendorDirectory;
