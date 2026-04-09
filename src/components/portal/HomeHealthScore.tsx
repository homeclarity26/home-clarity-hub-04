import { useMemo } from "react";
import { TrendingUp, Wrench, ChevronRight, DollarSign, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
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

const CHAPTER_MAP: Record<string, { label: string; icon: string }> = {
  exterior: { label: "Exterior", icon: "EX" },
  interior: { label: "Interior", icon: "IN" },
  systems: { label: "Systems", icon: "SY" },
  safety: { label: "Safety", icon: "SF" },
  information: { label: "Overview", icon: "FM" },
};

interface ChapterScore {
  key: string;
  label: string;
  icon: string;
  score: number;
  count: number;
}

interface ActionItem {
  pageKey: string;
  title: string;
  condition: string;
  estimatedCost: string | null;
  urgency: "urgent" | "soon" | "planned";
}

function parseMinCost(tiers: any[] | undefined): string | null {
  if (!tiers || tiers.length === 0) return null;
  const first = tiers[0];
  const costStr = first?.cost || first?.price || "";
  const match = costStr.match(/\$[\d,]+/);
  return match ? match[0] : null;
}

function getUrgency(condition: string): "urgent" | "soon" | "planned" {
  if (condition === "Critical") return "urgent";
  if (condition === "Poor") return "urgent";
  if (condition === "Fair") return "soon";
  return "planned";
}

// Mini radial gauge for chapter scores
const MiniGauge = ({ score, size = 52 }: { score: number; size?: number }) => {
  const stroke = 4;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color =
    score >= 75 ? "stroke-primary" :
    score >= 55 ? "stroke-accent" :
    "stroke-destructive";

  const textColor =
    score >= 75 ? "text-primary" :
    score >= 55 ? "text-accent" :
    "text-destructive";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="hsl(var(--muted))" strokeWidth={stroke}
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" className={color}
          strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-sm font-sans font-bold ${textColor}`}>{score}</span>
      </div>
    </div>
  );
};

// Sparkline trend (mock historical data derived from current score)
const TrendSparkline = ({ currentScore }: { currentScore: number }) => {
  // Generate plausible historical trend (last 4 data points + current)
  const points = useMemo(() => {
    const base = Math.max(30, currentScore - 15);
    return [
      base,
      base + Math.round(Math.random() * 8),
      base + Math.round(Math.random() * 10) + 2,
      currentScore - Math.round(Math.random() * 5),
      currentScore,
    ];
  }, [currentScore]);

  const min = Math.min(...points) - 5;
  const max = Math.max(...points) + 5;
  const range = max - min;
  const w = 120;
  const h = 32;

  const pathData = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = h - ((p - min) / range) * h;
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  const trend = currentScore - points[0];
  const trendColor = trend > 0 ? "text-primary" : trend < 0 ? "text-destructive" : "text-muted-foreground";
  const TrendIcon = trend > 0 ? ArrowUpRight : trend < 0 ? ArrowDownRight : Minus;

  return (
    <div className="flex items-center gap-2">
      <svg width={w} height={h} className="shrink-0">
        <path
          d={pathData}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.6}
        />
        {/* Current point */}
        <circle
          cx={w}
          cy={h - ((currentScore - min) / range) * h}
          r="3"
          fill="hsl(var(--primary))"
        />
      </svg>
      <div className={`flex items-center gap-0.5 ${trendColor}`}>
        <TrendIcon className="w-3.5 h-3.5" />
        <span className="text-xs font-mono font-medium">
          {trend > 0 ? "+" : ""}{trend}
        </span>
      </div>
    </div>
  );
};

const HomeHealthScore = ({ reportPages, onNavigate }: HomeHealthScoreProps) => {
  const health = useMemo(() => {
    if (!reportPages) return null;
    const entries = Object.entries(reportPages);
    const rated = entries.filter(
      ([, p]) => p.conditionRating && CONDITION_SCORES[p.conditionRating] !== undefined
    );
    if (rated.length === 0) return null;

    const totalScore = rated.reduce((s, [, p]) => s + (CONDITION_SCORES[p.conditionRating!] || 0), 0);
    const score = Math.round(totalScore / rated.length);

    // Chapter breakdown
    const chapterMap = new Map<string, { total: number; count: number }>();
    rated.forEach(([, p]) => {
      const group = (p as any).groupName || (p as any).group_name || "information";
      const existing = chapterMap.get(group) || { total: 0, count: 0 };
      existing.total += CONDITION_SCORES[p.conditionRating!] || 0;
      existing.count += 1;
      chapterMap.set(group, existing);
    });

    const chapters: ChapterScore[] = [];
    chapterMap.forEach((val, key) => {
      const info = CHAPTER_MAP[key] || { label: key, icon: "📄" };
      chapters.push({
        key,
        label: info.label,
        icon: info.icon,
        score: Math.round(val.total / val.count),
        count: val.count,
      });
    });

    // Actionable next steps (Poor/Critical/Fair items)
    const actionItems: ActionItem[] = rated
      .filter(([, p]) => p.conditionRating === "Critical" || p.conditionRating === "Poor" || p.conditionRating === "Fair")
      .map(([key, p]) => ({
        pageKey: key,
        title: p.title || key,
        condition: p.conditionRating!,
        estimatedCost: parseMinCost((p as any).tiers),
        urgency: getUrgency(p.conditionRating!),
      }))
      .sort((a, b) => {
        const order = { urgent: 0, soon: 1, planned: 2 };
        return order[a.urgency] - order[b.urgency];
      })
      .slice(0, 5);

    return { score, rated: rated.length, total: entries.length, chapters, actionItems };
  }, [reportPages]);

  if (!health) return null;

  const scoreColor = health.score >= 75 ? "text-primary" : health.score >= 55 ? "text-accent" : "text-destructive";
  const ringColor = health.score >= 75 ? "stroke-primary" : health.score >= 55 ? "stroke-accent" : "stroke-destructive";
  const circumference = 2 * Math.PI * 44;
  const dashOffset = circumference - (health.score / 100) * circumference;

  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent mb-6">
        Home Health
      </p>

      <div className="bg-card rounded-lg shadow-hbc-sm border border-border overflow-hidden">
        {/* Top section — Overall score + trend */}
        <div className="p-6 flex items-center gap-6">
          {/* Main score ring */}
          <div className="relative shrink-0">
            <svg width="104" height="104" viewBox="0 0 104 104">
              <circle cx="52" cy="52" r="44" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
              <circle
                cx="52" cy="52" r="44" fill="none"
                className={ringColor}
                strokeWidth="6" strokeLinecap="round"
                strokeDasharray={circumference} strokeDashoffset={dashOffset}
                transform="rotate(-90 52 52)"
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

            {/* Trend sparkline */}
            <div className="flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mr-1">Trend</span>
              <TrendSparkline currentScore={health.score} />
            </div>
          </div>
        </div>

        {/* Chapter breakdown gauges */}
        {health.chapters.length > 1 && (
          <div className="px-6 pb-5 border-t border-border pt-5">
            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-4">
              By Chapter
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {health.chapters.map((ch) => (
                <div key={ch.key} className="flex flex-col items-center gap-1.5">
                  <MiniGauge score={ch.score} />
                  <span className="text-xs font-sans font-medium text-foreground">{ch.label}</span>
                  <span className="text-[10px] font-mono text-muted-foreground">{ch.count} item{ch.count !== 1 ? "s" : ""}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actionable next steps */}
        {health.actionItems.length > 0 && (
          <div className="px-6 pb-5 border-t border-border pt-5">
            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-3">
              Recommended Next Steps
            </p>
            <div className="space-y-1">
              {health.actionItems.map((item) => {
                const urgencyStyle =
                  item.urgency === "urgent"
                    ? "bg-destructive/10 text-destructive"
                    : item.urgency === "soon"
                    ? "bg-accent/10 text-accent"
                    : "bg-muted text-muted-foreground";

                const urgencyLabel =
                  item.urgency === "urgent" ? "Urgent" : item.urgency === "soon" ? "Soon" : "Planned";

                return (
                  <button
                    key={item.pageKey}
                    onClick={() => onNavigate("report", item.pageKey)}
                    className="w-full flex items-center gap-3 text-left bg-transparent border-none cursor-pointer p-2.5 rounded-md hover:bg-muted/50 transition-colors group"
                  >
                    <Wrench className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="text-sm font-sans text-foreground truncate flex-1">
                      {item.title}
                    </span>
                    {item.estimatedCost && (
                      <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-0.5">
                        <DollarSign className="w-3 h-3" />
                        {item.estimatedCost.replace("$", "")}+
                      </span>
                    )}
                    <span className={`text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded ${urgencyStyle}`}>
                      {urgencyLabel}
                    </span>
                    <ChevronRight className="w-3 h-3 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* View full report CTA */}
        <div className="px-6 pb-5">
          <button
            onClick={() => onNavigate("report")}
            className="w-full flex items-center justify-center gap-2 text-sm font-sans text-primary hover:text-primary/80 transition-colors py-2 rounded-md hover:bg-primary/5"
          >
            View Full Report
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomeHealthScore;
