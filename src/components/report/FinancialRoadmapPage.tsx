import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useEditMode } from "@/contexts/EditModeContext";
import { DollarSign, TrendingUp, AlertCircle, Clock } from "lucide-react";

interface TierEntry {
  pageTitle: string;
  pageKey: string;
  conditionRating?: string;
  tiers: { label: string; cost: string }[];
  group: string;
}

interface PhaseItem {
  pageTitle: string;
  pageKey: string;
  conditionRating?: string;
  tierLabel: string;
  cost: string;
  costLow: number;
  costHigh: number;
  group: string;
}

interface Phase {
  id: string;
  label: string;
  timeframe: string;
  description: string;
  icon: typeof AlertCircle;
  accentClass: string;
  badgeClass: string;
  items: PhaseItem[];
}

const conditionToPhase: Record<string, string> = {
  Critical: "urgent",
  Poor: "urgent",
  Fair: "nearTerm",
  Good: "longTerm",
  Excellent: "longTerm",
};

function parseCostRange(costStr: string): { low: number; high: number } {
  if (!costStr) return { low: 0, high: 0 };
  // Strip non-numeric except commas, dashes, and em-dashes
  const cleaned = costStr.replace(/[^0-9,–\-]/g, "");
  const parts = cleaned.split(/[–\-]/);
  const low = parseInt(parts[0]?.replace(/,/g, "") || "0", 10) || 0;
  const high = parseInt(parts[1]?.replace(/,/g, "") || String(low), 10) || low;
  return { low, high };
}

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}k`;
  return `$${n.toLocaleString()}`;
}

interface FinancialRoadmapPageProps {
  reportId?: string;
}

const FinancialRoadmapPage = ({ reportId }: FinancialRoadmapPageProps) => {
  const { canEdit } = useEditMode();
  const [tierEntries, setTierEntries] = useState<TierEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState<"essential" | "balanced" | "premium">("balanced");

  useEffect(() => {
    async function loadPages() {
      if (!reportId) {
        setIsLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from("report_pages")
          .select("page_key, title, group_name, condition_rating, tiers, sort_order")
          .eq("report_id", reportId)
          .not("tiers", "is", null)
          .order("sort_order", { ascending: true });

        if (error) throw error;

        const entries: TierEntry[] = (data || [])
          .filter((p) => {
            const t = p.tiers as unknown as { label: string; cost: string }[] | null;
            return Array.isArray(t) && t.length > 0;
          })
          .map((p) => ({
            pageTitle: p.title,
            pageKey: p.page_key,
            conditionRating: (p.condition_rating as string) || undefined,
            tiers: (p.tiers as unknown as { label: string; cost: string }[]) || [],
            group: p.group_name,
          }));

        setTierEntries(entries);
      } catch (err) {
        console.error("Failed to load report pages for roadmap:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadPages();
  }, [reportId]);

  // Group pages into phases based on condition rating
  const phases: Phase[] = [
    {
      id: "urgent",
      label: "Urgent",
      timeframe: "Within 12 Months",
      description: "Critical and poor-condition items that need immediate attention to prevent further damage or safety concerns.",
      icon: AlertCircle,
      accentClass: "text-destructive",
      badgeClass: "bg-destructive/10 text-destructive",
      items: [],
    },
    {
      id: "nearTerm",
      label: "Near-Term",
      timeframe: "Year 2–3",
      description: "Fair-condition items showing signs of wear that should be addressed before they become urgent.",
      icon: Clock,
      accentClass: "text-orange-500",
      badgeClass: "bg-orange-100 text-orange-700",
      items: [],
    },
    {
      id: "longTerm",
      label: "Planned",
      timeframe: "Year 4–5+",
      description: "Good-condition systems and improvements that can be strategically planned and budgeted over time.",
      icon: TrendingUp,
      accentClass: "text-accent",
      badgeClass: "bg-accent/10 text-accent",
      items: [],
    },
  ];

  // Tier index mapping: pick first, middle, or last tier based on selection
  function getTierForEntry(entry: TierEntry): { label: string; cost: string } | null {
    if (entry.tiers.length === 0) return null;
    const idx = selectedTier === "essential" ? 0 : selectedTier === "premium" ? entry.tiers.length - 1 : Math.floor((entry.tiers.length - 1) / 2);
    return entry.tiers[Math.min(idx, entry.tiers.length - 1)];
  }

  tierEntries.forEach((entry) => {
    const tier = getTierForEntry(entry);
    if (!tier) return;
    const { low, high } = parseCostRange(tier.cost);
    const phaseId = conditionToPhase[entry.conditionRating || ""] || "nearTerm";
    const phase = phases.find((p) => p.id === phaseId);
    if (phase) {
      phase.items.push({
        pageTitle: entry.pageTitle,
        pageKey: entry.pageKey,
        conditionRating: entry.conditionRating,
        tierLabel: tier.label,
        cost: tier.cost,
        costLow: low,
        costHigh: high,
        group: entry.group,
      });
    }
  });

  // Totals
  const totalLow = phases.reduce((sum, p) => sum + p.items.reduce((s, i) => s + i.costLow, 0), 0);
  const totalHigh = phases.reduce((sum, p) => sum + p.items.reduce((s, i) => s + i.costHigh, 0), 0);
  const urgentLow = phases[0].items.reduce((s, i) => s + i.costLow, 0);
  const urgentHigh = phases[0].items.reduce((s, i) => s + i.costHigh, 0);

  const conditionDot: Record<string, string> = {
    Excellent: "bg-emerald-500",
    Good: "bg-primary",
    Fair: "bg-orange-400",
    Poor: "bg-destructive",
    Critical: "bg-destructive",
  };

  if (isLoading) {
    return (
      <div className="max-w-[800px] mx-auto px-6 md:px-20 py-16 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (tierEntries.length === 0) {
    return (
      <div className="max-w-[800px] mx-auto px-6 md:px-20 py-16 text-center">
        <DollarSign className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-sans text-base font-medium text-foreground mb-2">No pricing data yet</h3>
        <p className="font-sans text-sm text-muted-foreground">
          Add pricing tiers to individual report pages and they'll automatically appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-[800px] mx-auto px-6 md:px-20 py-12 space-y-10">

      {/* Header */}
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent mb-2">Strategic Overview</p>
        <h1 className="font-display text-3xl text-foreground mb-3">Financial Roadmap</h1>
        <p className="font-sans text-base text-muted-foreground">
          A prioritized investment plan across all assessed home systems, organized by urgency and timeline.
        </p>
      </div>

      {/* Tier Selector */}
      <div className="flex items-center gap-2 p-1 bg-muted rounded-lg w-fit">
        {(["essential", "balanced", "premium"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setSelectedTier(t)}
            className={`px-4 py-1.5 rounded-md text-xs font-sans font-medium transition-all capitalize ${
              selectedTier === t
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "balanced" ? "Balanced" : t === "essential" ? "Essential" : "Premium"}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-border p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-1">5-Year Total</p>
          <p className="font-display text-2xl text-foreground">
            {formatCurrency(totalLow)}
            {totalLow !== totalHigh && <span className="text-muted-foreground">–{formatCurrency(totalHigh)}</span>}
          </p>
          <p className="font-sans text-xs text-muted-foreground mt-1">{tierEntries.length} items across {phases.filter(p => p.items.length > 0).length} phases</p>
        </div>
        <div className={`rounded-xl border p-5 ${urgentLow > 0 ? "border-destructive/30 bg-destructive/5" : "border-border"}`}>
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-1">Urgent (Year 1)</p>
          <p className={`font-display text-2xl ${urgentLow > 0 ? "text-destructive" : "text-muted-foreground"}`}>
            {urgentLow > 0
              ? `${formatCurrency(urgentLow)}${urgentLow !== urgentHigh ? `–${formatCurrency(urgentHigh)}` : ""}`
              : "—"}
          </p>
          <p className="font-sans text-xs text-muted-foreground mt-1">
            {phases[0].items.length > 0 ? `${phases[0].items.length} critical item${phases[0].items.length !== 1 ? "s" : ""}` : "No urgent items"}
          </p>
        </div>
      </div>

      {/* Phases */}
      {phases.map((phase) => {
        if (phase.items.length === 0) return null;
        const PhaseIcon = phase.icon;
        const phaseLow = phase.items.reduce((s, i) => s + i.costLow, 0);
        const phaseHigh = phase.items.reduce((s, i) => s + i.costHigh, 0);

        return (
          <div key={phase.id} className="space-y-3">
            {/* Phase header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <PhaseIcon className={`w-5 h-5 ${phase.accentClass} flex-shrink-0`} />
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-sans text-base font-semibold text-foreground">{phase.label}</h2>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${phase.badgeClass}`}>
                      {phase.timeframe}
                    </span>
                  </div>
                  <p className="font-sans text-sm text-muted-foreground mt-0.5">{phase.description}</p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-mono text-sm font-semibold text-foreground">
                  {formatCurrency(phaseLow)}{phaseLow !== phaseHigh && `–${formatCurrency(phaseHigh)}`}
                </p>
                <p className="font-mono text-[10px] text-muted-foreground">{phase.items.length} items</p>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-2 pl-7">
              {phase.items.map((item) => (
                <div
                  key={item.pageKey}
                  className="flex items-center justify-between gap-4 py-3 px-4 rounded-lg bg-muted/50 border border-border hover:bg-muted/80 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {item.conditionRating && (
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${conditionDot[item.conditionRating] || "bg-muted-foreground"}`} />
                    )}
                    <div className="min-w-0">
                      <p className="font-sans text-sm font-medium text-foreground truncate">{item.pageTitle}</p>
                      <p className="font-mono text-[10px] text-muted-foreground capitalize">
                        {item.group} · {item.tierLabel}
                        {item.conditionRating && ` · ${item.conditionRating}`}
                      </p>
                    </div>
                  </div>
                  <p className="font-mono text-sm font-semibold text-foreground flex-shrink-0">{item.cost}</p>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Footer note */}
      <p className="font-sans text-xs text-muted-foreground border-t border-border pt-6">
        All cost estimates are ranges based on current market conditions and represent typical contractor pricing in your area.
        Actual costs may vary based on contractor selection, material choices, and site-specific conditions.
        Costs shown reflect the <span className="font-medium capitalize">{selectedTier}</span> tier selection.
      </p>
    </div>
  );
};

export default FinancialRoadmapPage;
