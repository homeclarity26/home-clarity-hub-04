import { useState } from "react";
import { Lock, Save } from "lucide-react";
import { useEditMode } from "@/contexts/EditModeContext";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface CreatorNotesProps {
  notes: string;
  onSave?: (notes: string) => void;
}

const CreatorNotes = ({ notes, onSave }: CreatorNotesProps) => {
  const { canEdit } = useEditMode();
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(notes);

  // Only render for creators
  if (!canEdit) return null;

  const handleSave = () => {
    onSave?.(value);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setValue(notes);
    setIsEditing(false);
  };

  return (
    <div className="space-y-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
      <div className="flex items-center gap-2 text-primary">
        <Lock className="w-4 h-4" />
        <span className="font-mono text-[11px] uppercase tracking-[0.15em]">Creator Notes</span>
        <span className="text-[10px] text-muted-foreground ml-auto">(Hidden from client)</span>
      </div>
      
      {isEditing ? (
        <div className="space-y-3">
          <Textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Add private notes, reminders, follow-up items..."
            className="min-h-[100px] text-sm"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-md flex items-center gap-1"
            >
              <Save className="w-3 h-3" />
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
      ) : (
        <div
          className={cn(
            "cursor-pointer hover:bg-primary/10 rounded p-2 -m-2 transition-colors min-h-[60px]",
            !notes && "border border-dashed border-primary/30"
          )}
          onClick={() => setIsEditing(true)}
        >
          {notes ? (
            <p className="text-sm text-foreground whitespace-pre-wrap">{notes}</p>
          ) : (
            <p className="text-sm text-muted-foreground italic">Click to add private notes...</p>
          )}
        </div>
      )}
    </div>
  );
};

export default CreatorNotes;
