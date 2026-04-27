import { useState, useEffect, useCallback } from "react";
import { TrendingUp, TrendingDown, Home, MapPin, RefreshCw, Info, Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { LineChart, Line, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from "recharts";

interface HomeValueTrackerProps {
  propertyId: string;
  estimatedValue?: number | null;
  propertyAddress?: string;
  city?: string;
  state?: string;
  zip?: string;
  compact?: boolean;
}

interface Snapshot {
  id: string;
  snapshot_date: string;
  estimated_value: number | null;
  low_estimate: number | null;
  high_estimate: number | null;
  price_per_sqft: number | null;
  neighborhood_avg: number | null;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

const pctFmt = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;

const HomeValueTracker = ({
  propertyId,
  estimatedValue,
  propertyAddress,
  city,
  state,
  zip,
  compact = false,
}: HomeValueTrackerProps) => {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showInsights, setShowInsights] = useState(false);

  // Load historical snapshots
  useEffect(() => {
    if (!propertyId || propertyId.startsWith("mock-")) {
      setSnapshots([
        { id: "1", snapshot_date: "2025-06-01", estimated_value: 410000, low_estimate: 385000, high_estimate: 435000, price_per_sqft: 195, neighborhood_avg: 395000 },
        { id: "2", snapshot_date: "2025-09-01", estimated_value: 418000, low_estimate: 392000, high_estimate: 444000, price_per_sqft: 199, neighborhood_avg: 398000 },
        { id: "3", snapshot_date: "2025-12-01", estimated_value: 425000, low_estimate: 400000, high_estimate: 450000, price_per_sqft: 202, neighborhood_avg: 402000 },
        { id: "4", snapshot_date: "2026-03-01", estimated_value: 432000, low_estimate: 406000, high_estimate: 458000, price_per_sqft: 206, neighborhood_avg: 405000 },
      ]);
      return;
    }

    supabase.from("home_value_snapshots")
      .select("*")
      .eq("property_id", propertyId)
      .order("snapshot_date", { ascending: true })
      .then(({ data }: any) => {
        if (data && data.length > 0) setSnapshots(data);
      });
  }, [propertyId]);

  const fetchValue = useCallback(async (force = false) => {
    if (!propertyId || !propertyAddress || propertyId.startsWith("mock-")) return;
    setIsRefreshing(true);
    try {
      const { data, error } = await supabase.functions.invoke("fetch-home-value", {
        body: { property_id: propertyId, address: propertyAddress, city, state, zip, force },
      });
      if (error) throw error;
      if (data && !data.error) {
        // Reload snapshots
        const { data: fresh } = await supabase.from("home_value_snapshots")
          .select("*")
          .eq("property_id", propertyId)
          .order("snapshot_date", { ascending: true });
        if (fresh) setSnapshots(fresh);
      }
    } catch (err) {
      console.error("Failed to fetch value:", err);
    } finally {
      setIsRefreshing(false);
    }
  }, [propertyId, propertyAddress, city, state, zip]);

  // Auto-fetch on mount if no snapshots
  useEffect(() => {
    if (snapshots.length === 0 && propertyAddress && propertyId && !propertyId.startsWith("mock-")) {
      fetchValue(false);
    }
  }, [propertyAddress, propertyId]);

  const fetchAiInsights = async () => {
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-condition-forecast", {
        body: {
          context: `Property at ${propertyAddress || "unknown address"}. Current estimated value: ${fmt(current?.estimated_value || 0)}. Neighborhood average: ${fmt(current?.neighborhood_avg || 0)}. Price per sqft: $${current?.price_per_sqft || 0}. Value trend over ${snapshots.length} data points. Provide insights on what affects this home's value and what the homeowner can do to increase it.`,
          task: "home_value_insights",
        },
      });
      if (data?.text || data?.forecast) {
        setAiInsights(typeof data === "string" ? data : data.text || data.forecast || JSON.stringify(data));
      }
    } catch {
      setAiInsights("Unable to generate insights at this time. Your home's value is influenced by market conditions, property improvements, neighborhood trends, and local economic factors.");
    } finally {
      setAiLoading(false);
    }
  };

  const current = snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;
  const previous = snapshots.length > 1 ? snapshots[snapshots.length - 2] : null;
  const currentValue = current?.estimated_value || estimatedValue || null;
  const valueChange = current?.estimated_value && previous?.estimated_value
    ? current.estimated_value - previous.estimated_value
    : null;
  const valuePct = valueChange && previous?.estimated_value
    ? (valueChange / previous.estimated_value) * 100
    : null;

  const chartData = snapshots
    .filter((s) => s.estimated_value)
    .map((s) => ({
      date: new Date(s.snapshot_date).toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
      value: s.estimated_value,
      neighborhood: s.neighborhood_avg,
    }));

  if (!currentValue && snapshots.length === 0 && !isRefreshing) return null;

  const confidenceRange = current?.low_estimate && current?.high_estimate
    ? { low: current.low_estimate, high: current.high_estimate }
    : null;

  const rangeWidth = confidenceRange ? confidenceRange.high - confidenceRange.low : 0;
  const valuePosPercent = confidenceRange && currentValue
    ? ((currentValue - confidenceRange.low) / rangeWidth) * 100
    : 50;

  return (
    <div className="space-y-4">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent">
        Your Home's Estimated Value
      </p>

      <div className={`grid grid-cols-1 ${compact ? "" : "md:grid-cols-3"} gap-4`}>
        {/* Main Value Card */}
        <Card className="p-6 border-l-[3px] border-l-accent shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <Home className="w-5 h-5 text-accent" />
            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => fetchValue(true)}
                disabled={isRefreshing || propertyId?.startsWith("mock-")}
              >
                <RefreshCw className={`w-3.5 h-3.5 text-muted-foreground ${isRefreshing ? "animate-spin" : ""}`} />
              </Button>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-3.5 h-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs">
                    <p className="font-semibold mb-1">How is this calculated?</p>
                    <p>This estimate uses RentCast's Automated Valuation Model (AVM), which analyzes recent comparable sales, property characteristics, and local market trends. For informational purposes only, not an appraisal.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {isRefreshing && !currentValue ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Fetching estimate...</span>
            </div>
          ) : currentValue ? (
            <>
              <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-0.5">
                Estimated Value
              </p>
              <p className="font-display text-3xl text-foreground">{fmt(currentValue)}</p>
              {valueChange !== null && valuePct !== null && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  {valueChange >= 0 ? (
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5 text-destructive" />
                  )}
                  <span className={`font-mono text-[11px] ${valueChange >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                    {valueChange >= 0 ? "+" : ""}{fmt(valueChange)} ({pctFmt(valuePct)})
                  </span>
                </div>
              )}

              {/* Confidence range bar */}
              {confidenceRange && (
                <div className="mt-4">
                  <div className="flex justify-between text-[9px] font-mono text-muted-foreground mb-1">
                    <span>{fmt(confidenceRange.low)}</span>
                    <span>{fmt(confidenceRange.high)}</span>
                  </div>
                  <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-accent/20 via-accent/50 to-accent/20 rounded-full" />
                    <div
                      className="absolute top-0 w-2.5 h-2.5 bg-accent rounded-full border-2 border-background shadow-sm -translate-x-1/2 -translate-y-[1px]"
                      style={{ left: `${Math.min(Math.max(valuePosPercent, 5), 95)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Sparkline */}
              {chartData.length > 1 && (
                <div className="mt-4 h-12">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <Line type="monotone" dataKey="value" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {current?.snapshot_date && (
                <p className="font-mono text-[9px] text-muted-foreground mt-2">
                  Last updated: {new Date(current.snapshot_date).toLocaleDateString()}
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              {estimatedValue ? `Manual estimate: ${fmt(estimatedValue)}` : "No value data available yet."}
            </p>
          )}
        </Card>

        {/* Neighborhood Comparison */}
        {!compact && (
          <Card className="p-6 shadow-sm">
            <MapPin className="w-5 h-5 text-accent mb-3" />
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-0.5">
              Neighborhood Comparison
            </p>
            {current?.neighborhood_avg ? (
              <>
                <p className="font-display text-xl text-foreground">{fmt(current.neighborhood_avg)}</p>
                <p className="font-mono text-[10px] text-muted-foreground mt-1">Median sale price</p>
                {currentValue && (
                  <div className="mt-3 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Your Home</span>
                      <span className="font-mono font-medium text-foreground">{fmt(currentValue)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Neighborhood Avg</span>
                      <span className="font-mono font-medium text-foreground">{fmt(current.neighborhood_avg)}</span>
                    </div>
                    <div className="flex justify-between text-xs pt-1 border-t border-border">
                      <span className="text-muted-foreground">Difference</span>
                      <span className={`font-mono font-semibold ${currentValue >= current.neighborhood_avg ? "text-emerald-600" : "text-destructive"}`}>
                        {currentValue >= current.neighborhood_avg ? "+" : ""}{fmt(currentValue - current.neighborhood_avg)}
                      </span>
                    </div>
                    {current.price_per_sqft && (
                      <div className="flex justify-between text-xs mt-1">
                        <span className="text-muted-foreground">Price/sqft</span>
                        <span className="font-mono font-medium text-foreground">${current.price_per_sqft.toFixed(0)}</span>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground mt-1">Neighborhood data not yet available.</p>
            )}
          </Card>
        )}

        {/* Value History + AI Insights */}
        {!compact && (
          <Card className="p-6 shadow-sm">
            <TrendingUp className="w-5 h-5 text-accent mb-3" />
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-3">
              Value History
            </p>
            {chartData.length > 1 ? (
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <XAxis dataKey="date" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                    <YAxis hide domain={["dataMin - 10000", "dataMax + 10000"]} />
                    <RechartsTooltip
                      formatter={(value: number) => fmt(value)}
                      labelStyle={{ fontSize: 10 }}
                      contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid hsl(var(--border))" }}
                    />
                    <Line type="monotone" dataKey="value" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ r: 3 }} name="Your Home" />
                    <Line type="monotone" dataKey="neighborhood" stroke="hsl(var(--muted-foreground))" strokeWidth={1} strokeDasharray="4 4" dot={false} name="Neighborhood" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">More data points needed for chart.</p>
            )}

            <Dialog open={showInsights} onOpenChange={setShowInsights}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 text-xs gap-1.5 w-full"
                  onClick={() => { setShowInsights(true); if (!aiInsights) fetchAiInsights(); }}
                >
                  <Sparkles className="w-3 h-3" /> What affects my home's value?
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-base">What Affects Your Home's Value</DialogTitle>
                </DialogHeader>
                {aiLoading ? (
                  <div className="flex items-center gap-2 py-6 justify-center text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" /> Generating insights...
                  </div>
                ) : aiInsights ? (
                  <div className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">{aiInsights}</div>
                ) : (
                  <p className="text-sm text-muted-foreground">Click to generate personalized insights.</p>
                )}
              </DialogContent>
            </Dialog>
          </Card>
        )}
      </div>

      <p className="text-[9px] font-mono text-muted-foreground/60">
        Estimated value powered by RentCast. For informational purposes only, not an appraisal.
      </p>
    </div>
  );
};

export default HomeValueTracker;
