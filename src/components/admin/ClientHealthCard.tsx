import type { AdminClient } from "@/hooks/useAdminData";
import { Card } from "@/components/ui/card";
import { computeClientHealthScore, getHealthLevel, getHealthColor, getHealthLabel } from "@/lib/clientHealthScore";
import { Activity } from "lucide-react";

interface ClientHealthCardProps {
  client: AdminClient;
}

function ScoreBar({ label, value, max, className }: { label: string; value: number; max: number; className?: string }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between">
        <span className="text-[11px] font-sans text-muted-foreground">{label}</span>
        <span className="text-[11px] font-mono text-foreground">{value}/{max}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${className || "bg-primary"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

const ClientHealthCard = ({ client }: ClientHealthCardProps) => {
  const breakdown = computeClientHealthScore(client);
  const level = getHealthLevel(breakdown.total);
  const color = getHealthColor(level);
  const label = getHealthLabel(level);

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-sm font-sans font-semibold text-foreground">Client Health Score</h3>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative w-16 h-16">
          <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="hsl(var(--secondary))" strokeWidth="3" />
            <circle
              cx="18" cy="18" r="15.5" fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray={`${(breakdown.total / 100) * 97.4} 97.4`}
              strokeLinecap="round"
              className={color}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-lg font-mono font-bold ${color}`}>{breakdown.total}</span>
          </div>
        </div>
        <div>
          <p className={`text-sm font-sans font-semibold ${color}`}>{label}</p>
          <p className="text-[11px] font-sans text-muted-foreground">Composite score out of 100</p>
        </div>
      </div>

      <div className="space-y-3">
        <ScoreBar label="Report Completion" value={breakdown.reportCompletion} max={30} className="bg-primary" />
        <ScoreBar label="Report Status" value={breakdown.reportStatus} max={20} className="bg-accent" />
        <ScoreBar label="Engagement" value={breakdown.messageEngagement} max={15} className="bg-emerald-500" />
        <ScoreBar label="Issue Resolution" value={breakdown.issueFlags} max={20} className="bg-amber-500" />
        <ScoreBar label="Onboarding" value={breakdown.onboarding} max={15} className="bg-primary" />
      </div>
    </Card>
  );
};

export default ClientHealthCard;
