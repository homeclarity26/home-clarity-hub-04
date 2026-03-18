import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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

interface Props {
  projectId: string;
}

const DailyLogsTab = ({ projectId }: Props) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({
    weather_conditions: "clear",
    work_completed: "",
    materials_delivered: "",
    issues_encountered: "",
    next_day_plan: "",
  });

  const { data: logs } = useQuery({
    queryKey: ["project-daily-logs", projectId],
    queryFn: async () => {
      const { data } = await supabase
        .from("project_daily_logs")
        .select("*")
        .eq("project_id", projectId)
        .order("log_date", { ascending: false });
      return data || [];
    },
  });

  const addLog = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("project_daily_logs").insert({
        project_id: projectId,
        submitted_by: user!.id,
        weather_conditions: form.weather_conditions,
        work_completed: form.work_completed,
        materials_delivered: form.materials_delivered || null,
        issues_encountered: form.issues_encountered || null,
        next_day_plan: form.next_day_plan || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-daily-logs", projectId] });
      setShowNew(false);
      setForm({ weather_conditions: "clear", work_completed: "", materials_delivered: "", issues_encountered: "", next_day_plan: "" });
      toast.success("Daily log submitted");
    },
  });

  const weatherIcon = (w: string) => {
    if (w?.includes("rain")) return <CloudRain className="w-3.5 h-3.5 text-blue-500" />;
    if (w?.includes("snow")) return <Snowflake className="w-3.5 h-3.5 text-sky-400" />;
    if (w?.includes("cloud") || w?.includes("overcast")) return <Cloud className="w-3.5 h-3.5 text-muted-foreground" />;
    return <Sun className="w-3.5 h-3.5 text-amber-500" />;
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-sans font-semibold text-foreground flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-muted-foreground" />Daily Logs
        </h3>
        <Dialog open={showNew} onOpenChange={setShowNew}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1 text-xs font-sans">
              <Plus className="w-3.5 h-3.5" />New Log Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle className="font-sans">Submit Daily Log</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-sans text-muted-foreground">Weather</label>
                <Input value={form.weather_conditions} onChange={(e) => setForm({ ...form, weather_conditions: e.target.value })} placeholder="e.g., Clear 75°F" className="text-sm" />
              </div>
              <div>
                <label className="text-xs font-sans text-muted-foreground">Work Completed *</label>
                <Textarea value={form.work_completed} onChange={(e) => setForm({ ...form, work_completed: e.target.value })} placeholder="Describe today's work..." className="text-sm" rows={3} />
              </div>
              <div>
                <label className="text-xs font-sans text-muted-foreground">Materials Delivered</label>
                <Input value={form.materials_delivered} onChange={(e) => setForm({ ...form, materials_delivered: e.target.value })} placeholder="Any deliveries today?" className="text-sm" />
              </div>
              <div>
                <label className="text-xs font-sans text-muted-foreground">Issues Encountered</label>
                <Textarea value={form.issues_encountered} onChange={(e) => setForm({ ...form, issues_encountered: e.target.value })} placeholder="Any problems or delays?" className="text-sm" rows={2} />
              </div>
              <div>
                <label className="text-xs font-sans text-muted-foreground">Next Day Plan</label>
                <Input value={form.next_day_plan} onChange={(e) => setForm({ ...form, next_day_plan: e.target.value })} placeholder="What's planned for tomorrow?" className="text-sm" />
              </div>
              <Button className="w-full text-sm font-sans" onClick={() => addLog.mutate()} disabled={!form.work_completed.trim()}>
                Submit Log
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {(logs || []).length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-muted-foreground font-sans">No daily logs yet. Submit your first job site log.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {logs!.map((log: any) => (
            <Card key={log.id} className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <p className="text-sm font-sans font-semibold text-foreground">{format(new Date(log.log_date), "EEEE, MMMM d")}</p>
                <div className="flex items-center gap-1">
                  {weatherIcon(log.weather_conditions)}
                  <span className="text-xs text-muted-foreground font-sans">{log.weather_conditions}</span>
                </div>
                {log.share_with_client && <Badge variant="secondary" className="text-[9px] h-4">Shared</Badge>}
              </div>
              {log.work_completed && (
                <div className="mb-2">
                  <p className="text-[10px] font-sans text-muted-foreground uppercase tracking-wider">Work Completed</p>
                  <p className="text-sm font-sans text-foreground">{log.work_completed}</p>
                </div>
              )}
              {log.issues_encountered && (
                <div className="mb-2">
                  <p className="text-[10px] font-sans text-muted-foreground uppercase tracking-wider">Issues</p>
                  <p className="text-sm font-sans text-destructive">{log.issues_encountered}</p>
                </div>
              )}
              {log.next_day_plan && (
                <div>
                  <p className="text-[10px] font-sans text-muted-foreground uppercase tracking-wider">Tomorrow</p>
                  <p className="text-sm font-sans text-foreground">{log.next_day_plan}</p>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default DailyLogsTab;
