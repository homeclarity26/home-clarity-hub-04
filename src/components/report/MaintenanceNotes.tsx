import { useState } from "react";
import { Wrench, Plus, X } from "lucide-react";
import { useEditMode } from "@/contexts/EditModeContext";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface MaintenanceData {
  frequency?: string;
  tasks: string[];
}

interface MaintenanceNotesProps {
  maintenance: MaintenanceData;
  onSave?: (maintenance: MaintenanceData) => void;
}

const frequencyOptions = ["Monthly", "Quarterly", "Seasonal", "Annual", "Every 2-3 years", "Every 5-10 years", "As needed"];

const MaintenanceNotes = ({ maintenance, onSave }: MaintenanceNotesProps) => {
  const { canEdit } = useEditMode();
  const [isEditing, setIsEditing] = useState(false);
  const [frequency, setFrequency] = useState(maintenance.frequency || "Annual");
  const [tasks, setTasks] = useState(maintenance.tasks);
  const [newTask, setNewTask] = useState("");

  const handleSave = () => {
    onSave?.({ frequency, tasks: tasks.filter(Boolean) });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFrequency(maintenance.frequency || "Annual");
    setTasks(maintenance.tasks);
    setIsEditing(false);
  };

  const addTask = () => {
    if (newTask.trim()) {
      setTasks([...tasks, newTask.trim()]);
      setNewTask("");
    }
  };

  const removeTask = (index: number) => {
    setTasks(tasks.filter((_, i) => i !== index));
  };

  const updateTask = (index: number, value: string) => {
    const updated = [...tasks];
    updated[index] = value;
    setTasks(updated);
  };

  if (isEditing && canEdit) {
    return (
      <div className="space-y-3 p-4 rounded-lg bg-muted/50 border border-border">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Wrench className="w-4 h-4" />
          <span className="font-mono text-[11px] uppercase tracking-[0.15em]">Maintenance</span>
        </div>
        
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Frequency</label>
          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background"
          >
            {frequencyOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Tasks</label>
          {tasks.map((task, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="text"
                value={task}
                onChange={(e) => updateTask(i, e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-border rounded-md bg-background"
              />
              <button
                onClick={() => removeTask(i)}
                className="p-2 text-muted-foreground hover:text-destructive"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTask()}
              placeholder="Add maintenance task..."
              className="flex-1 px-3 py-2 text-sm border border-dashed border-border rounded-md bg-background"
            />
            <button
              onClick={addTask}
              className="p-2 text-muted-foreground hover:text-foreground"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={handleSave}
            className="px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-md"
          >
            Save
          </button>
          <button
            onClick={handleCancel}
            className="px-3 py-1.5 text-xs font-medium bg-muted text-muted-foreground rounded-md"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (!maintenance.tasks || maintenance.tasks.length === 0) return null;

  return (
    <div
      className={cn(
        "space-y-3 p-4 rounded-lg bg-muted/50 border border-border",
        canEdit && "cursor-pointer hover:bg-muted/70 transition-colors"
      )}
      onClick={canEdit ? () => setIsEditing(true) : undefined}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Wrench className="w-4 h-4" />
          <span className="font-mono text-[11px] uppercase tracking-[0.15em]">Maintenance</span>
        </div>
        {maintenance.frequency && (
          <Badge variant="outline" className="text-[10px]">
            {maintenance.frequency}
          </Badge>
        )}
      </div>
      <ul className="space-y-1.5">
        {maintenance.tasks.map((task, i) => (
          <li
            key={i}
            className={cn(
              "text-sm text-foreground flex items-start gap-2",
              task.startsWith("[") && "text-muted-foreground italic"
            )}
          >
            <span className="text-primary mt-1">•</span>
            {task}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MaintenanceNotes;
