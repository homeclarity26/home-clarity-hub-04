import { useState } from "react";
import { Link2, Plus, X } from "lucide-react";
import { useEditMode } from "@/contexts/EditModeContext";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Dependency {
  pageKey: string;
  title: string;
  type: "before" | "after";
}

interface DependenciesListProps {
  dependencies: Dependency[];
  allPages?: { pageKey: string; title: string }[];
  onSave?: (dependencies: Dependency[]) => void;
  onNavigate?: (pageKey: string) => void;
}

const DependenciesList = ({ dependencies, allPages, onSave, onNavigate }: DependenciesListProps) => {
  const { canEdit } = useEditMode();
  const [isEditing, setIsEditing] = useState(false);
  const [items, setItems] = useState<Dependency[]>(dependencies);
  const [newPageKey, setNewPageKey] = useState("");
  const [newDepType, setNewDepType] = useState<"before" | "after">("before");

  const handleSave = () => {
    onSave?.(items);
    setIsEditing(false);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const addItem = () => {
    if (!newPageKey) return;
    const page = allPages?.find((p) => p.pageKey === newPageKey);
    if (!page) return;
    // Avoid duplicates
    if (items.find((i) => i.pageKey === newPageKey)) return;
    setItems([...items, { pageKey: page.pageKey, title: page.title, type: newDepType }]);
    setNewPageKey("");
  };

  // Pages available to add: all pages not already in items
  const addablePages = (allPages || []).filter(
    (p) => !items.find((i) => i.pageKey === p.pageKey)
  );

  const beforeDeps = dependencies.filter((d) => d.type === "before");
  const afterDeps = dependencies.filter((d) => d.type === "after");

  if (isEditing && canEdit) {
    return (
      <div className="space-y-3 p-4 border border-border rounded-lg bg-muted/30">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Link2 className="w-4 h-4" />
          <span className="font-mono text-[11px] uppercase tracking-[0.15em]">Dependencies</span>
        </div>

        {/* Existing items */}
        {items.length > 0 ? (
          <div className="space-y-2">
            {items.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs flex-shrink-0">
                  {item.type === "before" ? "Must do first" : "Do after"}
                </Badge>
                <span className="text-sm flex-1">{item.title}</span>
                <button
                  onClick={() => removeItem(i)}
                  className="ml-auto p-1 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic">No dependencies added yet.</p>
        )}

        {/* Add new dependency */}
        {addablePages.length > 0 && (
          <div className="flex items-center gap-2 pt-1">
            <select
              value={newPageKey}
              onChange={(e) => setNewPageKey(e.target.value)}
              className="flex-1 text-xs font-sans bg-background border border-input rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Add a page...</option>
              {addablePages.map((p) => (
                <option key={p.pageKey} value={p.pageKey}>
                  {p.title}
                </option>
              ))}
            </select>
            <select
              value={newDepType}
              onChange={(e) => setNewDepType(e.target.value as "before" | "after")}
              className="text-xs font-sans bg-background border border-input rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="before">Must do first</option>
              <option value="after">Do after</option>
            </select>
            <button
              onClick={addItem}
              disabled={!newPageKey}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-muted border border-border text-xs font-sans text-foreground hover:bg-muted/80 transition-colors disabled:opacity-40"
            >
              <Plus className="w-3 h-3" />
              Add
            </button>
          </div>
        )}

        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={handleSave}
            className="px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Save
          </button>
          <button
            onClick={() => {
              setItems(dependencies);
              setIsEditing(false);
            }}
            className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (dependencies.length === 0) {
    // In edit mode, show an "Add dependencies" prompt even when empty
    if (canEdit && (allPages?.length ?? 0) > 0) {
      return (
        <div
          className="flex items-center gap-2 py-2 px-4 border border-dashed border-border rounded-lg text-muted-foreground cursor-pointer hover:border-primary/40 hover:text-foreground transition-colors"
          onClick={() => setIsEditing(true)}
        >
          <Link2 className="w-3.5 h-3.5" />
          <span className="text-xs font-mono uppercase tracking-[0.12em]">Add page dependencies</span>
          <Plus className="w-3.5 h-3.5 ml-auto" />
        </div>
      );
    }
    return null;
  }

  return (
    <div
      className={cn(
        "space-y-3 p-4 border border-border rounded-lg bg-muted/30",
        canEdit && "cursor-pointer hover:border-primary/30 transition-colors"
      )}
      onClick={canEdit ? () => setIsEditing(true) : undefined}
    >
      <div className="flex items-center gap-2 text-muted-foreground">
        <Link2 className="w-4 h-4" />
        <span className="font-mono text-[11px] uppercase tracking-[0.15em]">Dependencies</span>
        {canEdit && <Plus className="w-3.5 h-3.5 ml-auto opacity-50" />}
      </div>
      <div className="flex flex-wrap gap-3">
        {beforeDeps.length > 0 && (
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Must complete first:</span>
            <div className="flex flex-wrap gap-1">
              {beforeDeps.map((dep) => (
                <Badge
                  key={dep.pageKey}
                  variant="secondary"
                  className="cursor-pointer hover:bg-secondary/80"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigate?.(dep.pageKey);
                  }}
                >
                  {dep.title}
                </Badge>
              ))}
            </div>
          </div>
        )}
        {afterDeps.length > 0 && (
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Complete after:</span>
            <div className="flex flex-wrap gap-1">
              {afterDeps.map((dep) => (
                <Badge
                  key={dep.pageKey}
                  variant="outline"
                  className="cursor-pointer hover:bg-muted"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigate?.(dep.pageKey);
                  }}
                >
                  {dep.title}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DependenciesList;
