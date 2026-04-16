import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * HBC Home Health Score Ring — reusable, accessible, animated.
 *
 * Use wherever a 0–100 score needs a beautiful, instantly-understandable visual.
 * Color is coded by severity. Animates the stroke on mount (0 → final over ~800ms).
 *
 * Default palette is aligned with the HBC design system:
 *   >= 75 → gold (healthy)
 *   >= 50 → amber (caution)
 *   <  50 → destructive (attention)
 *
 * Renders as a real SVG with a proper `role="meter"` for screen readers.
 */
interface HealthScoreRingProps {
  score: number; // 0-100
  size?: number;
  strokeWidth?: number;
  animate?: boolean;
  label?: string;
  showNumber?: boolean;
  className?: string;
  // Optional visual override when on a dark background (e.g. the hero)
  trackClassName?: string;
  numberClassName?: string;
}

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

const colorFor = (s: number) => {
  if (s >= 75) return "hsl(var(--accent))"; // HBC gold
  if (s >= 50) return "#F59E0B"; // amber
  return "hsl(var(--destructive))";
};

export function HealthScoreRing({
  score,
  size = 88,
  strokeWidth = 6,
  animate = true,
  label,
  showNumber = true,
  className,
  trackClassName,
  numberClassName,
}: HealthScoreRingProps) {
  const safeScore = clamp(score);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Animate from 0 → safeScore on mount if requested.
  const [rendered, setRendered] = useState(animate ? 0 : safeScore);

  useEffect(() => {
    if (!animate) {
      setRendered(safeScore);
      return;
    }
    // Respect prefers-reduced-motion
    const mq = typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)")
      : null;
    if (mq?.matches) {
      setRendered(safeScore);
      return;
    }
    const t = requestAnimationFrame(() => setRendered(safeScore));
    return () => cancelAnimationFrame(t);
  }, [safeScore, animate]);

  const dashOffset = circumference - (rendered / 100) * circumference;
  const stroke = colorFor(safeScore);

  return (
    <div
      role="meter"
      aria-valuenow={safeScore}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? `Home condition score ${safeScore} of 100`}
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden="true"
      >
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className={cn("text-muted", trackClassName)}
        />
        {/* Score arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{
            transition: "stroke-dashoffset 800ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        />
      </svg>
      {showNumber && (
        <span
          className={cn(
            "absolute font-display leading-none",
            numberClassName ?? "text-foreground",
          )}
          style={{ fontSize: Math.max(14, Math.round(size * 0.32)) }}
        >
          {safeScore}
        </span>
      )}
    </div>
  );
}
