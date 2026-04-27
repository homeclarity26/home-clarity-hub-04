import { useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, X, FileText, Image as ImageIcon, FileAudio, FileVideo, File } from "lucide-react";
import type { IntakeFileRef } from "@/contexts/WizardContext";

// One intake card. Accepts multiple files of multiple mime types. The
// upload itself is local-only in this PR (we capture the File metadata into
// state); a follow-up will wire each card to its destination Storage bucket.
// The "auto-sort regardless of which bucket they dropped it in" behavior
// per [v2.1] is best implemented at the bucket-write layer, not here.

interface IntakeUploadCardProps {
  title: string;
  description: string;
  accept?: string;
  files: IntakeFileRef[];
  onChange: (next: IntakeFileRef[]) => void;
}

const fileIcon = (mime: string) => {
  if (mime.startsWith("image/")) return ImageIcon;
  if (mime.startsWith("audio/")) return FileAudio;
  if (mime.startsWith("video/")) return FileVideo;
  if (mime === "application/pdf") return FileText;
  return File;
};

const fmtSize = (n: number): string => {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
};

export function IntakeUploadCard({
  title,
  description,
  accept,
  files,
  onChange,
}: IntakeUploadCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAdd = (newFiles: FileList | null) => {
    if (!newFiles || newFiles.length === 0) return;
    const refs: IntakeFileRef[] = Array.from(newFiles).map((f) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: f.name,
      size: f.size,
      mime: f.type || "application/octet-stream",
    }));
    onChange([...files, ...refs]);
  };

  const handleRemove = (id: string) => {
    onChange(files.filter((f) => f.id !== id));
  };

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-sans font-semibold text-foreground">
            {title}
          </h4>
          <p className="text-xs font-sans text-muted-foreground mt-0.5">
            {description}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          className="min-h-[44px] shrink-0"
        >
          <Upload className="w-4 h-4 mr-1.5" aria-hidden />
          Add files
        </Button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={accept}
          className="hidden"
          onChange={(e) => {
            handleAdd(e.target.files);
            // Reset so re-adding the same filename works.
            if (inputRef.current) inputRef.current.value = "";
          }}
        />
      </div>

      {files.length === 0 ? (
        <div
          className="rounded-md border border-dashed border-border bg-muted/30 px-4 py-6 text-xs font-sans text-muted-foreground text-center"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleAdd(e.dataTransfer?.files ?? null);
          }}
        >
          Drop files here, or click Add files
        </div>
      ) : (
        <ul className="space-y-1.5">
          {files.map((f) => {
            const Icon = fileIcon(f.mime);
            return (
              <li
                key={f.id}
                className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2"
              >
                <Icon className="w-4 h-4 shrink-0 text-muted-foreground" aria-hidden />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-sans font-medium text-foreground truncate">
                    {f.name}
                  </div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                    {fmtSize(f.size)}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemove(f.id)}
                  className="min-h-[36px] min-w-[36px]"
                  aria-label={`Remove ${f.name}`}
                >
                  <X className="w-4 h-4" aria-hidden />
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
