import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Phone, Mail, MessageSquare, Calendar, FileText, Activity } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLogCRMActivity } from "@/hooks/useCRMData";
import { format } from "date-fns";
import type { CRMActivityEntry } from "@/hooks/useCRMData";

const ACTIVITY_TYPES = ["call", "meeting", "email", "note", "portal_visit", "invoice", "project_update", "custom"];
const typeIcons: Record<string, any> = {
  call: Phone, meeting: Calendar, email: Mail, note: FileText,
  portal_visit: Activity, invoice: Activity, project_update: Activity, custom: MessageSquare,
};

const CRMTimelineTab = ({ contactId, activities }: { contactId: string; activities: CRMActivityEntry[] | undefined }) => {
  const { user } = useAuth();
  const logActivity = useLogCRMActivity();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState({ activity_type: "call", channel: "", content_preview: "" });

  const filtered = (activities || []).filter(a => filter === "all" || a.activity_type === filter);

  const handleLog = () => {
    if (!form.content_preview.trim()) return;
    logActivity.mutate({
      contact_id: contactId,
      activity_type: form.activity_type,
      channel: form.channel || null,
      content_preview: form.content_preview,
      metadata: {},
      logged_by: user?.id || null,
    }, {
      onSuccess: () => { setDialogOpen(false); setForm({ activity_type: "call", channel: "", content_preview: "" }); }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-1 flex-wrap">
          {["all", ...ACTIVITY_TYPES].map(t => (
            <Button key={t} variant={filter === t ? "default" : "outline"} size="sm" className="text-xs font-sans" onClick={() => setFilter(t)}>
              {t === "all" ? "All" : t.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
            </Button>
          ))}
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5 font-sans"><Plus className="w-4 h-4" /> Log Activity</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-sans">Log Activity</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Select value={form.activity_type} onValueChange={v => setForm(p => ({ ...p, activity_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ACTIVITY_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input placeholder="Channel (e.g., phone, zoom, in-person)" value={form.channel} onChange={e => setForm(p => ({ ...p, channel: e.target.value }))} className="font-sans" />
              <Textarea placeholder="What happened?" value={form.content_preview} onChange={e => setForm(p => ({ ...p, content_preview: e.target.value }))} className="font-sans" rows={3} />
              <Button onClick={handleLog} disabled={logActivity.isPending} className="w-full font-sans">Save Activity</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="p-5">
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground font-sans text-center py-6">No activities recorded. Click "Log Activity" to get started.</p>
        ) : (
          <div className="space-y-4">
            {filtered.map(a => {
              const Icon = typeIcons[a.activity_type] || Activity;
              return (
                <div key={a.id} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-sans text-foreground">{a.content_preview || a.activity_type}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-[9px] font-sans">{a.activity_type.replace(/_/g, " ")}</Badge>
                      {a.channel && <span className="text-[11px] text-muted-foreground font-sans">{a.channel}</span>}
                      <span className="text-[11px] text-muted-foreground font-sans">{format(new Date(a.logged_at), "MMM d, h:mm a")}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};

export default CRMTimelineTab;
