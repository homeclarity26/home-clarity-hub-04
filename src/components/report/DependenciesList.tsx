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
  onSave?: (dependencies: Dependency[]) => void;
  onNavigate?: (pageKey: string) => void;
}

const DependenciesList = ({ dependencies, onSave, onNavigate }: DependenciesListProps) => {
  const { canEdit } = useEditMode();
  const [isEditing, setIsEditing] = useState(false);
  const [items, setItems] = useState(dependencies);

  const beforeDeps = dependencies.filter((d) => d.type === "before");
  const afterDeps = dependencies.filter((d) => d.type === "after");

  const handleSave = () => {
    onSave?.(items);
    setIsEditing(false);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  if (isEditing && canEdit) {
    return (
      <div className="space-y-3 p-4 border border-border rounded-lg bg-muted/30">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Link2 className="w-4 h-4" />
          <span className="font-mono text-[11px] uppercase tracking-[0.15em]">Dependencies</span>
        </div>
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {item.type === "before" ? "Must do first" : "Do after"}
              </Badge>
              <span className="text-sm">{item.title}</span>
              <button onClick={() => removeItem(i)} className="ml-auto p-1 text-muted-foreground hover:text-destructive">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Dependencies are managed through the project planning interface.
        </p>
        <button
          onClick={handleSave}
          className="px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-md"
        >
          Done
        </button>
      </div>
    );
  }

  if (dependencies.length === 0) return null;

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
      </div>
      <div className="flex flex-wrap gap-2">
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
