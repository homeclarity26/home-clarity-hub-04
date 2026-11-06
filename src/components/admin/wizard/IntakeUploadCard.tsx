import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  X,
  Check,
  Link as LinkIcon,
  Loader2,
  AlertCircle,
  Plus,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useWizard, type IntakeFileRef } from "@/contexts/WizardContext";
import { toast } from "@/hooks/use-toast";

// Per-card intake control, prototype screens 1-2: white card with title +
// muted subtitle and a full-width "+ Add" outline button; once a file is
// in, the card border flips gold, a green "UPLOADED" mono pill appears,
// and each file renders as a cream chip with a gold left edge.
//
// Files are uploaded to the private `wizard-uploads` bucket immediately on
// add — never held only in React state — so a crash, refresh, or 500 from
// the analyzer doesn't lose the recording the consultant just spent 90
// minutes capturing.
//
// Path layout: {creator_id}/{draft_id}/{card_key}/{file_id}-{filename}.
// The first segment matches storage RLS so creators only ever touch
// their own files.

const BUCKET = "wizard-uploads";
const MAX_FILE_BYTES = 50 * 1024 * 1024;

interface IntakeUploadCardProps {
  title: string;
  description: string;
  cardKey: string;
  accept?: string;
  files: IntakeFileRef[];
  onChange: (next: IntakeFileRef[]) => void;
  /**
   * When provided, renders a URL paste input above the file list. Used for
   * Hover and iGuide cards where the consultant typically pastes the
   * sharing URL from the third-party scan tool. Saved verbatim to wizard
   * state and shipped to properties.{hover_url,iguide_url} at publish.
   */
  url?: {
    value: string;
    onChange: (next: string) => void;
    label: string;
    placeholder?: string;
  };
}

const fmtSize = (n: number): string => {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
};

const sanitizeName = (name: string): string =>
  name.replace(/[^a-zA-Z0-9._-]+/g, "_");

const makeFileId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

export function IntakeUploadCard({
  title,
  description,
  cardKey,
  accept,
  files,
  onChange,
  url,
}: IntakeUploadCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { state } = useWizard();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async (newFiles: FileList | null) => {
    if (!newFiles || newFiles.length === 0) return;
    if (!user?.id) {
      toast({
        title: "Not signed in",
        description: "Sign in again to upload intake materials.",
        variant: "destructive",
      });
      return;
    }
    // We may not have a draft id yet on the very first interaction. Fall
    // back to "pending"; the autosave will move files once a draft exists.
    const draftId = state.draftId ?? "pending";

    setBusy(true);
    setError(null);
    const oversize: string[] = [];
    const uploaded: IntakeFileRef[] = [];
    try {
      for (const f of Array.from(newFiles)) {
        if (f.size > MAX_FILE_BYTES) {
          oversize.push(f.name);
          continue;
        }
        const id = makeFileId();
        const safeName = sanitizeName(f.name);
        const path = `${user.id}/${draftId}/${cardKey}/${id}-${safeName}`;
        const { error: upErr } = await supabase.storage
          .from(BUCKET)
          .upload(path, f, {
            contentType: f.type || "application/octet-stream",
            cacheControl: "3600",
            upsert: false,
          });
        if (upErr) throw upErr;
        uploaded.push({
          id,
          name: f.name,
          size: f.size,
          mime: f.type || "application/octet-stream",
          storage_path: path,
          bucket: BUCKET,
        });
      }
      if (uploaded.length > 0) {
        onChange([...files, ...uploaded]);
      }
      if (oversize.length > 0) {
        const list = oversize.join(", ");
        const msg = `Skipped (over 50 MB): ${list}`;
        setError(msg);
        toast({ title: "Some files skipped", description: msg, variant: "destructive" });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setError(message);
      toast({ title: "Upload failed", description: message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async (file: IntakeFileRef) => {
    if (file.storage_path && file.bucket) {
      try {
        await supabase.storage.from(file.bucket).remove([file.storage_path]);
      } catch (err) {
        console.warn("IntakeUploadCard remove failed", err);
      }
    }
    onChange(files.filter((f) => f.id !== file.id));
  };

  const hasFiles = files.length > 0;

  return (
    <div
      className={`rounded-lg border bg-white p-5 space-y-3 ${
        hasFiles
          ? "border-hbc-gold"
          : "border-hbc-border"
      }`}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        void handleAdd(e.dataTransfer?.files ?? null);
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-sans font-semibold text-hbc-navy">
            {title}
          </h4>
          <p className="text-xs font-sans text-hbc-grey mt-0.5">
            {description}
          </p>
        </div>
        {hasFiles && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-sm bg-emerald-50 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-emerald-700">
            <Check className="h-3 w-3" aria-hidden />
            Uploaded
          </span>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={accept}
        className="hidden"
        onChange={(e) => {
          void handleAdd(e.target.files);
          // Reset so re-adding the same filename works.
          if (inputRef.current) inputRef.current.value = "";
        }}
      />

      {url && (
        <div className="space-y-1.5">
          <Label className="text-xs font-sans flex items-center gap-1.5 text-hbc-grey">
            <LinkIcon className="w-3.5 h-3.5" aria-hidden />
            {url.label}
          </Label>
          <Input
            type="url"
            value={url.value}
            onChange={(e) => url.onChange(e.target.value)}
            placeholder={url.placeholder ?? "https://"}
            className="text-xs bg-white"
          />
          {url.value && (
            <a
              href={url.value}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-mono text-hbc-gold-readable hover:underline break-all"
            >
              Open link →
            </a>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs font-sans text-destructive">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden />
          <span>{error}</span>
        </div>
      )}

      {hasFiles && (
        <ul className="space-y-1.5">
          {files.map((f) => (
            <li
              key={f.id}
              className="flex items-center gap-2 rounded-sm border-l-2 border-hbc-gold bg-hbc-surface px-3 py-2"
            >
              <div className="flex-1 min-w-0">
                <div className="text-xs font-sans font-semibold text-hbc-navy truncate">
                  {f.name}
                </div>
                <div className="text-[10px] font-sans text-hbc-grey mt-0.5">
                  {fmtSize(f.size)}
                  {f.storage_path ? " · saved" : " · pending"}
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => void handleRemove(f)}
                className="min-h-[36px] min-w-[36px] text-hbc-grey"
                aria-label={`Remove ${f.name}`}
              >
                <X className="w-4 h-4" aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="min-h-[44px] w-full border-hbc-border text-hbc-navy"
      >
        {busy ? (
          <Loader2 className="w-4 h-4 mr-1.5 animate-spin" aria-hidden />
        ) : (
          <Plus className="w-4 h-4 mr-1.5" aria-hidden />
        )}
        {busy ? "Uploading..." : hasFiles ? "Add more" : "Add"}
      </Button>
    </div>
  );
}
