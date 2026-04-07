import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Upload, FileText, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DigitalAssetsData {
  hoverUrl: string;
  hoverPdfUrl: string;
  iguideUrl: string;
  iguidePdfUrl: string;
}

interface DigitalAssetsStepProps {
  data: DigitalAssetsData;
  onChange: (data: DigitalAssetsData) => void;
  propertyId?: string;
}

function getAssetStatus(url: string, pdfUrl: string): "not_started" | "partial" | "complete" {
  if (url && pdfUrl) return "complete";
  if (url || pdfUrl) return "partial";
  return "not_started";
}

function StatusBadge({ status }: { status: "not_started" | "partial" | "complete" }) {
  const config = {
    not_started: { label: "Not Started", className: "bg-gray-100 text-gray-600 hover:bg-gray-100" },
    partial: { label: "Partial", className: "bg-amber-100 text-amber-800 hover:bg-amber-100" },
    complete: { label: "Ready", className: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100" },
  };
  const { label, className } = config[status];
  return <Badge className={`text-[10px] font-mono ${className}`}>{label}</Badge>;
}

function PdfUploadField({
  label,
  value,
  bucketPath,
  onUpload,
  onRemove,
}: {
  label: string;
  value: string;
  bucketPath: string;
  onUpload: (url: string) => void;
  onRemove: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Only PDF files are accepted.");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error("File must be under 20 MB.");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${bucketPath}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("report-images").upload(path, file);
      if (error) throw error;

      const { data: urlData } = await supabase.storage.from("report-images").createSignedUrl(path, 3600);
      onUpload(urlData?.signedUrl || path);
      toast.success("PDF uploaded.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      toast.error(msg);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="space-y-1.5">
      <Label className="font-mono text-[10px] uppercase tracking-[0.15em]">{label}</Label>
      {value ? (
        <div className="flex items-center gap-2 p-2 rounded-md border bg-muted/30">
          <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
          <span className="text-xs truncate flex-1">PDF uploaded</span>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0"
            onClick={onRemove}
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      ) : (
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
            className="font-mono text-[11px] w-full"
          >
            <Upload className="w-3.5 h-3.5 mr-1.5" />
            {uploading ? "Uploading..." : "Upload PDF"}
          </Button>
        </div>
      )}
    </div>
  );
}

export default function DigitalAssetsStep({ data, onChange }: DigitalAssetsStepProps) {
  const hoverStatus = getAssetStatus(data.hoverUrl, data.hoverPdfUrl);
  const iguideStatus = getAssetStatus(data.iguideUrl, data.iguidePdfUrl);

  function update(patch: Partial<DigitalAssetsData>) {
    onChange({ ...data, ...patch });
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground mb-1">
          Digital Asset Links
        </h3>
        <p className="text-xs text-muted-foreground">
          Connect Hover.to measurements and iGuide virtual tours. You can skip this step and add them later.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Hover.to Card */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="font-mono text-[11px] uppercase tracking-[0.15em]">
                Hover.to
              </CardTitle>
              <StatusBadge status={hoverStatus} />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="font-mono text-[10px] uppercase tracking-[0.15em]">
                Project URL
              </Label>
              <Input
                placeholder="https://hover.to/project/..."
                value={data.hoverUrl}
                onChange={(e) => update({ hoverUrl: e.target.value })}
                className="font-mono text-xs"
              />
            </div>

            <PdfUploadField
              label="Measurement PDF"
              value={data.hoverPdfUrl}
              bucketPath="digital-assets/hover"
              onUpload={(url) => update({ hoverPdfUrl: url })}
              onRemove={() => update({ hoverPdfUrl: "" })}
            />

            {data.hoverUrl && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="font-mono text-[11px] w-full"
                asChild
              >
                <a href={data.hoverUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                  View in Hover.to
                </a>
              </Button>
            )}
          </CardContent>
        </Card>

        {/* iGuide Card */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="font-mono text-[11px] uppercase tracking-[0.15em]">
                iGuide
              </CardTitle>
              <StatusBadge status={iguideStatus} />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="font-mono text-[10px] uppercase tracking-[0.15em]">
                Virtual Tour URL
              </Label>
              <Input
                placeholder="https://youriguide.com/..."
                value={data.iguideUrl}
                onChange={(e) => update({ iguideUrl: e.target.value })}
                className="font-mono text-xs"
              />
            </div>

            <PdfUploadField
              label="Floorplan PDF"
              value={data.iguidePdfUrl}
              bucketPath="digital-assets/iguide"
              onUpload={(url) => update({ iguidePdfUrl: url })}
              onRemove={() => update({ iguidePdfUrl: "" })}
            />

            {data.iguideUrl && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="font-mono text-[11px] w-full"
                asChild
              >
                <a href={data.iguideUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                  View iGuide Tour
                </a>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
