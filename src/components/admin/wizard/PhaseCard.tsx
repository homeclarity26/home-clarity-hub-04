import { Card } from "@/components/ui/card";
import type { ReactNode } from "react";

// Defense / Offense / Expansion phase card. Universal expanding container
// pattern — accepts any number of children rows without clipping.

type PhaseTone = "defense" | "offense" | "expansion";

interface PhaseCardProps {
  tone: PhaseTone;
  title: string;
  description: string;
  count?: number;
  children?: ReactNode;
}

const TONE_CLASSES: Record<PhaseTone, { eyebrow: string; border: string }> = {
  defense: {
    eyebrow: "text-destructive",
    border: "border-destructive/40",
  },
  offense: {
    // Use the readable gold token so the eyebrow passes contrast on cream.
    eyebrow: "text-[hsl(var(--hbc-gold-readable))]",
    border: "border-[hsl(var(--hbc-gold-readable))]/40",
  },
  expansion: {
    eyebrow: "text-primary",
    border: "border-primary/40",
  },
};

export function PhaseCard({
  tone,
  title,
  description,
  count,
  children,
}: PhaseCardProps) {
  const tones = TONE_CLASSES[tone];
  return (
    <Card className={`p-5 space-y-3 border ${tones.border}`}>
      <div className="space-y-1">
        <div
          className={`text-[10px] font-mono uppercase tracking-wider ${tones.eyebrow}`}
        >
          {title}
        </div>
        <p className="text-xs font-sans text-muted-foreground">{description}</p>
        {typeof count === "number" && (
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            {count} project{count === 1 ? "" : "s"}
          </div>
        )}
      </div>
      {children && <div className="space-y-1.5">{children}</div>}
    </Card>
  );
}
