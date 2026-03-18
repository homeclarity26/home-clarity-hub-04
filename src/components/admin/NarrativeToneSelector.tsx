import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pen } from "lucide-react";

export type NarrativeTone = "technical" | "client-friendly" | "executive";

const TONES: { value: NarrativeTone; label: string; description: string }[] = [
  { value: "client-friendly", label: "Client-Friendly", description: "Warm, approachable language for homeowners" },
  { value: "technical", label: "Technical", description: "Detailed professional terminology" },
  { value: "executive", label: "Executive Summary", description: "Brief, high-level overview" },
];

interface Props {
  value: NarrativeTone;
  onChange: (tone: NarrativeTone) => void;
}

const NarrativeToneSelector = ({ value, onChange }: Props) => (
  <div className="flex items-center gap-2">
    <Pen className="w-3.5 h-3.5 text-muted-foreground" />
    <Select value={value} onValueChange={(v) => onChange(v as NarrativeTone)}>
      <SelectTrigger className="h-7 text-xs font-sans w-auto min-w-[140px] border-dashed">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {TONES.map((t) => (
          <SelectItem key={t.value} value={t.value} className="text-xs font-sans">
            <div>
              <div className="font-medium">{t.label}</div>
              <div className="text-[10px] text-muted-foreground">{t.description}</div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);

export default NarrativeToneSelector;
