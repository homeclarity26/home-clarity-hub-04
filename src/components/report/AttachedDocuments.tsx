import { useEffect, useState } from "react";
import { FileText, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AttachedFile {
  id: string;
  file_name: string;
  category: string;
  storage_path: string;
  file_size: string | null;
}

interface AttachedDocumentsProps {
  propertyId: string;
  pageKey: string;
}

export function AttachedDocuments({ propertyId, pageKey }: AttachedDocumentsProps) {
  const [files, setFiles] = useState<AttachedFile[]>([]);

  useEffect(() => {
    if (!propertyId || propertyId.startsWith("mock-")) return;
    supabase
      .from("client_files")
      .select("id, file_name, category, storage_path, file_size")
      .eq("property_id", propertyId)
      .ilike("category", `%${pageKey.replace(/-/g, "%")}%`)
      .limit(10)
      .then(({ data }) => {
        if (data && data.length > 0) setFiles(data);
      });
  }, [propertyId, pageKey]);

  if (files.length === 0) return null;

  const openFile = async (path: string) => {
    const { data } = await supabase.storage.from("report-images").createSignedUrl(path, 3600);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="mt-8 pt-6 border-t border-border">
      <h4 className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-3">
        Attached Documents
      </h4>
      <ul className="space-y-2">
        {files.map((f) => (
          <li
            key={f.id}
            onClick={() => f.storage_path && void openFile(f.storage_path)}
            className="flex items-center gap-3 rounded-md border border-border bg-background px-3 py-2 cursor-pointer hover:bg-muted/30 transition-colors"
          >
            <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-sans text-foreground truncate">{f.file_name}</p>
              <p className="text-[10px] font-mono text-muted-foreground">
                {f.category}{f.file_size ? ` · ${f.file_size}` : ""}
              </p>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
          </li>
        ))}
      </ul>
    </div>
  );
}
