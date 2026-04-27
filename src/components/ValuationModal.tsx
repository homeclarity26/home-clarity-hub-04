import { useMemo } from "react";
import { Info, MapPin, Home, TrendingUp, RefreshCw, ExternalLink } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { PropertyValuation } from "@/hooks/usePropertyValuation";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

const fmtDate = (d: string) => {
  try {
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch { return d; }
};

interface ValuationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  valuation: PropertyValuation | null;
  onRefresh: () => void;
  isRefreshing: boolean;
  // HBC internal data
  valueHistory?: Array<{ estimated_value: number; recorded_at: string }>;
  valueDrivers?: Array<{ title: string; value_contribution_estimate: number | null }>;
  neighborhoodMedian?: number | null;
}

const ValuationModal = ({
  open,
  onOpenChange,
  valuation,
  onRefresh,
  isRefreshing,
  valueHistory,
  valueDrivers,
  neighborhoodMedian,
}: ValuationModalProps) => {
  const price = valuation?.price ?? null;
  const price_range_low = valuation?.price_range_low ?? null;
  const price_range_high = valuation?.price_range_high ?? null;
  const sp = valuation?.subject_property ?? {};
  const comparables = valuation?.comparables ?? [];

  const confidence = useMemo(() => {
    if (!price || !price_range_low || !price_range_high) return null;
    const spread = price_range_high - price_range_low;
    const pct = (spread / price) * 100;
    if (pct < 10) return { label: "High Confidence", color: "text-emerald-600 bg-emerald-50" };
    if (pct < 20) return { label: "Moderate Confidence", color: "text-amber-600 bg-amber-50" };
    return { label: "Low Confidence", color: "text-red-600 bg-red-50" };
  }, [price, price_range_low, price_range_high]);

  const appreciation = useMemo(() => {
    if (!price || !sp?.lastSalePrice) return null;
    const pct = ((price - sp.lastSalePrice) / sp.lastSalePrice) * 100;
    return pct;
  }, [price, sp]);

  const rangePercent = useMemo(() => {
    if (!price || !price_range_low || !price_range_high) return 50;
    const range = price_range_high - price_range_low;
    if (range === 0) return 50;
    return ((price - price_range_low) / range) * 100;
  }, [price, price_range_low, price_range_high]);

  const sortedComps = useMemo(() => {
    if (!comparables) return [];
    return [...comparables]
      .sort((a, b) => (b.correlation || 0) - (a.correlation || 0))
      .slice(0, 5);
  }, [comparables]);

  const completedDrivers = valueDrivers?.filter((d) => d.value_contribution_estimate && d.value_contribution_estimate > 0) || [];

  if (!valuation) return null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[92vh] overflow-y-auto">
        <DrawerHeader className="text-center pb-2 border-b border-border">
          <div className="flex items-center justify-center gap-2 mb-1">
            <MapPin className="w-4 h-4 text-accent" />
            <DrawerTitle className="font-display text-lg">{valuation.address}</DrawerTitle>
          </div>
          <DrawerDescription className="flex items-center justify-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Updated {fmtDate(valuation.fetched_at)}
            </span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-3.5 h-3.5 text-muted-foreground/50" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-xs">
                  This estimate is powered by Rentcast's Automated Valuation Model (AVM) using recent comparable sales, your property's characteristics, and local market data.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {valuation._stale && (
              <span className="font-mono text-[9px] uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                Cached
              </span>
            )}
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-6 py-6 space-y-8 max-w-2xl mx-auto w-full">
          {/* Valuation Summary */}
          {price && (
            <section className="text-center space-y-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">
                  Estimated Market Value
                </p>
                <p className="font-display text-4xl text-foreground">{fmt(price)}</p>
                {confidence && (
                  <span className={`font-mono text-[9px] uppercase px-2.5 py-1 rounded-full mt-2 inline-block ${confidence.color}`}>
                    {confidence.label}
                  </span>
                )}
              </div>

              {/* Range bar */}
              {price_range_low && price_range_high && (
                <div className="space-y-2">
                  <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                    Estimated Value Range
                  </p>
                  <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-accent/30 via-accent to-accent/30 rounded-full"
                      style={{ width: "100%" }}
                    />
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-accent rounded-full border-2 border-background shadow-md"
                      style={{ left: `${Math.max(5, Math.min(95, rangePercent))}%`, transform: "translate(-50%, -50%)" }}
                    />
                  </div>
                  <div className="flex justify-between">
                    <span className="font-mono text-[10px] text-muted-foreground">{fmt(price_range_low)}</span>
                    <span className="font-mono text-[10px] text-muted-foreground">{fmt(price_range_high)}</span>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Your Property */}
          {sp && Object.keys(sp).length > 0 && (
            <section>
              <h3 className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent mb-4 flex items-center gap-2">
                <Home className="w-4 h-4" /> Your Property
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {sp.propertyType && (
                  <DataCell label="Property Type" value={sp.propertyType.replace(/_/g, " ")} />
                )}
                {sp.bedrooms != null && sp.bathrooms != null && (
                  <DataCell label="Bed / Bath" value={`${sp.bedrooms} bed / ${sp.bathrooms} bath`} />
                )}
                {sp.squareFootage != null && (
                  <DataCell label="Square Footage" value={sp.squareFootage.toLocaleString() + " sq ft"} />
                )}
                {sp.lotSize != null && (
                  <DataCell label="Lot Size" value={`${sp.lotSize.toLocaleString()} sq ft (${(sp.lotSize / 43560).toFixed(2)} acres)`} />
                )}
                {sp.yearBuilt != null && (
                  <DataCell label="Year Built" value={String(sp.yearBuilt)} />
                )}
                {sp.lastSalePrice != null && (
                  <DataCell
                    label="Last Sale Price"
                    value={fmt(sp.lastSalePrice)}
                    sub={sp.lastSaleDate ? fmtDate(sp.lastSaleDate) : undefined}
                  />
                )}
              </div>
              {appreciation !== null && (
                <div className="mt-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg px-4 py-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span className="font-sans text-sm text-emerald-700 dark:text-emerald-400">
                    Your home has appreciated <strong>{appreciation.toFixed(1)}%</strong> since purchase
                  </span>
                </div>
              )}
            </section>
          )}

          {/* How We Calculated */}
          {sp && price && (
            <section>
              <h3 className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent mb-3">How We Calculated This</h3>
              <p className="font-sans text-sm text-muted-foreground leading-relaxed">
                This estimate is based on {sortedComps.length} comparable home sale{sortedComps.length !== 1 ? "s" : ""} near your property, weighted by similarity in size, age, condition, and proximity.
                {sp.bedrooms && sp.squareFootage && sp.yearBuilt && (
                  <> Your home's unique characteristics (including {sp.bedrooms} bedroom{sp.bedrooms !== 1 ? "s" : ""}, {sp.squareFootage.toLocaleString()} sq ft, and a {sp.yearBuilt} build year) were used to fine-tune the estimate against these comps.</>
                )}
              </p>
            </section>
          )}

          {/* Comparable Sales */}
          {sortedComps.length > 0 && (
            <section>
              <h3 className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent mb-4">Comparable Sales</h3>
              <div className="space-y-3">
                {sortedComps.map((comp, i) => (
                  <div key={i} className="bg-card rounded-lg p-4 border border-border shadow-hbc-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-sans text-sm text-foreground truncate">
                          {comp.formattedAddress || comp.address || "Comparable Property"}
                        </p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
                          {comp.price != null && (
                            <span className="font-mono text-[11px] font-medium text-foreground">{fmt(comp.price)}</span>
                          )}
                          {comp.bedrooms != null && comp.bathrooms != null && (
                            <span className="font-mono text-[10px] text-muted-foreground">
                              {comp.bedrooms}bd / {comp.bathrooms}ba
                            </span>
                          )}
                          {comp.squareFootage != null && (
                            <span className="font-mono text-[10px] text-muted-foreground">
                              {comp.squareFootage.toLocaleString()} sq ft
                            </span>
                          )}
                          {comp.distance != null && (
                            <span className="font-mono text-[10px] text-muted-foreground">
                              {comp.distance.toFixed(2)} mi away
                            </span>
                          )}
                          {comp.daysOnMarket != null && (
                            <span className="font-mono text-[10px] text-muted-foreground">
                              {comp.daysOnMarket} DOM
                            </span>
                          )}
                          {(comp.lastSaleDate || comp.listedDate) && (
                            <span className="font-mono text-[10px] text-muted-foreground">
                              {fmtDate(comp.lastSaleDate || comp.listedDate || "")}
                            </span>
                          )}
                        </div>
                      </div>
                      {comp.correlation != null && (
                        <span className="font-mono text-[10px] font-medium px-2 py-1 rounded-full bg-accent/10 text-accent whitespace-nowrap">
                          {Math.round(comp.correlation * 100)}% match
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* HBC Value Drivers */}
          {(completedDrivers.length > 0 || (valueHistory && valueHistory.length > 1) || neighborhoodMedian) && (
            <section>
              <h3 className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent mb-4">
                HBC Value Drivers
              </h3>

              {/* Sparkline */}
              {valueHistory && valueHistory.length > 1 && (
                <div className="mb-4">
                  <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground mb-2">Value History</p>
                  <div className="flex items-end gap-1 h-10">
                    {valueHistory.map((h, i) => {
                      const min = Math.min(...valueHistory.map((v) => v.estimated_value));
                      const max = Math.max(...valueHistory.map((v) => v.estimated_value));
                      const range = max - min || 1;
                      const height = ((h.estimated_value - min) / range) * 100;
                      return (
                        <div
                          key={i}
                          className={`flex-1 rounded-sm ${i === valueHistory.length - 1 ? "bg-accent" : "bg-accent/30"}`}
                          style={{ height: `${Math.max(15, height)}%` }}
                          title={`${h.recorded_at}: ${fmt(h.estimated_value)}`}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {completedDrivers.length > 0 && (
                <div className="space-y-2 mb-4">
                  {completedDrivers.map((d, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="font-sans text-muted-foreground truncate mr-2">{d.title}</span>
                      <span className="font-mono text-[11px] text-foreground whitespace-nowrap">
                        +{fmt(d.value_contribution_estimate!)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {neighborhoodMedian && price && (
                <div className="bg-card rounded-lg p-4 border border-border flex items-center justify-between">
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Neighborhood Median</p>
                    <p className="font-display text-lg text-foreground">{fmt(neighborhoodMedian)}</p>
                  </div>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {price >= neighborhoodMedian ? "Above" : "Below"} by {fmt(Math.abs(price - neighborhoodMedian))}
                  </span>
                </div>
              )}
            </section>
          )}

          {/* Footer */}
          <div className="border-t border-border pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[9px] text-muted-foreground">
                Last refreshed: {fmtDate(valuation.fetched_at)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={isRefreshing}
                className="font-mono text-[10px] uppercase tracking-wider gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
                Refresh Estimate
              </Button>
            </div>
            <p className="font-sans text-[10px] text-muted-foreground/60 text-center italic">
              This estimate is provided for informational purposes only and is not a formal appraisal.
            </p>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

function DataCell({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-muted/30 rounded-lg px-4 py-3">
      <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground mb-0.5">{label}</p>
      <p className="font-sans text-sm text-foreground capitalize">{value}</p>
      {sub && <p className="font-mono text-[9px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

export default ValuationModal;
