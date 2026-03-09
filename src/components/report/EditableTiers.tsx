import { useState } from "react";
import { useEditMode } from "@/contexts/EditModeContext";
import { Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TierData } from "@/data/reportContent";
import { cn } from "@/lib/utils";

interface TiersData {
  essential: TierData;
  enhanced: TierData;
  signature: TierData;
}

interface EditableTiersProps {
  tiers: TiersData;
  onSave: (tiers: TiersData) => void;
}

const tierKeys: (keyof TiersData)[] = ["essential", "enhanced", "signature"];
const tierLabels: Record<string, string> = {
  essential: "Essential",
  enhanced: "Enhanced",
  signature: "Signature",
};

const EditableTiers = ({ tiers, onSave }: EditableTiersProps) => {
  const { canEdit } = useEditMode();
  const [editingTier, setEditingTier] = useState<keyof TiersData | null>(null);
  const [draft, setDraft] = useState<TierData>({ price: "", description: "" });

  const startEdit = (key: keyof TiersData) => {
    setEditingTier(key);
    setDraft({ ...tiers[key] });
  };

  const commitEdit = () => {
    if (!editingTier) return;
    onSave({ ...tiers, [editingTier]: draft });
    setEditingTier(null);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {tierKeys.map((key) => {
        const tier = tiers[key];
        const isEditing = editingTier === key;

        return (
          <div
            key={key}
            className={cn(
              "border border-border rounded-lg p-5 relative group/tier transition-all",
              canEdit && !isEditing && "hover:border-accent hover:border-dashed hover:bg-accent/5 cursor-pointer",
              key === "signature" && "border-accent"
            )}
            onClick={canEdit && !isEditing ? () => startEdit(key) : undefined}
          >
            <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground mb-2">
              {tierLabels[key]}
            </p>

            {isEditing ? (
              <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                <input
                  value={draft.price}
                  onChange={(e) => setDraft({ ...draft, price: e.target.value })}
                  className="text-2xl font-display text-foreground bg-transparent border-b-2 border-accent outline-none w-full"
                  placeholder="$0,000"
                  autoFocus
                />
                <textarea
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  className="text-sm text-muted-foreground bg-transparent border border-accent/30 rounded p-2 outline-none w-full resize-none"
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={commitEdit}>
                    <Check className="h-3 w-3 mr-1 text-accent" /> Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingTier(null)}>
                    <X className="h-3 w-3 mr-1" /> Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-2xl font-display text-foreground mb-2">{tier.price}</p>
                <p className="text-sm text-muted-foreground">{tier.description}</p>
                {canEdit && (
                  <Pencil className="absolute top-3 right-3 h-3 w-3 text-accent opacity-0 group-hover/tier:opacity-100 transition-opacity" />
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default EditableTiers;
