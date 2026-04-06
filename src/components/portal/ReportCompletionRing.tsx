import { useEffect, useRef, useState } from "react";

interface ReportCompletionRingProps {
  completionPercent: number;
  totalSections?: number;
}

const RING_RADIUS = 40;
const RING_STROKE = 7;
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const ReportCompletionRing = ({
  completionPercent,
  totalSections = 57,
}: ReportCompletionRingProps) => {
  const [animatedPercent, setAnimatedPercent] = useState(0);
  const frameRef = useRef<number | null>(null);
  const prevPercent = useRef(0);

  useEffect(() => {
    const target = Math.min(100, Math.max(0, completionPercent));
    const start = prevPercent.current;
    const duration = 900; // ms
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + (target - start) * eased;
      setAnimatedPercent(Math.round(current));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        prevPercent.current = target;
      }
    };

    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(animate);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [completionPercent]);

  const completedSections = Math.round((animatedPercent / 100) * totalSections);
  const offset = CIRCUMFERENCE - (animatedPercent / 100) * CIRCUMFERENCE;
  const size = (RING_RADIUS + RING_STROKE) * 2 + 4;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="rotate-[-90deg]"
        >
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={RING_RADIUS}
            fill="none"
            stroke="hsl(30,11%,90%)"
            strokeWidth={RING_STROKE}
          />
          {/* Progress */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={RING_RADIUS}
            fill="none"
            stroke="#C4A265"
            strokeWidth={RING_STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.05s linear" }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0">
          <span className="font-mono text-base font-semibold text-foreground leading-none">
            {animatedPercent}%
          </span>
        </div>
      </div>
      <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground text-center">
        {completedSections} of {totalSections} sections complete
      </p>
    </div>
  );
};

export default ReportCompletionRing;
