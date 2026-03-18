import { AlertTriangle, Plus, X } from "lucide-react";
import type { PriorityActionContent } from "../types";

interface PriorityActionBlockProps {
  content: PriorityActionContent;
  editable?: boolean;
  onChange?: (content: PriorityActionContent) => void;
}

const priorityStyles: Record<string, string> = {
  urgent: "bg-destructive/10 text-destructive border-destructive/20",
  high: "bg-hbc-rust/10 text-hbc-rust border-hbc-rust/20",
  medium: "bg-hbc-gold/10 text-accent-foreground border-accent/20",
  low: "bg-muted text-muted-foreground border-border",
};

const PriorityActionBlock = ({ content, editable, onChange }: PriorityActionBlockProps) => {
  const items = content.items || [];

  const addItem = () => {
    onChange?.({ items: [...items, { text: "", priority: "medium" }] });
  };

  const updateItem = (idx: number, field: string, value: string) => {
    const updated = items.map((item, i) =>
      i === idx ? { ...item, [field]: value } : item
    );
    onChange?.({ items: updated });
  };

  const removeItem = (idx: number) => {
    onChange?.({ items: items.filter((_, i) => i !== idx) });
  };

  return (
    <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-6 space-y-4">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-destructive" />
        <h3 className="font-display text-lg font-semibold text-foreground">Priority Action Items</h3>
      </div>
      <div className="space-y-2">
        {items.map((item, idx) => (
          <div key={idx} className={`flex items-start gap-3 rounded-md border p-3 ${priorityStyles[item.priority]}`}>
            {editable ? (
              <>
                <select
                  className="bg-transparent text-xs font-mono rounded outline-none shrink-0"
                  value={item.priority}
                  onChange={(e) => updateItem(idx, "priority", e.target.value)}
                >
                  {["urgent", "high", "medium", "low"].map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                <input
                  className="flex-1 bg-transparent text-sm outline-none"
                  value={item.text}
                  onChange={(e) => updateItem(idx, "text", e.target.value)}
                  placeholder="Action item..."
                />
                <button onClick={() => removeItem(idx)} className="shrink-0">
                  <X className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <span className="text-xs font-mono uppercase shrink-0">{item.priority}</span>
                <span className="text-sm">{item.text}</span>
              </>
            )}
          </div>
        ))}
      </div>
      {editable && (
        <button onClick={addItem} className="flex items-center gap-1 text-xs text-accent hover:text-accent/80 font-mono">
          <Plus className="h-3 w-3" /> Add Action
        </button>
      )}
    </div>
  );
};

export default PriorityActionBlock;
