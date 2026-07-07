import type { ReactNode } from "react";

// Defense / Offense / Expansion phase card, prototype screen 16: white
// card with a colored top border (rust / gold / navy), colored YEAR
// eyebrow, Cormorant title, bullet children. Universal expanding
// container pattern — accepts any number of children rows without
// clipping.

type PhaseTone = "defense" | "offense" | "expansion";

interface PhaseCardProps {
  tone: PhaseTone;
  title: string;
  description: string;
  count?: number;
  /** Colored mono eyebrow, e.g. "Year 1". Defaults per tone. */
  eyebrow?: string;
  children?: ReactNode;
}

const TONE_META: Record<
  PhaseTone,
  { accent: string; defaultEyebrow: string }
> = {
  defense: {
    accent: "hsl(var(--hbc-rust))",
    defaultEyebrow: "Year 1",
  },
  offense: {
    // Use the readable gold token so the eyebrow passes contrast on white.
    accent: "hsl(var(--hbc-gold-readable))",
    defaultEyebrow: "Year 1-3",
  },
  expansion: {
    accent: "hsl(var(--hbc-navy))",
    defaultEyebrow: "Year 2-5",
  },
};

export function PhaseCard({
  tone,
  title,
  description,
  count,
  eyebrow,
  children,
}: PhaseCardProps) {
  const meta = TONE_META[tone];
  return (
    <div
      className="rounded-lg border border-hbc-border bg-white p-5 space-y-3"
      style={{ borderTop: `3px solid ${meta.accent}` }}
    >
      <div className="space-y-1">
        <div
          className="font-mono text-[10px] uppercase tracking-[0.16em]"
          style={{ color: meta.accent }}
        >
          {eyebrow ?? meta.defaultEyebrow}
        </div>
        <div className="font-display text-2xl text-hbc-navy">{title}</div>
        <p className="text-xs font-sans text-hbc-grey">{description}</p>
        {typeof count === "number" && (
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            {count} project{count === 1 ? "" : "s"}
          </div>
        )}
      </div>
      {children && <div className="space-y-1.5">{children}</div>}
    </div>
  );
}
