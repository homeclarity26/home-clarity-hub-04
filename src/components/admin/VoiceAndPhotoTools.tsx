import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Mic, MicOff, Image, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ACCEPT_IMAGES } from "@/lib/upload-accept";

interface VoiceAndPhotoToolsProps {
  reportId: string;
  propertyId: string;
}

const VoiceAndPhotoTools = ({ reportId, propertyId }: VoiceAndPhotoToolsProps) => {
  const [voiceLoading, setVoiceLoading] = useState(false);
  const [voiceResult, setVoiceResult] = useState<string | null>(null);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoResult, setPhotoResult] = useState<{ page: string; confidence: number } | null>(null);
  const voiceInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const handleVoiceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setVoiceLoading(true);
    try {
      // Convert to base64
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1] || result);
        };
        reader.readAsDataURL(file);
      });

      const { data, error } = await supabase.functions.invoke("voice-to-narrative", {
        body: { audio: base64, mimeType: file.type },
      });
      if (error) throw error;
      setVoiceResult(data?.narrative || "No narrative generated.");
      toast.success("Voice note transcribed and polished!");
    } catch (err) {
      console.error("Voice transcription error:", err);
      toast.error("Failed to transcribe voice note");
    } finally {
      setVoiceLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoLoading(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1] || result);
        };
        reader.readAsDataURL(file);
      });

      const { data, error } = await supabase.functions.invoke("categorize-photo", {
        body: { image: base64, mimeType: file.type, reportId },
      });
      if (error) throw error;
      setPhotoResult(data);
      toast.success(`Photo categorized: ${data?.page || "Unknown"}`);
    } catch (err) {
      console.error("Photo categorization error:", err);
      toast.error("Failed to categorize photo");
    } finally {
      setPhotoLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Voice to Narrative */}
      <div>
        <input ref={voiceInputRef} type="file" accept="audio/*" className="hidden" onChange={handleVoiceUpload} />
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs font-sans"
          onClick={() => voiceInputRef.current?.click()}
          disabled={voiceLoading}
        >
          {voiceLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mic className="w-3.5 h-3.5" />}
          Voice → Narrative
        </Button>
      </div>

      {/* Photo Auto-Sort */}
      <div>
        <input ref={photoInputRef} type="file" accept={ACCEPT_IMAGES} className="hidden" onChange={handlePhotoUpload} />
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs font-sans"
          onClick={() => photoInputRef.current?.click()}
          disabled={photoLoading}
        >
          {photoLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Image className="w-3.5 h-3.5" />}
          Auto-Sort Photo
        </Button>
      </div>

      {/* Results display */}
      {voiceResult && (
        <Card className="w-full p-3 mt-2">
          <p className="text-xs font-sans font-semibold text-foreground mb-1">Transcribed Narrative:</p>
          <p className="text-xs font-sans text-muted-foreground whitespace-pre-wrap">{voiceResult}</p>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs mt-2"
            onClick={() => { navigator.clipboard.writeText(voiceResult); toast.success("Copied!"); }}
          >
            Copy to clipboard
          </Button>
        </Card>
      )}
      {photoResult && (
        <Card className="w-full p-3 mt-2">
          <p className="text-xs font-sans text-foreground">
            Suggested page: <span className="font-semibold">{photoResult.page}</span>
            <span className="text-muted-foreground ml-2">({Math.round((photoResult.confidence || 0) * 100)}% confidence)</span>
          </p>
        </Card>
      )}
    </div>
  );
};

export default VoiceAndPhotoTools;
