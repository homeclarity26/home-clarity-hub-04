import { useState } from "react";
import { useEditMode } from "@/contexts/EditModeContext";
import { Plus, Trash2, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Spec {
  label: string;
  value: string;
}

interface EditableSpecsProps {
  specs: Spec[];
  onSave: (specs: Spec[]) => void;
}

const EditableSpecs = ({ specs, onSave }: EditableSpecsProps) => {
  const { canEdit } = useEditMode();
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<Spec>({ label: "", value: "" });

  const startEdit = (index: number) => {
    setEditingIndex(index);
    setDraft({ ...specs[index] });
  };

  const commitEdit = () => {
    if (editingIndex === null || !draft.label.trim()) return;
    const updated = [...specs];
    updated[editingIndex] = { label: draft.label.trim(), value: draft.value.trim() };
    onSave(updated);
    setEditingIndex(null);
  };

  const cancelEdit = () => {
    setEditingIndex(null);
  };

  const addRow = () => {
    const updated = [...specs, { label: "New Spec", value: "Not yet documented" }];
    onSave(updated);
    setEditingIndex(updated.length - 1);
    setDraft({ label: "New Spec", value: "Not yet documented" });
  };

  const removeRow = (index: number) => {
    onSave(specs.filter((_, i) => i !== index));
    if (editingIndex === index) setEditingIndex(null);
  };

  return (
    <div className="space-y-3">
      {specs.map((spec, i) => (
        <div
          key={i}
          className={cn(
            "flex justify-between border-b border-border py-3 group/spec",
            canEdit && "hover:bg-accent/5 rounded transition-colors"
          )}
        >
          {editingIndex === i ? (
            <div className="flex items-center gap-2 w-full">
              <input
                value={draft.label}
                onChange={(e) => setDraft({ ...draft, label: e.target.value })}
                className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground bg-transparent border-b border-accent outline-none flex-1"
                autoFocus
              />
              <input
                value={draft.value}
                onChange={(e) => setDraft({ ...draft, value: e.target.value })}
                className="text-sm text-foreground bg-transparent border-b border-accent outline-none flex-1 text-right"
              />
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={commitEdit}>
                <Check className="h-3 w-3 text-accent" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={cancelEdit}>
                <X className="h-3 w-3 text-muted-foreground" />
              </Button>
            </div>
          ) : (
            <>
              <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
                {spec.label}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-foreground">{spec.value}</span>
                {canEdit && (
                  <div className="flex gap-1 opacity-0 group-hover/spec:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => startEdit(i)}>
                      <Pencil className="h-3 w-3 text-accent" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeRow(i)}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      ))}
      {canEdit && (
        <Button variant="ghost" size="sm" className="text-accent hover:text-accent" onClick={addRow}>
          <Plus className="h-3 w-3 mr-1" /> Add Specification
        </Button>
      )}
    </div>
  );
};

export default EditableSpecs;
