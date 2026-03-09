import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface VendorManagerProps {
  propertyId: string;
}

const SPECIALTIES = ["General Contractor", "HVAC Specialist", "Electrician", "Plumber", "Landscaper", "Roofer", "Painter", "Other"];

const VendorManager = ({ propertyId }: VendorManagerProps) => {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", contact_name: "", email: "", phone: "", specialty: "General Contractor" });

  const { data: vendors, isLoading } = useQuery({
    queryKey: ["vendors", propertyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendors")
        .select("*")
        .eq("property_id", propertyId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const resetForm = () => setForm({ title: "", contact_name: "", email: "", phone: "", specialty: "General Contractor" });

  const createVendor = async () => {
    if (!form.title) return;
    const { error } = await supabase.from("vendors").insert({
      property_id: propertyId,
      title: form.title,
      contact_name: form.contact_name || null,
      email: form.email || null,
      phone: form.phone || null,
      specialty: form.specialty,
    });
    if (error) { toast.error("Failed to create vendor"); return; }
    toast.success("Vendor added");
    setCreateOpen(false);
    resetForm();
    queryClient.invalidateQueries({ queryKey: ["vendors", propertyId] });
  };

  const updateVendor = async () => {
    if (!editId || !form.title) return;
    const { error } = await supabase.from("vendors").update({
      title: form.title,
      contact_name: form.contact_name || null,
      email: form.email || null,
      phone: form.phone || null,
      specialty: form.specialty,
    }).eq("id", editId);
    if (error) { toast.error("Failed to update vendor"); return; }
    toast.success("Vendor updated");
    setEditOpen(false);
    resetForm();
    setEditId(null);
    queryClient.invalidateQueries({ queryKey: ["vendors", propertyId] });
  };

  const deleteVendor = async (id: string) => {
    const { error } = await supabase.from("vendors").delete().eq("id", id);
    if (error) { toast.error("Failed to delete"); return; }
    toast.success("Vendor deleted");
    queryClient.invalidateQueries({ queryKey: ["vendors", propertyId] });
  };

  const openEdit = (v: NonNullable<typeof vendors>[number]) => {
    setEditId(v.id);
    setForm({ title: v.title, contact_name: v.contact_name || "", email: v.email || "", phone: v.phone || "", specialty: v.specialty });
    setEditOpen(true);
  };

  const FormFields = () => (
    <div className="space-y-4">
      <div><Label className="font-sans">Business Name</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
      <div><Label className="font-sans">Contact Name</Label><Input value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} /></div>
      <div><Label className="font-sans">Specialty</Label>
        <select value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-sans">
          {SPECIALTIES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div><Label className="font-sans">Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
      <div><Label className="font-sans">Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
    </div>
  );

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-sans font-semibold text-foreground">Approved Vendors</h3>
        <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild><Button size="sm" className="gap-1.5 text-xs font-sans"><Plus className="w-3.5 h-3.5" />Add Vendor</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-sans">Add Vendor</DialogTitle></DialogHeader>
            <FormFields />
            <Button onClick={createVendor} className="w-full font-sans">Add</Button>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={editOpen} onOpenChange={(o) => { setEditOpen(o); if (!o) { resetForm(); setEditId(null); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-sans">Edit Vendor</DialogTitle></DialogHeader>
          <FormFields />
          <Button onClick={updateVendor} className="w-full font-sans">Save Changes</Button>
        </DialogContent>
      </Dialog>

      {vendors && vendors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vendors.map((v) => (
            <Card key={v.id} className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-sans font-semibold text-foreground">{v.title}</h4>
                  <p className="text-xs font-sans text-muted-foreground">{v.specialty}</p>
                </div>
                <div className="flex items-center gap-0.5">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(v)}><Pencil className="w-3.5 h-3.5" /></Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild><Button variant="ghost" size="sm"><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button></AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="font-sans">Delete vendor?</AlertDialogTitle>
                        <AlertDialogDescription className="font-sans">Remove "{v.title}" from this property's vendor list.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="font-sans">Cancel</AlertDialogCancel>
                        <AlertDialogAction className="font-sans bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteVendor(v.id)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              {v.contact_name && <p className="text-sm font-sans text-foreground mt-2">{v.contact_name}</p>}
              {v.email && <p className="text-xs font-sans text-muted-foreground">{v.email}</p>}
              {v.phone && <p className="text-xs font-sans text-muted-foreground">{v.phone}</p>}
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center"><p className="text-sm font-sans text-muted-foreground">No vendors assigned. Add one to get started.</p></Card>
      )}
    </div>
  );
};

export default VendorManager;
