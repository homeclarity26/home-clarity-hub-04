import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Sun, Cloud, CloudRain, Snowflake, CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useProjectDailyLogs, logProjectActivity } from "@/hooks/useProjectData";

interface Props { projectId: string; }

const DailyLogsTab = ({ projectId }: Props) => {
  const { user } = useAuth(); const qc = useQueryClient();
  const [show, setShow] = useState(false);
  const [f, setF] = useState({ weather: "clear", work: "", materials: "", issues: "", plan: "" });
  const { data: logs } = useProjectDailyLogs(projectId);

  const add = useMutation({
    mutationFn: async () => { const { error } = await supabase.from("project_daily_logs").insert({ project_id: projectId, submitted_by: user!.id, weather_conditions: f.weather, work_completed: f.work, materials_delivered: f.materials || null, issues_encountered: f.issues || null, next_day_plan: f.plan || null }); if (error) throw error; await logProjectActivity(projectId, "daily_log", "Daily log submitted", user?.id); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["project-daily-logs", projectId] }); qc.invalidateQueries({ queryKey: ["project-activity-recent", projectId] }); setShow(false); setF({ weather: "clear", work: "", materials: "", issues: "", plan: "" }); toast.success("Daily log submitted"); },
  });

  const wIcon = (w: string | null) => { if (w?.includes("rain")) return <CloudRain className="w-3.5 h-3.5 text-blue-500" />; if (w?.includes("snow")) return <Snowflake className="w-3.5 h-3.5 text-sky-400" />; if (w?.includes("cloud")) return <Cloud className="w-3.5 h-3.5 text-muted-foreground" />; return <Sun className="w-3.5 h-3.5 text-amber-500" />; };

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-sans font-semibold text-foreground flex items-center gap-2"><CalendarDays className="w-4 h-4 text-muted-foreground" />Daily Logs</h3>
        <Dialog open={show} onOpenChange={setShow}><DialogTrigger asChild><Button size="sm" className="gap-1 text-xs font-sans"><Plus className="w-3.5 h-3.5" />New Log</Button></DialogTrigger>
          <DialogContent className="max-w-lg"><DialogHeader><DialogTitle className="font-sans">Submit Daily Log</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><label className="text-xs font-sans text-muted-foreground">Weather</label><Input value={f.weather} onChange={(e) => setF({ ...f, weather: e.target.value })} placeholder="e.g., Clear 75°F" className="text-sm" /></div>
              <div><label className="text-xs font-sans text-muted-foreground">Work Completed *</label><Textarea value={f.work} onChange={(e) => setF({ ...f, work: e.target.value })} className="text-sm" rows={3} /></div>
              <div><label className="text-xs font-sans text-muted-foreground">Materials Delivered</label><Input value={f.materials} onChange={(e) => setF({ ...f, materials: e.target.value })} className="text-sm" /></div>
              <div><label className="text-xs font-sans text-muted-foreground">Issues Encountered</label><Textarea value={f.issues} onChange={(e) => setF({ ...f, issues: e.target.value })} className="text-sm" rows={2} /></div>
              <div><label className="text-xs font-sans text-muted-foreground">Next Day Plan</label><Input value={f.plan} onChange={(e) => setF({ ...f, plan: e.target.value })} className="text-sm" /></div>
              <Button className="w-full text-sm font-sans" onClick={() => add.mutate()} disabled={!f.work.trim() || add.isPending}>Submit Log</Button>
            </div></DialogContent></Dialog>
      </div>
      {(logs || []).length === 0 ? <Card className="p-8 text-center"><p className="text-sm text-muted-foreground font-sans">No daily logs yet.</p></Card> : (
        <div className="space-y-3">{logs!.map((l) => (<Card key={l.id} className="p-4">
          <div className="flex items-center gap-3 mb-2"><p className="text-sm font-sans font-semibold text-foreground">{format(new Date(l.log_date), "EEEE, MMMM d")}</p><div className="flex items-center gap-1">{wIcon(l.weather_conditions)}<span className="text-xs text-muted-foreground font-sans">{l.weather_conditions}</span></div>{l.share_with_client && <Badge variant="secondary" className="text-[9px] h-4">Shared</Badge>}</div>
          {l.work_completed && <div className="mb-2"><p className="text-[10px] font-sans text-muted-foreground uppercase tracking-wider">Work Completed</p><p className="text-sm font-sans text-foreground">{l.work_completed}</p></div>}
          {l.issues_encountered && <div className="mb-2"><p className="text-[10px] font-sans text-muted-foreground uppercase tracking-wider">Issues</p><p className="text-sm font-sans text-destructive">{l.issues_encountered}</p></div>}
          {l.next_day_plan && <div><p className="text-[10px] font-sans text-muted-foreground uppercase tracking-wider">Tomorrow</p><p className="text-sm font-sans text-foreground">{l.next_day_plan}</p></div>}
        </Card>))}</div>
      )}
    </div>
  );
};

export default DailyLogsTab;
