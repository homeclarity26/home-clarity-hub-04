import { useState, useCallback } from "react";
import { Plus, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PhotoContent } from "../types";
import PhotoBlock from "./PhotoBlock";
import PhotoAnalysisPanel from "./PhotoAnalysisPanel";
import type { PhotoAnalysis } from "./PhotoAnalysisPanel";
import { usePhotoAnalysis } from "@/hooks/usePhotoAnalysis";
import { toast } from "sonner";

interface PhotoGalleryBlockProps {
  content: { photos: PhotoContent[] };
  editable?: boolean;
  onChange?: (content: { photos: PhotoContent[] }) => void;
  reportId?: string;
  sectionType?: string;
  propertyId?: string;
  onInsertFinding?: (finding: { name: string; rating: string; notes: string }) => void;
  onInsertFindings?: (findings: Array<{ name: string; rating: string; notes: string }>) => void;
  onApplyNarrative?: (narrative: string) => void;
  onApplyRating?: (rating: string) => void;
  currentRating?: string;
}

const PhotoGalleryBlock = ({
  content, editable, onChange, reportId, sectionType, propertyId,
  onInsertFinding, onInsertFindings, onApplyNarrative, onApplyRating, currentRating,
}: PhotoGalleryBlockProps) => {
  const photos = content.photos || [];
  const [analyzingUrls, setAnalyzingUrls] = useState<Set<string>>(new Set());

  const {
    analyses,
    isAnalyzing,
    analyzingCount,
    analyzeSinglePhoto,
    analyzePhotos,
  } = usePhotoAnalysis({
    sectionType,
    reportId,
    propertyId,
  });

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

  const handlePhotoUploaded = useCallback(async (url: string) => {
    setAnalyzingUrls((prev) => new Set([...prev, url]));
    await analyzeSinglePhoto(url);
    setAnalyzingUrls((prev) => {
      const next = new Set(prev);
      next.delete(url);
      return next;
    });
  }, [analyzeSinglePhoto]);

  const handleAnalyzeAll = useCallback(async () => {
    const urls = photos.map((p) => p.url).filter(Boolean);
    if (urls.length === 0) {
      toast.error("No photos to analyze");
      return;
    }
    setAnalyzingUrls(new Set(urls));
    await analyzePhotos(urls);
    setAnalyzingUrls(new Set());
  }, [photos, analyzePhotos]);

  const analyzedUrls = new Set(analyses.map((a) => a.photo_url));

  const cols = photos.length <= 2 ? "grid-cols-2" : photos.length === 3 ? "grid-cols-3" : "grid-cols-2 md:grid-cols-4";

  return (
    <div className="space-y-3">
      <div className={`grid ${cols} gap-3`}>
        {photos.map((photo, idx) => (
          <div key={idx} className="relative group">
            <PhotoBlock
              content={photo}
              editable={editable}
              onChange={(p) => updatePhoto(idx, p)}
              reportId={reportId}
              isAnalyzing={analyzingUrls.has(photo.url)}
              hasAnalysis={analyzedUrls.has(photo.url)}
              onPhotoUploaded={editable ? handlePhotoUploaded : undefined}
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
        <div className="flex items-center gap-3">
          <button onClick={addPhoto} className="flex items-center gap-1 text-xs text-accent hover:text-accent/80 font-mono">
            <Plus className="h-3 w-3" /> Add Photo
          </button>
          {photos.filter((p) => p.url).length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-[10px] gap-1 text-accent"
              onClick={handleAnalyzeAll}
              disabled={isAnalyzing}
            >
              <Sparkles className="h-3 w-3" />
              Analyze {photos.filter((p) => p.url).length > 1 ? "All Photos" : "Photo"}
            </Button>
          )}
        </div>
      )}

      {/* AI Analysis Panel */}
      {editable && (analyses.length > 0 || isAnalyzing) && (
        <PhotoAnalysisPanel
          analyses={analyses}
          isAnalyzing={isAnalyzing}
          analyzingCount={analyzingCount}
          currentRating={currentRating}
          onApplyRating={onApplyRating || (() => {})}
          onApplyNarrative={onApplyNarrative || (() => {})}
          onApplyFinding={onInsertFinding || (() => {})}
          onApplyAllFindings={onInsertFindings || (() => {})}
        />
      )}
    </div>
  );
};

export default PhotoGalleryBlock;
