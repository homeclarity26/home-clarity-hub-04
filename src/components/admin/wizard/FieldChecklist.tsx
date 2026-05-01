import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Plus, ListChecks } from "lucide-react";
import type { ChecklistItem } from "@/contexts/WizardContext";

// Field-side checklist (per [v2.4] in Master Plan W1). Renders the
// field_checklist block items as toggleable rows. The full block_renderer
// version lives at SharedBlockRenderer; here we use a local minimal UI so
// the wizard step doesn't have to wrap the editor's heavier component.

interface FieldChecklistProps {
  items: ChecklistItem[];
  onChange: (next: ChecklistItem[]) => void;
}

export function FieldChecklist({ items, onChange }: FieldChecklistProps) {
  // Default to expanded whenever the list is pre-populated. The default
  // checklist is the consultant's walkthrough script — hiding it would
  // defeat the purpose. Empty list (legacy drafts that opted out) stays
  // collapsed so it doesn't take up space.
  const [expanded, setExpanded] = useState(items.length > 0);
  const [draft, setDraft] = useState("");

  const checkedCount = items.filter((i) => i.checked).length;

  const addItem = () => {
    const label = draft.trim();
    if (!label) return;
    const next: ChecklistItem = {
      id: `chk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      label,
      checked: false,
    };
    onChange([...items, next]);
    setDraft("");
  };

  const toggle = (id: string) => {
    onChange(
      items.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)),
    );
  };

  return (
    <Card className="p-4">
      <button
        type="button"
        onClick={() => setExpanded((s) => !s)}
        className="flex items-center justify-between w-full text-left min-h-[44px]"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2">
          <ListChecks className="w-4 h-4 text-primary" aria-hidden />
          <span className="text-sm font-sans font-semibold text-foreground">
            Field-side checklist
          </span>
          {items.length > 0 && (
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              {checkedCount}/{items.length}
            </span>
          )}
        </div>
        <span className="text-xs font-sans text-muted-foreground">
          {expanded ? "Hide" : "Show"}
        </span>
      </button>

      {expanded && (
        <div className="space-y-3 pt-3">
          {items.length === 0 && (
            <p className="text-xs font-sans text-muted-foreground">
              No field-side checklist items yet. Add the items you confirmed
              during the walkthrough below.
            </p>
          )}
          <ul className="space-y-1.5">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2"
              >
                <Checkbox
                  id={`chk-${item.id}`}
                  checked={item.checked}
                  onCheckedChange={() => toggle(item.id)}
                />
                <label
                  htmlFor={`chk-${item.id}`}
                  className="text-xs font-sans text-foreground flex-1 cursor-pointer"
                >
                  {item.label}
                </label>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-2">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Confirmed serial plate is legible"
              className="text-xs"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addItem();
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addItem}
              className="min-h-[44px]"
            >
              <Plus className="w-4 h-4 mr-1" aria-hidden />
              Add
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
