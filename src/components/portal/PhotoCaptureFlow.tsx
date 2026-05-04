import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface PhotoCaptureFlowProps {
  propertyId: string;
}

export function PhotoCaptureFlow({ propertyId }: PhotoCaptureFlowProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [lastUploaded, setLastUploaded] = useState<string | null>(null);

  const handleCapture = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setLastUploaded(null);

    try {
      const file = files[0];
      const path = `${propertyId}/photos/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage
        .from("property-photos")
        .upload(path, file, { contentType: file.type });
      if (upErr) throw upErr;

      let category = "Interior Photos";
      try {
        const { data: catData } = await supabase.functions.invoke("categorize-photo", {
          body: { fileName: file.name, storagePath: path, bucket: "property-photos" },
        });
        if (catData?.category) category = catData.category;
      } catch {
        // fallback to Interior Photos
      }

      await supabase.from("client_files").insert({
        property_id: propertyId,
        file_name: file.name,
        category,
        storage_path: path,
        file_type: "image",
        file_size: file.size < 1048576
          ? `${(file.size / 1024).toFixed(1)} KB`
          : `${(file.size / 1048576).toFixed(1)} MB`,
      });

      setLastUploaded(file.name);
      toast({ title: "Photo captured", description: `Classified as ${category}` });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      toast({ title: "Capture failed", description: msg, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="p-4 flex items-center gap-3">
      <Button
        type="button"
        variant="outline"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="min-h-[44px] shrink-0"
      >
        {uploading ? (
          <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
        ) : (
          <Camera className="w-4 h-4 mr-1.5" />
        )}
        {uploading ? "Uploading..." : "Take photo"}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          void handleCapture(e.target.files);
          if (inputRef.current) inputRef.current.value = "";
        }}
      />
      {lastUploaded && (
        <div className="flex items-center gap-1.5 text-xs font-sans text-muted-foreground">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span className="truncate">{lastUploaded}</span>
        </div>
      )}
    </Card>
  );
}
