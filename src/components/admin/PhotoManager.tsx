import { useState, useCallback, useRef } from "react";
import { Camera, Upload, Search, Filter, Sparkles, Eye, EyeOff, X, ChevronLeft, ChevronRight, Tag, Loader2, Image as ImageIcon, CheckCircle2, Crop as CropIcon } from "lucide-react";
import { PhotoCropDialog } from "./PhotoCropDialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ACCEPT_IMAGES } from "@/lib/upload-accept";
import { format } from "date-fns";

interface PhotoManagerProps {
  propertyId: string;
  reportPages?: { id: string; title: string; page_key: string }[];
  projects?: { id: string; title: string }[];
}

const CATEGORIES = [
  { value: "all", label: "All" },
  { value: "exterior", label: "Exterior" },
  { value: "interior", label: "Interior" },
  { value: "system", label: "Systems" },
  { value: "before", label: "Before" },
  { value: "after", label: "After" },
  { value: "progress", label: "Progress" },
  { value: "damage", label: "Damage" },
  { value: "other", label: "Other" },
];

const CATEGORY_COLORS: Record<string, string> = {
  exterior: "bg-blue-500/10 text-blue-700 border-blue-200",
  interior: "bg-amber-500/10 text-amber-700 border-amber-200",
  system: "bg-violet-500/10 text-violet-700 border-violet-200",
  before: "bg-orange-500/10 text-orange-700 border-orange-200",
  after: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
  progress: "bg-cyan-500/10 text-cyan-700 border-cyan-200",
  damage: "bg-red-500/10 text-red-700 border-red-200",
  other: "bg-muted text-muted-foreground border-border",
};

// Sentinel tag stored in property_photos.tags whenever the AI Categorize
// flow set the category. Stripped on the next user override (or explicit
// Confirm tap) so the badge disappears once the consultant has reviewed.
const AI_SUGGESTED_TAG = "ai-suggested";

function isAISuggested(photo: { tags?: string[] | null }): boolean {
  return Array.isArray(photo.tags) && photo.tags.includes(AI_SUGGESTED_TAG);
}

