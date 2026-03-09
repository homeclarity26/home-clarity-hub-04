import { useState, useRef, useEffect } from "react";
import { useEditMode } from "@/contexts/EditModeContext";
import { Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditableFieldProps {
  value: string;
  onSave: (value: string) => void;
  className?: string;
  inputClassName?: string;
  tag?: "h2" | "h3" | "p" | "span";
}

const EditableField = ({
  value,
  onSave,
  className,
  inputClassName,
  tag: Tag = "span",
}: EditableFieldProps) => {
  const { canEdit } = useEditMode();
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const commit = () => {
    setIsEditing(false);
    if (draft.trim() && draft !== value) {
      onSave(draft.trim());
    } else {
      setDraft(value);
    }
  };

  if (!canEdit) {
    return <Tag className={className}>{value}</Tag>;
  }

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") {
            setDraft(value);
            setIsEditing(false);
          }
        }}
        className={cn(
          "bg-transparent border-b-2 border-accent outline-none w-full",
          inputClassName || className
        )}
      />
    );
  }

  return (
    <div
      className="relative group/field inline-block w-full cursor-text"
      onClick={() => setIsEditing(true)}
    >
      <Tag
        className={cn(
          className,
          "border border-dashed border-transparent group-hover/field:border-accent group-hover/field:bg-accent/5 rounded px-1 -mx-1 transition-all"
        )}
      >
        {value}
      </Tag>
      <Pencil className="absolute -top-1 -right-1 h-3 w-3 text-accent opacity-0 group-hover/field:opacity-100 transition-opacity" />
    </div>
  );
};

export default EditableField;
