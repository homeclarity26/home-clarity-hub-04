interface LifespanBarProps {
  currentAge: number;
  expectedLifespan: number;
  label?: string;
}

const LifespanBar = ({ currentAge, expectedLifespan, label }: LifespanBarProps) => {
  const pct = Math.min(100, Math.round((currentAge / expectedLifespan) * 100));
  const remaining = Math.max(0, expectedLifespan - currentAge);

  const barColor =
    pct >= 85 ? "bg-red-500" : pct >= 60 ? "bg-amber-500" : "bg-emerald-500";
  const textColor =
    pct >= 85 ? "text-red-600" : pct >= 60 ? "text-amber-600" : "text-emerald-600";

  return (
    <div className="bg-card rounded-lg border border-border p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
          {label || "Expected Lifespan"}
        </span>
        <span className={`font-mono text-[11px] font-medium ${textColor}`}>
          {remaining} yr{remaining !== 1 ? "s" : ""} remaining
        </span>
      </div>
      <div className="h-3 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between mt-2">
        <span className="font-mono text-[9px] text-muted-foreground">
          Installed {currentAge} yr{currentAge !== 1 ? "s" : ""} ago
        </span>
        <span className="font-mono text-[9px] text-muted-foreground">
          Expected: {expectedLifespan} yrs
        </span>
      </div>
    </div>
  );
};

export default LifespanBar;
