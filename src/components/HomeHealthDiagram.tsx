import type { ReportPageData } from "@/data/reportContent";

interface HomeHealthDiagramProps {
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
  { key: "hvac", label: "HVAC", keywords: ["hvac", "heating", "cooling", "furnace", "air-conditioning", "air conditioning", "heat-pump"] },
  { key: "plumbing", label: "Plumbing", keywords: ["plumbing", "water", "sewer", "drain", "pipe", "water-heater"] },
  { key: "electrical", label: "Electrical", keywords: ["electrical", "wiring", "panel", "electric"] },
  { key: "exterior", label: "Exterior", keywords: ["exterior", "siding", "foundation", "windows", "doors", "deck", "patio", "garage", "driveway", "landscaping"] },
  { key: "interior", label: "Interior", keywords: ["interior", "kitchen", "bathroom", "bedroom", "flooring", "paint", "walls", "basement"] },
];

const CONDITION_COLORS: Record<string, { fill: string; label: string }> = {
  excellent: { fill: "fill-emerald-400", label: "Excellent" },
  good: { fill: "fill-primary/60", label: "Good" },
  fair: { fill: "fill-amber-400", label: "Fair" },
  poor: { fill: "fill-orange-500", label: "Poor" },
  critical: { fill: "fill-destructive", label: "Critical" },
  unknown: { fill: "fill-muted", label: "No Data" },
};

function getConditionForSystem(section: SystemSection, pages: Record<string, ReportPageData>): string {
  const conditionPriority = ["critical", "poor", "fair", "good", "excellent"];
  let worstIdx = conditionPriority.length;

  for (const page of Object.values(pages)) {
    const pageKey = page.id?.toLowerCase() || "";
    const pageTitle = page.title?.toLowerCase() || "";
    const pageGroup = page.group?.toLowerCase() || "";
    const combined = `${pageKey} ${pageTitle} ${pageGroup}`;

    const matches = section.keywords.some((kw) => combined.includes(kw));
    if (!matches) continue;

    const rating = page.conditionRating?.toLowerCase();
    if (!rating) continue;

    const idx = conditionPriority.indexOf(rating);
    if (idx >= 0 && idx < worstIdx) {
      worstIdx = idx;
    }
  }

  return worstIdx < conditionPriority.length ? conditionPriority[worstIdx] : "unknown";
}

function getFirstPageKeyForSystem(section: SystemSection, pages: Record<string, ReportPageData>): string | undefined {
  for (const page of Object.values(pages)) {
    const combined = `${page.id?.toLowerCase()} ${page.title?.toLowerCase()} ${page.group?.toLowerCase()}`;
    if (section.keywords.some((kw) => combined.includes(kw))) return page.id;
  }
  return undefined;
}

const HomeHealthDiagram = ({ pages, onNavigate }: HomeHealthDiagramProps) => {
  const hasPagesData = Object.keys(pages).length > 0;
  if (!hasPagesData) return null;

  const systems = SYSTEM_SECTIONS.map((section) => ({
    ...section,
    condition: getConditionForSystem(section, pages),
    firstPageKey: getFirstPageKeyForSystem(section, pages),
  }));

  return (
    <div className="max-w-[1400px] mx-auto px-6 md:px-20">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent mb-6">Home Health Overview</p>
      <div className="bg-card rounded-lg border border-border shadow-hbc-sm p-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {systems.map((sys) => {
            const colors = CONDITION_COLORS[sys.condition] || CONDITION_COLORS.unknown;
            return (
              <button
                key={sys.key}
                onClick={() => {
                  if (sys.firstPageKey) {
                    onNavigate("report", sys.firstPageKey);
                  } else {
                    onNavigate("report");
                  }
                }}
                className="group flex flex-col items-center gap-2 p-4 rounded-lg border border-border hover:border-accent/40 hover:shadow-hbc-sm transition-all bg-transparent cursor-pointer"
              >
                {/* Condition Dot */}
                <div className="relative">
                  <svg width="48" height="48" viewBox="0 0 48 48">
                    <circle cx="24" cy="24" r="20" className="fill-secondary" />
                    <circle cx="24" cy="24" r="14" className={colors.fill} opacity={0.85} />
                  </svg>
                </div>
                <span className="text-xs font-sans font-medium text-foreground group-hover:text-accent transition-colors">
                  {sys.label}
                </span>
                <span className="text-[10px] font-mono text-muted-foreground">
                  {colors.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-border justify-center">
          {["excellent", "good", "fair", "poor", "critical"].map((c) => (
            <div key={c} className="flex items-center gap-1.5">
              <svg width="10" height="10" viewBox="0 0 10 10">
                <circle cx="5" cy="5" r="5" className={CONDITION_COLORS[c].fill} />
              </svg>
              <span className="text-[10px] font-sans text-muted-foreground capitalize">{c}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomeHealthDiagram;
