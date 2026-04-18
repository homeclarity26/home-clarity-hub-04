import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Phone, Mail, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { CRMPerson } from "@/hooks/useCRMData";

const CRMContactsTab = ({ contactId, people }: { contactId: string; people: CRMPerson[] | undefined }) => {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", relationship: "", phone: "", email: "", preferred_method: "email", notes: "" });

  const handleAdd = async () => {
    if (!form.name.trim()) return;
    const { error } = await supabase.from("crm_contacts_people").insert({ contact_id: contactId, ...form });
    if (error) { toast.error("Failed to add contact"); return; }
    toast.success("Contact added");
    qc.invalidateQueries({ queryKey: ["crm-people", contactId] });
    setDialogOpen(false);
    setForm({ name: "", relationship: "", phone: "", email: "", preferred_method: "email", notes: "" });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-sans font-semibold text-sm text-foreground">Associated People</h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5 font-sans"><Plus className="w-4 h-4" /> Add Contact</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-sans">Add Person</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="font-sans" />
              <Input placeholder="Relationship (e.g., Spouse, Property Manager)" value={form.relationship} onChange={e => setForm(p => ({ ...p, relationship: e.target.value }))} className="font-sans" />
              <Input placeholder="Phone" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="font-sans" />
              <Input placeholder="Email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="font-sans" />
              <Input placeholder="Notes" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className="font-sans" />
              <Button onClick={handleAdd} className="w-full font-sans">Add Person</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {(people || []).length === 0 ? (
        <Card className="p-12 text-center">
          <User className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground font-sans">No associated contacts yet.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(people || []).map(p => (
            <Card key={p.id} className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-sans font-medium">
                  {p.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-sans text-sm font-medium text-foreground">{p.name}</p>
                  {p.relationship && <p className="font-sans text-[11px] text-muted-foreground">{p.relationship}</p>}
                </div>
              </div>
              <div className="space-y-1 text-xs font-sans text-muted-foreground">
                {p.phone && <div className="flex items-center gap-1.5"><Phone className="w-3 h-3" />{p.phone}</div>}
                {p.email && <div className="flex items-center gap-1.5"><Mail className="w-3 h-3" />{p.email}</div>}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CRMContactsTab;
