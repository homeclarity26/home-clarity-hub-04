import { useState } from "react";
import { Eye, Plus, X } from "lucide-react";
import { useEditMode } from "@/contexts/EditModeContext";
import { cn } from "@/lib/utils";

interface KeyObservationsProps {
  observations: string[];
  onSave?: (observations: string[]) => void;
}

const KeyObservations = ({ observations, onSave }: KeyObservationsProps) => {
  const { canEdit } = useEditMode();
  const [isEditing, setIsEditing] = useState(false);
  const [items, setItems] = useState(observations);
  const [newItem, setNewItem] = useState("");

  const handleSave = () => {
    onSave?.(items.filter(Boolean));
    setIsEditing(false);
  };

  const handleCancel = () => {
    setItems(observations);
    setIsEditing(false);
  };

  const addItem = () => {
    if (newItem.trim()) {
      setItems([...items, newItem.trim()]);
      setNewItem("");
    }
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, value: string) => {
    const updated = [...items];
    updated[index] = value;
    setItems(updated);
  };

  if (isEditing && canEdit) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Eye className="w-4 h-4" />
          <span className="font-mono text-[11px] uppercase tracking-[0.15em]">Key Observations</span>
        </div>
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="text"
                value={item}
                onChange={(e) => updateItem(i, e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-border rounded-md bg-background"
              />
              <button
                onClick={() => removeItem(i)}
                className="p-2 text-muted-foreground hover:text-destructive"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addItem()}
              placeholder="Add observation..."
              className="flex-1 px-3 py-2 text-sm border border-dashed border-border rounded-md bg-background"
            />
            <button
              onClick={addItem}
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

  return (
    <div
      className={cn(
        "space-y-3",
        canEdit && "cursor-pointer hover:bg-accent/5 rounded-lg p-2 -m-2 transition-colors"
      )}
      onClick={canEdit ? () => setIsEditing(true) : undefined}
    >
      <div className="flex items-center gap-2 text-muted-foreground">
        <Eye className="w-4 h-4" />
        <span className="font-mono text-[11px] uppercase tracking-[0.15em]">Key Observations</span>
      </div>
      <ul className="space-y-2">
        {observations.map((obs, i) => (
          <li
            key={i}
            className={cn(
              "text-sm text-foreground pl-4 border-l-2 border-primary/30 py-1",
              obs.startsWith("[") && "text-muted-foreground italic"
            )}
          >
            {obs}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default KeyObservations;
