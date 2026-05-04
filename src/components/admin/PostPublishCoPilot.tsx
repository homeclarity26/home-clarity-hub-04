import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Loader2, Upload, CheckCircle2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface PostPublishCoPilotProps {
  propertyId: string;
}

interface InboxItem {
  id: string;
  kind: string;
  payload: Record<string, unknown>;
  status: string;
  created_at: string;
}

export function PostPublishCoPilot({ propertyId }: PostPublishCoPilotProps) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadItems = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("copilot_inbox")
      .select("*")
      .eq("property_id", propertyId)
      .order("created_at", { ascending: false })
      .limit(50);
    setItems((data || []) as InboxItem[]);
    setLoading(false);
  };

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) loadItems();
  };

  const submitNote = async () => {
    if (!note.trim()) return;
    await supabase.from("copilot_inbox").insert({
      property_id: propertyId,
      source: "admin",
      kind: "note",
      payload: { text: note.trim() },
    });
    setNote("");
    toast({ title: "Note added to co-pilot inbox" });
    loadItems();
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const file = files[0];
      const path = `${propertyId}/copilot/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage
        .from("property-photos")
        .upload(path, file, { contentType: file.type });
      if (upErr) throw upErr;

      const kind = file.type.startsWith("image/") ? "photo" : "document";
      await supabase.from("copilot_inbox").insert({
        property_id: propertyId,
        source: "admin",
        kind,
        payload: { fileName: file.name, storagePath: path, fileType: file.type },
      });
      toast({ title: `${kind === "photo" ? "Photo" : "Document"} queued for report` });
      loadItems();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      toast({ title: "Upload failed", description: msg, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const updateStatus = async (id: string, status: "absorbed" | "rejected") => {
    await supabase
      .from("copilot_inbox")
      .update({ status, absorbed_at: status === "absorbed" ? new Date().toISOString() : null })
      .eq("id", id);
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
  };

  const pending = items.filter((i) => i.status === "pending");
  const processed = items.filter((i) => i.status !== "pending");

  return (
    <Sheet open={open} onOpenChange={handleOpen}>
      <SheetTrigger asChild>
        <Button
          className="fixed bottom-6 right-6 z-40 rounded-full shadow-lg min-h-[48px] min-w-[48px] p-0 flex items-center justify-center gap-2 px-4"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline text-sm">Add to Report</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="font-display text-lg text-foreground">Co-Pilot Inbox</h2>
          <p className="text-xs font-sans text-muted-foreground">Add content to this published report.</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Upload zone */}
          <Card className="p-4 space-y-3">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="min-h-[36px]"
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Upload className="w-4 h-4 mr-1" />}
                {uploading ? "Uploading..." : "Upload file"}
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*,.pdf,.doc,.docx,.txt"
                className="hidden"
                onChange={(e) => {
                  void handleFileUpload(e.target.files);
                  if (fileRef.current) fileRef.current.value = "";
                }}
              />
            </div>
            <div className="flex gap-2">
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note for the report..."
                className="min-h-[60px] text-sm"
              />
              <Button
                size="sm"
                disabled={!note.trim()}
                onClick={submitNote}
                className="min-h-[44px] shrink-0 self-end"
              >
                Add
              </Button>
            </div>
          </Card>

          {loading ? (
            <p className="text-sm text-muted-foreground text-center">Loading...</p>
          ) : (
            <>
              {pending.length > 0 && (
                <section className="space-y-2">
                  <h3 className="font-mono text-[10px] uppercase tracking-[0.15em] text-accent">
                    Pending ({pending.length})
                  </h3>
                  {pending.map((item) => (
                    <Card key={item.id} className="p-3 flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-mono text-muted-foreground capitalize">{item.kind}</p>
                        <p className="text-sm text-foreground mt-0.5 truncate">
                          {(item.payload as Record<string, string>).text ||
                           (item.payload as Record<string, string>).fileName ||
                           "Content"}
                        </p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatus(item.id, "absorbed")}
                          className="min-h-[32px] h-8 px-2"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => updateStatus(item.id, "rejected")}
                          className="min-h-[32px] h-8 px-2 text-muted-foreground"
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </section>
              )}

              {processed.length > 0 && (
                <section className="space-y-2">
                  <h3 className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                    Processed ({processed.length})
                  </h3>
                  {processed.slice(0, 10).map((item) => (
                    <Card key={item.id} className="p-3 opacity-50">
                      <p className="text-xs font-mono text-muted-foreground capitalize">
                        {item.kind} — {item.status}
                      </p>
                    </Card>
                  ))}
                </section>
              )}

              {pending.length === 0 && processed.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No items yet. Upload a photo, document, or add a note above.
                </p>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
