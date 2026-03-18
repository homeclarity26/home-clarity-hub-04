import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, AlertTriangle } from "lucide-react";
import { useAdminTasks, useCreateTask, useToggleTaskComplete, type AdminTask } from "@/hooks/useAdminTasks";
import { useAdminClients } from "@/hooks/useAdminData";
import { toast } from "sonner";
import { isPast, format } from "date-fns";

const priorityStyles: Record<string, string> = {
  urgent: "bg-destructive/10 text-destructive border-destructive/20",
  high: "bg-amber-100 text-amber-800 border-amber-200",
  medium: "bg-blue-100 text-blue-800 border-blue-200",
  low: "bg-muted text-muted-foreground border-border",
};

interface TasksSectionProps {
  clientId?: string;
  compact?: boolean;
}

const TasksSection = ({ clientId, compact }: TasksSectionProps) => {
  const { data: tasks } = useAdminTasks(clientId);
  const { data: clients } = useAdminClients();
  const createTask = useCreateTask();
  const toggleTask = useToggleTaskComplete();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", due_date: "", priority: "medium", client_id: clientId || "" });

  const openTasks = (tasks || []).filter((t) => t.status !== "completed");
  const displayed = compact ? openTasks.slice(0, 5) : openTasks;

  const handleCreate = async () => {
    if (!form.title.trim()) return;
    try {
      await createTask.mutateAsync({ ...form, client_id: form.client_id || undefined });
      toast.success("Task created");
      setOpen(false);
      setForm({ title: "", description: "", due_date: "", priority: "medium", client_id: clientId || "" });
    } catch {
      toast.error("Failed to create task");
    }
  };

  const isOverdue = (t: AdminTask) => t.due_date && isPast(new Date(t.due_date)) && t.status !== "completed";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-sans font-semibold text-foreground">
          {clientId ? "Tasks" : "My Tasks"}
          {openTasks.length > 0 && <span className="ml-2 text-xs font-normal text-muted-foreground">({openTasks.length})</span>}
        </h3>
        <Button size="sm" className="gap-1.5 text-xs font-sans" onClick={() => setOpen(true)}>
          <Plus className="w-3.5 h-3.5" />New Task
        </Button>
      </div>

      {displayed.length === 0 ? (
        <p className="text-sm font-sans text-muted-foreground text-center py-4">No open tasks.</p>
      ) : (
        <div className="space-y-1.5">
          {displayed.map((task) => (
            <div
              key={task.id}
              className={`flex items-start gap-3 p-3 rounded-md border transition-colors ${
                isOverdue(task) ? "bg-destructive/5 border-destructive/20" : "bg-card border-border"
              }`}
            >
              <Checkbox
                checked={task.status === "completed"}
                onCheckedChange={() => toggleTask.mutate({ id: task.id, currentStatus: task.status })}
                className="mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className={`text-sm font-sans font-medium ${task.status === "completed" ? "line-through text-muted-foreground" : "text-foreground"}`}>
                    {task.title}
                  </p>
                  <Badge variant="outline" className={`text-[10px] font-sans ${priorityStyles[task.priority]}`}>
                    {task.priority}
                  </Badge>
                  {isOverdue(task) && (
                    <Badge variant="destructive" className="text-[10px] font-sans gap-1">
                      <AlertTriangle className="w-2.5 h-2.5" />Overdue
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs font-sans text-muted-foreground">
                  {task.due_date && <span>{format(new Date(task.due_date), "MMM d")}</span>}
                  {!clientId && task.client_name && <span>· {task.client_name}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-sans">New Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="font-sans text-xs">Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            {!clientId && (
              <div>
                <Label className="font-sans text-xs">Link to Client (optional)</Label>
                <Select value={form.client_id} onValueChange={(v) => setForm({ ...form, client_id: v })}>
                  <SelectTrigger><SelectValue placeholder="No client" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {(clients || []).map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="font-sans text-xs">Due Date</Label>
                <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
              </div>
              <div>
                <Label className="font-sans text-xs">Priority</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="font-sans text-xs">Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <Button onClick={handleCreate} className="w-full font-sans" disabled={createTask.isPending || !form.title.trim()}>
              {createTask.isPending ? "Creating…" : "Create Task"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TasksSection;
