import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Shield, Wrench, FileText, ChevronRight } from "lucide-react";
import type { ReportPageData } from "@/data/reportContent";

interface HomeHealthScoreProps {
  reportPages?: Record<string, ReportPageData>;
  onNavigate: (tab: string, pageId?: string) => void;
}

const CONDITION_SCORES: Record<string, number> = {
  Excellent: 100,
  Good: 80,
  Fair: 55,
  Poor: 30,
  Critical: 10,
};

const HomeHealthScore = ({ reportPages, onNavigate }: HomeHealthScoreProps) => {
  const health = useMemo(() => {
    if (!reportPages) return null;
    const entries = Object.entries(reportPages);
    const rated = entries.filter(([, p]) => p.conditionRating && CONDITION_SCORES[p.conditionRating] !== undefined);
    if (rated.length === 0) return null;

    const totalScore = rated.reduce((s, [, p]) => s + (CONDITION_SCORES[p.conditionRating!] || 0), 0);
    const score = Math.round(totalScore / rated.length);

    const breakdown = {
      excellent: rated.filter(([, p]) => p.conditionRating === "Excellent").length,
      good: rated.filter(([, p]) => p.conditionRating === "Good").length,
      fair: rated.filter(([, p]) => p.conditionRating === "Fair").length,
      poor: rated.filter(([, p]) => p.conditionRating === "Poor").length,
      critical: rated.filter(([, p]) => p.conditionRating === "Critical").length,
    };

    const needsAttention = rated
      .filter(([, p]) => p.conditionRating === "Poor" || p.conditionRating === "Critical")
      .map(([key, p]) => ({ key, ...p }))
      .slice(0, 3);

    return { score, rated: rated.length, total: entries.length, breakdown, needsAttention };
  }, [reportPages]);

  if (!health) return null;

  const scoreColor = health.score >= 75 ? "text-primary" : health.score >= 55 ? "text-accent" : "text-destructive";
  const ringColor = health.score >= 75 ? "stroke-primary" : health.score >= 55 ? "stroke-accent" : "stroke-destructive";
  const circumference = 2 * Math.PI * 40;
  const dashOffset = circumference - (health.score / 100) * circumference;

  return (
    <div className="bg-card rounded-lg shadow-hbc-sm border border-border p-6">
      <div className="flex items-start gap-6">
        {/* Score Ring */}
        <div className="relative shrink-0">
          <svg width="96" height="96" viewBox="0 0 96 96">
            <circle cx="48" cy="48" r="40" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
            <circle
              cx="48" cy="48" r="40" fill="none"
              className={ringColor}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              transform="rotate(-90 48 48)"
              style={{ transition: "stroke-dashoffset 1s ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-2xl font-sans font-bold ${scoreColor}`}>{health.score}</span>
            <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">/ 100</span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-display text-xl text-foreground mb-1">Home Health Score</h3>
          <p className="font-sans text-sm text-muted-foreground mb-3">
            Based on {health.rated} system{health.rated !== 1 ? "s" : ""} assessed in your report
          </p>

          {/* Condition distribution bar */}
          <div className="flex h-2 rounded-full overflow-hidden mb-3">
            {health.breakdown.excellent > 0 && (
              <div className="bg-primary" style={{ width: `${(health.breakdown.excellent / health.rated) * 100}%` }} />
            )}
            {health.breakdown.good > 0 && (
              <div className="bg-primary/60" style={{ width: `${(health.breakdown.good / health.rated) * 100}%` }} />
            )}
            {health.breakdown.fair > 0 && (
              <div className="bg-accent" style={{ width: `${(health.breakdown.fair / health.rated) * 100}%` }} />
            )}
            {health.breakdown.poor > 0 && (
              <div className="bg-destructive/60" style={{ width: `${(health.breakdown.poor / health.rated) * 100}%` }} />
            )}
            {health.breakdown.critical > 0 && (
              <div className="bg-destructive" style={{ width: `${(health.breakdown.critical / health.rated) * 100}%` }} />
            )}
          </div>

          <div className="flex gap-4 text-[10px] font-mono text-muted-foreground">
            <span><span className="inline-block w-2 h-2 rounded-full bg-primary mr-1" />{health.breakdown.excellent + health.breakdown.good} Good+</span>
            <span><span className="inline-block w-2 h-2 rounded-full bg-accent mr-1" />{health.breakdown.fair} Fair</span>
            <span><span className="inline-block w-2 h-2 rounded-full bg-destructive mr-1" />{health.breakdown.poor + health.breakdown.critical} Needs Work</span>
          </div>
        </div>
      </div>

      {/* Needs attention items */}
      {health.needsAttention.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">Needs Attention</p>
          <div className="space-y-1.5">
            {health.needsAttention.map((page) => (
              <button
                key={page.key || page.title}
                onClick={() => onNavigate("report", page.key)}
                className="w-full flex items-center gap-2 text-left bg-transparent border-none cursor-pointer p-2 rounded-md hover:bg-muted/50 transition-colors"
              >
                <Wrench className="w-3.5 h-3.5 text-destructive shrink-0" />
                <span className="text-sm font-sans text-foreground truncate">{page.title}</span>
                <span className="text-[10px] font-mono text-destructive ml-auto capitalize">{page.conditionRating}</span>
                <ChevronRight className="w-3 h-3 text-muted-foreground/30" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeHealthScore;
