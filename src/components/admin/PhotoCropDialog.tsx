import { useRef, useState, useCallback } from "react";
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, RotateCw, Crop as CropIcon } from "lucide-react";
import { toast } from "sonner";

// Crop + rotate editor for the PhotoManager lightbox. Loads the photo's
// URL into a <ReactCrop>, lets the consultant draw a freeform or
// 16:9 / 1:1 / 4:3 crop, optionally rotate in 90° steps, and emits the
// edited image as a Blob via onSave. PhotoManager handles persistence
// (storage upload + DB update) so this dialog stays UI-only.

interface PhotoCropDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  photoUrl: string;
  onSave: (blob: Blob) => Promise<void>;
}

export function PhotoCropDialog({
  open,
  onOpenChange,
  photoUrl,
  onSave,
}: PhotoCropDialogProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [rotation, setRotation] = useState(0);
  const [aspect, setAspect] = useState<number | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    // Default crop covers the full image so the consultant can rotate
    // without drawing a region first.
    const initial = aspect
      ? centerCrop(makeAspectCrop({ unit: "%", width: 90 }, aspect, width, height), width, height)
      : ({ unit: "%", x: 5, y: 5, width: 90, height: 90 } as Crop);
    setCrop(initial);
  }, [aspect]);

  const rotate = () => setRotation((r) => (r + 90) % 360);

  const setAspectRatio = (ratio: number | undefined) => {
    setAspect(ratio);
    if (imgRef.current && ratio) {
      const { width, height } = imgRef.current;
      setCrop(centerCrop(makeAspectCrop({ unit: "%", width: 90 }, ratio, width, height), width, height));
    }
  };

  // Render the crop region (and any rotation) to an offscreen canvas,
  // produce a JPEG blob, and hand it to the parent. PhotoManager owns
  // the upload + DB update so the dialog can be reused anywhere a
  // photo needs editing without dragging Supabase deps along.
  const handleSave = async () => {
    if (!imgRef.current || !completedCrop || !completedCrop.width || !completedCrop.height) {
      toast.error("Draw a crop area first");
      return;
    }
    setSaving(true);
    try {
      const blob = await renderToBlob(imgRef.current, completedCrop, rotation);
      if (!blob) throw new Error("Failed to encode cropped image");
      await onSave(blob);
      onOpenChange(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Save failed";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">Edit photo</DialogTitle>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2 pb-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Aspect</span>
          <Button variant={aspect === undefined ? "default" : "outline"} size="sm" className="h-7 text-[11px]" onClick={() => setAspectRatio(undefined)}>Free</Button>
          <Button variant={aspect === 1 ? "default" : "outline"} size="sm" className="h-7 text-[11px]" onClick={() => setAspectRatio(1)}>1:1</Button>
          <Button variant={aspect === 4 / 3 ? "default" : "outline"} size="sm" className="h-7 text-[11px]" onClick={() => setAspectRatio(4 / 3)}>4:3</Button>
          <Button variant={aspect === 16 / 9 ? "default" : "outline"} size="sm" className="h-7 text-[11px]" onClick={() => setAspectRatio(16 / 9)}>16:9</Button>
          <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1.5 ml-auto" onClick={rotate}>
            <RotateCw className="w-3.5 h-3.5" /> Rotate 90°
          </Button>
        </div>

        <div className="bg-muted/30 rounded-md p-2 flex items-center justify-center min-h-[300px]">
          <ReactCrop
            crop={crop}
            onChange={(_, pct) => setCrop(pct)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={aspect}
            keepSelection
          >
            <img
              ref={imgRef}
              src={photoUrl}
              alt="Photo to edit"
              onLoad={onImageLoad}
              style={{ transform: `rotate(${rotation}deg)`, maxHeight: "60vh", maxWidth: "100%" }}
              crossOrigin="anonymous"
            />
          </ReactCrop>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-1.5">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CropIcon className="w-4 h-4" />}
            {saving ? "Saving..." : "Save edits"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Renders the cropped (and optionally rotated) region of the source image
// to a JPEG Blob. Crop coords are in *displayed* pixels — we scale to the
// natural resolution so the saved image is the same quality as the
// original, not the on-screen preview.
async function renderToBlob(image: HTMLImageElement, crop: PixelCrop, rotationDeg: number): Promise<Blob | null> {
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  const cropW = crop.width * scaleX;
  const cropH = crop.height * scaleY;
  const cropX = crop.x * scaleX;
  const cropY = crop.y * scaleY;

  const radians = (rotationDeg * Math.PI) / 180;
  const swapsAxes = rotationDeg === 90 || rotationDeg === 270;
  const outW = swapsAxes ? cropH : cropW;
  const outH = swapsAxes ? cropW : cropH;

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(outW);
  canvas.height = Math.round(outH);
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.imageSmoothingQuality = "high";
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(radians);
  ctx.drawImage(
    image,
    cropX,
    cropY,
    cropW,
    cropH,
    -cropW / 2,
    -cropH / 2,
    cropW,
    cropH,
  );

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/jpeg", 0.92));
}
