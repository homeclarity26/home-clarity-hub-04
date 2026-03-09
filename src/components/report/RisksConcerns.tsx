import { useState } from "react";
import { AlertTriangle, Plus, X } from "lucide-react";
import { useEditMode } from "@/contexts/EditModeContext";
import { cn } from "@/lib/utils";

interface RisksConcernsProps {
  risks: string[];
  onSave?: (risks: string[]) => void;
}

const RisksConcerns = ({ risks, onSave }: RisksConcernsProps) => {
  const { canEdit } = useEditMode();
  const [isEditing, setIsEditing] = useState(false);
  const [items, setItems] = useState(risks);
  const [newItem, setNewItem] = useState("");

  const handleSave = () => {
    onSave?.(items.filter(Boolean));
    setIsEditing(false);
  };

  const handleCancel = () => {
    setItems(risks);
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
      <div className="space-y-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
          <AlertTriangle className="w-4 h-4" />
          <span className="font-mono text-[11px] uppercase tracking-[0.15em]">Risks & Concerns</span>
        </div>
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="text"
                value={item}
                onChange={(e) => updateItem(i, e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-amber-500/30 rounded-md bg-background"
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
              placeholder="Add risk or concern..."
              className="flex-1 px-3 py-2 text-sm border border-dashed border-amber-500/30 rounded-md bg-background"
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
            className="px-3 py-1.5 text-xs font-medium bg-amber-600 text-white rounded-md"
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

  if (risks.length === 0) return null;

  return (
    <div
      className={cn(
        "space-y-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20",
        canEdit && "cursor-pointer hover:bg-amber-500/15 transition-colors"
      )}
      onClick={canEdit ? () => setIsEditing(true) : undefined}
    >
      <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
        <AlertTriangle className="w-4 h-4" />
        <span className="font-mono text-[11px] uppercase tracking-[0.15em]">Risks & Concerns</span>
      </div>
      <ul className="space-y-2">
        {risks.map((risk, i) => (
          <li
            key={i}
            className={cn(
              "text-sm text-foreground pl-4 border-l-2 border-amber-500/50 py-1",
              risk.startsWith("[") && "text-muted-foreground italic"
            )}
          >
            {risk}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RisksConcerns;
