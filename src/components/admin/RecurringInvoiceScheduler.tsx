import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Plus, CalendarClock, Loader2, Trash2, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format, addMonths, addWeeks, addYears } from "date-fns";

interface RecurringInvoiceSchedulerProps {
  propertyId: string;
}

const FREQUENCIES = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "annually", label: "Annually" },
];

const RecurringInvoiceScheduler = ({ propertyId }: RecurringInvoiceSchedulerProps) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    amount: "",
    frequency: "monthly",
    next_run_date: new Date().toISOString().split("T")[0],
  });

  const { data: schedules, isLoading } = useQuery({
    queryKey: ["recurring-schedules", propertyId],
    queryFn: async () => {
      const { data, error } = await supabase.from("recurring_invoice_schedules")
        .select("*")
        .eq("property_id", propertyId)
        .order("next_run_date", { ascending: true });
      if (error) throw error;
      return (data || []) as any[];
    },
  });

  const resetForm = () => setForm({ title: "", description: "", amount: "", frequency: "monthly", next_run_date: new Date().toISOString().split("T")[0] });

  const createSchedule = async () => {
    if (!form.title || !form.amount || !user) return;
    const { error } = await supabase.from("recurring_invoice_schedules").insert({
      property_id: propertyId,
      admin_id: user.id,
      title: form.title,
      description: form.description || null,
      amount: parseFloat(form.amount),
      frequency: form.frequency,
      next_run_date: form.next_run_date,
    });
    if (error) { toast.error("Failed to create schedule"); return; }
    toast.success("Recurring schedule created");
    setCreateOpen(false);
    resetForm();
    queryClient.invalidateQueries({ queryKey: ["recurring-schedules", propertyId] });
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    await supabase.from("recurring_invoice_schedules").update({ is_active: !isActive }).eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["recurring-schedules", propertyId] });
  };

  const deleteSchedule = async (id: string) => {
    await supabase.from("recurring_invoice_schedules").delete().eq("id", id);
    toast.success("Schedule deleted");
    queryClient.invalidateQueries({ queryKey: ["recurring-schedules", propertyId] });
  };

  const generateNow = async (schedule: any) => {
    // Create an invoice from the schedule
    const { error } = await supabase.from("invoices").insert({
      property_id: propertyId,
      title: schedule.title,
      description: schedule.description || schedule.title,
      amount: Number(schedule.amount),
      subtotal: Number(schedule.amount),
      total: Number(schedule.amount),
      balance_due: Number(schedule.amount),
      status: "draft",
      due_date: schedule.next_run_date,
    });
    if (error) { toast.error("Failed to generate invoice"); return; }

    // Advance next_run_date
    const current = new Date(schedule.next_run_date);
    let next: Date;
    switch (schedule.frequency) {
      case "weekly": next = addWeeks(current, 1); break;
      case "quarterly": next = addMonths(current, 3); break;
      case "annually": next = addYears(current, 1); break;
      default: next = addMonths(current, 1);
    }
    await supabase.from("recurring_invoice_schedules")
      .update({ last_run_date: schedule.next_run_date, next_run_date: next.toISOString().split("T")[0] })
      .eq("id", schedule.id);

    toast.success("Invoice generated from schedule");
    queryClient.invalidateQueries({ queryKey: ["recurring-schedules", propertyId] });
    queryClient.invalidateQueries({ queryKey: ["admin-invoices", propertyId] });
  };

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarClock className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-sans font-semibold text-foreground">Recurring Invoices</h3>
        </div>
        <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5 text-xs font-sans"><Plus className="w-3.5 h-3.5" />Add Schedule</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-sans">New Recurring Invoice</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label className="font-sans text-xs">Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div><Label className="font-sans text-xs">Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="font-sans text-xs">Amount ($)</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
                <div><Label className="font-sans text-xs">Frequency</Label>
                  <Select value={form.frequency} onValueChange={(v) => setForm({ ...form, frequency: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {FREQUENCIES.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label className="font-sans text-xs">Next Run Date</Label><Input type="date" value={form.next_run_date} onChange={(e) => setForm({ ...form, next_run_date: e.target.value })} /></div>
              <Button onClick={createSchedule} className="w-full font-sans">Create Schedule</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {schedules && schedules.length > 0 ? (
        <div className="space-y-3">
          {schedules.map((s: any) => (
            <Card key={s.id} className={`p-4 ${!s.is_active ? "opacity-50" : ""}`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-sans font-semibold text-foreground truncate">{s.title}</h4>
                    <Badge variant="outline" className="text-[10px] capitalize font-sans">{s.frequency}</Badge>
                    {!s.is_active && <Badge className="bg-muted text-muted-foreground text-[10px] border-none">Paused</Badge>}
                  </div>
                  <p className="text-xs font-sans text-muted-foreground mt-0.5">
                    ${Number(s.amount).toFixed(2)} · Next: {format(new Date(s.next_run_date), "MMM d, yyyy")}
                    {s.last_run_date && ` · Last: ${format(new Date(s.last_run_date), "MMM d")}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="text-xs font-sans" onClick={() => generateNow(s)}>Generate Now</Button>
                  <Switch checked={s.is_active} onCheckedChange={() => toggleActive(s.id, s.is_active)} />
                  <Button variant="ghost" size="sm" onClick={() => deleteSchedule(s.id)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <p className="text-sm font-sans text-muted-foreground">No recurring schedules. Create one to automate billing.</p>
        </Card>
      )}
    </div>
  );
};

export default RecurringInvoiceScheduler;
