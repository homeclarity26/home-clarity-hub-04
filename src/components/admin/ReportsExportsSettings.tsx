import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Mail, Calendar, Plus, Trash2, Clock, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const REPORT_TYPES = [
  { value: "client_list", label: "Client List Export" },
  { value: "revenue_summary", label: "Revenue Summary" },
  { value: "project_status", label: "Project Status" },
  { value: "invoice_aging", label: "Invoice Aging" },
  { value: "trade_partner_performance", label: "Trade Partner Performance" },
  { value: "maintenance_due", label: "Maintenance Due" },
];

const ReportsExportsSettings = () => {
  const [digestEnabled, setDigestEnabled] = useState(false);
  const [digestDay, setDigestDay] = useState("monday");
  const [digestTime, setDigestTime] = useState("08:00");
  const [testingDigest, setTestingDigest] = useState(false);
  const [scheduledReports, setScheduledReports] = useState<any[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newReport, setNewReport] = useState({ name: "", report_type: "client_list", frequency: "weekly", recipients: "" });
  const [creating, setCreating] = useState(false);
  const [recentExports, setRecentExports] = useState<any[]>([]);

  useEffect(() => {
    loadScheduledReports();
    loadRecentExports();
  }, []);

  const loadScheduledReports = async () => {
    const { data } = await supabase.from("scheduled_reports").select("*").order("created_at", { ascending: false });
    if (data) setScheduledReports(data);
  };

  const loadRecentExports = async () => {
    const { data } = await supabase.from("export_jobs").select("*").order("created_at", { ascending: false }).limit(10);
    if (data) setRecentExports(data);
  };

  const handleTestDigest = async () => {
    setTestingDigest(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-weekly-digest");
      if (error) throw error;
      toast.success("Test digest generated successfully");
    } catch {
      toast.error("Failed to generate test digest");
    } finally {
      setTestingDigest(false);
    }
  };

  const handleCreateScheduled = async () => {
    setCreating(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      const recipients = newReport.recipients.split(",").map(e => e.trim()).filter(Boolean);
      const { error } = await supabase.from("scheduled_reports").insert({
        name: newReport.name,
        report_type: newReport.report_type,
        frequency: newReport.frequency,
        recipients,
        active: true,
        created_by: user.user?.id,
      });
      if (error) throw error;
      toast.success("Scheduled report created");
      setShowCreateDialog(false);
      setNewReport({ name: "", report_type: "client_list", frequency: "weekly", recipients: "" });
      loadScheduledReports();
    } catch {
      toast.error("Failed to create scheduled report");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteScheduled = async (id: string) => {
    await supabase.from("scheduled_reports").delete().eq("id", id);
    toast.success("Scheduled report deleted");
    loadScheduledReports();
  };

  const handleToggleScheduled = async (id: string, active: boolean) => {
    await supabase.from("scheduled_reports").update({ active }).eq("id", id);
    loadScheduledReports();
  };

  return (
    <div className="space-y-6">
      {/* Weekly Digest */}
      <Card className="p-6 space-y-5">
        <div className="flex items-center gap-3">
          <Mail className="w-5 h-5 text-accent" />
          <h3 className="text-base font-sans font-semibold text-foreground">Weekly Business Digest</h3>
        </div>
        <p className="text-sm font-sans text-muted-foreground">
          Receive a weekly AI-generated email summarizing revenue, client activity, overdue items, and priorities.
        </p>

        <div className="flex items-center justify-between">
          <Label className="text-sm font-sans">Send weekly digest email</Label>
          <Switch checked={digestEnabled} onCheckedChange={setDigestEnabled} />
        </div>

        {digestEnabled && (
          <div className="flex items-center gap-4 pl-1">
            <div className="space-y-1">
              <Label className="text-[10px] font-sans uppercase tracking-wider text-muted-foreground">Day</Label>
              <Select value={digestDay} onValueChange={setDigestDay}>
                <SelectTrigger className="w-32 font-sans text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["monday", "tuesday", "wednesday", "thursday", "friday"].map(d => (
                    <SelectItem key={d} value={d} className="capitalize font-sans">{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-sans uppercase tracking-wider text-muted-foreground">Time</Label>
              <Input type="time" value={digestTime} onChange={(e) => setDigestTime(e.target.value)} className="w-28 font-sans" />
            </div>
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 font-sans text-xs"
          onClick={handleTestDigest}
          disabled={testingDigest}
        >
          {testingDigest ? <Loader2 className="w-3 h-3 animate-spin" /> : <Mail className="w-3 h-3" />}
          Send test digest now
        </Button>
      </Card>

      {/* Scheduled Reports */}
      <Card className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-accent" />
            <h3 className="text-base font-sans font-semibold text-foreground">Scheduled Reports</h3>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 font-sans text-xs">
                <Plus className="w-3 h-3" /> Create
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-sans">Create Scheduled Report</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-sans">Report Name</Label>
                  <Input
                    value={newReport.name}
                    onChange={(e) => setNewReport({ ...newReport, name: e.target.value })}
                    placeholder="Monthly Revenue Report"
                    className="font-sans"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-sans">Type</Label>
                  <Select value={newReport.report_type} onValueChange={(v) => setNewReport({ ...newReport, report_type: v })}>
                    <SelectTrigger className="font-sans">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {REPORT_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value} className="font-sans">{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-sans">Frequency</Label>
                  <Select value={newReport.frequency} onValueChange={(v) => setNewReport({ ...newReport, frequency: v })}>
                    <SelectTrigger className="font-sans w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily" className="font-sans">Daily</SelectItem>
                      <SelectItem value="weekly" className="font-sans">Weekly</SelectItem>
                      <SelectItem value="monthly" className="font-sans">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-sans">Recipients (comma-separated emails)</Label>
                  <Input
                    value={newReport.recipients}
                    onChange={(e) => setNewReport({ ...newReport, recipients: e.target.value })}
                    placeholder="admin@example.com, team@example.com"
                    className="font-sans"
                  />
                </div>
                <Button onClick={handleCreateScheduled} disabled={creating || !newReport.name.trim()} className="w-full font-sans">
                  {creating ? "Creating..." : "Create Scheduled Report"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {scheduledReports.length === 0 ? (
          <p className="text-sm font-sans text-muted-foreground">No scheduled reports yet.</p>
        ) : (
          <div className="space-y-3">
            {scheduledReports.map((sr) => (
              <div key={sr.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={sr.active}
                    onCheckedChange={(v) => handleToggleScheduled(sr.id, v)}
                  />
                  <div>
                    <p className="text-sm font-sans font-medium text-foreground">{sr.name}</p>
                    <p className="text-[11px] font-sans text-muted-foreground">
                      {REPORT_TYPES.find(t => t.value === sr.report_type)?.label} · {sr.frequency}
                      {sr.recipients?.length > 0 && ` · ${sr.recipients.length} recipient(s)`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={sr.active ? "default" : "secondary"} className="text-[10px] font-mono">
                    {sr.active ? "Active" : "Paused"}
                  </Badge>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleDeleteScheduled(sr.id)}>
                    <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Recent Exports */}
      <Card className="p-6 space-y-5">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-accent" />
          <h3 className="text-base font-sans font-semibold text-foreground">Recent Exports</h3>
        </div>
        {recentExports.length === 0 ? (
          <p className="text-sm font-sans text-muted-foreground">No exports yet. Use the Export menu from any list view.</p>
        ) : (
          <div className="space-y-2">
            {recentExports.map((ej) => (
              <div key={ej.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div>
                  <p className="text-sm font-sans font-medium text-foreground capitalize">
                    {ej.export_type?.replace(/_/g, " ")}
                  </p>
                  <p className="text-[10px] font-sans text-muted-foreground">
                    {new Date(ej.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={ej.status === "complete" ? "default" : ej.status === "failed" ? "destructive" : "secondary"}
                    className="text-[10px] font-mono"
                  >
                    {ej.status}
                  </Badge>
                  {ej.file_url && (
                    <Button asChild variant="ghost" size="sm" className="h-7 px-2">
                      <a href={ej.file_url} download className="text-xs font-sans">Download</a>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default ReportsExportsSettings;
