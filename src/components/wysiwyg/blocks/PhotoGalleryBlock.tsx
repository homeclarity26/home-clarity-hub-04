import { Plus, X } from "lucide-react";
import type { PhotoContent } from "../types";
import PhotoBlock from "./PhotoBlock";

interface PhotoGalleryBlockProps {
  content: { photos: PhotoContent[] };
  editable?: boolean;
  onChange?: (content: { photos: PhotoContent[] }) => void;
  reportId?: string;
}

const PhotoGalleryBlock = ({ content, editable, onChange, reportId }: PhotoGalleryBlockProps) => {
  const photos = content.photos || [];

  const updatePhoto = (idx: number, photo: PhotoContent) => {
    const updated = photos.map((p, i) => (i === idx ? photo : p));
    onChange?.({ photos: updated });
  };

  const addPhoto = () => {
    onChange?.({ photos: [...photos, { url: "", caption: "" }] });
  };

  const removePhoto = (idx: number) => {
    onChange?.({ photos: photos.filter((_, i) => i !== idx) });
  };

  const cols = photos.length <= 2 ? "grid-cols-2" : photos.length === 3 ? "grid-cols-3" : "grid-cols-2 md:grid-cols-4";

  return (
    <div className="space-y-3">
      <div className={`grid ${cols} gap-3`}>
        {photos.map((photo, idx) => (
          <div key={idx} className="relative">
            <PhotoBlock
              content={photo}
              editable={editable}
              onChange={(p) => updatePhoto(idx, p)}
              reportId={reportId}
            />
            {editable && photo.url && (
              <button
                onClick={() => removePhoto(idx)}
                className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}
      </div>
      {editable && (
        <button onClick={addPhoto} className="flex items-center gap-1 text-xs text-accent hover:text-accent/80 font-mono">
          <Plus className="h-3 w-3" /> Add Photo
        </button>
      )}
    </div>
  );
};

export default PhotoGalleryBlock;
