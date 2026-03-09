import { useState } from "react";
import { Pencil } from "lucide-react";
import { useEditMode } from "@/contexts/EditModeContext";
import WYSIWYGEditor from "./WYSIWYGEditor";
import ImageGrid from "./ImageGrid";
import { cn } from "@/lib/utils";

interface EditableSectionProps {
  content: string;
  images?: string[];
  onSave: (content: string, images: string[]) => void;
  className?: string;
  children: React.ReactNode;
}

const EditableSection = ({
  content,
  images = [],
  onSave,
  className,
  children,
}: EditableSectionProps) => {
  const { canEdit } = useEditMode();
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = (newContent: string, newImages: string[]) => {
    onSave(newContent, newImages);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className={className}>
        <WYSIWYGEditor
          initialContent={content}
          initialImages={images}
          onSave={handleSave}
          onCancel={() => setIsEditing(false)}
          placeholder="Write your content here..."
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative group",
        canEdit && "cursor-text border border-dashed border-transparent hover:border-accent hover:bg-accent/5 rounded-lg transition-all p-2 -m-2",
        className
      )}
      onClick={canEdit ? () => setIsEditing(true) : undefined}
    >
      {canEdit && (
        <button
          className="absolute -top-2 -right-2 p-2 rounded-full bg-primary text-primary-foreground opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"
          onClick={(e) => {
            e.stopPropagation();
            setIsEditing(true);
          }}
        >
          <Pencil className="h-4 w-4" />
        </button>
      )}
      {children}
      {images.length > 0 && <ImageGrid images={images} />}
    </div>
  );
};

export default EditableSection;
