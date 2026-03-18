import { useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, FolderOpen, Image, FileText } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useProjectFiles, logProjectActivity } from "@/hooks/useProjectData";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";

const FOLDERS = ["Contracts", "Permits", "Plans", "Photos", "Invoices", "Warranties", "Misc"];

interface Props { projectId: string; }

const DocumentsPhotosTab = ({ projectId }: Props) => {
  const { user } = useAuth(); const qc = useQueryClient();
  const ref = useRef<HTMLInputElement>(null);
  const { data: files } = useProjectFiles(projectId);
  const photos = (files || []).filter((f) => f.category === "photos" || f.photo_tag);

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const path = `${projectId}/${Date.now()}.${file.name.split(".").pop()}`;
    const { error: ue } = await supabase.storage.from("project-photos").upload(path, file);
    if (ue) { toast.error("Upload failed"); return; }
    const { data: url } = supabase.storage.from("project-photos").getPublicUrl(path);
    const { error } = await supabase.from("project_files").insert({ project_id: projectId, file_name: file.name, file_url: url.publicUrl, file_size: `${(file.size / 1024).toFixed(0)} KB`, file_type: file.type, category: file.type.startsWith("image/") ? "photos" : "misc", uploaded_by: user?.id || null });
    if (error) { toast.error("Save failed"); return; }
    await logProjectActivity(projectId, "file_uploaded", `"${file.name}" uploaded`, user?.id);
    qc.invalidateQueries({ queryKey: ["project-files", projectId] });
    qc.invalidateQueries({ queryKey: ["project-activity-recent", projectId] });
    toast.success("File uploaded");
    if (ref.current) ref.current.value = "";
  };

  return (
    <div className="space-y-6 mt-4">
      <input type="file" ref={ref} className="hidden" onChange={upload} />
      <div className="flex items-center justify-between"><h3 className="text-sm font-sans font-semibold text-foreground">Documents & Photos</h3><Button size="sm" className="gap-1 text-xs font-sans" onClick={() => ref.current?.click()}><Upload className="w-3.5 h-3.5" />Upload File</Button></div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {FOLDERS.map((f) => { const count = (files || []).filter((x) => x.category?.toLowerCase() === f.toLowerCase()).length; return (<Card key={f} className="p-4 text-center cursor-pointer hover:bg-muted/30 transition-colors"><FolderOpen className="w-8 h-8 text-primary/60 mx-auto mb-2" /><p className="text-xs font-sans font-medium text-foreground">{f}</p><p className="text-[10px] font-sans text-muted-foreground">{count} files</p></Card>); })}
      </div>

      <Card className="p-4">
        <h3 className="text-sm font-sans font-semibold text-foreground mb-3">Recent Files</h3>
        {(files || []).length === 0 ? <p className="text-sm text-muted-foreground font-sans">No files uploaded yet.</p> : (
          <div className="space-y-2">{(files || []).slice(0, 10).map((f) => (<a key={f.id} href={f.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 py-2 px-2 rounded-md hover:bg-muted/30 no-underline"><FileText className="w-4 h-4 text-muted-foreground shrink-0" /><div className="flex-1 min-w-0"><p className="text-sm font-sans text-foreground truncate">{f.file_name}</p><p className="text-[10px] text-muted-foreground font-sans">{f.category} · {format(new Date(f.created_at), "MMM d")}{f.share_with_client && " · Shared"}</p></div>{f.share_with_client && <Badge variant="secondary" className="text-[9px] h-4">Shared</Badge>}</a>))}</div>
        )}
      </Card>

      <Card className="p-4">
        <h3 className="text-sm font-sans font-semibold text-foreground mb-3 flex items-center gap-2"><Image className="w-4 h-4 text-muted-foreground" />Photo Log</h3>
        {photos.length === 0 ? <div className="p-8 border border-dashed border-border rounded-lg text-center"><Image className="w-8 h-8 text-muted-foreground mx-auto mb-2" /><p className="text-sm text-muted-foreground font-sans">Upload photos to build your project photo log.</p></div> : (
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">{photos.map((f) => (<a key={f.id} href={f.file_url} target="_blank" rel="noopener noreferrer" className="aspect-square rounded-md bg-muted overflow-hidden"><img src={f.file_url} alt={f.file_name} className="w-full h-full object-cover" /></a>))}</div>
        )}
      </Card>
    </div>
  );
};

export default DocumentsPhotosTab;
