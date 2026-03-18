import type { FindingCardContent } from "../types";

interface FindingCardBlockProps {
  content: FindingCardContent;
  editable?: boolean;
  onChange?: (content: FindingCardContent) => void;
}

const ratingColors: Record<string, string> = {
  Excellent: "bg-accent",
  Good: "bg-accent/70",
  Fair: "bg-hbc-gold",
  Poor: "bg-hbc-rust",
  Critical: "bg-destructive",
};

const FindingCardBlock = ({ content, editable, onChange }: FindingCardBlockProps) => {
  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className={`w-3 h-3 rounded-full ${ratingColors[content.rating] || "bg-muted"}`} />
        {editable ? (
          <input
            className="flex-1 bg-transparent font-display text-sm font-semibold text-foreground outline-none border-b border-transparent focus:border-accent"
            value={content.name}
            onChange={(e) => onChange?.({ ...content, name: e.target.value })}
            placeholder="Finding name"
          />
        ) : (
          <span className="font-display text-sm font-semibold text-foreground">{content.name}</span>
        )}
        {editable ? (
          <select
            className="bg-muted text-xs font-mono rounded px-2 py-1 text-foreground outline-none"
            value={content.rating}
            onChange={(e) => onChange?.({ ...content, rating: e.target.value })}
          >
            {["Excellent", "Good", "Fair", "Poor", "Critical"].map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        ) : (
          <span className="text-xs font-mono text-muted-foreground">{content.rating}</span>
        )}
      </div>
      {editable ? (
        <textarea
          className="w-full bg-transparent text-sm text-muted-foreground outline-none resize-none min-h-[40px] border-b border-transparent focus:border-accent"
          value={content.notes}
          onChange={(e) => onChange?.({ ...content, notes: e.target.value })}
          placeholder="Notes about this finding..."
        />
      ) : (
        content.notes && <p className="text-sm text-muted-foreground">{content.notes}</p>
      )}
    </div>
  );
};

export default FindingCardBlock;
