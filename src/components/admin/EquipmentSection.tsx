import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Wrench, AlertTriangle, CheckCircle, Clock, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, isPast, isAfter, addDays } from "date-fns";

interface Equipment {
  id: string;
  name: string;
  category: string;
  brand: string | null;
  model: string | null;
  serial_number: string | null;
  install_date: string | null;
  warranty_expiry: string | null;
  last_service_date: string | null;
  next_service_date: string | null;
  estimated_replacement_cost: number | null;
  condition: string | null;
  notes: string | null;
  report_page_id: string | null;
  sort_order: number;
}

interface EquipmentSectionProps {
  propertyId: string;
  reportPages?: Array<{ id: string; title: string; page_key: string }>;
}

const CATEGORIES = [
  { value: "hvac", label: "HVAC" },
  { value: "plumbing", label: "Plumbing" },
  { value: "electrical", label: "Electrical" },
  { value: "appliances", label: "Appliances" },
  { value: "exterior", label: "Exterior" },
  { value: "structure", label: "Structure" },
  { value: "safety", label: "Safety" },
  { value: "other", label: "Other" },
];

const CONDITIONS = [
  { value: "excellent", label: "Excellent" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "poor", label: "Poor" },
  { value: "unknown", label: "Unknown" },
];

const conditionColors: Record<string, string> = {
  excellent: "bg-emerald-100 text-emerald-800",
  good: "bg-blue-100 text-blue-800",
  fair: "bg-amber-100 text-amber-800",
  poor: "bg-red-100 text-red-800",
  unknown: "bg-gray-100 text-gray-600",
};

function getServiceStatus(item: Equipment): { label: string; cls: string; icon: typeof CheckCircle } {
  const now = new Date();
  if (item.next_service_date) {
    const next = new Date(item.next_service_date);
    if (isPast(next)) return { label: "Overdue", cls: "text-destructive", icon: AlertTriangle };
    if (isAfter(next, now) && !isAfter(next, addDays(now, 60))) return { label: "Due Soon", cls: "text-orange-500", icon: Clock };
  }
  if (item.warranty_expiry && isPast(new Date(item.warranty_expiry))) {
    return { label: "Warranty Expired", cls: "text-muted-foreground", icon: ShieldAlert };
  }
  return { label: "Up to Date", cls: "text-foreground", icon: CheckCircle };
}

const defaultForm = {
  name: "", category: "hvac", brand: "", model: "", serial_number: "",
  install_date: "", warranty_expiry: "", last_service_date: "", next_service_date: "",
  estimated_replacement_cost: "", condition: "unknown", notes: "", report_page_id: "",
};

