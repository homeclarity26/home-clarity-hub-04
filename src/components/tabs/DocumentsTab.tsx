import { useState, useEffect } from "react";
import { FileText, Image, Music, ExternalLink, FolderOpen, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface DocumentsTabProps {
  propertyId?: string;
}

const categoryIcons: Record<string, typeof FileText> = {
  "Discovery Call": Music,
  "Walkthrough": FileText,
  "Exterior Photos": Image,
  "Interior Photos": Image,
  "Serial Plates": Image,
  "hover.to": FolderOpen,
  "External Reports": FileText,
  "General": FileText,
};

interface ClientFile {
  id: string;
  file_name: string;
  category: string;
  storage_path: string;
  file_type: string | null;
  file_size: string | null;
  created_at: string;
}

const DocumentsTab = ({ propertyId }: DocumentsTabProps) => {
  const [files, setFiles] = useState<ClientFile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!propertyId) { setLoading(false); return; }
    supabase
      .from("client_files")
      .select("*")
      .eq("property_id", propertyId)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setFiles(data);
        setLoading(false);
      });
  }, [propertyId]);

  const getPublicUrl = (storagePath: string) => {
    const { data } = supabase.storage.from("report-images").getPublicUrl(storagePath);
    return data.publicUrl;
  };

  const categories = [...new Set(files.map((f) => f.category))];

  return (
    <div>
      <section className="text-center py-12 md:py-16 px-6 md:px-20 max-w-4xl mx-auto">
        <h1 className="font-display text-3xl md:text-[36px] text-foreground mb-3">Documents & Files</h1>
        <p className="font-sans text-base text-muted-foreground">
          Files shared by your HBC advisor, organized by category.
        </p>
      </section>

      <div className="max-w-[1400px] mx-auto px-6 md:px-20 pb-16 flex flex-col gap-10">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : files.length === 0 ? (
          <div className="text-center py-12">
            <FolderOpen className="w-10 h-10 text-muted-foreground/40 mx-auto mb-4" />
            <p className="font-sans text-sm text-muted-foreground">No documents have been shared yet.</p>
            <p className="font-sans text-xs text-muted-foreground mt-1">Your advisor will upload files here as they become available.</p>
          </div>
        ) : (
          categories.map((category) => {
            const catFiles = files.filter((f) => f.category === category);
            const Icon = categoryIcons[category] || FileText;
            return (
              <div key={category}>
                <div className="flex items-center gap-2 mb-4">
                  <Icon className="w-4 h-4 text-accent" />
                  <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent">{category}</p>
                  <span className="text-xs font-sans text-muted-foreground">({catFiles.length})</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {catFiles.map((file) => (
                    <a
                      key={file.id}
                      href={getPublicUrl(file.storage_path)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group bg-card rounded-lg p-5 shadow-hbc-sm hover:shadow-hbc-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col gap-2 border border-border no-underline"
                    >
                      <div className="flex items-start justify-between">
                        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                          {file.file_type === "image" ? <Image className="w-4 h-4 text-muted-foreground" /> : <FileText className="w-4 h-4 text-muted-foreground" />}
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-accent transition-colors" />
                      </div>
                      <p className="font-sans text-sm text-foreground truncate">{file.file_name}</p>
                      <p className="font-mono text-[10px] text-muted-foreground">
                        {file.file_size} · {new Date(file.created_at).toLocaleDateString()}
                      </p>
                    </a>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default DocumentsTab;
