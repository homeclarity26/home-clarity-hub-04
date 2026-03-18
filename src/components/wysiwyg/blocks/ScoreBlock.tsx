import type { ScoreContent } from "../types";

interface ScoreBlockProps {
  content: ScoreContent;
  editable?: boolean;
  onChange?: (content: ScoreContent) => void;
}

const ScoreCircle = ({
  label,
  value,
  size = "lg",
  editable,
  onChangeValue,
}: {
  label: string;
  value: number;
  size?: "lg" | "sm";
  editable?: boolean;
  onChangeValue?: (v: number) => void;
}) => {
  const dim = size === "lg" ? 120 : 80;
  const stroke = size === "lg" ? 8 : 6;
  const radius = (dim - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  const color =
    value >= 80 ? "hsl(var(--accent))" :
    value >= 60 ? "hsl(var(--hbc-gold))" :
    value >= 40 ? "hsl(16 86% 39%)" :
    "hsl(var(--destructive))";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: dim, height: dim }}>
        <svg width={dim} height={dim} className="-rotate-90">
          <circle cx={dim / 2} cy={dim / 2} r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth={stroke} />
          <circle
            cx={dim / 2} cy={dim / 2} r={radius} fill="none"
            stroke={color} strokeWidth={stroke}
            strokeDasharray={circumference} strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          {editable ? (
            <input
              type="number" min={0} max={100}
              className="w-12 text-center bg-transparent outline-none font-display text-xl font-bold text-foreground"
              value={value}
              onChange={(e) => onChangeValue?.(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
            />
          ) : (
            <span className={`font-display font-bold text-foreground ${size === "lg" ? "text-2xl" : "text-lg"}`}>
              {value}
            </span>
          )}
        </div>
      </div>
      <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">{label}</span>
    </div>
  );
};

const ScoreBlock = ({ content, editable, onChange }: ScoreBlockProps) => {
  const chapters = [
    { key: "exterior" as const, label: "Exterior" },
    { key: "interior" as const, label: "Interior" },
    { key: "systems" as const, label: "Systems" },
    { key: "safety" as const, label: "Safety" },
  ].filter((c) => content[c.key] !== undefined);

  return (
    <div className="bg-card rounded-lg border border-border p-8">
      <div className="flex flex-wrap items-center justify-center gap-8">
        <ScoreCircle
          label="Overall"
          value={content.overall}
          size="lg"
          editable={editable}
          onChangeValue={(v) => onChange?.({ ...content, overall: v })}
        />
        {chapters.length > 0 && (
          <div className="h-16 w-px bg-border hidden sm:block" />
        )}
        {chapters.map((ch) => (
          <ScoreCircle
            key={ch.key}
            label={ch.label}
            value={(content[ch.key] as number) || 0}
            size="sm"
            editable={editable}
            onChangeValue={(v) => onChange?.({ ...content, [ch.key]: v })}
          />
        ))}
      </div>
    </div>
  );
};

export default ScoreBlock;