const EquipmentSection = ({ propertyId, reportPages }: EquipmentSectionProps) => {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);

  const load = async () => {
    if (!propertyId) { setLoading(false); return; }
    const { data, error } = await supabase
      .from("equipment")
      .select("*")
      .eq("property_id", propertyId)
      .order("category")
      .order("sort_order");
    if (error) { toast.error("Failed to load equipment"); }
    setEquipment((data || []) as Equipment[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [propertyId]);

  const resetForm = () => setForm(defaultForm);

  const buildInsert = () => ({
    property_id: propertyId,
    name: form.name,
    category: form.category,
    brand: form.brand || null,
    model: form.model || null,
    serial_number: form.serial_number || null,
    install_date: form.install_date || null,
    warranty_expiry: form.warranty_expiry || null,
    last_service_date: form.last_service_date || null,
    next_service_date: form.next_service_date || null,
    estimated_replacement_cost: form.estimated_replacement_cost ? parseFloat(form.estimated_replacement_cost) : null,
    condition: form.condition || "unknown",
    notes: form.notes || null,
    report_page_id: form.report_page_id || null,
  });

  const create = async () => {
    if (!form.name) return;
    const { error } = await supabase.from("equipment").insert(buildInsert());
    if (error) { toast.error("Failed to add equipment"); return; }
    toast.success("Equipment added");
    setCreateOpen(false);
    resetForm();
    load();
  };

  const update = async () => {
    if (!editId || !form.name) return;
    const { error } = await supabase.from("equipment").update({
      name: form.name, category: form.category, brand: form.brand || null, model: form.model || null,
      serial_number: form.serial_number || null, install_date: form.install_date || null,
      warranty_expiry: form.warranty_expiry || null, last_service_date: form.last_service_date || null,
      next_service_date: form.next_service_date || null,
      estimated_replacement_cost: form.estimated_replacement_cost ? parseFloat(form.estimated_replacement_cost) : null,
      condition: form.condition || "unknown", notes: form.notes || null,
      report_page_id: form.report_page_id || null,
      updated_at: new Date().toISOString(),
    }).eq("id", editId);
    if (error) { toast.error("Failed to update"); return; }
    toast.success("Updated");
    setEditOpen(false);
    resetForm();
    setEditId(null);
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("equipment").delete().eq("id", id);
    if (error) { toast.error("Failed to delete"); return; }
    toast.success("Removed");
    load();
  };

  const openEdit = (e: Equipment) => {
    setEditId(e.id);
    setForm({
      name: e.name, category: e.category, brand: e.brand || "", model: e.model || "",
      serial_number: e.serial_number || "", install_date: e.install_date || "",
      warranty_expiry: e.warranty_expiry || "", last_service_date: e.last_service_date || "",
      next_service_date: e.next_service_date || "",
      estimated_replacement_cost: e.estimated_replacement_cost != null ? String(e.estimated_replacement_cost) : "",
      condition: e.condition || "unknown", notes: e.notes || "",
      report_page_id: e.report_page_id || "",
    });
    setEditOpen(true);
  };

  const byCategory = equipment.reduce((acc, e) => {
    if (!acc[e.category]) acc[e.category] = [];
    acc[e.category].push(e);
    return acc;
  }, {} as Record<string, Equipment[]>);

  const FormFields = () => (
    <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label className="font-sans text-xs">Name *</Label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Primary Furnace" />
        </div>
        <div>
          <Label className="font-sans text-xs">Category</Label>
          <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
            <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label className="font-sans text-xs">Condition</Label>
          <Select value={form.condition} onValueChange={(v) => setForm({ ...form, condition: v })}>
            <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>{CONDITIONS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label className="font-sans text-xs">Brand</Label>
          <Input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} placeholder="Carrier, Rheem…" />
        </div>
        <div>
          <Label className="font-sans text-xs">Model</Label>
          <Input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
        </div>
        <div>
          <Label className="font-sans text-xs">Serial Number</Label>
          <Input value={form.serial_number} onChange={(e) => setForm({ ...form, serial_number: e.target.value })} />
        </div>
        <div>
          <Label className="font-sans text-xs">Est. Replacement Cost ($)</Label>
          <Input type="number" value={form.estimated_replacement_cost} onChange={(e) => setForm({ ...form, estimated_replacement_cost: e.target.value })} />
        </div>
        <div>
          <Label className="font-sans text-xs">Install Date</Label>
          <Input type="date" value={form.install_date} onChange={(e) => setForm({ ...form, install_date: e.target.value })} />
        </div>
        <div>
          <Label className="font-sans text-xs">Warranty Expires</Label>
          <Input type="date" value={form.warranty_expiry} onChange={(e) => setForm({ ...form, warranty_expiry: e.target.value })} />
        </div>
        <div>
          <Label className="font-sans text-xs">Last Service</Label>
          <Input type="date" value={form.last_service_date} onChange={(e) => setForm({ ...form, last_service_date: e.target.value })} />
        </div>
        <div>
          <Label className="font-sans text-xs">Next Service Due</Label>
          <Input type="date" value={form.next_service_date} onChange={(e) => setForm({ ...form, next_service_date: e.target.value })} />
        </div>
        {reportPages && reportPages.length > 0 && (
          <div className="col-span-2">
            <Label className="font-sans text-xs">Linked Report Page</Label>
            <Select value={form.report_page_id} onValueChange={(v) => setForm({ ...form, report_page_id: v })}>
              <SelectTrigger className="text-xs"><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {reportPages.map((rp) => <SelectItem key={rp.id} value={rp.id}>{rp.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="col-span-2">
          <Label className="font-sans text-xs">Notes</Label>
          <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-sans font-semibold text-foreground">Equipment Registry</h3>
        <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5 text-xs font-sans"><Plus className="w-3.5 h-3.5" />Add Equipment</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle className="font-sans">Add Equipment</DialogTitle></DialogHeader>
            <FormFields />
            <Button onClick={create} className="w-full font-sans">Add</Button>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={editOpen} onOpenChange={(o) => { setEditOpen(o); if (!o) { resetForm(); setEditId(null); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="font-sans">Edit Equipment</DialogTitle></DialogHeader>
          <FormFields />
          <Button onClick={update} className="w-full font-sans">Save Changes</Button>
        </DialogContent>
      </Dialog>

      {loading ? (
        <div className="flex justify-center py-8"><div className="w-5 h-5 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" /></div>
      ) : equipment.length === 0 ? (
        <Card className="p-8 text-center">
          <Wrench className="w-5 h-5 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-sans text-muted-foreground">No equipment registered yet.</p>
          <p className="text-xs font-sans text-muted-foreground mt-1">Add major systems and appliances to build the property's digital equipment registry.</p>
        </Card>
      ) : (
        Object.entries(byCategory).map(([category, items]) => (
          <div key={category}>
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-2">
              {CATEGORIES.find((c) => c.value === category)?.label || category}
            </p>
            <div className="space-y-2">
              {items.map((item) => {
                const svc = getServiceStatus(item);
                const SvcIcon = svc.icon;
                return (
                  <Card key={item.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-sans font-medium text-foreground">{item.name}</p>
                          {item.condition && item.condition !== "unknown" && (
                            <Badge className={`text-[10px] font-mono border-none ${conditionColors[item.condition]}`}>
                              {item.condition}
                            </Badge>
                          )}
                          <span className={`flex items-center gap-1 text-[10px] font-mono ${svc.cls}`}>
                            <SvcIcon className="w-3 h-3" />
                            {svc.label}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1.5">
                          {item.brand && <span className="text-xs font-sans text-muted-foreground">{item.brand}{item.model ? ` · ${item.model}` : ""}</span>}
                          {item.serial_number && <span className="text-xs font-mono text-muted-foreground">S/N: {item.serial_number}</span>}
                          {item.install_date && <span className="text-xs font-sans text-muted-foreground">Installed {format(new Date(item.install_date), "MMM yyyy")}</span>}
                          {item.warranty_expiry && <span className={`text-xs font-sans ${isPast(new Date(item.warranty_expiry)) ? "text-muted-foreground line-through" : "text-foreground"}`}>Warranty until {format(new Date(item.warranty_expiry), "MMM yyyy")}</span>}
                          {item.next_service_date && <span className={`text-xs font-sans ${isPast(new Date(item.next_service_date)) ? "text-destructive font-medium" : "text-muted-foreground"}`}>Next service: {format(new Date(item.next_service_date), "MMM d, yyyy")}</span>}
                          {item.estimated_replacement_cost != null && <span className="text-xs font-sans text-muted-foreground">Est. replacement: ${Number(item.estimated_replacement_cost).toLocaleString()}</span>}
                        </div>
                        {item.notes && <p className="text-xs font-sans text-muted-foreground mt-1.5 italic">{item.notes}</p>}
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(item)}><Pencil className="w-3.5 h-3.5" /></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild><Button variant="ghost" size="sm"><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button></AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle className="font-sans">Remove equipment?</AlertDialogTitle>
                              <AlertDialogDescription className="font-sans">This will permanently remove "{item.name}" from the registry.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="font-sans">Cancel</AlertDialogCancel>
                              <AlertDialogAction className="font-sans bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => remove(item.id)}>Remove</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default EquipmentSection;
