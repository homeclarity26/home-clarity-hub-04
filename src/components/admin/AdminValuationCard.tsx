import { useState, useEffect, useCallback } from "react";
import { RefreshCw, TrendingUp, TrendingDown, Home, Info, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from "recharts";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

interface AdminValuationCardProps {
  propertyId: string;
  address: string;
  estimatedValue?: number | null;
  city?: string;
  state?: string;
  zip?: string;
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

const AdminValuationCard = ({ propertyId, address, estimatedValue, city, state, zip }: AdminValuationCardProps) => {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!propertyId) return;
    (supabase.from("home_value_snapshots") as any)
      .select("*")
      .eq("property_id", propertyId)
      .order("snapshot_date", { ascending: true })
      .then(({ data }: any) => { if (data) setSnapshots(data); });
  }, [propertyId]);

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("fetch-home-value", {
        body: { property_id: propertyId, address, city, state, zip, force: true },
      });
      if (error) throw error;
      // Reload snapshots
      const { data: fresh } = await (supabase.from("home_value_snapshots") as any)
        .select("*")
        .eq("property_id", propertyId)
        .order("snapshot_date", { ascending: true });
      if (fresh) setSnapshots(fresh);
    } catch (err) {
      console.error("Refresh failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const current = snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;
  const previous = snapshots.length > 1 ? snapshots[snapshots.length - 2] : null;
  const price = current?.estimated_value;
  const valueChange = price && previous?.estimated_value ? price - previous.estimated_value : null;
  const valuePct = valueChange && previous?.estimated_value ? (valueChange / previous.estimated_value) * 100 : null;

  const chartData = snapshots
    .filter((s) => s.estimated_value)
    .map((s) => ({
      date: new Date(s.snapshot_date).toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
      value: s.estimated_value,
    }));

  const confidenceRange = current?.low_estimate && current?.high_estimate
    ? { low: current.low_estimate, high: current.high_estimate }
    : null;
  const rangeWidth = confidenceRange ? confidenceRange.high - confidenceRange.low : 0;
  const valuePosPercent = confidenceRange && price
    ? ((price - confidenceRange.low) / rangeWidth) * 100
    : 50;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Home className="w-5 h-5 text-accent" />
          <h3 className="font-sans font-semibold text-foreground">Property Valuation</h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
          className="gap-1.5 font-mono text-[10px] uppercase tracking-wider"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          {price ? "Refresh" : "Fetch"}
        </Button>
      </div>

      {price ? (
        <div className="space-y-4">
          {/* Hero value */}
          <div>
            <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Estimated Value</p>
            <p className="font-display text-2xl text-foreground">{fmt(price)}</p>
            {valueChange !== null && valuePct !== null && (
              <div className="flex items-center gap-1.5 mt-1">
                {valueChange >= 0 ? (
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 text-destructive" />
                )}
                <span className={`font-mono text-[11px] ${valueChange >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                  {valueChange >= 0 ? "+" : ""}{fmt(valueChange)} ({valuePct >= 0 ? "+" : ""}{valuePct.toFixed(1)}%)
                </span>
                <span className="text-[9px] text-muted-foreground">vs last snapshot</span>
              </div>
            )}
          </div>

          {/* Confidence range bar */}
          {confidenceRange && (
            <div>
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
            <div className="h-16">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="date" tick={{ fontSize: 8 }} tickLine={false} axisLine={false} />
                  <YAxis hide domain={["dataMin - 5000", "dataMax + 5000"]} />
                  <RechartsTooltip
                    formatter={(value: number) => fmt(value)}
                    contentStyle={{ fontSize: 10, borderRadius: 6 }}
                  />
                  <Line type="monotone" dataKey="value" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ r: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Extra stats */}
          <div className="flex gap-6 text-xs">
            {current?.low_estimate && current?.high_estimate && (
              <>
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Low</p>
                  <p className="font-sans text-sm text-foreground">{fmt(current.low_estimate)}</p>
                </div>
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">High</p>
                  <p className="font-sans text-sm text-foreground">{fmt(current.high_estimate)}</p>
                </div>
              </>
            )}
            {current?.price_per_sqft && (
              <div>
                <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">$/sqft</p>
                <p className="font-sans text-sm text-foreground">${current.price_per_sqft.toFixed(0)}</p>
              </div>
            )}
            {current?.neighborhood_avg && (
              <div>
                <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Neighborhood</p>
                <p className="font-sans text-sm text-foreground">{fmt(current.neighborhood_avg)}</p>
              </div>
            )}
          </div>

          {current?.snapshot_date && (
            <p className="font-mono text-[9px] text-muted-foreground">
              Last updated: {new Date(current.snapshot_date).toLocaleDateString()} · Powered by RentCast
            </p>
          )}
        </div>
      ) : (
        <p className="font-sans text-sm text-muted-foreground">
          {isLoading
            ? "Fetching valuation..."
            : estimatedValue
              ? `Manual estimate: ${fmt(estimatedValue)}. Click Fetch for live data.`
              : "Click 'Fetch' to get a RentCast AVM estimate."}
        </p>
      )}
    </Card>
  );
};

export default AdminValuationCard;
