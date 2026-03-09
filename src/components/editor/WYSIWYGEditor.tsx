import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import EditorToolbar from "./EditorToolbar";
import ImageUploader from "./ImageUploader";
import ImageGrid from "./ImageGrid";
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Save, X, ImagePlus } from "lucide-react";

interface WYSIWYGEditorProps {
  initialContent?: string;
  initialImages?: string[];
  onSave: (content: string, images: string[]) => void;
  onCancel: () => void;
  placeholder?: string;
}

const WYSIWYGEditor = ({
  initialContent = "",
  initialImages = [],
  onSave,
  onCancel,
  placeholder = "Start writing...",
}: WYSIWYGEditorProps) => {
  const [images, setImages] = useState<string[]>(initialImages);
  const [showUploader, setShowUploader] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "rounded-lg max-w-full",
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose-base max-w-none focus:outline-none min-h-[200px] p-4",
      },
    },
  });

  const handleImageUpload = useCallback((urls: string[]) => {
    setImages((prev) => [...prev, ...urls]);
    setShowUploader(false);
  }, []);

  const handleImageRemove = useCallback((index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleImageReorder = useCallback((fromIndex: number, toIndex: number) => {
    setImages((prev) => {
      const newImages = [...prev];
      const [movedImage] = newImages.splice(fromIndex, 1);
      newImages.splice(toIndex, 0, movedImage);
      return newImages;
    });
  }, []);

  const handleSave = () => {
    if (editor) {
      onSave(editor.getHTML(), images);
    }
  };

  return (
    <div className="border border-border rounded-lg bg-background shadow-sm">
      <EditorToolbar editor={editor} />
      
      <EditorContent editor={editor} />

      {/* Image Section */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
            Images ({images.length})
          </h4>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowUploader(!showUploader)}
          >
            <ImagePlus className="h-4 w-4 mr-2" />
            Add Images
          </Button>
        </div>

        {showUploader && (
          <div className="mb-4">
            <ImageUploader onUpload={handleImageUpload} />
          </div>
        )}

        <ImageGrid
          images={images}
          onRemove={handleImageRemove}
          onReorder={handleImageReorder}
          editable
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 p-4 border-t border-border bg-muted/30">
        <Button variant="ghost" onClick={onCancel}>
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>
    </div>
  );
};

export default WYSIWYGEditor;
