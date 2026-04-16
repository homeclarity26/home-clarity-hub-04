import { useState, useEffect, useCallback, useMemo } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { X, GripVertical, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageGridProps {
  images: string[];
  onRemove?: (index: number) => void;
  onReorder?: (fromIndex: number, toIndex: number) => void;
  editable?: boolean;
}

/* ── Sortable image wrapper ─────────────────────────────────── */

interface SortableImageProps {
  id: string;
  src: string;
  index: number;
  aspectClass: string;
  spanClass: string;
  editable: boolean;
  onRemove?: (index: number) => void;
  onClickImage: (index: number) => void;
}

const SortableImage = ({
  id,
  src,
  index,
  aspectClass,
  spanClass,
  editable,
  onRemove,
  onClickImage,
}: SortableImageProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group overflow-hidden rounded-lg bg-muted",
        aspectClass,
        spanClass,
        editable ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
      )}
      onClick={() => !editable && onClickImage(index)}
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
          {/* Drag handle */}
          <div
            className="absolute top-2 left-2 p-1 rounded bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4 text-white" />
          </div>
          {onRemove && (
            <button
              onClick={(e) => { e.stopPropagation(); onRemove(index); }}
              aria-label="Remove photo"
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
  );
};

/* ── Main ImageGrid ─────────────────────────────────────────── */

const ImageGrid = ({ images, onRemove, onReorder, editable = false }: ImageGridProps) => {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Sensors for dnd-kit
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  // Stable IDs for sortable (URL is unique per image)
  const sortableIds = useMemo(
    () => images.map((src, i) => `img-${i}-${src.slice(-20)}`),
    [images]
  );

  // Grid layout config based on photo count
  const gridClass = useMemo(() => {
    const count = images.length;
    if (count === 1) return "grid-cols-1";
    if (count === 2) return "grid-cols-2";
    if (count === 3) return "grid-cols-2";
    if (count === 4) return "grid-cols-2";
    if (count === 5) return "grid-cols-2";
    return "grid-cols-3"; // 6+
  }, [images.length]);

  // Per-image aspect + span classes
  const getImageClasses = useCallback(
    (index: number): { aspect: string; span: string } => {
      const count = images.length;

      if (count === 1) {
        return { aspect: "aspect-video", span: "" };
      }
      if (count === 2) {
        return { aspect: "aspect-square", span: "" };
      }
      if (count === 3) {
        if (index === 0) return { aspect: "aspect-video", span: "col-span-2" };
        return { aspect: "aspect-square", span: "" };
      }
      if (count === 4) {
        return { aspect: "aspect-square", span: "" };
      }
      if (count === 5) {
        if (index === 0) return { aspect: "aspect-video", span: "col-span-2" };
        return { aspect: "aspect-square", span: "" };
      }
      // 6+
      return { aspect: "aspect-square", span: "" };
    },
    [images.length]
  );

  // Handle drag end -- reorder images
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const fromIndex = sortableIds.indexOf(active.id as string);
      const toIndex = sortableIds.indexOf(over.id as string);
      if (fromIndex !== -1 && toIndex !== -1 && onReorder) {
        onReorder(fromIndex, toIndex);
      }
    },
    [sortableIds, onReorder]
  );

  // Lightbox navigation
  const closeLightbox = useCallback(() => setLightboxIndex(null), []);
  const prevImage = useCallback(
    () => setLightboxIndex((i) => (i !== null ? (i - 1 + images.length) % images.length : null)),
    [images.length]
  );
  const nextImage = useCallback(
    () => setLightboxIndex((i) => (i !== null ? (i + 1) % images.length : null)),
    [images.length]
  );

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

  const gridContent = images.map((src, index) => {
    const { aspect, span } = getImageClasses(index);
    return (
      <SortableImage
        key={sortableIds[index]}
        id={sortableIds[index]}
        src={src}
        index={index}
        aspectClass={aspect}
        spanClass={span}
        editable={editable}
        onRemove={onRemove}
        onClickImage={(i) => setLightboxIndex(i)}
      />
    );
  });

  return (
    <>
      {editable ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sortableIds} strategy={rectSortingStrategy}>
            <div className={cn("grid gap-2 my-6", gridClass)}>{gridContent}</div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className={cn("grid gap-2 my-6", gridClass)}>{gridContent}</div>
      )}

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
