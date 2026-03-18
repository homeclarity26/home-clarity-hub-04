import { useState, useMemo } from "react";
import { TrendingUp, AlertTriangle, DollarSign, Calendar } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ReportPageData } from "@/data/reportContent";

interface CostComparisonToolProps {
  pages: Record<string, ReportPageData>;
}

const INFLATION_RATE = 0.05; // 5% annual increase for deferred maintenance

function parseCost(costStr: string | undefined): number {
  if (!costStr) return 0;
  const match = costStr.replace(/,/g, "").match(/\$?([\d.]+)/);
  return match ? parseFloat(match[1]) : 0;
}

const CostComparisonTool = ({ pages }: CostComparisonToolProps) => {
  const [deferYears, setDeferYears] = useState("3");

  const pagesWithTiers = useMemo(() => {
    return Object.values(pages).filter((p) => p.tiers && p.tiers.essential);
  }, [pages]);

  const comparison = useMemo(() => {
    const years = parseInt(deferYears);
    return pagesWithTiers.map((page) => {
      const baseCost = parseCost(page.tiers?.essential?.price);
      const deferredCost = baseCost * Math.pow(1 + INFLATION_RATE, years);
      const additionalDamage = page.conditionRating === "Poor" || page.conditionRating === "Critical"
        ? baseCost * 0.3 * years
        : baseCost * 0.1 * years;
      const totalDeferred = deferredCost + additionalDamage;
      return {
        title: page.title,
        condition: page.conditionRating || "unknown",
        costNow: baseCost,
        costDeferred: Math.round(totalDeferred),
        increase: Math.round(totalDeferred - baseCost),
        increasePercent: baseCost > 0 ? Math.round(((totalDeferred - baseCost) / baseCost) * 100) : 0,
      };
    }).filter((c) => c.costNow > 0).sort((a, b) => b.increase - a.increase);
  }, [pagesWithTiers, deferYears]);

  const totalNow = comparison.reduce((s, c) => s + c.costNow, 0);
  const totalDeferred = comparison.reduce((s, c) => s + c.costDeferred, 0);

  if (comparison.length === 0) return null;

  return (
    <div className="max-w-[1400px] mx-auto px-6 md:px-20">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent mb-6">Cost Comparison — Act Now vs. Defer</p>
      <div className="bg-card rounded-lg border border-border shadow-hbc-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-display text-lg text-foreground">What Happens If You Wait?</h3>
            <p className="font-sans text-sm text-muted-foreground">See estimated cost increases from deferring maintenance</p>
          </div>
          <Select value={deferYears} onValueChange={setDeferYears}>
            <SelectTrigger className="w-[140px] font-sans text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Defer 1 year</SelectItem>
              <SelectItem value="2">Defer 2 years</SelectItem>
              <SelectItem value="3">Defer 3 years</SelectItem>
              <SelectItem value="5">Defer 5 years</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 rounded-lg bg-accent/5 border border-accent/20">
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-accent mb-1">Act Now</p>
            <p className="font-display text-2xl text-foreground">${totalNow.toLocaleString()}</p>
          </div>
          <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-destructive mb-1">After {deferYears}yr Deferral</p>
            <p className="font-display text-2xl text-foreground">${totalDeferred.toLocaleString()}</p>
            <p className="font-mono text-[10px] text-destructive">+${(totalDeferred - totalNow).toLocaleString()} more</p>
          </div>
        </div>

        {/* Per-Item Breakdown */}
        <div className="space-y-2">
          {comparison.slice(0, 8).map((item) => (
            <div key={item.title} className="flex items-center gap-3 p-3 rounded-lg border border-border">
              <div className="flex-1 min-w-0">
                <p className="font-sans text-sm text-foreground truncate">{item.title}</p>
                <p className="font-mono text-[10px] text-muted-foreground">
                  Now: ${item.costNow.toLocaleString()} → ${item.costDeferred.toLocaleString()}
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="font-mono text-xs text-destructive font-medium">
                  +{item.increasePercent}%
                </span>
              </div>
            </div>
          ))}
        </div>

        <p className="font-sans text-[10px] text-muted-foreground mt-4 italic">
          * Estimates based on {INFLATION_RATE * 100}% annual cost inflation plus cascading damage risk. Actual costs may vary.
        </p>
      </div>
    </div>
  );
};

export default CostComparisonTool;
