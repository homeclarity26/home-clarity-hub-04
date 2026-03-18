import type { CostRangeContent } from "../types";

interface CostRangeBlockProps {
  content: CostRangeContent;
  editable?: boolean;
  onChange?: (content: CostRangeContent) => void;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

const CostRangeBlock = ({ content, editable, onChange }: CostRangeBlockProps) => (
  <div className="bg-card border border-border rounded-lg p-5 space-y-2">
    {editable ? (
      <>
        <input
          className="w-full bg-transparent font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground outline-none"
          value={content.label}
          onChange={(e) => onChange?.({ ...content, label: e.target.value })}
          placeholder="Label"
        />
        <div className="flex items-center gap-2">
          <input
            type="number"
            className="w-24 bg-muted rounded px-2 py-1 text-sm font-display font-bold text-foreground outline-none"
            value={content.low}
            onChange={(e) => onChange?.({ ...content, low: parseInt(e.target.value) || 0 })}
          />
          <span className="text-muted-foreground">–</span>
          <input
            type="number"
            className="w-24 bg-muted rounded px-2 py-1 text-sm font-display font-bold text-foreground outline-none"
            value={content.high}
            onChange={(e) => onChange?.({ ...content, high: parseInt(e.target.value) || 0 })}
          />
        </div>
      </>
    ) : (
      <>
        <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">{content.label}</div>
        <div className="font-display text-xl font-bold text-foreground">
          {fmt(content.low)} – {fmt(content.high)}
        </div>
        {content.tier && <div className="text-xs text-accent font-mono">{content.tier}</div>}
      </>
    )}
  </div>
);

export default CostRangeBlock;
