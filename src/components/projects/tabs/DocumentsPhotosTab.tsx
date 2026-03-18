import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, FolderOpen, Image, FileText } from "lucide-react";
import { format } from "date-fns";

const FOLDERS = ["Contracts", "Permits", "Plans", "Photos", "Invoices", "Warranties", "Misc"];

interface Props {
  projectId: string;
}

const DocumentsPhotosTab = ({ projectId }: Props) => {
  const { data: files } = useQuery({
    queryKey: ["project-files", projectId],
    queryFn: async () => {
      const { data } = await supabase
        .from("project_files")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const photoFiles = (files || []).filter((f: any) => f.category === "photos" || f.photo_tag);

  return (
    <div className="space-y-6 mt-4">
      {/* Upload */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-sans font-semibold text-foreground">Documents & Photos</h3>
        <Button size="sm" className="gap-1 text-xs font-sans">
          <Upload className="w-3.5 h-3.5" />Upload File
        </Button>
      </div>

      {/* Folder Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {FOLDERS.map((folder) => {
          const count = (files || []).filter((f: any) => f.category?.toLowerCase() === folder.toLowerCase()).length;
          return (
            <Card key={folder} className="p-4 text-center cursor-pointer hover:bg-muted/30 transition-colors">
              <FolderOpen className="w-8 h-8 text-primary/60 mx-auto mb-2" />
              <p className="text-xs font-sans font-medium text-foreground">{folder}</p>
              <p className="text-[10px] font-sans text-muted-foreground">{count} files</p>
            </Card>
          );
        })}
      </div>

      {/* Recent Files */}
      <Card className="p-4">
        <h3 className="text-sm font-sans font-semibold text-foreground mb-3">Recent Files</h3>
        {(files || []).length === 0 ? (
          <p className="text-sm text-muted-foreground font-sans">No files uploaded yet.</p>
        ) : (
          <div className="space-y-2">
            {(files || []).slice(0, 10).map((f: any) => (
              <div key={f.id} className="flex items-center gap-3 py-2 px-2 rounded-md hover:bg-muted/30">
                <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-sans text-foreground truncate">{f.file_name}</p>
                  <p className="text-[10px] text-muted-foreground font-sans">
                    {f.category} · {format(new Date(f.created_at), "MMM d")}
                    {f.share_with_client && " · Shared with client"}
                  </p>
                </div>
                {f.share_with_client && <Badge variant="secondary" className="text-[9px] h-4">Shared</Badge>}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Photo Gallery */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-sans font-semibold text-foreground flex items-center gap-2">
            <Image className="w-4 h-4 text-muted-foreground" />Photo Log
          </h3>
          <Button size="sm" variant="outline" className="gap-1 text-xs font-sans">
            <Image className="w-3.5 h-3.5" />Generate Photo Report
          </Button>
        </div>
        {photoFiles.length === 0 ? (
          <div className="p-8 border border-dashed border-border rounded-lg text-center">
            <Image className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground font-sans">Upload photos to build your project photo log.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {photoFiles.map((f: any) => (
              <div key={f.id} className="aspect-square rounded-md bg-muted flex items-center justify-center overflow-hidden">
                <img src={f.file_url} alt={f.file_name} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default DocumentsPhotosTab;
