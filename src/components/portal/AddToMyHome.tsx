import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Camera, FileText, Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface AddToMyHomeProps {
  propertyId: string;
}

export function AddToMyHome({ propertyId }: AddToMyHomeProps) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setNote("");
    setSubmitted(false);
  };

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) reset();
  };

  const submitNote = async () => {
    if (!note.trim()) return;
    await supabase.from("copilot_inbox").insert({
      property_id: propertyId,
      source: "client",
      kind: "note",
      payload: { text: note.trim() },
    });
    setNote("");
    setSubmitted(true);
    toast({ title: "Note submitted" });
  };

  const handleUpload = async (files: FileList | null, kind: "photo" | "document") => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const file = files[0];
      const path = `${propertyId}/client-uploads/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage
        .from("property-photos")
        .upload(path, file, { contentType: file.type });
      if (upErr) throw upErr;

      await supabase.from("copilot_inbox").insert({
        property_id: propertyId,
        source: "client",
        kind,
        payload: { fileName: file.name, storagePath: path, fileType: file.type },
      });
      setSubmitted(true);
      toast({ title: `${kind === "photo" ? "Photo" : "Document"} submitted` });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      toast({ title: "Upload failed", description: msg, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-30 rounded-full shadow-md min-h-[44px] min-w-[44px] p-0 flex items-center justify-center gap-2 px-3"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline text-xs font-mono uppercase tracking-wider">Add</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-sm p-0 flex flex-col">
        <div className="px-4 py-4 border-b border-border">
          <h2 className="font-display text-lg text-foreground">Add to my home</h2>
          <p className="text-xs font-sans text-muted-foreground mt-0.5">
            Submit a photo, document, or note. Adam will review and add it to your report.
          </p>
        </div>

        <div className="flex-1 p-4 space-y-4">
          {submitted ? (
            <Card className="p-6 text-center space-y-3">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <p className="text-sm font-sans text-foreground">
                Submitted! Adam will review and add this to your report. You will see it next time you open the report.
              </p>
              <Button variant="outline" size="sm" onClick={reset} className="min-h-[36px]">
                Add something else
              </Button>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="min-h-[80px] flex flex-col items-center gap-2"
                  onClick={() => photoRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5 text-accent" />}
                  <span className="text-xs">Take photo</span>
                </Button>
                <Button
                  variant="outline"
                  className="min-h-[80px] flex flex-col items-center gap-2"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5 text-accent" />}
                  <span className="text-xs">Upload file</span>
                </Button>
              </div>

              <input
                ref={photoRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  void handleUpload(e.target.files, "photo");
                  if (photoRef.current) photoRef.current.value = "";
                }}
              />
              <input
                ref={fileRef}
                type="file"
                accept="image/*,.pdf,.doc,.docx,.txt,.heic,.heif"
                className="hidden"
                onChange={(e) => {
                  void handleUpload(e.target.files, "document");
                  if (fileRef.current) fileRef.current.value = "";
                }}
              />

              <div className="space-y-2">
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Leave a note about something you noticed..."
                  className="min-h-[80px] text-sm"
                />
                <Button
                  size="sm"
                  disabled={!note.trim()}
                  onClick={submitNote}
                  className="min-h-[36px]"
                >
                  Submit note
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
