import { useState, useEffect } from "react";
import { Camera, Upload, X, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Photo {
  id: string;
  photo_url: string;
  photo_stage: string;
  caption: string | null;
  uploaded_by: string;
  uploader_type: string;
  created_at: string;
}

interface ProjectPhotoGalleryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectTitle: string;
}

const phases = ["before", "during", "after"] as const;

const ProjectPhotoGallery = ({ open, onOpenChange, projectId, projectTitle }: ProjectPhotoGalleryProps) => {
  const { user } = useAuth();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [activePhase, setActivePhase] = useState("before");

  const loadPhotos = async () => {
    if (projectId.startsWith("mock-") || projectId.startsWith("proj-")) {
      setPhotos([]);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("project_photos")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true });
    setPhotos((data || []) as Photo[]);
    setLoading(false);
  };

  useEffect(() => { if (open) loadPhotos(); }, [open, projectId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !files.length || !user) return;
    setUploading(true);

    try {
      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop();
        const path = `${projectId}/${activePhase}/${crypto.randomUUID()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("project-photos")
          .upload(path, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("project-photos")
          .getPublicUrl(path);

        await supabase.from("project_photos").insert({
          project_id: projectId,
          photo_url: publicUrl,
          phase: activePhase,
          uploaded_by: "client",
          caption: null,
        });
      }

      toast.success("Photos uploaded!");
      loadPhotos();
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload photos");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const phasePhotos = photos.filter(p => p.phase === activePhase);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-foreground">{projectTitle} — Photos</DialogTitle>
        </DialogHeader>

        <Tabs value={activePhase} onValueChange={setActivePhase}>
          <TabsList className="w-full">
            {phases.map(phase => (
              <TabsTrigger key={phase} value={phase} className="flex-1 capitalize">
                {phase} ({photos.filter(p => p.phase === phase).length})
              </TabsTrigger>
            ))}
          </TabsList>

          {phases.map(phase => (
            <TabsContent key={phase} value={phase} className="mt-4">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  {/* Upload button */}
                  <div className="mb-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Button variant="outline" size="sm" disabled={uploading} asChild>
                        <span>
                          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Upload className="w-3.5 h-3.5 mr-1.5" />}
                          Upload {phase} photos
                        </span>
                      </Button>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Photo grid */}
                  {phasePhotos.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {phasePhotos.map(photo => (
                        <div key={photo.id} className="relative group rounded-lg overflow-hidden border border-border">
                          <img
                            src={photo.photo_url}
                            alt={photo.caption || `${phase} photo`}
                            className="w-full h-32 object-cover"
                            loading="lazy"
                          />
                          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1.5">
                            <span className="font-mono text-[9px] uppercase tracking-wider text-white/80">
                              {photo.uploaded_by === "client" ? "You" : "Advisor"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 border border-dashed border-border rounded-lg">
                      <Camera className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="font-sans text-sm text-muted-foreground">No {phase} photos yet</p>
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectPhotoGallery;
