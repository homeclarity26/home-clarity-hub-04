import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Clock, DollarSign, Timer } from "lucide-react";
import { useTimeEntries, useCreateTimeEntry, ACTIVITY_TYPES, type TimeEntry } from "@/hooks/useTimeTracking";
import { toast } from "sonner";
import { format } from "date-fns";

interface TimeTrackingSectionProps {
  clientId: string;
  totalRevenue?: number;
}

const TimeTrackingSection = ({ clientId, totalRevenue = 0 }: TimeTrackingSectionProps) => {
  const { data: entries } = useTimeEntries(clientId);
  const createEntry = useCreateTimeEntry();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ entry_date: new Date().toISOString().split("T")[0], hours: "", activity_type: "site_visit", notes: "" });

  const totalHours = (entries || []).reduce((s, e) => s + Number(e.hours), 0);
  const hourlyRate = totalHours > 0 ? totalRevenue / totalHours : 0;

  // Breakdown by activity type
  const breakdown: Record<string, number> = {};
  (entries || []).forEach((e) => {
    breakdown[e.activity_type] = (breakdown[e.activity_type] || 0) + Number(e.hours);
  });

  const handleCreate = async () => {
    if (!form.hours || parseFloat(form.hours) <= 0) return;
    try {
      await createEntry.mutateAsync({ client_id: clientId, entry_date: form.entry_date, hours: parseFloat(form.hours), activity_type: form.activity_type, notes: form.notes || undefined });
      toast.success("Time logged");
      setOpen(false);
      setForm({ entry_date: new Date().toISOString().split("T")[0], hours: "", activity_type: "site_visit", notes: "" });
    } catch {
      toast.error("Failed to log time");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-sans font-semibold text-foreground">Time Tracking</h3>
        <Button size="sm" className="gap-1.5 text-xs font-sans" onClick={() => setOpen(true)}>
          <Plus className="w-3.5 h-3.5" />Log Time
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 text-center">
          <Clock className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
          <p className="text-lg font-sans font-bold text-foreground">{totalHours.toFixed(1)}</p>
          <p className="text-[10px] font-sans text-muted-foreground">Total Hours</p>
        </Card>
        <Card className="p-4 text-center">
          <Timer className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
          <p className="text-lg font-sans font-bold text-foreground">{(entries || []).length}</p>
          <p className="text-[10px] font-sans text-muted-foreground">Entries</p>
        </Card>
        <Card className="p-4 text-center">
          <DollarSign className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
          <p className="text-lg font-sans font-bold text-foreground">${hourlyRate.toFixed(0)}</p>
          <p className="text-[10px] font-sans text-muted-foreground">Eff. Hourly Rate</p>
        </Card>
      </div>

      {/* Breakdown */}
      {Object.keys(breakdown).length > 0 && (
        <Card className="p-4">
          <p className="text-xs font-sans font-medium text-muted-foreground mb-2">Hours by Activity</p>
          <div className="space-y-2">
            {Object.entries(breakdown).sort((a, b) => b[1] - a[1]).map(([type, hrs]) => {
              const label = ACTIVITY_TYPES.find((a) => a.value === type)?.label || type;
              const pct = totalHours > 0 ? (hrs / totalHours) * 100 : 0;
              return (
                <div key={type} className="flex items-center gap-2">
                  <span className="text-xs font-sans text-foreground w-32 truncate">{label}</span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs font-mono text-muted-foreground w-10 text-right">{hrs.toFixed(1)}h</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Recent Entries */}
      {(entries || []).slice(0, 5).map((entry) => (
        <div key={entry.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
          <div>
            <p className="text-sm font-sans text-foreground">{ACTIVITY_TYPES.find((a) => a.value === entry.activity_type)?.label || entry.activity_type}</p>
            <p className="text-xs font-sans text-muted-foreground">{format(new Date(entry.entry_date), "MMM d, yyyy")}{entry.notes ? ` · ${entry.notes}` : ""}</p>
          </div>
          <span className="text-sm font-mono font-medium text-foreground">{Number(entry.hours).toFixed(1)}h</span>
        </div>
      ))}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-sans">Log Time</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="font-sans text-xs">Date</Label>
                <Input type="date" value={form.entry_date} onChange={(e) => setForm({ ...form, entry_date: e.target.value })} />
              </div>
              <div>
                <Label className="font-sans text-xs">Hours</Label>
                <Input type="number" step="0.25" min="0.25" placeholder="1.5" value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} />
              </div>
            </div>
            <div>
              <Label className="font-sans text-xs">Activity Type</Label>
              <Select value={form.activity_type} onValueChange={(v) => setForm({ ...form, activity_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ACTIVITY_TYPES.map((a) => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="font-sans text-xs">Notes</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <Button onClick={handleCreate} className="w-full font-sans" disabled={createEntry.isPending || !form.hours}>
              {createEntry.isPending ? "Saving…" : "Log Time"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TimeTrackingSection;
