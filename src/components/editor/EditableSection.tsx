import { useState } from "react";
import { Pencil, Sparkles } from "lucide-react";
import { useEditMode } from "@/contexts/EditModeContext";
import WYSIWYGEditor from "./WYSIWYGEditor";
import AIEditPanel from "./AIEditPanel";
import ImageGrid from "./ImageGrid";
import { cn } from "@/lib/utils";

interface EditableSectionProps {
  content: string;
  images?: string[];
  onSave: (content: string, images: string[]) => void;
  className?: string;
  children: React.ReactNode;
  contentType?: string;
}

const EditableSection = ({
  content,
  images = [],
  onSave,
  className,
  children,
  contentType,
}: EditableSectionProps) => {
  const { canEdit } = useEditMode();
  const [isEditing, setIsEditing] = useState(false);
  const [showAI, setShowAI] = useState(false);

  const handleSave = (newContent: string, newImages: string[]) => {
    onSave(newContent, newImages);
    setIsEditing(false);
  };

  const handleAIApply = (newContent: string) => {
    onSave(newContent, images);
    setShowAI(false);
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
    <div className="space-y-3">
      <div
        className={cn(
          "relative group",
          canEdit && "cursor-text border border-dashed border-transparent hover:border-accent hover:bg-accent/5 rounded-lg transition-all p-2 -m-2",
          className
        )}
        onClick={canEdit ? () => setIsEditing(true) : undefined}
      >
        {canEdit && (
          <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <button
              className="p-2 rounded-full bg-accent text-accent-foreground shadow-lg"
              onClick={(e) => {
                e.stopPropagation();
                setShowAI(true);
              }}
              title="AI Edit"
            >
              <Sparkles className="h-4 w-4" />
            </button>
            <button
              className="p-2 rounded-full bg-primary text-primary-foreground shadow-lg"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
            >
              <Pencil className="h-4 w-4" />
            </button>
          </div>
        )}
        {children}
        {images.length > 0 && <ImageGrid images={images} />}
      </div>

      {showAI && canEdit && (
        <AIEditPanel
          currentContent={content}
          contentType={contentType}
          onApply={handleAIApply}
          onDiscard={() => setShowAI(false)}
        />
      )}
    </div>
  );
};

export default EditableSection;
