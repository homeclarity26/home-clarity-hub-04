import { cn } from "@/lib/utils";

/**
 * HBC Monogram Badge — core visual language element.
 *
 * Per brand spec, each chapter/module is represented by a 2-letter code
 * rendered on a circular badge in Playfair / IBM Plex Mono tracking.
 *
 * ES = Executive Summary — gold circle, navy text
 * EX = Exterior         — navy circle, gold text
 * IN = Interior         — gold circle, navy text
 * SY = Systems          — navy circle, gold text
 * SP = Strategy/Planning — gold circle, navy text
 *
 * Use anywhere a chapter, category, or module is referenced.
 */
export type MonogramCode = "ES" | "EX" | "IN" | "SY" | "SP" | "SA";

// Default variant for each code per brand spec
const defaultVariantMap: Record<MonogramCode, "gold-on-navy" | "navy-on-gold"> = {
  ES: "navy-on-gold", // Executive Summary — gold bg, navy text
  EX: "gold-on-navy", // Exterior — navy bg, gold text
  IN: "navy-on-gold", // Interior — gold bg, navy text
  SY: "gold-on-navy", // Systems — navy bg, gold text
  SP: "navy-on-gold", // Strategy — gold bg, navy text
  SA: "gold-on-navy", // Safety — navy bg, gold text (paired with SY)
};

type MonogramSize = "xs" | "sm" | "md" | "lg" | "xl";

const sizePx: Record<MonogramSize, number> = {
  xs: 24,
  sm: 32,
  md: 44,
  lg: 64,
  xl: 96,
};

interface MonogramProps {
  code: MonogramCode;
  size?: MonogramSize;
  variant?: "gold-on-navy" | "navy-on-gold";
  label?: string; // accessible name; falls back to code
  className?: string;
}

export function Monogram({
  code,
  size = "md",
  variant,
  label,
  className,
}: MonogramProps) {
  const effectiveVariant = variant ?? defaultVariantMap[code];
  const px = sizePx[size];
  const bgCls =
    effectiveVariant === "gold-on-navy" ? "bg-primary" : "bg-accent";
  const fgCls =
    effectiveVariant === "gold-on-navy" ? "text-accent" : "text-primary";

  return (
    <span
      role="img"
      aria-label={label ?? `${code} monogram`}
      className={cn(
        "inline-flex items-center justify-center rounded-full font-mono font-medium select-none flex-shrink-0",
        bgCls,
        fgCls,
        className,
      )}
      style={{
        width: px,
        height: px,
        fontSize: Math.max(10, Math.round(px * 0.32)),
        letterSpacing: "0.05em",
      }}
    >
      {code}
    </span>
  );
}

/**
 * Maps a report chapter id (from ReportChapterNav) to a monogram code.
 * Exported so `ReportChapterNav`, `ReportOverview`, `HomeTab` etc. stay in sync.
 */
export function chapterToMonogram(chapterId: string): MonogramCode {
  switch (chapterId) {
    case "exterior":
    case "exterior-structures":
      return "EX";
    case "interior":
    case "interior-living":
    case "interior-bedrooms":
    case "interior-bathrooms":
    case "interior-utility":
    case "interior-unfinished":
    case "interior-additional":
    case "appliances":
      return "IN";
    case "systems":
    case "systems-hvac":
    case "systems-mechanical":
    case "systems-additional":
      return "SY";
    case "safety":
    case "safety-detection":
      return "SA";
    case "strategy":
      return "SP";
    case "information":
    case "executive-summary":
    default:
      return "ES";
  }
}
