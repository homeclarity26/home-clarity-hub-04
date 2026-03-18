import { useState, useEffect, useCallback, useMemo } from "react";
import { X, GripVertical, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageGridProps {
  images: string[];
  onRemove?: (index: number) => void;
  onReorder?: (fromIndex: number, toIndex: number) => void;
  editable?: boolean;
}

const ImageGrid = ({ images, onRemove, onReorder, editable = false }: ImageGridProps) => {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

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

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);
  const prevImage = useCallback(() => setLightboxIndex(i => i !== null ? (i - 1 + images.length) % images.length : null), [images.length]);
  const nextImage = useCallback(() => setLightboxIndex(i => i !== null ? (i + 1) % images.length : null), [images.length]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") prevImage();
      if (e.key === "ArrowRight") nextImage();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxIndex, closeLightbox, prevImage, nextImage]);

  if (images.length === 0) return null;

  return (
    <>
      <div className={cn("grid gap-3 my-6", gridClass)}>
        {images.map((src, index) => (
          <div
            key={`${src}-${index}`}
            className={cn(
              "relative group aspect-square overflow-hidden rounded-lg bg-muted",
              editable ? "cursor-move" : "cursor-pointer"
            )}
            draggable={editable}
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index)}
            onClick={() => !editable && setLightboxIndex(index)}
          >
            <img
              src={src}
              alt={`Image ${index + 1}`}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
              loading="lazy"
            />
            {editable ? (
              <>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <GripVertical className="h-5 w-5 text-white drop-shadow-lg" />
                </div>
                {onRemove && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onRemove(index); }}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/90"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </>
            ) : (
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                <ZoomIn className="w-6 h-6 text-white drop-shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={closeLightbox}
        >
          <button
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white bg-transparent border-none cursor-pointer z-50"
            onClick={closeLightbox}
          >
            <X className="w-6 h-6" />
          </button>

          {images.length > 1 && (
            <>
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-white/70 hover:text-white bg-black/30 rounded-full border-none cursor-pointer z-50"
                onClick={(e) => { e.stopPropagation(); prevImage(); }}
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-white/70 hover:text-white bg-black/30 rounded-full border-none cursor-pointer z-50"
                onClick={(e) => { e.stopPropagation(); nextImage(); }}
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          <img
            src={images[lightboxIndex]}
            alt={`Full size ${lightboxIndex + 1}`}
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm font-sans">
            {lightboxIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </>
  );
};

export default ImageGrid;
