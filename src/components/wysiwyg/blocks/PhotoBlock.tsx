import { useCallback, useRef, useState } from "react";
import { ImagePlus, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import type { PhotoContent } from "../types";

interface PhotoBlockProps {
  content: PhotoContent;
  editable?: boolean;
  onChange?: (content: PhotoContent) => void;
  reportId?: string;
  isAnalyzing?: boolean;
  hasAnalysis?: boolean;
  onPhotoUploaded?: (url: string) => void;
  onPhotoClick?: (url: string) => void;
}

const PhotoBlock = ({ content, editable, onChange, reportId, isAnalyzing, hasAnalysis, onPhotoUploaded, onPhotoClick }: PhotoBlockProps) => {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const path = `${reportId || "general"}/${crypto.randomUUID()}-${file.name}`;
    const { error } = await supabase.storage.from("report-images").upload(path, file);
    if (error) {
      toast.error("Upload failed");
      return;
    }
    const { data: urlData, error: signErr } = await supabase.storage.from("report-images").createSignedUrl(path, 3600);
    if (signErr || !urlData?.signedUrl) {
      toast.error("Failed to get image URL");
      return;
    }
    const url = urlData.signedUrl;
    onChange?.({ ...content, url });
    onPhotoUploaded?.(url);
  }, [content, onChange, reportId, onPhotoUploaded]);

  if (!content.url) {
    return editable ? (
      <div
        onClick={() => fileRef.current?.click()}
        className="bg-muted rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center py-12 cursor-pointer hover:border-accent transition-colors"
      >
        <ImagePlus className="h-8 w-8 text-muted-foreground mb-2" />
        <span className="text-xs font-mono text-muted-foreground">Click to upload</span>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
      </div>
    ) : (
      <div className="bg-muted rounded-lg h-32 flex items-center justify-center">
        <span className="text-xs text-muted-foreground">No image</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className={`relative group ${!editable && hasAnalysis ? "cursor-pointer" : ""}`} onClick={() => { if (!editable && hasAnalysis && content.url) onPhotoClick?.(content.url); }}>
        <img src={content.url} alt={content.caption || ""} className="w-full rounded-lg object-cover" />
        {/* Analysis overlay indicators */}
        {isAnalyzing && (
          <div className="absolute top-2 left-2">
            <Badge className="bg-accent/90 text-accent-foreground text-[9px] gap-1 animate-pulse">
              <Loader2 className="h-2.5 w-2.5 animate-spin" /> Analyzing
            </Badge>
          </div>
        )}
        {!isAnalyzing && hasAnalysis && !editable && (
          <div className="absolute top-2 left-2">
            <Badge className="bg-accent/80 text-accent-foreground text-[9px] gap-1">
              <Sparkles className="h-2.5 w-2.5" /> Inspected
            </Badge>
          </div>
        )}
        {editable && (
          <div
            onClick={() => fileRef.current?.click()}
            className="absolute inset-0 bg-primary/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center cursor-pointer"
          >
            <span className="text-primary-foreground text-sm font-medium">Replace</span>
          </div>
        )}
        {editable && <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />}
      </div>
      {editable ? (
        <input
          className="w-full bg-transparent text-xs text-muted-foreground outline-none border-b border-transparent focus:border-accent font-mono"
          value={content.caption || ""}
          onChange={(e) => onChange?.({ ...content, caption: e.target.value })}
          placeholder="Add a caption..."
        />
      ) : (
        content.caption && <p className="text-xs text-muted-foreground text-center font-mono">{content.caption}</p>
      )}
    </div>
  );
};

export default PhotoBlock;
