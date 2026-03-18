import { useState, useEffect } from "react";
import { Plus, Megaphone, Loader2, Trash2, Eye } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AdminHeader from "@/components/admin/AdminHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";

interface Announcement {
  id: string;
  title: string;
  body: string;
  target_audience: string;
  display_type: string;
  start_date: string;
  end_date: string | null;
  created_at: string;
}

const AdminAnnouncements = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    body: "",
    target_audience: "all",
    display_type: "banner",
    start_date: new Date().toISOString().split("T")[0],
    end_date: "",
  });
  const [saving, setSaving] = useState(false);
  const [dismissalCounts, setDismissalCounts] = useState<Record<string, number>>({});

  const load = async () => {
    const { data } = await (supabase.from("announcements" as any) as any)
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setAnnouncements(data as Announcement[]);

    // Get dismissal counts
    const { data: dismissals } = await (supabase.from("announcement_dismissals" as any) as any)
      .select("announcement_id");
    if (dismissals) {
      const counts: Record<string, number> = {};
      (dismissals as any[]).forEach((d: any) => {
        counts[d.announcement_id] = (counts[d.announcement_id] || 0) + 1;
      });
      setDismissalCounts(counts);
    }
    setIsLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!form.title.trim() || !form.body.trim() || !user) return;
    setSaving(true);
    const { error } = await (supabase.from("announcements" as any) as any).insert({
      title: form.title,
      body: form.body,
      target_audience: form.target_audience,
      display_type: form.display_type,
      start_date: new Date(form.start_date).toISOString(),
      end_date: form.end_date ? new Date(form.end_date).toISOString() : null,
      created_by: user.id,
    });
    setSaving(false);
    if (error) { toast.error("Failed to create announcement"); return; }
    toast.success("Announcement created");
    setCreateOpen(false);
    setForm({ title: "", body: "", target_audience: "all", display_type: "banner", start_date: new Date().toISOString().split("T")[0], end_date: "" });
    load();
  };

  const handleDelete = async (id: string) => {
    await (supabase.from("announcements" as any) as any).delete().eq("id", id);
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    toast.success("Announcement deleted");
  };

  const getStatus = (a: Announcement) => {
    const now = new Date();
    const start = new Date(a.start_date);
    if (start > now) return "scheduled";
    if (a.end_date && new Date(a.end_date) < now) return "expired";
    return "active";
  };

  return (
    <div>
      <AdminHeader breadcrumbs={[{ label: "Announcements" }]} />
      <div className="p-6 max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Megaphone className="w-5 h-5 text-accent" />
            <h1 className="text-xl font-sans font-bold text-foreground">Announcements</h1>
          </div>
          <Button size="sm" className="gap-1.5 font-sans" onClick={() => setCreateOpen(true)}>
            <Plus className="w-3.5 h-3.5" />New Announcement
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : announcements.length === 0 ? (
          <Card className="p-8 text-center">
            <Megaphone className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-sans text-muted-foreground">No announcements yet. Create one to broadcast to your clients.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {announcements.map((a) => {
              const status = getStatus(a);
              return (
                <Card key={a.id} className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-sans font-semibold text-foreground">{a.title}</h3>
                        <Badge variant={status === "active" ? "default" : status === "scheduled" ? "secondary" : "outline"} className="text-[10px]">
                          {status}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">{a.display_type}</Badge>
                        <Badge variant="outline" className="text-[10px]">{a.target_audience}</Badge>
                      </div>
                      <p className="text-xs font-sans text-muted-foreground line-clamp-2">{a.body}</p>
                      <div className="flex items-center gap-4 mt-2 text-[10px] font-sans text-muted-foreground">
                        <span>{format(new Date(a.start_date), "MMM d, yyyy")}{a.end_date ? ` — ${format(new Date(a.end_date), "MMM d, yyyy")}` : ""}</span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />Seen by {dismissalCounts[a.id] || 0} clients
                        </span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(a.id)}>
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle className="font-sans">New Announcement</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label className="text-xs font-sans">Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="font-sans" /></div>
              <div><Label className="text-xs font-sans">Body</Label><Textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} rows={4} className="font-sans" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-xs font-sans">Target Audience</Label>
                  <Select value={form.target_audience} onValueChange={(v) => setForm({ ...form, target_audience: v })}>
                    <SelectTrigger className="font-sans"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Clients</SelectItem>
                      <SelectItem value="active_members">Active Members Only</SelectItem>
                      <SelectItem value="overdue_invoices">Clients with Overdue Invoices</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label className="text-xs font-sans">Display Type</Label>
                  <Select value={form.display_type} onValueChange={(v) => setForm({ ...form, display_type: v })}>
                    <SelectTrigger className="font-sans"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="banner">Banner</SelectItem>
                      <SelectItem value="notification">Notification</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-xs font-sans">Start Date</Label><Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></div>
                <div><Label className="text-xs font-sans">End Date (optional)</Label><Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></div>
              </div>
              <Button onClick={handleCreate} disabled={saving || !form.title.trim()} className="w-full font-sans">
                {saving ? "Creating..." : "Create Announcement"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminAnnouncements;
