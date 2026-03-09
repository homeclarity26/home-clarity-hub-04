import { useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Image, Music, Archive, ExternalLink, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const categoryIcons: Record<string, typeof FileText> = {
  "Discovery Call": Music,
  "Walkthrough": FileText,
  "Exterior Photos": Image,
  "Interior Photos": Image,
  "Serial Plates": Image,
  "hover.to": Archive,
  "External Reports": FileText,
  "General": FileText,
};

const FILE_CATEGORIES = ["Discovery Call", "Walkthrough", "Exterior Photos", "Interior Photos", "Serial Plates", "hover.to", "External Reports", "General"];

interface FileManagerProps {
  propertyId: string;
}

const FileManager = ({ propertyId }: FileManagerProps) => {
  const queryClient = useQueryClient();
  const [uploadingCategory, setUploadingCategory] = useState<string | null>(null);

  const { data: files, isLoading } = useQuery({
    queryKey: ["client-files", propertyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_files")
        .select("*")
        .eq("property_id", propertyId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const uploadFile = async (file: File, category: string) => {
    setUploadingCategory(category);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const storagePath = `files/${propertyId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("report-images")
        .upload(storagePath, file);

      if (uploadError) { toast.error(`Upload failed: ${uploadError.message}`); return; }

      const fileType = file.type.startsWith("image/") ? "image" : file.type.startsWith("audio/") ? "audio" : "document";
      const fileSize = file.size < 1024 * 1024 ? `${(file.size / 1024).toFixed(0)} KB` : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

      const { error: dbError } = await supabase.from("client_files").insert({
        property_id: propertyId,
        file_name: file.name,
        category,
        storage_path: storagePath,
        file_type: fileType,
        file_size: fileSize,
      });

      if (dbError) { toast.error("Failed to save file metadata"); return; }
      toast.success(`${file.name} uploaded`);
      queryClient.invalidateQueries({ queryKey: ["client-files", propertyId] });
    } finally {
      setUploadingCategory(null);
    }
  };

  const deleteFile = async (fileId: string, storagePath: string) => {
    await supabase.storage.from("report-images").remove([storagePath]);
    const { error } = await supabase.from("client_files").delete().eq("id", fileId);
    if (error) { toast.error("Failed to delete"); return; }
    toast.success("File deleted");
    queryClient.invalidateQueries({ queryKey: ["client-files", propertyId] });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, category: string) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file, category);
    e.target.value = "";
  };

  const getPublicUrl = (storagePath: string) => {
    const { data } = supabase.storage.from("report-images").getPublicUrl(storagePath);
    return data.publicUrl;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const categoriesWithFiles = FILE_CATEGORIES.filter(
    (cat) => files?.some((f) => f.category === cat)
  );
  const emptyCategories = FILE_CATEGORIES.filter(
    (cat) => !files?.some((f) => f.category === cat)
  );

  return (
    <div className="space-y-6">
      {categoriesWithFiles.map((category) => {
        const catFiles = files?.filter((f) => f.category === category) || [];
        const Icon = categoryIcons[category] || FileText;

        return (
          <Card key={category} className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-muted-foreground" />
                <h4 className="text-sm font-sans font-semibold text-foreground">{category}</h4>
                <span className="text-xs font-sans text-muted-foreground">({catFiles.length})</span>
              </div>
              <div className="relative">
                <input type="file" onChange={(e) => handleFileSelect(e, category)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                <Button variant="outline" size="sm" className="gap-1.5 text-xs font-sans pointer-events-none">
                  {uploadingCategory === category ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  Upload
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              {catFiles.map((file) => (
                <div key={file.id} className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded bg-muted flex items-center justify-center shrink-0">
                      {file.file_type === "image" ? <Image className="w-4 h-4 text-muted-foreground" /> : <FileText className="w-4 h-4 text-muted-foreground" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-sans text-foreground truncate">{file.file_name}</p>
                      <p className="text-[11px] font-sans text-muted-foreground">{file.file_size} · {new Date(file.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="sm" asChild>
                      <a href={getPublicUrl(file.storage_path)} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteFile(file.id, file.storage_path)}>
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        );
      })}

      {/* Quick upload for empty categories */}
      {emptyCategories.length > 0 && (
        <Card className="p-5 border-dashed">
          <h4 className="text-sm font-sans font-semibold text-foreground mb-3">Upload to Category</h4>
          <div className="flex flex-wrap gap-2">
            {emptyCategories.map((cat) => (
              <div key={cat} className="relative">
                <input type="file" onChange={(e) => handleFileSelect(e, cat)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                <Button variant="outline" size="sm" className="text-xs font-sans pointer-events-none">
                  {categoryIcons[cat] ? <span className="mr-1.5">{cat}</span> : cat}
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* iGuide link */}
      <Card className="p-5 border-dashed">
        <div className="flex items-center gap-2 mb-3">
          <ExternalLink className="w-4 h-4 text-muted-foreground" />
          <h4 className="text-sm font-sans font-semibold text-foreground">iGuide Link</h4>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="https://youriguide.com/..."
            className="flex-1 h-9 px-3 rounded-md border border-border text-sm font-sans bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <Button size="sm" className="text-xs font-sans">Save</Button>
        </div>
      </Card>
    </div>
  );
};

export default FileManager;
