import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Plus, ChevronDown, ChevronRight, Flag, CheckCircle2, Circle, Clock, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";

const phaseStatuses = ["not_started", "in_progress", "complete", "blocked"];
const taskStatuses = ["todo", "in_progress", "blocked", "done"];
const taskPriorities = ["low", "normal", "high", "urgent"];

const statusIcons: Record<string, React.ReactNode> = {
  todo: <Circle className="w-3.5 h-3.5 text-muted-foreground" />,
  in_progress: <Clock className="w-3.5 h-3.5 text-primary" />,
  blocked: <AlertTriangle className="w-3.5 h-3.5 text-destructive" />,
  done: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />,
};

interface Props {
  projectId: string;
}

const PhasesTasksTab = ({ projectId }: Props) => {
  const queryClient = useQueryClient();
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());
  const [newPhaseName, setNewPhaseName] = useState("");
  const [addingTaskTo, setAddingTaskTo] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const { data: phases, isLoading } = useQuery({
    queryKey: ["project-phases", projectId],
    queryFn: async () => {
      const { data } = await supabase
        .from("project_phases")
        .select("*")
        .eq("project_id", projectId)
        .order("sort_order");
      return data || [];
    },
  });

  const { data: tasks } = useQuery({
    queryKey: ["project-tasks", projectId],
    queryFn: async () => {
      const { data } = await supabase
        .from("project_tasks")
        .select("*")
        .eq("project_id", projectId)
        .order("sort_order");
      return data || [];
    },
  });

  const addPhase = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase.from("project_phases").insert({
        project_id: projectId,
        name,
        sort_order: (phases?.length || 0),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-phases", projectId] });
      setNewPhaseName("");
      toast.success("Phase added");
    },
  });

  const addTask = useMutation({
    mutationFn: async ({ phaseId, title }: { phaseId: string; title: string }) => {
      const phaseTasks = (tasks || []).filter((t: any) => t.phase_id === phaseId);
      const { error } = await supabase.from("project_tasks").insert({
        project_id: projectId,
        phase_id: phaseId,
        title,
        sort_order: phaseTasks.length,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-tasks", projectId] });
      setNewTaskTitle("");
      setAddingTaskTo(null);
      toast.success("Task added");
    },
  });

  const updateTaskStatus = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: string }) => {
      const { error } = await supabase.from("project_tasks").update({ status }).eq("id", taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-tasks", projectId] });
    },
  });

  const updatePhaseStatus = useMutation({
    mutationFn: async ({ phaseId, status }: { phaseId: string; status: string }) => {
      const { error } = await supabase.from("project_phases").update({ status }).eq("id", phaseId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-phases", projectId] });
    },
  });

  const togglePhase = (id: string) => {
    const next = new Set(expandedPhases);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpandedPhases(next);
  };

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4 mt-4">
      {(phases || []).map((phase: any) => {
        const phaseTasks = (tasks || []).filter((t: any) => t.phase_id === phase.id);
        const completedTasks = phaseTasks.filter((t: any) => t.status === "done").length;
        const isExpanded = expandedPhases.has(phase.id);

        return (
          <Card key={phase.id} className="overflow-hidden">
            <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/30" onClick={() => togglePhase(phase.id)}>
              {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-sans font-semibold text-foreground">{phase.name}</span>
                  <Badge variant={phase.status === "complete" ? "default" : phase.status === "blocked" ? "destructive" : "secondary"} className="text-[10px] capitalize h-5">
                    {phase.status.replace("_", " ")}
                  </Badge>
                  <span className="text-[10px] font-sans text-muted-foreground">{completedTasks}/{phaseTasks.length} tasks</span>
                </div>
              </div>
              <Select
                value={phase.status}
                onValueChange={(v) => updatePhaseStatus.mutate({ phaseId: phase.id, status: v })}
              >
                <SelectTrigger className="w-32 h-7 text-[10px]" onClick={(e) => e.stopPropagation()}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {phaseStatuses.map((s) => (
                    <SelectItem key={s} value={s} className="text-xs capitalize">{s.replace("_", " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isExpanded && (
              <div className="border-t border-border px-4 pb-4">
                <div className="space-y-1 mt-3">
                  {phaseTasks.map((task: any) => (
                    <div key={task.id} className="flex items-center gap-3 py-2 px-2 rounded-md hover:bg-muted/30 group">
                      <button
                        className="bg-transparent border-none cursor-pointer p-0"
                        onClick={() => updateTaskStatus.mutate({
                          taskId: task.id,
                          status: task.status === "done" ? "todo" : "done",
                        })}
                      >
                        {statusIcons[task.status] || statusIcons.todo}
                      </button>
                      <span className={`text-sm font-sans flex-1 ${task.status === "done" ? "line-through text-muted-foreground" : "text-foreground"}`}>
                        {task.title}
                      </span>
                      {task.priority !== "normal" && (
                        <Badge variant={task.priority === "urgent" ? "destructive" : "secondary"} className="text-[9px] h-4 capitalize">
                          {task.priority}
                        </Badge>
                      )}
                      <Select
                        value={task.status}
                        onValueChange={(v) => updateTaskStatus.mutate({ taskId: task.id, status: v })}
                      >
                        <SelectTrigger className="w-24 h-6 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {taskStatuses.map((s) => (
                            <SelectItem key={s} value={s} className="text-xs capitalize">{s.replace("_", " ")}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>

                {addingTaskTo === phase.id ? (
                  <div className="flex gap-2 mt-2">
                    <Input
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      placeholder="Task name..."
                      className="h-8 text-sm"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && newTaskTitle.trim()) {
                          addTask.mutate({ phaseId: phase.id, title: newTaskTitle.trim() });
                        }
                      }}
                      autoFocus
                    />
                    <Button size="sm" className="h-8 text-xs" onClick={() => {
                      if (newTaskTitle.trim()) addTask.mutate({ phaseId: phase.id, title: newTaskTitle.trim() });
                    }}>Add</Button>
                    <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setAddingTaskTo(null)}>Cancel</Button>
                  </div>
                ) : (
                  <Button variant="ghost" size="sm" className="mt-2 text-xs font-sans gap-1 text-muted-foreground" onClick={() => setAddingTaskTo(phase.id)}>
                    <Plus className="w-3 h-3" />Add Task
                  </Button>
                )}
              </div>
            )}
          </Card>
        );
      })}

      {/* Add Phase */}
      <div className="flex gap-2">
        <Input
          value={newPhaseName}
          onChange={(e) => setNewPhaseName(e.target.value)}
          placeholder="New phase name..."
          className="h-9 text-sm max-w-xs"
          onKeyDown={(e) => {
            if (e.key === "Enter" && newPhaseName.trim()) addPhase.mutate(newPhaseName.trim());
          }}
        />
        <Button size="sm" className="h-9 gap-1 text-xs font-sans" onClick={() => {
          if (newPhaseName.trim()) addPhase.mutate(newPhaseName.trim());
        }}>
          <Plus className="w-3.5 h-3.5" />Add Phase
        </Button>
      </div>
    </div>
  );
};

export default PhasesTasksTab;