// Walks a report_pages.narrative jsonb cell and concatenates the text
// content. Handles the W2.5 ReportBlock array shape (text blocks have
// `content.html`); strips HTML tags so the AI sees plain text. Falls
// back to a JSON dump for unrecognized shapes so we always pass
// SOMETHING to the redraft prompt.
function extractTextFromNarrative(narrative: unknown): string {
  if (!narrative) return "";
  if (typeof narrative === "string") return narrative;
  if (Array.isArray(narrative)) {
    const parts: string[] = [];
    for (const item of narrative) {
      if (!item || typeof item !== "object") continue;
      const block = item as { type?: string; content?: { html?: string; text?: string } };
      if (block.type === "text") {
        const html = block.content?.html ?? block.content?.text ?? "";
        parts.push(html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
      }
    }
    return parts.filter(Boolean).join("\n\n");
  }
  return JSON.stringify(narrative);
}

type PropertyPhoto = {
  id: string;
  property_id: string;
  project_id: string | null;
  report_page_id: string | null;
  category: string;
  room_or_area: string | null;
  title: string;
  description: string;
  file_url: string;
  thumbnail_url: string | null;
  taken_at: string;
  gps_lat: number | null;
  gps_lng: number | null;
  taken_by: string | null;
  is_client_visible: boolean;
  tags: string[];
  width: number | null;
  height: number | null;
  created_at: string;
};

const PhotoManager = ({ propertyId, reportPages, projects }: PhotoManagerProps) => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState<PropertyPhoto | null>(null);
  const [editTags, setEditTags] = useState("");
  const [categorizing, setCategorizing] = useState(false);
  const [beforeAfterMode, setBeforeAfterMode] = useState(false);
  const [sliderPos, setSliderPos] = useState(50);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [redrafting, setRedrafting] = useState(false);
  const [redraftResult, setRedraftResult] = useState<{ narrative: string[]; key_observations: string[]; pageTitle: string } | null>(null);

  const { data: photos = [], isLoading } = useQuery({
    queryKey: ["property-photos", propertyId],
    queryFn: async () => {
      const { data } = await supabase.from("property_photos")
        .select("*")
        .eq("property_id", propertyId)
        .order("created_at", { ascending: false });
      return (data || []) as PropertyPhoto[];
    },
  });

  const filtered = photos.filter((p) => {
    if (filter !== "all" && p.category !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        p.title?.toLowerCase().includes(q) ||
        p.room_or_area?.toLowerCase().includes(q) ||
        p.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Before/After pairs
  const beforeAfterPairs = (() => {
    const befores = photos.filter((p) => p.category === "before");
    const afters = photos.filter((p) => p.category === "after");
    const pairs: { before: PropertyPhoto; after: PropertyPhoto }[] = [];
    for (const b of befores) {
      const match = afters.find((a) => a.room_or_area && a.room_or_area === b.room_or_area);
      if (match) pairs.push({ before: b, after: match });
    }
    return pairs;
  })();

  const handleBulkUpload = useCallback(async (files: FileList) => {
    if (!user) return;
    setUploading(true);
    let count = 0;
    try {
      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop();
        const ts = Date.now();
        const path = `${propertyId}/${ts}_${file.name}`;
        const { error: upErr } = await supabase.storage.from("property-photos").upload(path, file);
        if (upErr) { console.error(upErr); continue; }
        const { data: signedData } = await supabase.storage.from("property-photos").createSignedUrl(path, 3600);
        const photoUrl = signedData?.signedUrl || path;
        await supabase.from("property_photos").insert({
          property_id: propertyId,
          file_url: photoUrl,
          title: file.name.replace(/\.[^/.]+$/, ""),
          taken_by: user.id,
          category: "other",
          is_client_visible: true,
          tags: [],
        });
        count++;
      }
      toast.success(`${count} photo${count > 1 ? "s" : ""} uploaded`);
      qc.invalidateQueries({ queryKey: ["property-photos", propertyId] });
    } catch (err) {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  }, [propertyId, user, qc]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) handleBulkUpload(e.dataTransfer.files);
  }, [handleBulkUpload]);

  const toggleVisibility = async (photo: PropertyPhoto) => {
    await supabase.from("property_photos")
      .update({ is_client_visible: !photo.is_client_visible })
      .eq("id", photo.id);
    qc.invalidateQueries({ queryKey: ["property-photos", propertyId] });
  };

  const updatePhoto = async (id: string, updates: Record<string, unknown>) => {
    // When the user manually changes the category, strip the "ai-suggested"
    // tag — that change is their explicit confirmation, so the badge
    // should disappear. Same for room_or_area edits since those are part
    // of the AI's auto-sort.
    let patch = updates;
    if (
      ("category" in updates || "room_or_area" in updates) &&
      lightboxPhoto?.id === id &&
      isAISuggested(lightboxPhoto)
    ) {
      patch = {
        ...updates,
        tags: (lightboxPhoto.tags || []).filter((t) => t !== AI_SUGGESTED_TAG),
      };
    }
    await supabase.from("property_photos").update(patch).eq("id", id);
    qc.invalidateQueries({ queryKey: ["property-photos", propertyId] });
    if (lightboxPhoto?.id === id) {
      setLightboxPhoto({ ...lightboxPhoto, ...patch } as PropertyPhoto);
    }
  };

  // Re-draft this report page using ALL photos currently linked to it.
  // Loads the page title + existing narrative blocks, harvests photo
  // URLs, asks draft-page-narrative (redraft_mode) to update the
  // narrative based on what the photos show now. Returns the AI's
  // suggestion in a dialog for the consultant to review + manually
  // copy into the page editor — no auto-apply because the page block
  // structure varies and we don't want to silently overwrite work.
  const redraftPageFromPhotos = async (photo: PropertyPhoto) => {
    if (!photo.report_page_id) return;
    setRedrafting(true);
    try {
      const { data: pageRow, error: pErr } = await supabase
        .from("report_pages")
        .select("id, page_key, title, narrative")
        .eq("id", photo.report_page_id)
        .single();
      if (pErr || !pageRow) throw new Error(pErr?.message || "Page not found");

      const { data: linkedPhotos } = await supabase
        .from("property_photos")
        .select("file_url")
        .eq("report_page_id", photo.report_page_id)
        .order("created_at", { ascending: true });
      const photoUrls = (linkedPhotos || []).map((p) => p.file_url).filter(Boolean);
      if (photoUrls.length === 0) {
        toast.error("No photos linked to this page yet");
        return;
      }

      const existingText = extractTextFromNarrative(pageRow.narrative);

      const { data, error } = await supabase.functions.invoke("draft-page-narrative", {
        body: {
          pageSlug: pageRow.page_key,
          pageName: pageRow.title,
          redraft_mode: true,
          existing_narrative_text: existingText,
          photo_urls: photoUrls,
        },
      });
      if (error) throw error;

      setRedraftResult({
        narrative: Array.isArray(data?.narrative) ? data.narrative : [],
        key_observations: Array.isArray(data?.key_observations) ? data.key_observations : [],
        pageTitle: pageRow.title,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Redraft failed";
      toast.error(message);
    } finally {
      setRedrafting(false);
    }
  };

  // Crop dialog → upload edited blob to a sibling path with -edited
  // suffix + timestamp, then point the photo's file_url at the new
  // signed URL. Original is preserved (no overwrite) so the consultant
  // can re-crop later without compounding loss.
  const saveCroppedPhoto = async (blob: Blob) => {
    if (!lightboxPhoto || !user) return;
    const ts = Date.now();
    const newPath = `${propertyId}/edited-${ts}-${lightboxPhoto.id}.jpg`;
    const { error: upErr } = await supabase.storage
      .from("property-photos")
      .upload(newPath, blob, {
        contentType: "image/jpeg",
        cacheControl: "3600",
        upsert: false,
      });
    if (upErr) throw upErr;
    const { data: signedData } = await supabase.storage
      .from("property-photos")
      .createSignedUrl(newPath, 3600 * 24 * 365);
    const newUrl = signedData?.signedUrl;
    if (!newUrl) throw new Error("Could not generate URL for cropped photo");
    await supabase.from("property_photos")
      .update({ file_url: newUrl, thumbnail_url: null })
      .eq("id", lightboxPhoto.id);
    qc.invalidateQueries({ queryKey: ["property-photos", propertyId] });
    setLightboxPhoto({ ...lightboxPhoto, file_url: newUrl, thumbnail_url: null });
    toast.success("Photo edited");
  };

  // Manual confirm — removes the AI badge without changing anything else.
  // Useful when the AI got it right and the consultant just wants to
  // acknowledge it before moving on.
  const confirmAISuggestion = async (photo: PropertyPhoto) => {
    if (!isAISuggested(photo)) return;
    const nextTags = (photo.tags || []).filter((t) => t !== AI_SUGGESTED_TAG);
    await supabase.from("property_photos").update({ tags: nextTags }).eq("id", photo.id);
    qc.invalidateQueries({ queryKey: ["property-photos", propertyId] });
    if (lightboxPhoto?.id === photo.id) {
      setLightboxPhoto({ ...lightboxPhoto, tags: nextTags } as PropertyPhoto);
    }
  };

  const deletePhoto = async (id: string) => {
    await supabase.from("property_photos").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["property-photos", propertyId] });
    setLightboxPhoto(null);
    toast.success("Photo deleted");
  };

  const handleAICategorize = async () => {
    const uncategorized = photos.filter((p) => p.category === "other");
    if (uncategorized.length === 0) { toast.info("No uncategorized photos"); return; }
    setCategorizing(true);
    let updated = 0;
    try {
      for (const photo of uncategorized) {
        try {
          const { data, error } = await supabase.functions.invoke("categorize-photo", {
            body: {
              imageUrl: photo.file_url,
              availablePages: reportPages?.map((p) => ({ slug: p.page_key, name: p.title })) || [],
            },
          });
          if (!error && data) {
            const category = data.category || "other";
            const room = data.room_or_area || data.pageSlug || null;
            // Stamp ai-suggested tag so the consultant sees a badge on
            // anything the AI categorized — they confirm by editing a
            // field or clicking the check icon, which strips the tag.
            const aiTags = data.tags || [];
            const tags = aiTags.includes(AI_SUGGESTED_TAG)
              ? aiTags
              : [AI_SUGGESTED_TAG, ...aiTags];
            await supabase.from("property_photos")
              .update({ category, room_or_area: room, tags })
              .eq("id", photo.id);
            updated++;
          }
        } catch { /* skip */ }
      }
      toast.success(`AI categorized ${updated} photo${updated > 1 ? "s" : ""}`);
      qc.invalidateQueries({ queryKey: ["property-photos", propertyId] });
    } finally {
      setCategorizing(false);
    }
  };

  const lightboxIndex = lightboxPhoto ? filtered.findIndex((p) => p.id === lightboxPhoto.id) : -1;
  const goLightbox = (dir: number) => {
    const next = filtered[lightboxIndex + dir];
    if (next) setLightboxPhoto(next);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-sans font-semibold text-foreground">Photos</h3>
          <Badge variant="secondary" className="text-[10px]">{photos.length}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-xs gap-1.5"
            onClick={handleAICategorize}
            disabled={categorizing}
          >
            {categorizing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            AI Categorize
          </Button>
          {beforeAfterPairs.length > 0 && (
            <Button
              variant={beforeAfterMode ? "default" : "outline"}
              size="sm"
              className="text-xs gap-1.5"
              onClick={() => setBeforeAfterMode(!beforeAfterMode)}
            >
              Before/After
            </Button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT_IMAGES}
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handleBulkUpload(e.target.files)}
          />
          <Button size="sm" className="text-xs gap-1.5" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
            Upload Photos
          </Button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setFilter(cat.value)}
            className={`px-2.5 py-1 text-[11px] font-sans rounded-full border transition-colors cursor-pointer ${
              filter === cat.value
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:border-primary/50"
            }`}
          >
            {cat.label}
            {cat.value !== "all" && (
              <span className="ml-1 opacity-60">
                {photos.filter((p) => p.category === cat.value).length}
              </span>
            )}
          </button>
        ))}
        <div className="ml-auto relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tags, rooms..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-7 pl-8 text-xs w-48"
          />
        </div>
      </div>

      {/* Before/After Slider View */}
      {beforeAfterMode && beforeAfterPairs.length > 0 && (
        <div className="space-y-4">
          {beforeAfterPairs.map((pair, i) => (
            <Card key={i} className="p-4">
              <p className="text-xs font-sans font-medium text-foreground mb-2">{pair.before.room_or_area || "Comparison"}</p>
              <div className="relative w-full h-64 overflow-hidden rounded-lg select-none">
                <img src={pair.after.file_url} alt="After" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 overflow-hidden" style={{ width: `${sliderPos}%` }}>
                  <img src={pair.before.file_url} alt="Before" className="w-full h-full object-cover" style={{ minWidth: "100%" }} />
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={sliderPos}
                  onChange={(e) => setSliderPos(Number(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-col-resize z-10"
                />
                <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg z-[5]" style={{ left: `${sliderPos}%` }}>
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center">
                    <ChevronLeft className="w-3 h-3 text-foreground" />
                    <ChevronRight className="w-3 h-3 text-foreground" />
                  </div>
                </div>
                <Badge className="absolute top-2 left-2 bg-orange-500/90 text-white text-[9px]">Before</Badge>
                <Badge className="absolute top-2 right-2 bg-emerald-500/90 text-white text-[9px]">After</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Drop zone + Grid */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="min-h-[200px]"
      >
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <Card className="p-8 text-center border-dashed">
            <ImageIcon className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm font-sans text-muted-foreground">
              {photos.length === 0 ? "Drop photos here or click Upload" : "No photos match your filter"}
            </p>
          </Card>
        ) : (
          <div className="columns-2 md:columns-3 lg:columns-4 gap-3 space-y-3">
            {filtered.map((photo) => (
              <div
                key={photo.id}
                className="break-inside-avoid group relative rounded-lg overflow-hidden border border-border bg-card cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => { setLightboxPhoto(photo); setEditTags(photo.tags?.join(", ") || ""); }}
              >
                <img
                  src={photo.thumbnail_url || photo.file_url}
                  alt={photo.title}
                  className="w-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1 min-w-0">
                      <Badge variant="outline" className={`text-[8px] font-mono ${CATEGORY_COLORS[photo.category] || CATEGORY_COLORS.other}`}>
                        {photo.category}
                      </Badge>
                      {isAISuggested(photo) && (
                        <Badge variant="outline" className="text-[8px] font-mono bg-accent/15 text-accent border-accent/30" title="AI suggested this category — open to review or override">
                          <Sparkles className="w-2.5 h-2.5 mr-0.5" aria-hidden /> AI
                        </Badge>
                      )}
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleVisibility(photo); }}
                      className="text-white/70 hover:text-white"
                    >
                      {photo.is_client_visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    </button>
                  </div>
                  {photo.room_or_area && (
                    <p className="text-[9px] font-mono text-white/80 mt-0.5">{photo.room_or_area}</p>
                  )}
                </div>
                {!photo.is_client_visible && (
                  <div className="absolute top-1.5 right-1.5">
                    <Badge variant="destructive" className="text-[8px]">Admin Only</Badge>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Crop dialog */}
      {lightboxPhoto && (
        <PhotoCropDialog
          open={cropDialogOpen}
          onOpenChange={setCropDialogOpen}
          photoUrl={lightboxPhoto.file_url}
          onSave={saveCroppedPhoto}
        />
      )}

      {/* Re-draft result dialog. Read-only — consultant copies the
          suggested narrative into the page editor manually. We don't
          auto-apply because page block structures vary and a silent
          rewrite could nuke other blocks the consultant added. */}
      <Dialog open={!!redraftResult} onOpenChange={(o) => !o && setRedraftResult(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {redraftResult && (
            <>
              <div className="space-y-1 mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-accent" />
                  <h3 className="font-display text-base font-semibold text-foreground">
                    AI re-draft for {redraftResult.pageTitle}
                  </h3>
                </div>
                <p className="text-xs font-sans text-muted-foreground">
                  Suggested narrative based on the photos currently linked to this page. Copy what you like into the page editor.
                </p>
              </div>
              <div className="space-y-4">
                <div>
                  <Label className="text-[10px] font-mono uppercase text-muted-foreground">Suggested narrative</Label>
                  <div className="mt-1 space-y-2 rounded-md border border-border bg-muted/30 p-3 text-xs font-sans text-foreground">
                    {redraftResult.narrative.map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>
                </div>
                {redraftResult.key_observations.length > 0 && (
                  <div>
                    <Label className="text-[10px] font-mono uppercase text-muted-foreground">Key observations</Label>
                    <ul className="mt-1 space-y-1 rounded-md border border-border bg-muted/30 p-3 text-xs font-sans text-foreground">
                      {redraftResult.key_observations.map((o, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-accent" aria-hidden>•</span>
                          <span>{o}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const text = [
                        redraftResult.narrative.join("\n\n"),
                        redraftResult.key_observations.length > 0
                          ? `\n\nKey observations:\n${redraftResult.key_observations.map((o) => `• ${o}`).join("\n")}`
                          : "",
                      ].join("");
                      navigator.clipboard.writeText(text).then(
                        () => toast.success("Copied to clipboard"),
                        () => toast.error("Copy failed"),
                      );
                    }}
                    className="text-xs gap-1.5"
                  >
                    <Tag className="w-3.5 h-3.5" />
                    Copy
                  </Button>
                  <Button size="sm" onClick={() => setRedraftResult(null)} className="text-xs">
                    Close
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Lightbox */}
      <Dialog open={!!lightboxPhoto} onOpenChange={(o) => !o && setLightboxPhoto(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {lightboxPhoto && (
            <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-4">
              <div className="relative">
                <img src={lightboxPhoto.file_url} alt={lightboxPhoto.title} className="w-full rounded-lg" />
                {lightboxIndex > 0 && (
                  <button onClick={() => goLightbox(-1)} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1.5 hover:bg-black/70">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                )}
                {lightboxIndex < filtered.length - 1 && (
                  <button onClick={() => goLightbox(1)} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1.5 hover:bg-black/70">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs gap-1.5"
                  onClick={() => setCropDialogOpen(true)}
                >
                  <CropIcon className="w-3.5 h-3.5" />
                  Crop / rotate
                </Button>
                {lightboxPhoto.report_page_id && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs gap-1.5"
                    onClick={() => redraftPageFromPhotos(lightboxPhoto)}
                    disabled={redrafting}
                    title="Ask AI to update this page's narrative based on the photos linked to it"
                  >
                    {redrafting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    {redrafting ? "Reading photos..." : "Re-draft page from photos"}
                  </Button>
                )}
                <div>
                  <Label className="text-[10px] font-mono uppercase text-muted-foreground">Title</Label>
                  <Input
                    value={lightboxPhoto.title}
                    onChange={(e) => updatePhoto(lightboxPhoto.id, { title: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label className="text-[10px] font-mono uppercase text-muted-foreground">Category</Label>
                    {isAISuggested(lightboxPhoto) && (
                      <button
                        type="button"
                        onClick={() => confirmAISuggestion(lightboxPhoto)}
                        className="flex items-center gap-1 text-[10px] font-mono text-accent hover:text-accent/80"
                        title="Confirm AI choice and remove the badge"
                      >
                        <Sparkles className="w-3 h-3" aria-hidden />
                        AI suggested
                        <CheckCircle2 className="w-3 h-3" aria-hidden />
                      </button>
                    )}
                  </div>
                  <Select value={lightboxPhoto.category} onValueChange={(v) => updatePhoto(lightboxPhoto.id, { category: v })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.filter((c) => c.value !== "all").map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[10px] font-mono uppercase text-muted-foreground">Room / Area</Label>
                  <Input
                    value={lightboxPhoto.room_or_area || ""}
                    onChange={(e) => updatePhoto(lightboxPhoto.id, { room_or_area: e.target.value })}
                    className="h-8 text-xs"
                    placeholder="e.g. Kitchen, Roof"
                  />
                </div>
                <div>
                  <Label className="text-[10px] font-mono uppercase text-muted-foreground">Description</Label>
                  <Textarea
                    value={lightboxPhoto.description || ""}
                    onChange={(e) => updatePhoto(lightboxPhoto.id, { description: e.target.value })}
                    className="text-xs min-h-[60px]"
                  />
                </div>
                <div>
                  <Label className="text-[10px] font-mono uppercase text-muted-foreground">Tags (comma-separated)</Label>
                  <Input
                    value={editTags}
                    onChange={(e) => setEditTags(e.target.value)}
                    onBlur={() => updatePhoto(lightboxPhoto.id, { tags: editTags.split(",").map((t) => t.trim()).filter(Boolean) })}
                    className="h-8 text-xs"
                    placeholder="hvac, damage, urgent"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] font-mono uppercase text-muted-foreground">Client Visible</Label>
                  <Switch
                    checked={lightboxPhoto.is_client_visible}
                    onCheckedChange={(v) => updatePhoto(lightboxPhoto.id, { is_client_visible: v })}
                  />
                </div>
                {reportPages && reportPages.length > 0 && (
                  <div>
                    <Label className="text-[10px] font-mono uppercase text-muted-foreground">Assign to Report Page</Label>
                    <Select
                      value={lightboxPhoto.report_page_id || "none"}
                      onValueChange={(v) => updatePhoto(lightboxPhoto.id, { report_page_id: v === "none" ? null : v })}
                    >
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {reportPages.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {projects && projects.length > 0 && (
                  <div>
                    <Label className="text-[10px] font-mono uppercase text-muted-foreground">Assign to Project</Label>
                    <Select
                      value={lightboxPhoto.project_id || "none"}
                      onValueChange={(v) => updatePhoto(lightboxPhoto.id, { project_id: v === "none" ? null : v })}
                    >
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {projects.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="text-[10px] font-mono text-muted-foreground space-y-0.5">
                  <p>Taken: {lightboxPhoto.taken_at ? format(new Date(lightboxPhoto.taken_at), "MMM d, yyyy h:mm a") : "—"}</p>
                  {lightboxPhoto.gps_lat && <p>GPS: {lightboxPhoto.gps_lat}, {lightboxPhoto.gps_lng}</p>}
                </div>
                <Button variant="destructive" size="sm" className="w-full text-xs" onClick={() => deletePhoto(lightboxPhoto.id)}>
                  Delete Photo
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PhotoManager;
