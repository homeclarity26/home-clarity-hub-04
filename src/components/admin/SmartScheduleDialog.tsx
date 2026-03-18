import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Calendar, Lightbulb, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format, isSameDay, addDays, isPast } from "date-fns";

interface SmartScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  existingEvents?: { id: string; title: string; event_date: string; event_type: string }[];
  equipment?: { id: string; name: string; next_service_date: string | null; category: string | null }[];
  editEvent?: { id: string; title: string; description: string | null; event_date: string; event_type: string } | null;
}

const SmartScheduleDialog = ({ open, onOpenChange, propertyId, existingEvents = [], equipment = [], editEvent }: SmartScheduleDialogProps) => {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", event_date: "", event_type: "appointment", create_reminders: true });

  useEffect(() => {
    if (editEvent) {
      const d = new Date(editEvent.event_date);
      const local = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
      setForm({ title: editEvent.title, description: editEvent.description || "", event_date: local, event_type: editEvent.event_type, create_reminders: false });
    } else {
      setForm({ title: "", description: "", event_date: "", event_type: "appointment", create_reminders: true });
    }
  }, [editEvent, open]);

  // Conflict detection
  const conflicts = useMemo(() => {
    if (!form.event_date) return [];
    const target = new Date(form.event_date);
    return existingEvents.filter((ev) => {
      if (editEvent && ev.id === editEvent.id) return false;
      return isSameDay(new Date(ev.event_date), target);
    });
  }, [form.event_date, existingEvents, editEvent]);

  // Suggested dates from equipment service dates
  const suggestions = useMemo(() => {
    return equipment
      .filter((e) => e.next_service_date && !isPast(new Date(e.next_service_date)))
      .sort((a, b) => new Date(a.next_service_date!).getTime() - new Date(b.next_service_date!).getTime())
      .slice(0, 3)
      .map((e) => ({
        label: `${e.name} service due`,
        date: e.next_service_date!,
        category: e.category,
      }));
  }, [equipment]);

  const handleSave = async () => {
    if (!form.title || !form.event_date) return;
    setSaving(true);
    try {
      const eventDate = new Date(form.event_date).toISOString();

      if (editEvent) {
        const { error } = await supabase
          .from("schedule_events")
          .update({ title: form.title, description: form.description || null, event_date: eventDate, event_type: form.event_type })
          .eq("id", editEvent.id);
        if (error) throw error;
        toast.success("Event updated");
      } else {
        const { error } = await supabase
          .from("schedule_events")
          .insert({ property_id: propertyId, title: form.title, description: form.description || null, event_date: eventDate, event_type: form.event_type });
        if (error) throw error;

        // Auto-create reminders
        if (form.create_reminders) {
          const reminders = [
            { days: 7, label: "7-day reminder" },
            { days: 1, label: "1-day reminder" },
          ];
          const targetDate = new Date(form.event_date);
          for (const r of reminders) {
            const reminderDate = addDays(targetDate, -r.days);
            if (!isPast(reminderDate)) {
              await supabase.from("schedule_events").insert({
                property_id: propertyId,
                title: `Reminder: ${form.title}`,
                description: `${r.label} for "${form.title}"`,
                event_date: reminderDate.toISOString(),
                event_type: "reminder",
              });
            }
          }
        }

        toast.success("Event created" + (form.create_reminders ? " with reminders" : ""));
      }

      await queryClient.invalidateQueries({ queryKey: ["admin-schedule-events", propertyId] });
      onOpenChange(false);
    } catch {
      toast.error("Failed to save event");
    } finally {
      setSaving(false);
    }
  };

  const applySuggestion = (dateStr: string, label: string) => {
    const d = new Date(dateStr);
    const local = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T09:00`;
    setForm((f) => ({ ...f, event_date: local, title: f.title || label, event_type: "task" }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-sans">{editEvent ? "Edit Event" : "Schedule Event"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="font-sans">Title</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <Label className="font-sans">Date & Time</Label>
            <Input type="datetime-local" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} />
          </div>

          {/* Conflict warning */}
          {conflicts.length > 0 && (
            <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20">
              <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-sans font-medium text-destructive">Scheduling conflict</p>
                {conflicts.map((c) => (
                  <p key={c.id} className="text-xs font-sans text-muted-foreground mt-0.5">
                    "{c.title}" at {format(new Date(c.event_date), "h:mm a")}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Suggested dates from equipment */}
          {!editEvent && suggestions.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-accent" />
                <span className="text-xs font-sans font-medium text-muted-foreground">Suggested from equipment</span>
              </div>
              {suggestions.map((s) => (
                <button
                  key={s.date}
                  onClick={() => applySuggestion(s.date, s.label)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-md border border-border bg-muted/30 hover:bg-muted/60 transition-colors text-left"
                >
                  <span className="text-xs font-sans text-foreground">{s.label}</span>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {format(new Date(s.date), "MMM d")}
                  </Badge>
                </button>
              ))}
            </div>
          )}

          <div>
            <Label className="font-sans">Type</Label>
            <Select value={form.event_type} onValueChange={(v) => setForm({ ...form, event_type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="appointment">Appointment</SelectItem>
                <SelectItem value="milestone">Milestone</SelectItem>
                <SelectItem value="task">Task</SelectItem>
                <SelectItem value="inspection">Inspection</SelectItem>
                <SelectItem value="reminder">Reminder</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="font-sans">Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>

          {!editEvent && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.create_reminders}
                onChange={(e) => setForm({ ...form, create_reminders: e.target.checked })}
                className="rounded border-border"
              />
              <span className="text-xs font-sans text-muted-foreground">Auto-create 7-day and 1-day reminders</span>
            </label>
          )}

          <Button onClick={handleSave} className="w-full font-sans" disabled={saving || !form.title || !form.event_date}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {editEvent ? "Save Changes" : "Create Event"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SmartScheduleDialog;
