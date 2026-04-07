import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, RefreshCw, Loader2, Minus, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

interface PropertyValueWidgetProps {
  propertyId?: string;
  estimatedValue?: number | null;
}

interface ValueData {
  estimated_value: number | null;
  low_estimate: number | null;
  high_estimate: number | null;
  price_per_sqft: number | null;
  neighborhood_avg: number | null;
  snapshot_date: string | null;
  change_from_last_snapshot: number | null;
  change_percent: number | null;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

const PropertyValueWidget = ({ propertyId, estimatedValue: initialValue }: PropertyValueWidgetProps) => {
  const [data, setData] = useState<ValueData | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [lastFetched, setLastFetched] = useState<string | null>(null);
  const [address, setAddress] = useState<string | null>(null);

  // Load property address + cached value on mount
  useEffect(() => {
    if (!propertyId || propertyId.startsWith("mock-")) return;
    const load = async () => {
      const { data: prop } = await supabase
        .from("properties")
        .select("estimated_value, address, city, state, zip")
        .eq("id", propertyId)
        .single();

      if (prop) {
        setAddress([prop.address, prop.city, prop.state, prop.zip].filter(Boolean).join(", "));
        // Check for today's snapshot
        const today = new Date().toISOString().split("T")[0];
        const { data: snapshot } = await supabase
          .from("home_value_snapshots")
          .select("*")
          .eq("property_id", propertyId)
          .eq("snapshot_date", today)
          .limit(1)
          .maybeSingle();

        if (snapshot) {
          setData({
            estimated_value: snapshot.estimated_value,
            low_estimate: snapshot.low_estimate,
            high_estimate: snapshot.high_estimate,
            price_per_sqft: snapshot.price_per_sqft,
            neighborhood_avg: snapshot.neighborhood_avg,
            snapshot_date: snapshot.snapshot_date,
            change_from_last_snapshot: null,
            change_percent: null,
          });
          setLastFetched(snapshot.snapshot_date);
          // Load AI summary if we have a value
          if (snapshot.estimated_value) {
            loadAiSummary(snapshot.estimated_value, snapshot.low_estimate, snapshot.high_estimate, snapshot.neighborhood_avg, prop.address);
          }
        } else if (prop.estimated_value) {
          setData({
            estimated_value: Number(prop.estimated_value),
            low_estimate: null,
            high_estimate: null,
            price_per_sqft: null,
            neighborhood_avg: null,
            snapshot_date: null,
            change_from_last_snapshot: null,
            change_percent: null,
          });
        }
      }
    };
    load();
  }, [propertyId]);

  const loadAiSummary = async (
    value: number,
    low: number | null,
    high: number | null,
    neighborhoodAvg: number | null,
    addr: string
  ) => {
    setAiLoading(true);
    try {
      const { data: result } = await supabase.functions.invoke("ai-score-explainer", {
        body: {
          type: "home_value",
          value,
          low_estimate: low,
          high_estimate: high,
          neighborhood_avg: neighborhoodAvg,
          address: addr,
        },
      });
      if (result?.explanation) setAiSummary(result.explanation);
    } catch {
      // silent fail — no summary shown
    } finally {
      setAiLoading(false);
    }
  };

  const refresh = async () => {
    if (!propertyId || !address) return;
    setLoading(true);
    try {
      const parts = address.split(", ");
      const { data: result, error } = await supabase.functions.invoke("fetch-home-value", {
        body: {
          property_id: propertyId,
          address: parts[0] || address,
          city: parts[1] || undefined,
          state: parts[2] || undefined,
          zip: parts[3] || undefined,
          force: true,
        },
      });
      if (error) throw error;
      if (result) {
        setData({
          estimated_value: result.estimated_value,
          low_estimate: result.low_estimate,
          high_estimate: result.high_estimate,
          price_per_sqft: result.price_per_sqft,
          neighborhood_avg: result.neighborhood_avg,
          snapshot_date: result.snapshot_date,
          change_from_last_snapshot: result.change_from_last_snapshot,
          change_percent: result.change_percent,
        });
        setLastFetched(new Date().toISOString());
        setAiSummary(null);
        if (result.estimated_value) {
          loadAiSummary(result.estimated_value, result.low_estimate, result.high_estimate, result.neighborhood_avg, parts[0] || address);
        }
      }
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  };

  // Nothing to show
  const displayValue = data?.estimated_value ?? (initialValue ? Number(initialValue) : null);
  if (!displayValue && !loading) return null;

  const change = data?.change_from_last_snapshot;
  const changePct = data?.change_percent;
  const isUp = change && change > 0;
  const isDown = change && change < 0;

  return (
    <Card className="overflow-hidden">
      {/* Main row */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Estimated Home Value</p>
              {displayValue ? (
                <p className="font-display text-2xl text-foreground leading-tight">{fmt(displayValue)}</p>
              ) : (
                <div className="h-8 w-40 bg-muted animate-pulse rounded mt-1" />
              )}

              {/* Change badge */}
              {change !== null && change !== undefined && (
                <div className={`flex items-center gap-1 mt-0.5 ${isUp ? "text-emerald-600" : isDown ? "text-red-500" : "text-muted-foreground"}`}>
                  {isUp ? <TrendingUp className="w-3 h-3" /> : isDown ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                  <span className="font-mono text-[11px]">
                    {isUp ? "+" : ""}{fmt(change)} ({changePct ? `${changePct > 0 ? "+" : ""}${changePct.toFixed(1)}%` : ""}) since last update
                  </span>
                </div>
              )}

              {lastFetched && (
                <p className="text-[10px] font-sans text-muted-foreground mt-0.5">
                  Updated {formatDistanceToNow(new Date(lastFetched), { addSuffix: true })} · Powered by Rentcast
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <Button variant="ghost" size="sm" className="gap-1 text-xs font-sans h-8 px-2" onClick={refresh} disabled={loading}>
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-border/50 bg-muted/30 px-5 py-4 space-y-4">

          {/* Range + comps grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {data?.low_estimate && (
              <div className="bg-background rounded-lg p-3 text-center">
                <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground mb-1">Low Estimate</p>
                <p className="font-display text-base text-foreground">{fmt(data.low_estimate)}</p>
              </div>
            )}
            {data?.high_estimate && (
              <div className="bg-background rounded-lg p-3 text-center">
                <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground mb-1">High Estimate</p>
                <p className="font-display text-base text-foreground">{fmt(data.high_estimate)}</p>
              </div>
            )}
            {data?.price_per_sqft && (
              <div className="bg-background rounded-lg p-3 text-center">
                <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground mb-1">Per Sq Ft</p>
                <p className="font-display text-base text-foreground">{fmt(data.price_per_sqft)}</p>
              </div>
            )}
            {data?.neighborhood_avg && (
              <div className="bg-background rounded-lg p-3 text-center">
                <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground mb-1">Neighborhood Avg</p>
                <p className="font-display text-base text-foreground">{fmt(data.neighborhood_avg)}</p>
              </div>
            )}
          </div>

          {/* AI Summary */}
          <div className="rounded-lg border border-accent/20 bg-accent/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              <p className="font-mono text-[10px] uppercase tracking-wider text-accent">AI Valuation Insight</p>
            </div>
            {aiLoading ? (
              <div className="space-y-2">
                <div className="h-3 bg-accent/10 rounded animate-pulse w-full" />
                <div className="h-3 bg-accent/10 rounded animate-pulse w-4/5" />
                <div className="h-3 bg-accent/10 rounded animate-pulse w-3/5" />
              </div>
            ) : aiSummary ? (
              <p className="font-sans text-sm text-foreground/80 leading-relaxed">{aiSummary}</p>
            ) : (
              <p className="font-sans text-sm text-muted-foreground italic">Refresh the value to generate an AI insight.</p>
            )}
          </div>

          <p className="font-sans text-[10px] text-muted-foreground">
            Estimates are provided by Rentcast's automated valuation model and are for informational purposes only. Actual market value may vary.
          </p>
        </div>
      )}
    </Card>
  );
};

export default PropertyValueWidget;
