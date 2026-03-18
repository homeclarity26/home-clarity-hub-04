import { useState, useEffect } from "react";
import { TrendingUp, Home, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface HomeValueTrackerProps {
  propertyId: string;
  estimatedValue?: number | null;
}

interface ValueEntry {
  id: string;
  estimated_value: number;
  recorded_at: string;
  notes: string | null;
}

interface ValueDriver {
  id: string;
  title: string;
  value_contribution_estimate: number | null;
  status: string;
}

const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

const HomeValueTracker = ({ propertyId, estimatedValue }: HomeValueTrackerProps) => {
  const [history, setHistory] = useState<ValueEntry[]>([]);
  const [drivers, setDrivers] = useState<ValueDriver[]>([]);
  const [neighborhoodMedian, setNeighborhoodMedian] = useState<number | null>(null);

  useEffect(() => {
    if (!propertyId || propertyId.startsWith("mock-")) {
      // Mock data
      setHistory([
        { id: "1", estimated_value: 410000, recorded_at: "2025-06-01", notes: "Initial assessment" },
        { id: "2", estimated_value: 418000, recorded_at: "2025-12-01", notes: "Market update" },
        { id: "3", estimated_value: 425000, recorded_at: "2026-03-01", notes: "Post-improvement estimate" },
      ]);
      setDrivers([
        { id: "1", title: "Furnace Replacement", value_contribution_estimate: 3500, status: "completed" },
        { id: "2", title: "Electrical Panel Upgrade", value_contribution_estimate: 2800, status: "in_progress" },
      ]);
      setNeighborhoodMedian(395000);
      return;
    }

    Promise.all([
      (supabase.from("home_value_history" as any) as any)
        .select("*").eq("property_id", propertyId).order("recorded_at", { ascending: true }),
      (supabase.from("projects") as any)
        .select("id, title, value_contribution_estimate, status")
        .eq("property_id", propertyId)
        .not("value_contribution_estimate", "is", null),
      supabase.from("properties").select("neighborhood_median_value").eq("id", propertyId).single(),
    ]).then(([histRes, projRes, propRes]) => {
      if (histRes.data) setHistory(histRes.data);
      if (projRes.data) setDrivers(projRes.data);
      if (propRes.data) setNeighborhoodMedian((propRes.data as any).neighborhood_median_value);
    });
  }, [propertyId]);

  const currentValue = estimatedValue || (history.length > 0 ? history[history.length - 1].estimated_value : null);
  const previousValue = history.length > 1 ? history[history.length - 2].estimated_value : null;
  const valueChange = currentValue && previousValue ? currentValue - previousValue : null;
  const completedDrivers = drivers.filter(d => d.status === "completed" || d.status === "complete");
  const totalContribution = completedDrivers.reduce((s, d) => s + (d.value_contribution_estimate || 0), 0);

  if (!currentValue) return null;

  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent mb-6">Your Home's Value</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main value card */}
        <div className="bg-card rounded-lg p-8 shadow-hbc-sm border border-border border-l-[3px] border-l-accent">
          <Home className="w-5 h-5 text-accent mb-3" />
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-1">Estimated Value</p>
          <p className="font-display text-3xl text-foreground">{fmt(currentValue)}</p>
          {valueChange !== null && (
            <div className="flex items-center gap-1.5 mt-2">
              <TrendingUp className={`w-3.5 h-3.5 ${valueChange >= 0 ? "text-green-600" : "text-destructive"}`} />
              <span className={`font-mono text-[11px] ${valueChange >= 0 ? "text-green-600" : "text-destructive"}`}>
                {valueChange >= 0 ? "+" : ""}{fmt(valueChange)} since last update
              </span>
            </div>
          )}
          {/* Mini sparkline */}
          {history.length > 1 && (
            <div className="mt-4 flex items-end gap-1 h-8">
              {history.map((h, i) => {
                const min = Math.min(...history.map(v => v.estimated_value));
                const max = Math.max(...history.map(v => v.estimated_value));
                const range = max - min || 1;
                const height = ((h.estimated_value - min) / range) * 100;
                return (
                  <div
                    key={h.id}
                    className={`flex-1 rounded-sm transition-all ${i === history.length - 1 ? "bg-accent" : "bg-accent/30"}`}
                    style={{ height: `${Math.max(15, height)}%` }}
                    title={`${h.recorded_at}: ${fmt(h.estimated_value)}`}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Value Drivers */}
        <div className="bg-card rounded-lg p-8 shadow-hbc-sm border border-border">
          <TrendingUp className="w-5 h-5 text-accent mb-3" />
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-1">Value Drivers</p>
          {completedDrivers.length > 0 ? (
            <>
              <p className="font-display text-xl text-foreground mb-3">+{fmt(totalContribution)}</p>
              <div className="space-y-2">
                {completedDrivers.slice(0, 4).map(d => (
                  <div key={d.id} className="flex items-center justify-between text-sm">
                    <span className="font-sans text-muted-foreground truncate mr-2">{d.title}</span>
                    <span className="font-mono text-[11px] text-foreground whitespace-nowrap">+{fmt(d.value_contribution_estimate || 0)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="font-sans text-sm text-muted-foreground mt-1">Complete projects to track their impact on your home's value.</p>
          )}
        </div>

        {/* Neighborhood */}
        <div className="bg-card rounded-lg p-8 shadow-hbc-sm border border-border">
          <MapPin className="w-5 h-5 text-accent mb-3" />
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-1">Neighborhood Median</p>
          {neighborhoodMedian ? (
            <>
              <p className="font-display text-xl text-foreground">{fmt(neighborhoodMedian)}</p>
              <p className="font-mono text-[11px] text-muted-foreground mt-1">
                Your home is {currentValue >= neighborhoodMedian ? "above" : "below"} median by{" "}
                {fmt(Math.abs(currentValue - neighborhoodMedian))}
              </p>
            </>
          ) : (
            <p className="font-sans text-sm text-muted-foreground mt-1">Neighborhood data coming soon.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomeValueTracker;
