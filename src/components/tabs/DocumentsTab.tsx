import { useState, useEffect, useMemo, useCallback } from "react";
import EmptyState from "@/components/EmptyState";
import { FileText, Image, Music, ExternalLink, FolderOpen, Loader2, Search, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import DocumentExpirationTracker from "@/components/portal/DocumentExpirationTracker";
import InsuranceAssistant from "@/components/InsuranceAssistant";

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
  "Invoices": FileText,
  "Warranties": FileText,
  "Permits": FileText,
  "Insurance": FileText,
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

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

const DocumentsTab = ({ propertyId }: DocumentsTabProps) => {
  const [files, setFiles] = useState<ClientFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!propertyId) { setLoading(false); return; }

    if (propertyId.startsWith("mock-")) {
      setFiles([
        { id: "doc-1", file_name: "Discovery Call Notes — Johnson.pdf", category: "Discovery Call", storage_path: "", file_type: "pdf", file_size: "245 KB", created_at: "2026-01-05T00:00:00Z" },
        { id: "doc-2", file_name: "Discovery Call Recording.mp3", category: "Discovery Call", storage_path: "", file_type: "audio", file_size: "18.2 MB", created_at: "2026-01-05T00:00:00Z" },
        { id: "doc-3", file_name: "Exterior — Front Elevation.jpg", category: "Exterior Photos", storage_path: "", file_type: "image", file_size: "3.1 MB", created_at: "2026-01-12T00:00:00Z" },
        { id: "doc-4", file_name: "Home Clarity Report — Johnson Residence.pdf", category: "General", storage_path: "", file_type: "pdf", file_size: "4.8 MB", created_at: "2026-02-15T00:00:00Z" },
      ]);
      setLoading(false);
      return;
    }

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

  const openSignedUrl = async (storagePath: string) => {
    const { data } = await supabase.storage.from("report-images").createSignedUrl(storagePath, 3600);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  const handleUploadFiles = useCallback(async (fileList: FileList) => {
    if (!propertyId || propertyId.startsWith("mock-")) {
      toast.error("Upload not available in demo mode.");
      return;
    }

    setUploading(true);
    const uploaded: ClientFile[] = [];

    for (const file of Array.from(fileList)) {
      try {
        // AI categorization
        let category = "General";
        try {
          const { data: catData } = await supabase.functions.invoke("categorize-document", {
            body: { fileName: file.name, fileType: file.type },
          });
          if (catData?.category) category = catData.category;
        } catch {
          // fallback to General
        }

        // Upload to storage
        const path = `${propertyId}/documents/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage.from("report-images").upload(path, file);
        if (uploadError) throw uploadError;

        // Save to client_files
        const fileType = file.type.startsWith("image/") ? "image" : file.type.startsWith("audio/") ? "audio" : "pdf";
        const { data: inserted, error: dbError } = await supabase.from("client_files").insert({
          property_id: propertyId,
          file_name: file.name,
          category,
          storage_path: path,
          file_type: fileType,
          file_size: formatFileSize(file.size),
        }).select().single();

        if (dbError) throw dbError;
        if (inserted) uploaded.push(inserted);
      } catch (err) {
        console.error(`Failed to upload ${file.name}:`, err);
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    if (uploaded.length > 0) {
      setFiles((prev) => [...uploaded, ...prev]);
      toast.success(`${uploaded.length} file${uploaded.length > 1 ? "s" : ""} uploaded & categorized`);
    }
    setUploading(false);
  }, [propertyId]);

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) handleUploadFiles(e.dataTransfer.files);
  };

  const allCategories = useMemo(() => [...new Set(files.map((f) => f.category))], [files]);

  const filteredFiles = useMemo(() => {
    let result = files;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((f) => f.file_name.toLowerCase().includes(q));
    }
    if (categoryFilter !== "all") {
      result = result.filter((f) => f.category === categoryFilter);
    }
    return result;
  }, [files, searchQuery, categoryFilter]);

  const categories = [...new Set(filteredFiles.map((f) => f.category))];

  return (
    <div>
      <section className="text-center py-12 md:py-16 px-6 md:px-20 max-w-4xl mx-auto">
        <h1 className="font-display text-3xl md:text-[36px] text-foreground mb-3">Documents & Files</h1>
        <p className="font-sans text-base text-muted-foreground">
          Files shared by your HBC advisor, organized by category.
        </p>
      </section>

      <div className="max-w-[1400px] mx-auto px-6 md:px-20 pb-16 flex flex-col gap-10">
        {/* Drag & Drop Upload Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging ? "border-accent bg-accent/5" : "border-border hover:border-accent/40"
          }`}
        >
          {uploading ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-accent" />
              <span className="text-sm font-sans text-muted-foreground">Uploading & categorizing...</span>
            </div>
          ) : (
            <>
              <Upload className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm font-sans text-muted-foreground mb-2">
                Drag & drop files here, or
              </p>
              <label>
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => e.target.files && handleUploadFiles(e.target.files)}
                />
                <Button variant="outline" size="sm" className="font-sans text-xs" asChild>
                  <span>Browse Files</span>
                </Button>
              </label>
              <p className="text-[10px] font-sans text-muted-foreground mt-2">
                Files are automatically categorized by AI
              </p>
            </>
          )}
        </div>

        {/* Search & Filter */}
        {files.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 font-sans text-sm"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[200px] font-sans text-sm">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {allCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : filteredFiles.length === 0 && files.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title="No Documents Yet"
            description="Upload files above or your advisor will share documents here as they become available."
          />
        ) : (
          categories.map((category) => {
            const catFiles = filteredFiles.filter((f) => f.category === category);
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
                    <div
                      key={file.id}
                      onClick={() => file.storage_path && openSignedUrl(file.storage_path)}
                      className="group bg-card rounded-lg p-5 shadow-hbc-sm hover:shadow-hbc-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col gap-2 border border-border cursor-pointer"
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
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
        {/* Document Expiration Tracker — relocated from Home */}
        {propertyId && <DocumentExpirationTracker propertyId={propertyId} />}

        {/* Insurance Assistant — relocated from Home */}
        {propertyId && !propertyId?.startsWith("mock-") && (
          <InsuranceAssistant propertyId={propertyId} />
        )}
      </div>
    </div>
  );
};

export default DocumentsTab;
