import type { StatCardContent } from "../types";

interface StatCardBlockProps {
  content: StatCardContent;
  editable?: boolean;
  onChange?: (content: StatCardContent) => void;
}

const StatCardBlock = ({ content, editable, onChange }: StatCardBlockProps) => (
  <div className="bg-card border border-border rounded-lg p-5 text-center space-y-1">
    {editable ? (
      <>
        <input
          className="w-full text-center bg-transparent font-display text-2xl font-bold text-foreground outline-none"
          value={content.value}
          onChange={(e) => onChange?.({ ...content, value: e.target.value })}
          placeholder="0"
        />
        <input
          className="w-full text-center bg-transparent font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground outline-none"
          value={content.label}
          onChange={(e) => onChange?.({ ...content, label: e.target.value })}
          placeholder="Metric Label"
        />
        <input
          className="w-full text-center bg-transparent text-xs text-muted-foreground outline-none"
          value={content.subtitle || ""}
          onChange={(e) => onChange?.({ ...content, subtitle: e.target.value })}
          placeholder="Subtitle"
        />
      </>
    ) : (
      <>
        <div className="font-display text-2xl font-bold text-foreground">{content.value}</div>
        <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">{content.label}</div>
        {content.subtitle && <div className="text-xs text-muted-foreground">{content.subtitle}</div>}
      </>
    )}
  </div>
);

export default StatCardBlock;
