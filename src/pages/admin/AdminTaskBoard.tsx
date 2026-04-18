import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Loader2, GripVertical, Calendar, AlertTriangle, CheckCircle } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format, isPast, isToday, isThisWeek } from "date-fns";

const COLUMNS = [
  { id: "open", label: "To Do", color: "bg-muted" },
  { id: "in_progress", label: "In Progress", color: "bg-accent/10" },
  { id: "completed", label: "Done", color: "bg-green-50" },
];

const PRIORITIES = { high: "text-destructive", medium: "text-accent", low: "text-muted-foreground" };
const CATEGORIES = ["Report", "Invoice", "Follow-Up", "Vendor", "Project", "Other"];

const AdminTaskBoard = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [quickAdd, setQuickAdd] = useState("");
  const [editTask, setEditTask] = useState<any>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [dragTask, setDragTask] = useState<string | null>(null);
  const [filterClient, setFilterClient] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");

  const { data: tasks, isLoading } = useQuery({
    queryKey: ["admin-tasks-board"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tasks").select("*, properties(id, property_name, address)").order("due_date", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return (data || []).map((t: any) => ({ ...t, client_name: t.properties?.property_name || t.properties?.address || null }));
    },
  });

  const { data: clients } = useQuery({
    queryKey: ["admin-clients-list"],
    queryFn: async () => {
      const { data } = await supabase.from("properties").select("id, property_name, address");
      return data || [];
    },
  });

  const filtered = (tasks || []).filter((t: any) => {
    if (filterClient !== "all" && t.client_id !== filterClient) return false;
    if (filterPriority !== "all" && t.priority !== filterPriority) return false;
    if (filterCategory !== "all" && t.category !== filterCategory) return false;
    return true;
  });

  const tasksByColumn = COLUMNS.map(col => ({ ...col, tasks: filtered.filter((t: any) => t.status === col.id) }));

  const dueToday = filtered.filter((t: any) => t.due_date && isToday(new Date(t.due_date)) && t.status !== "completed").length;
  const overdue = filtered.filter((t: any) => t.due_date && isPast(new Date(t.due_date)) && !isToday(new Date(t.due_date)) && t.status !== "completed").length;
  const thisWeek = filtered.filter((t: any) => t.due_date && isThisWeek(new Date(t.due_date)) && t.status !== "completed").length;

  const addQuickTask = async () => {
    if (!quickAdd.trim() || !user) return;
    await supabase.from("tasks").insert({ admin_id: user.id, title: quickAdd.trim(), priority: "medium", status: "open" });
    setQuickAdd("");
    queryClient.invalidateQueries({ queryKey: ["admin-tasks-board"] });
    queryClient.invalidateQueries({ queryKey: ["admin-task-count"] });
    toast.success("Task added");
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    await supabase.from("tasks").update({ status: newStatus }).eq("id", taskId);
    queryClient.invalidateQueries({ queryKey: ["admin-tasks-board"] });
    queryClient.invalidateQueries({ queryKey: ["admin-task-count"] });
  };

  const saveTask = async () => {
    if (!editTask) return;
    const { id, ...rest } = editTask;
    if (id) {
      await supabase.from("tasks").update({ title: rest.title, description: rest.description, due_date: rest.due_date || null, priority: rest.priority, category: rest.category, client_id: rest.client_id || null }).eq("id", id);
    } else {
      await supabase.from("tasks").insert({ ...rest, admin_id: user?.id, status: "open" });
    }
    setEditOpen(false);
    setEditTask(null);
    queryClient.invalidateQueries({ queryKey: ["admin-tasks-board"] });
    queryClient.invalidateQueries({ queryKey: ["admin-task-count"] });
    toast.success("Task saved");
  };

  const handleDrop = (colId: string) => {
    if (dragTask) { updateTaskStatus(dragTask, colId); setDragTask(null); }
  };

  return (
    <div>
      <AdminHeader breadcrumbs={[{ label: "Tasks" }]} />
      <div className="p-6 max-w-7xl space-y-4">
        {/* Stats */}
        <div className="flex gap-4 flex-wrap">
          <Badge variant="outline" className="text-sm py-1 px-3">{dueToday} due today</Badge>
          {overdue > 0 && <Badge variant="destructive" className="text-sm py-1 px-3">{overdue} overdue</Badge>}
          <Badge variant="outline" className="text-sm py-1 px-3">{thisWeek} this week</Badge>
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          <Select value={filterClient} onValueChange={setFilterClient}>
            <SelectTrigger className="w-[180px] text-sm"><SelectValue placeholder="All Clients" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Clients</SelectItem>
              {(clients || []).map(c => <SelectItem key={c.id} value={c.id}>{c.property_name || c.address}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-[140px] text-sm"><SelectValue placeholder="Priority" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[140px] text-sm"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map(c => <SelectItem key={c} value={c.toLowerCase()}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => { setEditTask({ title: "", description: "", due_date: "", priority: "medium", category: "other", client_id: "" }); setEditOpen(true); }}>
            <Plus className="w-4 h-4 mr-1" />New Task
          </Button>
        </div>

        {/* Kanban Board */}
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {tasksByColumn.map(col => (
              <div key={col.id} className={`rounded-lg p-3 min-h-[400px] ${col.color}`} onDragOver={e => e.preventDefault()} onDrop={() => handleDrop(col.id)}>
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center justify-between">
                  {col.label}
                  <Badge variant="secondary" className="text-xs">{col.tasks.length}</Badge>
                </h3>
                {col.id === "open" && (
                  <div className="mb-3">
                    <Input placeholder="Quick add task..." value={quickAdd} onChange={e => setQuickAdd(e.target.value)} onKeyDown={e => e.key === "Enter" && addQuickTask()} className="text-sm bg-card" />
                  </div>
                )}
                <div className="space-y-2">
                  {col.tasks.map((task: any) => (
                    <Card key={task.id} className="p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow" draggable onDragStart={() => setDragTask(task.id)} onClick={() => { setEditTask(task); setEditOpen(true); }}>
                      <div className="flex items-start gap-2">
                        <GripVertical className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                          {task.client_name && <p className="text-xs text-muted-foreground truncate">{task.client_name}</p>}
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <span className={`text-[10px] font-medium uppercase ${PRIORITIES[task.priority as keyof typeof PRIORITIES] || "text-muted-foreground"}`}>{task.priority}</span>
                            {task.category && task.category !== "other" && <Badge variant="secondary" className="text-[10px] h-4">{task.category}</Badge>}
                            {task.due_date && (
                              <span className={`text-[10px] flex items-center gap-0.5 ${isPast(new Date(task.due_date)) && task.status !== "completed" ? "text-destructive" : "text-muted-foreground"}`}>
                                <Calendar className="w-3 h-3" />{format(new Date(task.due_date), "MMM d")}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-sans">{editTask?.id ? "Edit Task" : "New Task"}</DialogTitle></DialogHeader>
          {editTask && (
            <div className="space-y-4">
              <div><Label>Title</Label><Input value={editTask.title} onChange={e => setEditTask({ ...editTask, title: e.target.value })} /></div>
              <div><Label>Description</Label><Textarea value={editTask.description || ""} onChange={e => setEditTask({ ...editTask, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Priority</Label>
                  <Select value={editTask.priority} onValueChange={v => setEditTask({ ...editTask, priority: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="high">High</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="low">Low</SelectItem></SelectContent>
                  </Select>
                </div>
                <div><Label>Category</Label>
                  <Select value={editTask.category || "other"} onValueChange={v => setEditTask({ ...editTask, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c.toLowerCase()}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Due Date</Label><Input type="date" value={editTask.due_date || ""} onChange={e => setEditTask({ ...editTask, due_date: e.target.value })} /></div>
              <div><Label>Client</Label>
                <Select value={editTask.client_id || ""} onValueChange={v => setEditTask({ ...editTask, client_id: v })}>
                  <SelectTrigger><SelectValue placeholder="No client" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {(clients || []).map(c => <SelectItem key={c.id} value={c.id}>{c.property_name || c.address}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={saveTask} className="w-full">Save Task</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTaskBoard;
