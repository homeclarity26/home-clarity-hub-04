import type { FieldChecklistContent, FieldChecklistItem } from "../types";

const GOLD = "#B87333";

interface FieldChecklistBlockProps {
  content: FieldChecklistContent;
  editable?: boolean;
  onChange?: (content: FieldChecklistContent) => void;
}

const FieldChecklistBlock = ({ content, editable, onChange }: FieldChecklistBlockProps) => {
  // ADMIN-ONLY block per [v2.4]. The client portal renders nothing here.
  // PortalBlockViewer always passes editable=false, so this guard makes
  // the block invisible client-side regardless of how it landed in the
  // page content.
  if (!editable) return null;

  const update = (patch: Partial<FieldChecklistContent>) => onChange?.({ ...content, ...patch });

  const items = content.items ?? [];

  const updateItem = (i: number, patch: Partial<FieldChecklistItem>) => {
    const next = [...items];
    next[i] = { ...next[i], ...patch };
    update({ items: next });
  };

  const removeItem = (i: number) => update({ items: items.filter((_, j) => j !== i) });

  const addItem = () =>
    update({
      items: [
        ...items,
        {
          id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `item-${Date.now()}`,
          description: "",
          checked: false,
        },
      ],
    });

  return (
    <div className="bg-card border-2 border-dashed border-border rounded-lg p-4 sm:p-5">
      {/* Admin-only banner */}
      <div className="font-mono text-[10px] uppercase tracking-[0.15em] mb-3 flex items-center gap-2" style={{ color: GOLD }}>
        <span>Admin-only</span>
        <span className="text-muted-foreground normal-case tracking-normal text-[10px]">(never visible to client)</span>
      </div>

      <input
        className="w-full bg-transparent font-display text-lg sm:text-xl text-foreground outline-none mb-3"
        value={content.title ?? "Field Walkthrough Checklist"}
        onChange={(e) => update({ title: e.target.value })}
      />

      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={item.id} className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={item.checked}
              onChange={(e) => updateItem(i, { checked: e.target.checked })}
              className="w-5 h-5 cursor-pointer"
              aria-label={item.description || "Checklist item"}
            />
            <input
              className={`flex-1 bg-transparent text-sm outline-none border-b border-border ${
                item.checked ? "text-muted-foreground line-through" : "text-foreground"
              }`}
              value={item.description}
              onChange={(e) => updateItem(i, { description: e.target.value })}
              placeholder="Walkthrough item"
            />
            <button
              type="button"
              onClick={() => removeItem(i)}
              className="text-xs text-muted-foreground hover:text-foreground"
              aria-label="Remove item"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={addItem}
        className="mt-3 text-xs text-muted-foreground hover:text-foreground"
      >
        + Add walkthrough item
      </button>

      {items.length > 0 && (
        <div className="mt-3 text-[10px] text-muted-foreground font-mono uppercase tracking-[0.15em]">
          {items.filter((i) => i.checked).length} of {items.length} done
        </div>
      )}
    </div>
  );
};

export default FieldChecklistBlock;
