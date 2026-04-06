import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mic, Camera, FileText, FileDown, Loader2, Sparkles } from "lucide-react";

interface BuildMyReportProps {
  propertyId: string;
  reportId: string;
  clientFirstName?: string;
  onComplete: () => void;
}

// Standard page groups for batch drafting
const PAGE_GROUPS = [
  { id: "kitchen", label: "Kitchen" },
  { id: "living-room", label: "Living Room" },
  { id: "master-bedroom", label: "Master Bedroom" },
  { id: "bathrooms", label: "Bathrooms" },
  { id: "basement", label: "Basement" },
  { id: "exterior", label: "Exterior" },
  { id: "roof", label: "Roof" },
  { id: "hvac-furnace", label: "HVAC / Furnace" },
  { id: "hvac-air-conditioning", label: "Air Conditioning" },
  { id: "water-heater", label: "Water Heater" },
  { id: "electrical-panel", label: "Electrical Panel" },
  { id: "plumbing", label: "Plumbing" },
];

const BuildMyReport = ({
  propertyId,
  reportId,
  clientFirstName,
  onComplete,
}: BuildMyReportProps) => {
  // Upload state
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [notes, setNotes] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  // Build progress state
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildProgress, setBuildProgress] = useState<string[]>([]);
  const [currentGroup, setCurrentGroup] = useState<string>("");

  const audioRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const pdfRef = useRef<HTMLInputElement>(null);

  // ── File helpers ────────────────────────────────────────────────────────
  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setAudioFile(file);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setPhotoFiles((prev) => [...prev, ...files]);
  };

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setPdfFile(file);
  };

  // ── Build all pages ──────────────────────────────────────────────────────
  const handleBuild = async () => {
    const hasContent = audioFile || photoFiles.length > 0 || notes.trim() || pdfFile;
    if (!hasContent) {
      toast.error("Add at least one input before building.");
      return;
    }

    setIsBuilding(true);
    setBuildProgress([]);

    try {
      // Convert files to base64 for edge function
      let audioBase64: string | undefined;
      let photoBase64s: string[] = [];
      let pdfBase64: string | undefined;

      if (audioFile) {
        audioBase64 = await fileToBase64(audioFile);
      }
      if (photoFiles.length > 0) {
        photoBase64s = await Promise.all(photoFiles.map(fileToBase64));
      }
      if (pdfFile) {
        pdfBase64 = await fileToBase64(pdfFile);
      }

      const uploadedContent = {
        audioBase64: audioBase64 || null,
        audioMimeType: audioFile?.type || null,
        photoBase64s: photoBase64s.length > 0 ? photoBase64s : null,
        notes: notes.trim() || null,
        pdfBase64: pdfBase64 || null,
      };

      // Draft all page groups
      for (const group of PAGE_GROUPS) {
        setCurrentGroup(`Drafting ${group.label} pages…`);
        setBuildProgress((prev) => [...prev, `Drafting ${group.label}…`]);

        try {
          await supabase.functions.invoke("draft-page-narrative", {
            body: {
              buildAll: true,
              propertyId,
              reportId,
              pageSlug: group.id,
              pageName: group.label,
              ...uploadedContent,
            },
          });
          setBuildProgress((prev) =>
            prev.map((p) =>
              p === `Drafting ${group.label}…` ? `✓ ${group.label}` : p
            )
          );
        } catch (err) {
          console.warn(`Draft failed for ${group.label}:`, err);
          setBuildProgress((prev) =>
            prev.map((p) =>
              p === `Drafting ${group.label}…` ? `— ${group.label} (skipped)` : p
            )
          );
        }
      }

      toast.success("Report pages drafted! Review and refine each section.");
      onComplete();
    } catch (err) {
      console.error("Build My Report failed:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsBuilding(false);
      setCurrentGroup("");
    }
  };

  const heading = clientFirstName
    ? `Build ${clientFirstName}'s Report`
    : "Build This Report";

  return (
    <div
      className="w-full rounded-xl border border-border/40 shadow-sm overflow-hidden"
      style={{ background: "#F8F6F2" }}
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="px-8 pt-10 pb-6 border-b border-border/30">
        <div className="flex items-center gap-3 mb-3">
          <Sparkles className="w-5 h-5" style={{ color: "#C4A265" }} />
          <span
            className="font-mono text-[10px] uppercase tracking-[0.2em]"
            style={{ color: "#8A8E99" }}
          >
            Moment Zero
          </span>
        </div>
        <h2
          className="font-display text-3xl md:text-4xl mb-3"
          style={{ color: "#1B2B4D" }}
        >
          {heading}
        </h2>
        <p className="font-sans text-base max-w-[55ch]" style={{ color: "#8A8E99" }}>
          Upload everything you have — voice memos, photos, notes, inspection findings.
          AI drafts all report pages simultaneously.
        </p>
      </div>

      {/* ── Upload grid ────────────────────────────────────────────────── */}
      <div className="px-8 py-8 grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Voice/Audio */}
        <UploadZone
          icon={<Mic className="w-6 h-6" />}
          label="Voice / Audio"
          sublabel={audioFile ? audioFile.name : "MP3, M4A, WAV"}
          active={!!audioFile}
          onClick={() => audioRef.current?.click()}
        />
        <input
          ref={audioRef}
          type="file"
          accept=".mp3,.m4a,.wav,audio/*"
          className="hidden"
          onChange={handleAudioChange}
        />

        {/* Photos */}
        <UploadZone
          icon={<Camera className="w-6 h-6" />}
          label="Photos"
          sublabel={
            photoFiles.length > 0
              ? `${photoFiles.length} photo${photoFiles.length !== 1 ? "s" : ""} selected`
              : "Any image format"
          }
          active={photoFiles.length > 0}
          onClick={() => photoRef.current?.click()}
        />
        <input
          ref={photoRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handlePhotoChange}
        />

        {/* Notes / Text */}
        <div
          className="rounded-lg border border-dashed border-border/60 p-5 flex flex-col gap-2 hover:border-[#C4A265]/60 transition-colors cursor-text"
          style={{ background: "rgba(255,255,255,0.6)" }}
        >
          <div className="flex items-center gap-2" style={{ color: "#1B2B4D" }}>
            <FileText className="w-6 h-6" style={{ color: "#C4A265" }} />
            <span className="font-mono text-[11px] uppercase tracking-[0.15em]">
              Notes / Text
            </span>
          </div>
          <textarea
            className="w-full bg-transparent font-sans text-sm resize-none outline-none placeholder:text-muted-foreground/50"
            style={{ color: "#1B2B4D", minHeight: "80px" }}
            placeholder="Paste inspection notes, bullet points, or any text observations…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Inspection PDF */}
        <UploadZone
          icon={<FileDown className="w-6 h-6" />}
          label="Inspection PDF"
          sublabel={pdfFile ? pdfFile.name : "Upload report PDF"}
          active={!!pdfFile}
          onClick={() => pdfRef.current?.click()}
        />
        <input
          ref={pdfRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={handlePdfChange}
        />
      </div>

      {/* ── Build button ────────────────────────────────────────────────── */}
      <div className="px-8 pb-10">
        {!isBuilding ? (
          <button
            onClick={handleBuild}
            className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-lg font-mono text-sm uppercase tracking-[0.12em] transition-opacity hover:opacity-90 active:opacity-80"
            style={{ background: "#C4A265", color: "#1B2B4D" }}
          >
            <Sparkles className="w-4 h-4" />
            Build Report
          </button>
        ) : (
          <div className="space-y-4">
            {/* Progress log */}
            <div
              className="rounded-lg border border-border/40 p-4 max-h-48 overflow-y-auto"
              style={{ background: "rgba(255,255,255,0.7)" }}
            >
              {currentGroup && (
                <div className="flex items-center gap-2 mb-3">
                  <Loader2
                    className="w-3.5 h-3.5 animate-spin flex-shrink-0"
                    style={{ color: "#C4A265" }}
                  />
                  <span className="font-mono text-[11px] uppercase tracking-[0.1em]" style={{ color: "#1B2B4D" }}>
                    {currentGroup}
                  </span>
                </div>
              )}
              <div className="space-y-1.5">
                {buildProgress.map((line, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span
                      className="font-mono text-[11px]"
                      style={{ color: line.startsWith("✓") ? "#4CAF81" : "#8A8E99" }}
                    >
                      {line}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" style={{ color: "#C4A265" }} />
              <span className="font-mono text-[11px] uppercase tracking-[0.12em]" style={{ color: "#8A8E99" }}>
                Building pages…
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Upload Zone sub-component ──────────────────────────────────────────────
interface UploadZoneProps {
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  active: boolean;
  onClick: () => void;
}

const UploadZone = ({ icon, label, sublabel, active, onClick }: UploadZoneProps) => (
  <button
    type="button"
    onClick={onClick}
    className="rounded-lg border border-dashed p-5 flex flex-col items-start gap-2 text-left transition-all hover:shadow-sm"
    style={{
      borderColor: active ? "#C4A265" : "rgba(27,43,77,0.15)",
      background: active ? "rgba(196,162,101,0.08)" : "rgba(255,255,255,0.6)",
      color: "#1B2B4D",
    }}
  >
    <span style={{ color: active ? "#C4A265" : "#8A8E99" }}>{icon}</span>
    <span className="font-mono text-[11px] uppercase tracking-[0.15em]" style={{ color: "#1B2B4D" }}>
      {label}
    </span>
    <span className="font-sans text-xs" style={{ color: "#8A8E99" }}>
      {sublabel}
    </span>
  </button>
);

export default BuildMyReport;
