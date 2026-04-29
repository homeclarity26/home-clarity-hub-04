import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, Plus, X, Loader2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { ACCEPT_IMAGES } from "@/lib/upload-accept";

interface ProjectPhoto {
  id: string;
  photo_url: string;
  caption: string | null;
  taken_date: string;
  photo_stage: string;
  uploader_type: string;
  created_at: string;
}

interface ProjectPhotoTimelineProps {
  projectId: string;
  projectTitle: string;
  isAdmin?: boolean;
}

const ProjectPhotoTimeline = ({ projectId, projectTitle, isAdmin = false }: ProjectPhotoTimelineProps) => {
  const { user } = useAuth();
  const [photos, setPhotos] = useState<ProjectPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [form, setForm] = useState({ taken_date: new Date().toISOString().split("T")[0], caption: "", photo_stage: "progress" });

  const loadPhotos = async () => {
    const { data } = await supabase.from("project_photos")
      .select("*")
      .eq("project_id", projectId)
      .order("taken_date", { ascending: true });
    const rows = (data as ProjectPhoto[]) || [];

    // photo_url is stored as a storage path. Sign on read so URLs don't expire
    // at rest. Legacy rows may contain a full http(s) URL — leave those alone.
    const paths = rows.map((r) => r.photo_url).filter((u) => u && !u.startsWith("http"));
    const signedMap: Record<string, string> = {};
    if (paths.length > 0) {
      const { data: signed } = await supabase.storage
        .from("project-photos")
        .createSignedUrls(paths, 3600);
      signed?.forEach((s: { path: string | null; signedUrl: string }) => {
        if (s.path && s.signedUrl) signedMap[s.path] = s.signedUrl;
      });
    }

    setPhotos(rows.map((r) => ({ ...r, photo_url: signedMap[r.photo_url] || r.photo_url })));
    setLoading(false);
  };

  useEffect(() => { loadPhotos(); }, [projectId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !user) return;
    setUploading(true);

    for (const file of Array.from(files)) {
      const path = `${projectId}/${form.taken_date}/${Date.now()}-${file.name}`;
      const { error: uploadErr } = await supabase.storage.from("project-photos").upload(path, file);
      if (uploadErr) { toast.error(`Failed to upload ${file.name}`); continue; }

      // Store the storage path — loadPhotos signs on read so URLs never go stale at rest.
      await supabase.from("project_photos").insert({
        project_id: projectId,
        uploaded_by: user.id,
        uploader_type: isAdmin ? "admin" : "client",
        photo_url: path,
        caption: form.caption || null,
        taken_date: form.taken_date,
        photo_stage: form.photo_stage,
      });
    }
    toast.success("Photos uploaded");
    setUploading(false);
    setDialogOpen(false);
    loadPhotos();
  };

  // Group photos by date
  const grouped = photos.reduce<Record<string, ProjectPhoto[]>>((acc, p) => {
    const d = p.taken_date;
    if (!acc[d]) acc[d] = [];
    acc[d].push(p);
    return acc;
  }, {});

  const beforePhotos = photos.filter((p) => p.photo_stage === "before");
  const afterPhotos = photos.filter((p) => p.photo_stage === "after");
  const hasBeforeAfter = beforePhotos.length > 0 && afterPhotos.length > 0;

  if (loading) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Photo Timeline</p>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="gap-1.5 text-xs font-sans">
              <Plus className="w-3.5 h-3.5" />Add Photos
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-sans">Add Project Photos</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label className="font-sans">Date</Label><Input type="date" value={form.taken_date} onChange={(e) => setForm({ ...form, taken_date: e.target.value })} /></div>
              <div><Label className="font-sans">Caption (optional)</Label><Input value={form.caption} onChange={(e) => setForm({ ...form, caption: e.target.value })} /></div>
              <div><Label className="font-sans">Stage</Label>
                <Select value={form.photo_stage} onValueChange={(v) => setForm({ ...form, photo_stage: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="before">Before</SelectItem>
                    <SelectItem value="progress">Progress</SelectItem>
                    <SelectItem value="after">After</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="font-sans">Select Photos</Label>
                <Input type="file" accept={ACCEPT_IMAGES} multiple onChange={handleUpload} disabled={uploading} />
                {uploading && <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground"><Loader2 className="w-3.5 h-3.5 animate-spin" />Uploading...</div>}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Before/After Comparison */}
      {hasBeforeAfter && (
        <Card className="p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-3">Before & After</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] font-mono text-muted-foreground mb-1.5 uppercase">Before</p>
              <div className="grid grid-cols-2 gap-1.5">
                {beforePhotos.slice(0, 4).map((p) => (
                  <img key={p.id} src={p.photo_url} alt={p.caption || "Before"} className="rounded-md w-full aspect-square object-cover cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setLightboxUrl(p.photo_url)} />
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-mono text-muted-foreground mb-1.5 uppercase">After</p>
              <div className="grid grid-cols-2 gap-1.5">
                {afterPhotos.slice(0, 4).map((p) => (
                  <img key={p.id} src={p.photo_url} alt={p.caption || "After"} className="rounded-md w-full aspect-square object-cover cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setLightboxUrl(p.photo_url)} />
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Timeline */}
      {Object.keys(grouped).length > 0 ? (
        <div className="relative pl-6 border-l-2 border-border space-y-6">
          {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([date, datePhotos]) => (
            <div key={date} className="relative">
              <div className="absolute -left-[calc(1.5rem+5px)] top-0 w-2.5 h-2.5 rounded-full bg-accent border-2 border-background" />
              <p className="font-sans text-xs font-medium text-foreground mb-2">
                {format(new Date(date + "T00:00:00"), "MMMM d, yyyy")}
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {datePhotos.map((photo) => (
                  <div key={photo.id} className="relative group">
                    <img src={photo.photo_url} alt={photo.caption || ""} className="rounded-md w-full aspect-square object-cover cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setLightboxUrl(photo.photo_url)} />
                    {photo.photo_stage !== "progress" && (
                      <span className="absolute top-1 left-1 text-[8px] font-mono uppercase tracking-wider bg-background/80 text-foreground px-1.5 py-0.5 rounded">
                        {photo.photo_stage}
                      </span>
                    )}
                    <span className="absolute bottom-1 right-1 text-[8px] font-mono uppercase tracking-wider bg-background/80 text-muted-foreground px-1.5 py-0.5 rounded">
                      {photo.uploader_type === "admin" ? "HBC" : "Client"}
                    </span>
                  </div>
                ))}
              </div>
              {datePhotos[0]?.caption && <p className="font-sans text-xs text-muted-foreground mt-1.5">{datePhotos[0].caption}</p>}
            </div>
          ))}
        </div>
      ) : (
        <Card className="p-6 text-center">
          <Camera className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
          <p className="font-sans text-sm text-muted-foreground">No photos yet. Add the first one to start the timeline.</p>
        </Card>
      )}

      {/* Lightbox */}
      {lightboxUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setLightboxUrl(null)}>
          <button onClick={() => setLightboxUrl(null)} className="absolute top-4 right-4 text-white bg-transparent border-none cursor-pointer"><X className="w-6 h-6" /></button>
          <img src={lightboxUrl} alt="" className="max-w-full max-h-[90vh] rounded-lg object-contain" />
        </div>
      )}
    </div>
  );
};

export default ProjectPhotoTimeline;
