import { useMemo } from "react";
import { X, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageGridProps {
  images: string[];
  onRemove?: (index: number) => void;
  onReorder?: (fromIndex: number, toIndex: number) => void;
  editable?: boolean;
}

const ImageGrid = ({ images, onRemove, onReorder, editable = false }: ImageGridProps) => {
  // Calculate optimal grid layout based on image count
  const gridClass = useMemo(() => {
    const count = images.length;
    if (count === 1) return "grid-cols-1";
    if (count === 2) return "grid-cols-2";
    if (count === 3) return "grid-cols-3";
    if (count === 4) return "grid-cols-2";
    if (count <= 6) return "grid-cols-3";
    return "grid-cols-4";
  }, [images.length]);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData("imageIndex", index.toString());
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    const fromIndex = parseInt(e.dataTransfer.getData("imageIndex"));
    if (fromIndex !== toIndex && onReorder) {
      onReorder(fromIndex, toIndex);
    }
  };

  if (images.length === 0) return null;

  return (
    <div className={cn("grid gap-3 my-6", gridClass)}>
      {images.map((src, index) => (
        <div
          key={`${src}-${index}`}
          className={cn(
            "relative group aspect-square overflow-hidden rounded-lg bg-muted",
            editable && "cursor-move"
          )}
          draggable={editable}
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, index)}
        >
          <img
            src={src}
            alt={`Image ${index + 1}`}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
          {editable && (
            <>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical className="h-5 w-5 text-white drop-shadow-lg" />
              </div>
              {onRemove && (
                <button
                  onClick={() => onRemove(index)}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/90"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  );
};

export default ImageGrid;
