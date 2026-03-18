import { useState } from "react";
import { ChevronRight, TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { ReportPageData } from "@/data/reportContent";

interface InteractiveHealthDashboardProps {
  pages: Record<string, ReportPageData>;
  onNavigate: (tab: string, pageId?: string) => void;
}

type SystemSection = {
  key: string;
  label: string;
  keywords: string[];
};

const SYSTEM_SECTIONS: SystemSection[] = [
  { key: "roof", label: "Roof", keywords: ["roof", "roofing", "attic", "gutter"] },
  { key: "hvac", label: "HVAC", keywords: ["hvac", "heating", "cooling", "furnace", "air-conditioning", "heat-pump"] },
  { key: "plumbing", label: "Plumbing", keywords: ["plumbing", "water", "sewer", "drain", "pipe", "water-heater"] },
  { key: "electrical", label: "Electrical", keywords: ["electrical", "wiring", "panel", "electric"] },
  { key: "exterior", label: "Exterior", keywords: ["exterior", "siding", "foundation", "windows", "doors", "deck", "patio", "garage", "driveway", "landscaping"] },
  { key: "interior", label: "Interior", keywords: ["interior", "kitchen", "bathroom", "bedroom", "flooring", "paint", "walls", "basement"] },
];

const CONDITION_SCORES: Record<string, number> = {
  excellent: 100,
  good: 80,
  fair: 60,
  poor: 35,
  critical: 10,
};

const CONDITION_COLORS: Record<string, { stroke: string; bg: string; text: string; label: string }> = {
  excellent: { stroke: "stroke-emerald-400", bg: "bg-emerald-400", text: "text-emerald-600", label: "Excellent" },
  good: { stroke: "stroke-primary", bg: "bg-primary", text: "text-primary", label: "Good" },
  fair: { stroke: "stroke-amber-400", bg: "bg-amber-400", text: "text-amber-600", label: "Fair" },
  poor: { stroke: "stroke-orange-500", bg: "bg-orange-500", text: "text-orange-600", label: "Poor" },
  critical: { stroke: "stroke-destructive", bg: "bg-destructive", text: "text-destructive", label: "Critical" },
  unknown: { stroke: "stroke-muted", bg: "bg-muted", text: "text-muted-foreground", label: "No Data" },
};

function getSystemData(section: SystemSection, pages: Record<string, ReportPageData>) {
  const matchingPages: ReportPageData[] = [];
  const conditionPriority = ["critical", "poor", "fair", "good", "excellent"];
  let worstIdx = conditionPriority.length;

  for (const page of Object.values(pages)) {
    const combined = `${page.id?.toLowerCase()} ${page.title?.toLowerCase()} ${page.group?.toLowerCase()}`;
    if (!section.keywords.some((kw) => combined.includes(kw))) continue;
    matchingPages.push(page);
    const rating = page.conditionRating?.toLowerCase();
    if (!rating) continue;
    const idx = conditionPriority.indexOf(rating);
    if (idx >= 0 && idx < worstIdx) worstIdx = idx;
  }

  const condition = worstIdx < conditionPriority.length ? conditionPriority[worstIdx] : "unknown";
  const score = CONDITION_SCORES[condition] ?? 0;
  return { condition, score, matchingPages };
}

function RadialGauge({ score, condition, size = 80 }: { score: number; condition: string; size?: number }) {
  const r = (size - 8) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;
  const colors = CONDITION_COLORS[condition] || CONDITION_COLORS.unknown;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" className="stroke-secondary" strokeWidth={5} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        className={colors.stroke}
        strokeWidth={5}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.8s ease" }}
      />
    </svg>
  );
}

const InteractiveHealthDashboard = ({ pages, onNavigate }: InteractiveHealthDashboardProps) => {
  const [selectedSystem, setSelectedSystem] = useState<string | null>(null);

  const systems = SYSTEM_SECTIONS.map((section) => {
    const data = getSystemData(section, pages);
    return { ...section, ...data };
  });

  const overallScore = systems.length > 0
    ? Math.round(systems.reduce((sum, s) => sum + s.score, 0) / systems.length)
    : 0;
  const overallCondition = overallScore >= 85 ? "excellent" : overallScore >= 70 ? "good" : overallScore >= 50 ? "fair" : overallScore >= 30 ? "poor" : "critical";

  const selected = systems.find((s) => s.key === selectedSystem);

  if (Object.keys(pages).length === 0) return null;

  return (
    <div className="max-w-[1400px] mx-auto px-6 md:px-20">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent mb-6">Interactive Home Health</p>
      <div className="bg-card rounded-lg border border-border shadow-hbc-sm p-6">
        {/* Overall Score */}
        <div className="flex items-center gap-6 mb-6">
          <div className="relative">
            <RadialGauge score={overallScore} condition={overallCondition} size={100} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-display text-xl text-foreground">{overallScore}</span>
            </div>
          </div>
          <div>
            <h3 className="font-display text-lg text-foreground">Overall Health Score</h3>
            <p className={`font-mono text-[11px] uppercase tracking-[0.15em] ${CONDITION_COLORS[overallCondition].text}`}>
              {CONDITION_COLORS[overallCondition].label}
            </p>
          </div>
        </div>

        {/* System Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {systems.map((sys) => {
            const colors = CONDITION_COLORS[sys.condition] || CONDITION_COLORS.unknown;
            const isSelected = selectedSystem === sys.key;
            return (
              <button
                key={sys.key}
                onClick={() => setSelectedSystem(isSelected ? null : sys.key)}
                className={`group flex flex-col items-center gap-2 p-4 rounded-lg border transition-all bg-transparent cursor-pointer ${
                  isSelected ? "border-accent shadow-hbc-sm bg-accent/5" : "border-border hover:border-accent/40"
                }`}
              >
                <div className="relative">
                  <RadialGauge score={sys.score} condition={sys.condition} size={48} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-mono text-[10px] text-foreground">{sys.score}</span>
                  </div>
                </div>
                <span className="text-xs font-sans font-medium text-foreground">{sys.label}</span>
                <span className={`text-[10px] font-mono ${colors.text}`}>{colors.label}</span>
              </button>
            );
          })}
        </div>

        {/* Drill-down Panel */}
        {selected && (
          <div className="mt-4 pt-4 border-t border-border">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent mb-3">
              {selected.label} — {selected.matchingPages.length} page{selected.matchingPages.length !== 1 ? "s" : ""}
            </p>
            <div className="space-y-2">
              {selected.matchingPages.map((page) => {
                const rating = page.conditionRating?.toLowerCase() || "unknown";
                const colors = CONDITION_COLORS[rating] || CONDITION_COLORS.unknown;
                return (
                  <button
                    key={page.id}
                    onClick={() => onNavigate("report", page.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:border-accent/40 bg-transparent cursor-pointer transition-all text-left"
                  >
                    <div className={`w-2.5 h-2.5 rounded-full ${colors.bg}`} />
                    <span className="font-sans text-sm text-foreground flex-1">{page.title}</span>
                    <span className={`font-mono text-[10px] ${colors.text}`}>{colors.label}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30" />
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InteractiveHealthDashboard;
