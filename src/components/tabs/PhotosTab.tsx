import { useState, useCallback, useRef } from "react";
import EmptyState from "@/components/EmptyState";
import { Camera, Upload, Download, ChevronLeft, ChevronRight, Loader2, Image as ImageIcon, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface PhotosTabProps {
  propertyId?: string;
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

type PropertyPhoto = {
  id: string;
  category: string;
  room_or_area: string | null;
  title: string;
  description: string;
  file_url: string;
  thumbnail_url: string | null;
  is_client_visible: boolean;
  tags: string[];
  created_at: string;
};

const PhotosTab = ({ propertyId }: PhotosTabProps) => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [filter, setFilter] = useState("all");
  const [uploading, setUploading] = useState(false);
  const [aiOrganizing, setAiOrganizing] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [sliderPos, setSliderPos] = useState(50);

  const isMock = propertyId?.startsWith("mock-");

  const { data: photos = [], isLoading } = useQuery({
    queryKey: ["portal-photos", propertyId],
    enabled: !!propertyId && !isMock,
    queryFn: async () => {
      const { data } = await supabase.from("property_photos")
        .select("*")
        .eq("property_id", propertyId)
        .eq("is_client_visible", true)
        .order("created_at", { ascending: false });
      return (data || []) as PropertyPhoto[];
    },
  });

  const mockPhotos: PropertyPhoto[] = isMock ? [
    { id: "1", category: "exterior", room_or_area: "Front Yard", title: "Front facade", description: "", file_url: "/placeholder.svg", thumbnail_url: null, is_client_visible: true, tags: ["curb-appeal"], created_at: new Date().toISOString() },
    { id: "2", category: "interior", room_or_area: "Kitchen", title: "Kitchen overview", description: "", file_url: "/placeholder.svg", thumbnail_url: null, is_client_visible: true, tags: ["kitchen"], created_at: new Date().toISOString() },
    { id: "3", category: "system", room_or_area: "Mechanical Room", title: "HVAC unit", description: "", file_url: "/placeholder.svg", thumbnail_url: null, is_client_visible: true, tags: ["hvac"], created_at: new Date().toISOString() },
  ] : [];

  const allPhotos = isMock ? mockPhotos : photos;
  const filtered = filter === "all" ? allPhotos : allPhotos.filter((p) => p.category === filter);

  // Before/After pairs
  const beforeAfterPairs = (() => {
    const befores = allPhotos.filter((p) => p.category === "before");
    const afters = allPhotos.filter((p) => p.category === "after");
    return befores
      .map((b) => ({ before: b, after: afters.find((a) => a.room_or_area && a.room_or_area === b.room_or_area) }))
      .filter((p): p is { before: PropertyPhoto; after: PropertyPhoto } => !!p.after);
  })();

  const handleUpload = useCallback(async (files: FileList) => {
    if (!user || !propertyId || isMock) return;
    setUploading(true);
    let count = 0;
    try {
      for (const file of Array.from(files)) {
        const path = `${propertyId}/${Date.now()}_${file.name}`;
        const { error } = await supabase.storage.from("property-photos").upload(path, file);
        if (error) continue;
        const { data: signedPData } = await supabase.storage.from("property-photos").createSignedUrl(path, 3600);
        const photoFileUrl = signedPData?.signedUrl || path;
        await supabase.from("property_photos").insert({
          property_id: propertyId,
          file_url: photoFileUrl,
          title: file.name.replace(/\.[^/.]+$/, ""),
          taken_by: user.id,
          category: "other",
          is_client_visible: true,
          tags: [],
        });
        count++;
      }
      toast.success(`${count} photo${count > 1 ? "s" : ""} uploaded`);
      qc.invalidateQueries({ queryKey: ["portal-photos", propertyId] });

      // Auto-organize with AI
      if (count > 0) {
        setAiOrganizing(true);
        try {
          // Fetch newly uploaded uncategorized photos
          const { data: newPhotos } = await supabase.from("property_photos")
            .select("*")
            .eq("property_id", propertyId)
            .eq("category", "other")
            .order("created_at", { ascending: false })
            .limit(count);
          
          for (const photo of (newPhotos || [])) {
            try {
              const { data } = await supabase.functions.invoke("categorize-photo", {
                body: { imageUrl: photo.file_url, availablePages: [] },
              });
              if (data) {
                await supabase.from("property_photos")
                  .update({
                    category: data.category || "other",
                    room_or_area: data.room_or_area || data.pageSlug || null,
                    tags: data.tags || [],
                  })
                  .eq("id", photo.id);
              }
            } catch { /* skip */ }
          }
          qc.invalidateQueries({ queryKey: ["portal-photos", propertyId] });
          toast.success("AI organized your photos!");
        } catch { /* silent */ } finally {
          setAiOrganizing(false);
        }
      }
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  }, [propertyId, user, qc, isMock]);

  const downloadPhoto = (url: string, title: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = title || "photo";
    a.target = "_blank";
    a.click();
  };

  return (
    <section className="max-w-[1200px] mx-auto px-4 md:px-20 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl text-foreground">Photos</h2>
          <p className="font-sans text-sm text-muted-foreground mt-1">Your home photo gallery</p>
        </div>
        <div className="flex items-center gap-2">
          {(uploading || aiOrganizing) && (
            <Badge variant="secondary" className="text-[10px] gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              {aiOrganizing ? "AI organizing..." : "Uploading..."}
            </Badge>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => e.target.files && handleUpload(e.target.files)} />
          <Button size="sm" className="gap-1.5 text-xs font-sans" onClick={() => fileInputRef.current?.click()} disabled={uploading || isMock}>
            <Upload className="w-3.5 h-3.5" /> Upload Photos
          </Button>
        </div>
      </div>

      {/* Category filters */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map((cat) => {
          const count = cat.value === "all" ? allPhotos.length : allPhotos.filter((p) => p.category === cat.value).length;
          return (
            <button
              key={cat.value}
              onClick={() => setFilter(cat.value)}
              className={`px-3 py-1.5 text-xs font-sans rounded-full border transition-colors cursor-pointer ${
                filter === cat.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:border-primary/40"
              }`}
            >
              {cat.label} {count > 0 && <span className="ml-1 opacity-60">{count}</span>}
            </button>
          );
        })}
      </div>

      {/* Before/After Sliders */}
      {beforeAfterPairs.length > 0 && filter === "all" && (
        <div className="space-y-3">
          <h3 className="font-sans text-sm font-semibold text-foreground">Before & After</h3>
          {beforeAfterPairs.map((pair, i) => (
            <Card key={i} className="p-3">
              <p className="text-xs font-sans font-medium text-muted-foreground mb-2">{pair.before.room_or_area}</p>
              <div className="relative w-full h-48 md:h-64 overflow-hidden rounded-lg select-none">
                <img src={pair.after.file_url} alt="After" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 overflow-hidden" style={{ width: `${sliderPos}%` }}>
                  <img src={pair.before.file_url} alt="Before" className="w-full h-full object-cover" style={{ minWidth: "100%" }} />
                </div>
                <input type="range" min={0} max={100} value={sliderPos} onChange={(e) => setSliderPos(Number(e.target.value))} className="absolute inset-0 w-full h-full opacity-0 cursor-col-resize z-10" />
                <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow z-[5]" style={{ left: `${sliderPos}%` }}>
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-white shadow-md flex items-center justify-center">
                    <ChevronLeft className="w-3 h-3" /><ChevronRight className="w-3 h-3" />
                  </div>
                </div>
                <Badge className="absolute top-2 left-2 bg-orange-500/90 text-white text-[9px]">Before</Badge>
                <Badge className="absolute top-2 right-2 bg-emerald-500/90 text-white text-[9px]">After</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Photo Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={ImageIcon}
          title={allPhotos.length === 0 ? "No Photos Yet" : "No Photos in This Category"}
          description={allPhotos.length === 0 ? "Upload photos to start building your home's visual record." : "Try selecting a different category filter above."}
          actionLabel={allPhotos.length === 0 ? "Upload Photos" : undefined}
          onAction={allPhotos.length === 0 ? () => fileInputRef.current?.click() : undefined}
        />
      ) : (
        <div className="columns-2 md:columns-3 gap-3 space-y-3">
          {filtered.map((photo, idx) => (
            <div
              key={photo.id}
              className="break-inside-avoid group relative rounded-lg overflow-hidden border border-border bg-card cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setLightboxIdx(idx)}
            >
              <img src={photo.thumbnail_url || photo.file_url} alt={photo.title} className="w-full object-cover" loading="lazy" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                <Badge variant="outline" className="text-[8px] font-mono text-white/90 border-white/30 bg-black/20">{photo.category}</Badge>
                {photo.room_or_area && <p className="text-[9px] font-mono text-white/80 mt-0.5">{photo.room_or_area}</p>}
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); downloadPhoto(photo.file_url, photo.title); }}
                className="absolute top-2 right-2 bg-black/40 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Download className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <Dialog open={lightboxIdx !== null} onOpenChange={(o) => !o && setLightboxIdx(null)}>
        <DialogContent className="max-w-3xl p-2 bg-black/95 border-none">
          {lightboxIdx !== null && filtered[lightboxIdx] && (
            <div className="relative">
              <img src={filtered[lightboxIdx].file_url} alt={filtered[lightboxIdx].title} className="w-full max-h-[80vh] object-contain rounded" />
              {lightboxIdx > 0 && (
                <button onClick={() => setLightboxIdx(lightboxIdx - 1)} className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/20 text-white rounded-full p-2 hover:bg-white/30">
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              {lightboxIdx < filtered.length - 1 && (
                <button onClick={() => setLightboxIdx(lightboxIdx + 1)} className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/20 text-white rounded-full p-2 hover:bg-white/30">
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
              <div className="absolute bottom-3 left-3 space-y-1">
                <p className="text-white text-sm font-sans">{filtered[lightboxIdx].title}</p>
                {filtered[lightboxIdx].description && <p className="text-white/70 text-xs font-sans">{filtered[lightboxIdx].description}</p>}
              </div>
              <button
                onClick={() => downloadPhoto(filtered[lightboxIdx].file_url, filtered[lightboxIdx].title)}
                className="absolute top-3 right-3 bg-white/20 text-white rounded-full p-2 hover:bg-white/30"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default PhotosTab;
