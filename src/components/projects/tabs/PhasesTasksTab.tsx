import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, ChevronDown, ChevronRight, CheckCircle2, Circle, Clock, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useProjectPhases, useProjectTasks, useCreatePhase, useCreateTask, useUpdatePhaseStatus, useUpdateTaskStatus } from "@/hooks/useProjectData";

const phaseStatuses = ["not_started", "in_progress", "complete", "blocked"];
const taskStatuses = ["todo", "in_progress", "blocked", "done"];
const statusIcons: Record<string, React.ReactNode> = { todo: <Circle className="w-3.5 h-3.5 text-muted-foreground" />, in_progress: <Clock className="w-3.5 h-3.5 text-primary" />, blocked: <AlertTriangle className="w-3.5 h-3.5 text-destructive" />, done: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> };

interface Props { projectId: string; }

const PhasesTasksTab = ({ projectId }: Props) => {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [newPhase, setNewPhase] = useState("");
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [newTask, setNewTask] = useState("");

  const { data: phases, isLoading } = useProjectPhases(projectId);
  const { data: tasks } = useProjectTasks(projectId);
  const createPhase = useCreatePhase();
  const createTask = useCreateTask();
  const updatePhase = useUpdatePhaseStatus();
  const updateTask = useUpdateTaskStatus();

  const addPhase = () => { if (!newPhase.trim()) return; createPhase.mutate({ project_id: projectId, name: newPhase.trim(), sort_order: phases?.length || 0 }, { onSuccess: () => { setNewPhase(""); toast.success("Phase added"); } }); };
  const addTask = (phaseId: string) => { if (!newTask.trim()) return; const n = (tasks || []).filter((t) => t.phase_id === phaseId).length; createTask.mutate({ project_id: projectId, phase_id: phaseId, title: newTask.trim(), sort_order: n }, { onSuccess: () => { setNewTask(""); setAddingTo(null); toast.success("Task added"); } }); };
  const toggle = (id: string) => { const s = new Set(expanded); s.has(id) ? s.delete(id) : s.add(id); setExpanded(s); };

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4 mt-4">
      {(phases || []).map((phase) => {
        const pt = (tasks || []).filter((t) => t.phase_id === phase.id);
        const done = pt.filter((t) => t.status === "done").length;
        const open = expanded.has(phase.id);
        return (
          <Card key={phase.id} className="overflow-hidden">
            <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/30" onClick={() => toggle(phase.id)}>
              {open ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
              <div className="flex-1"><div className="flex items-center gap-2"><span className="text-sm font-sans font-semibold text-foreground">{phase.name}</span><Badge variant={phase.status === "complete" ? "default" : phase.status === "blocked" ? "destructive" : "secondary"} className="text-[10px] capitalize h-5">{phase.status.replace("_", " ")}</Badge><span className="text-[10px] font-sans text-muted-foreground">{done}/{pt.length} tasks</span></div></div>
              <Select value={phase.status} onValueChange={(v) => updatePhase.mutate({ phaseId: phase.id, status: v, projectId, phaseName: phase.name })}><SelectTrigger className="w-32 h-7 text-[10px]" onClick={(e) => e.stopPropagation()}><SelectValue /></SelectTrigger><SelectContent>{phaseStatuses.map((s) => <SelectItem key={s} value={s} className="text-xs capitalize">{s.replace("_", " ")}</SelectItem>)}</SelectContent></Select>
            </div>
            {open && (
              <div className="border-t border-border px-4 pb-4">
                <div className="space-y-1 mt-3">
                  {pt.map((task) => (
                    <div key={task.id} className="flex items-center gap-3 py-2 px-2 rounded-md hover:bg-muted/30 group">
                      <button className="bg-transparent border-none cursor-pointer p-0" onClick={() => updateTask.mutate({ taskId: task.id, status: task.status === "done" ? "todo" : "done", projectId })}>{statusIcons[task.status] || statusIcons.todo}</button>
                      <span className={`text-sm font-sans flex-1 ${task.status === "done" ? "line-through text-muted-foreground" : "text-foreground"}`}>{task.title}</span>
                      {task.priority && task.priority !== "normal" && <Badge variant={task.priority === "urgent" ? "destructive" : "secondary"} className="text-[9px] h-4 capitalize">{task.priority}</Badge>}
                      <Select value={task.status} onValueChange={(v) => updateTask.mutate({ taskId: task.id, status: v, projectId })}><SelectTrigger className="w-24 h-6 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"><SelectValue /></SelectTrigger><SelectContent>{taskStatuses.map((s) => <SelectItem key={s} value={s} className="text-xs capitalize">{s.replace("_", " ")}</SelectItem>)}</SelectContent></Select>
                    </div>
                  ))}
                </div>
                {addingTo === phase.id ? (
                  <div className="flex gap-2 mt-2"><Input value={newTask} onChange={(e) => setNewTask(e.target.value)} placeholder="Task name..." className="h-8 text-sm" onKeyDown={(e) => { if (e.key === "Enter") addTask(phase.id); }} autoFocus /><Button size="sm" className="h-8 text-xs" onClick={() => addTask(phase.id)}>Add</Button><Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setAddingTo(null)}>Cancel</Button></div>
                ) : (
                  <Button variant="ghost" size="sm" className="mt-2 text-xs font-sans gap-1 text-muted-foreground" onClick={() => setAddingTo(phase.id)}><Plus className="w-3 h-3" />Add Task</Button>
                )}
              </div>
            )}
          </Card>
        );
      })}
      <div className="flex gap-2"><Input value={newPhase} onChange={(e) => setNewPhase(e.target.value)} placeholder="New phase name..." className="h-9 text-sm max-w-xs" onKeyDown={(e) => { if (e.key === "Enter") addPhase(); }} /><Button size="sm" className="h-9 gap-1 text-xs font-sans" onClick={addPhase}><Plus className="w-3.5 h-3.5" />Add Phase</Button></div>
    </div>
  );
};

export default PhasesTasksTab;
