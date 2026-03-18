import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Copy, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const CATEGORIES = ["Inspection", "Consultation", "Maintenance", "Report", "Add-On", "Recurring", "Other"];
const PRICE_TYPES = [
  { value: "flat", label: "Flat Fee" },
  { value: "hourly", label: "Hourly" },
  { value: "monthly", label: "Monthly Recurring" },
  { value: "annual", label: "Annual Recurring" },
];

const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

const categoryColors: Record<string, string> = {
  Inspection: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  Consultation: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  Maintenance: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  Report: "bg-accent/20 text-accent-foreground",
  "Add-On": "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  Recurring: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
  Other: "bg-muted text-muted-foreground",
};

interface ServiceForm {
  name: string;
  description: string;
  category: string;
  price: number;
  price_type: string;
  duration_hours: string;
  is_active: boolean;
}

const emptyForm: ServiceForm = { name: "", description: "", category: "Inspection", price: 0, price_type: "flat", duration_hours: "", is_active: true };

const ServicesLibrary = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<ServiceForm>(emptyForm);
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const { data: services = [], isLoading } = useQuery({
    queryKey: ["services-library"],
    queryFn: async () => {
      const { data } = await (supabase.from("services") as any).select("*").order("sort_order").order("name");
      return data || [];
    },
  });

  const filtered = filterCategory === "all" ? services : services.filter((s: any) => s.category === filterCategory);

  const save = async () => {
    if (!user || !form.name.trim()) return;
    const payload = {
      admin_id: user.id,
      name: form.name.trim(),
      description: form.description.trim(),
      category: form.category,
      price: form.price,
      price_type: form.price_type,
      duration_hours: form.duration_hours ? parseFloat(form.duration_hours) : null,
      is_active: form.is_active,
    };

    if (editId) {
      await (supabase.from("services") as any).update(payload).eq("id", editId);
      toast.success("Service updated");
    } else {
      await (supabase.from("services") as any).insert(payload);
      toast.success("Service created");
    }

    setDialogOpen(false);
    setEditId(null);
    setForm(emptyForm);
    qc.invalidateQueries({ queryKey: ["services-library"] });
  };

  const openEdit = (s: any) => {
    setEditId(s.id);
    setForm({
      name: s.name, description: s.description || "", category: s.category, price: s.price,
      price_type: s.price_type, duration_hours: s.duration_hours ? String(s.duration_hours) : "", is_active: s.is_active,
    });
    setDialogOpen(true);
  };

  const duplicate = async (s: any) => {
    if (!user) return;
    await (supabase.from("services") as any).insert({
      admin_id: user.id, name: `${s.name} (Copy)`, description: s.description, category: s.category,
      price: s.price, price_type: s.price_type, duration_hours: s.duration_hours, is_active: true,
    });
    qc.invalidateQueries({ queryKey: ["services-library"] });
    toast.success("Service duplicated");
  };

  const remove = async (id: string) => {
    await (supabase.from("services") as any).delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["services-library"] });
    toast.success("Service deleted");
  };

  const toggleActive = async (id: string, current: boolean) => {
    await (supabase.from("services") as any).update({ is_active: !current }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["services-library"] });
  };

  const priceLabel = (s: any) => {
    const suffix: Record<string, string> = { flat: "", hourly: "/hr", monthly: "/mo", annual: "/yr" };
    return `${fmt(s.price)}${suffix[s.price_type] || ""}`;
  };

  return (
    <Card className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-accent" />
          <h3 className="text-base font-sans font-semibold text-foreground">Services Library</h3>
          <Badge variant="outline" className="text-[10px] font-mono">{services.length} services</Badge>
        </div>
        <Button size="sm" className="gap-1.5 text-xs font-sans" onClick={() => { setEditId(null); setForm(emptyForm); setDialogOpen(true); }}>
          <Plus className="w-3.5 h-3.5" />Add Service
        </Button>
      </div>

      <p className="text-sm font-sans text-muted-foreground">
        Your master list of services. These feed membership tiers, à la carte menus, estimates, and invoices.
      </p>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        <Button variant={filterCategory === "all" ? "default" : "outline"} size="sm" className="text-xs font-sans" onClick={() => setFilterCategory("all")}>All</Button>
        {CATEGORIES.map(c => (
          <Button key={c} variant={filterCategory === c ? "default" : "outline"} size="sm" className="text-xs font-sans" onClick={() => setFilterCategory(c)}>{c}</Button>
        ))}
      </div>

      {/* Services grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((s: any) => (
          <Card key={s.id} className={`p-4 space-y-3 transition-opacity ${!s.is_active ? "opacity-50" : ""}`}>
            <div className="flex items-start justify-between">
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-sans font-semibold text-foreground truncate">{s.name}</span>
                  {!s.is_active && <Badge variant="outline" className="text-[9px]">Inactive</Badge>}
                </div>
                <Badge className={`text-[9px] ${categoryColors[s.category] || categoryColors.Other}`}>{s.category}</Badge>
              </div>
              <span className="text-sm font-mono font-bold text-foreground whitespace-nowrap">{priceLabel(s)}</span>
            </div>

            {s.description && <p className="text-xs font-sans text-muted-foreground line-clamp-2">{s.description}</p>}

            {s.duration_hours && (
              <p className="text-[10px] font-mono text-muted-foreground">{s.duration_hours}h estimated</p>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-border">
              <Switch checked={s.is_active} onCheckedChange={() => toggleActive(s.id, s.is_active)} />
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(s)}><Pencil className="w-3 h-3" /></Button>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => duplicate(s)}><Copy className="w-3 h-3" /></Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild><Button variant="ghost" size="sm" className="h-7 w-7 p-0"><Trash2 className="w-3 h-3 text-destructive" /></Button></AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="font-sans">Delete "{s.name}"?</AlertDialogTitle>
                      <AlertDialogDescription className="font-sans">This won't affect existing invoices or estimates that reference this service.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="font-sans">Cancel</AlertDialogCancel>
                      <AlertDialogAction className="font-sans bg-destructive text-destructive-foreground" onClick={() => remove(s.id)}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Package className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-sans text-muted-foreground">No services yet. Add your first service to get started.</p>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="font-sans">{editId ? "Edit Service" : "New Service"}</DialogTitle></DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-1.5">
              <Label className="text-xs font-sans">Service Name *</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g., Full Home Inspection" className="font-sans" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-sans">Description</Label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="What's included..." className="font-sans text-sm" rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-sans">Category</Label>
                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                  <SelectTrigger className="font-sans text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c} className="font-sans">{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-sans">Pricing Type</Label>
                <Select value={form.price_type} onValueChange={v => setForm({ ...form, price_type: v })}>
                  <SelectTrigger className="font-sans text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{PRICE_TYPES.map(t => <SelectItem key={t.value} value={t.value} className="font-sans">{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-sans">Price ($)</Label>
                <Input type="number" value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })} className="font-mono" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-sans">Duration (hours, optional)</Label>
                <Input type="number" step="0.5" value={form.duration_hours} onChange={e => setForm({ ...form, duration_hours: e.target.value })} className="font-mono" placeholder="e.g., 4" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs font-sans">Active</Label>
              <Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="font-sans">Cancel</Button>
            <Button onClick={save} disabled={!form.name.trim()} className="font-sans">{editId ? "Update" : "Create"} Service</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ServicesLibrary;
