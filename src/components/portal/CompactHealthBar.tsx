import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { ReportPageData } from "@/data/reportContent";

interface CompactHealthBarProps {
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
  excellent: 100, good: 80, fair: 60, poor: 35, critical: 10,
};

const SEGMENT_COLORS: Record<string, string> = {
  excellent: "bg-emerald-400",
  good: "bg-primary",
  fair: "bg-amber-400",
  poor: "bg-orange-500",
  critical: "bg-destructive",
  unknown: "bg-muted",
};

const SEGMENT_TEXT: Record<string, string> = {
  excellent: "text-emerald-600",
  good: "text-primary",
  fair: "text-amber-600",
  poor: "text-orange-600",
  critical: "text-destructive",
  unknown: "text-muted-foreground",
};

const CONDITION_LABEL: Record<string, string> = {
  excellent: "Excellent", good: "Good", fair: "Fair", poor: "Poor", critical: "Critical", unknown: "No Data",
};

function getSystemData(section: SystemSection, pages: Record<string, ReportPageData>) {
  const conditionPriority = ["critical", "poor", "fair", "good", "excellent"];
  let worstIdx = conditionPriority.length;

  for (const page of Object.values(pages)) {
    const combined = `${page.id?.toLowerCase()} ${page.title?.toLowerCase()} ${page.group?.toLowerCase()}`;
    if (!section.keywords.some((kw) => combined.includes(kw))) continue;
    const rating = page.conditionRating?.toLowerCase();
    if (!rating) continue;
    const idx = conditionPriority.indexOf(rating);
    if (idx >= 0 && idx < worstIdx) worstIdx = idx;
  }

  const condition = worstIdx < conditionPriority.length ? conditionPriority[worstIdx] : "unknown";
  const score = CONDITION_SCORES[condition] ?? 0;
  return { condition, score };
}

const CompactHealthBar = ({ pages, onNavigate }: CompactHealthBarProps) => {
  const [expanded, setExpanded] = useState(false);

  const systems = SYSTEM_SECTIONS.map((section) => ({
    ...section,
    ...getSystemData(section, pages),
  }));

  const overallScore = systems.length > 0
    ? Math.round(systems.reduce((sum, s) => sum + s.score, 0) / systems.length)
    : 0;
  const overallCondition = overallScore >= 85 ? "excellent" : overallScore >= 70 ? "good" : overallScore >= 50 ? "fair" : overallScore >= 30 ? "poor" : "critical";

  if (Object.keys(pages).length === 0) return null;

  return (
    <div className="w-full px-6 md:px-20 max-w-[1400px] mx-auto">
      <div className="bg-card rounded-lg border border-border shadow-hbc-sm">
        {/* Main bar — max 80px */}
        <div className="flex items-center gap-6 px-6 py-4" style={{ maxHeight: "80px" }}>
          {/* Left: score */}
          <div className="flex items-center gap-3 shrink-0">
            <span className="font-display text-3xl text-foreground leading-none">{overallScore}</span>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground leading-tight">
                Overall Health
              </p>
              <span className={`font-mono text-[11px] font-medium ${SEGMENT_TEXT[overallCondition]}`}>
                {CONDITION_LABEL[overallCondition]}
              </span>
            </div>
          </div>

          {/* Center: segmented bar */}
          <div className="flex-1 flex gap-1 items-center h-3 rounded-full overflow-hidden bg-muted/50">
            {systems.map((sys) => (
              <div
                key={sys.key}
                className={`h-full flex-1 ${SEGMENT_COLORS[sys.condition]} transition-all duration-500 first:rounded-l-full last:rounded-r-full`}
                title={`${sys.label}: ${sys.score}`}
              />
            ))}
          </div>

          {/* Right: toggle */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-[11px] font-mono uppercase tracking-[0.12em] text-accent hover:text-foreground transition-colors bg-transparent border-none cursor-pointer shrink-0"
          >
            Details
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Expanded detail rows */}
        {expanded && (
          <div className="border-t border-border px-6 py-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {systems.map((sys) => (
              <button
                key={sys.key}
                onClick={() => onNavigate("report")}
                className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-muted/30 transition-colors bg-transparent border-none cursor-pointer text-left"
              >
                <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${SEGMENT_COLORS[sys.condition]}`} />
                <span className="font-sans text-sm text-foreground">{sys.label}</span>
                <span className={`font-mono text-[11px] ml-auto ${SEGMENT_TEXT[sys.condition]}`}>
                  {sys.score}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CompactHealthBar;
