interface HealthBarProps {
  label: string;
  current: number;
  total: number;
  unit: string;
}

const HealthBar = ({ label, current, total, unit }: HealthBarProps) => {
  const percentage = Math.min((current / total) * 100, 100);
  const isOverdue = current > total;

  return (
    <div className="my-8">
      <div className="w-full h-1 bg-border relative">
        <div
          className={`h-full ${isOverdue ? "bg-destructive" : "bg-accent"}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground mt-3">
        {label}: {current} / {total} {unit}
        {isOverdue && " — Past Expected Life"}
      </p>
    </div>
  );
};

export default HealthBar;
