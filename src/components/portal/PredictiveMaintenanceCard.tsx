import { useState, useEffect, useMemo } from "react";
import { Shield, ChevronDown, ChevronUp, AlertTriangle, Clock, CheckCircle2, Wrench, RefreshCw, X, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Prediction {
  id: string;
  system_type: string;
  prediction_type: string;
  probability_score: number;
  predicted_timeframe: string;
  confidence_level: string;
  reasoning: any[];
  estimated_cost_low: number;
  estimated_cost_high: number;
  status: string;
  equipment_id: string | null;
  generated_at: string;
}

const TIMEFRAME_ORDER = ["immediate", "3_months", "6_months", "1_year", "2_years", "3_years", "5_years"];
const TIMEFRAME_LABELS: Record<string, string> = {
  immediate: "Immediate",
  "3_months": "3 Months",
  "6_months": "6 Months",
  "1_year": "1 Year",
  "2_years": "2 Years",
  "3_years": "3 Years",
  "5_years": "5 Years",
};

const SYSTEM_ICONS: Record<string, string> = {
  HVAC: "🌡️", Roof: "🏠", Plumbing: "🔧", Electrical: "⚡",
  "Kitchen Appliances": "🍳", Foundation: "🧱", Exterior: "🏡",
  Windows: "🪟", Insulation: "🧤", "Water Heater": "💧",
};

function getUrgencyColor(probability: number, timeframe: string): string {
  const idx = TIMEFRAME_ORDER.indexOf(timeframe);
  if (probability >= 75 && idx <= 2) return "text-destructive";
  if (probability >= 50 && idx <= 4) return "text-amber-500";
  return "text-emerald-500";
}

function getUrgencyBg(probability: number, timeframe: string): string {
  const idx = TIMEFRAME_ORDER.indexOf(timeframe);
  if (probability >= 75 && idx <= 2) return "bg-destructive/10 border-destructive/20";
  if (probability >= 50 && idx <= 4) return "bg-amber-500/10 border-amber-500/20";
  return "bg-emerald-500/10 border-emerald-500/20";
}

function ProbabilityGauge({ score }: { score: number }) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 75 ? "stroke-destructive" : score >= 50 ? "stroke-amber-500" : "stroke-emerald-500";

  return (
    <div className="relative w-16 h-16 flex-shrink-0">
      <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={radius} fill="none" stroke="currentColor" className="text-border" strokeWidth="4" />
        <circle cx="32" cy="32" r={radius} fill="none" className={color} strokeWidth="4"
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-mono text-xs font-bold text-foreground">
        {score}%
      </span>
    </div>
  );
}

export default function PredictiveMaintenanceCard({ propertyId, clientId }: { propertyId: string; clientId?: string }) {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!clientId || propertyId?.startsWith("mock-")) {
      setLoading(false);
      return;
    }
    loadPredictions();
  }, [clientId]);

  const loadPredictions = async () => {
    if (!clientId) return;
    setLoading(true);
    const { data } = await (supabase.from("maintenance_predictions" as any) as any)
      .select("*")
      .eq("client_id", clientId)
      .eq("status", "active")
      .order("probability_score", { ascending: false });
    setPredictions(data || []);
    setLoading(false);
  };

  const handleGenerate = async () => {
    if (!clientId) return;
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-predictions", {
        body: { client_id: clientId },
      });
      if (error) throw error;
      toast.success(`Generated ${data.count} predictions`);
      await loadPredictions();
    } catch (e: any) {
      toast.error(e.message || "Failed to generate predictions");
    } finally {
      setGenerating(false);
    }
  };

  const handleDismiss = async (id: string) => {
    await (supabase.from("maintenance_predictions" as any) as any)
      .update({ status: "dismissed" })
      .eq("id", id);
    setPredictions(prev => prev.filter(p => p.id !== id));
    toast.success("Prediction dismissed");
  };

  const activePredictions = predictions.filter(p => p.status === "active");

  // Cost summaries
  const costSummary = useMemo(() => {
    const by1 = activePredictions.filter(p => TIMEFRAME_ORDER.indexOf(p.predicted_timeframe) <= 3);
    const by3 = activePredictions.filter(p => TIMEFRAME_ORDER.indexOf(p.predicted_timeframe) <= 5);
    const by5 = activePredictions;
    return {
      year1: { low: by1.reduce((s, p) => s + (p.estimated_cost_low || 0), 0), high: by1.reduce((s, p) => s + (p.estimated_cost_high || 0), 0) },
      year3: { low: by3.reduce((s, p) => s + (p.estimated_cost_low || 0), 0), high: by3.reduce((s, p) => s + (p.estimated_cost_high || 0), 0) },
      year5: { low: by5.reduce((s, p) => s + (p.estimated_cost_low || 0), 0), high: by5.reduce((s, p) => s + (p.estimated_cost_high || 0), 0) },
    };
  }, [activePredictions]);

  // Timeline dots
  const timelineDots = useMemo(() => {
    return TIMEFRAME_ORDER.map(tf => ({
      timeframe: tf,
      label: TIMEFRAME_LABELS[tf],
      predictions: activePredictions.filter(p => p.predicted_timeframe === tf),
    }));
  }, [activePredictions]);

  if (propertyId?.startsWith("mock-")) {
    return null; // No mock data for this feature
  }

  return (
    <div className="bg-card rounded-lg border border-border shadow-hbc-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary)/0.8)] p-6 text-primary-foreground">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5" />
            <div>
              <h2 className="font-display text-lg">Predictive Maintenance</h2>
              <p className="text-sm opacity-80">AI-powered forecasts for your home</p>
            </div>
          </div>
          {!loading && activePredictions.length === 0 && (
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white/20 hover:bg-white/30 text-sm font-mono uppercase tracking-wider transition-colors disabled:opacity-50"
            >
              {generating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Activity className="w-3.5 h-3.5" />}
              {generating ? "Analyzing..." : "Generate"}
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center">
          <RefreshCw className="w-5 h-5 animate-spin mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Loading predictions...</p>
        </div>
      ) : activePredictions.length === 0 ? (
        <div className="p-8 text-center">
          <Shield className="w-8 h-8 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">No predictions yet. Your advisor will generate them during your next review.</p>
        </div>
      ) : (
        <div className="p-6 space-y-6">
          {/* Cost Summary */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "1 Year", ...costSummary.year1 },
              { label: "3 Years", ...costSummary.year3 },
              { label: "5 Years", ...costSummary.year5 },
            ].map(s => (
              <div key={s.label} className="bg-muted/30 rounded-lg p-3 text-center">
                <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{s.label}</p>
                <p className="font-display text-lg text-foreground">
                  ${s.low.toLocaleString()}
                  <span className="text-muted-foreground text-sm">–${s.high.toLocaleString()}</span>
                </p>
              </div>
            ))}
          </div>

          {/* Timeline */}
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-3">5-Year Timeline</p>
            <div className="relative flex items-center justify-between h-8">
              <div className="absolute inset-x-0 top-1/2 h-px bg-border" />
              {timelineDots.map(td => (
                <div key={td.timeframe} className="relative flex flex-col items-center z-10">
                  {td.predictions.length > 0 ? (
                    <div className="flex -space-x-1">
                      {td.predictions.slice(0, 3).map((p, i) => (
                        <div key={p.id}
                          className={`w-3 h-3 rounded-full border-2 border-card ${
                            getUrgencyColor(p.probability_score, p.predicted_timeframe).replace("text-", "bg-")
                          }`}
                          style={{ zIndex: 3 - i }}
                        />
                      ))}
                      {td.predictions.length > 3 && (
                        <span className="text-[9px] text-muted-foreground ml-1">+{td.predictions.length - 3}</span>
                      )}
                    </div>
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-border" />
                  )}
                  <span className="text-[9px] text-muted-foreground mt-1 whitespace-nowrap">{td.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Prediction Cards */}
          <div className="space-y-3">
            {activePredictions.map(pred => {
              const isExpanded = expanded[pred.id];
              const reasons = Array.isArray(pred.reasoning) ? pred.reasoning : [];
              return (
                <div key={pred.id} className={`rounded-lg border p-4 ${getUrgencyBg(pred.probability_score, pred.predicted_timeframe)}`}>
                  <div className="flex items-start gap-3">
                    <ProbabilityGauge score={pred.probability_score} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base">{SYSTEM_ICONS[pred.system_type] || "🔩"}</span>
                        <h3 className="font-display text-sm text-foreground truncate">{pred.system_type}</h3>
                        <span className={`font-mono text-[9px] uppercase px-1.5 py-0.5 rounded ${
                          pred.prediction_type === "replacement" ? "bg-destructive/10 text-destructive" :
                          pred.prediction_type === "service" ? "bg-amber-500/10 text-amber-600" :
                          "bg-blue-500/10 text-blue-600"
                        }`}>
                          {pred.prediction_type}
                        </span>
                        <span className="font-mono text-[9px] uppercase text-muted-foreground ml-auto">
                          {pred.confidence_level} conf.
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {TIMEFRAME_LABELS[pred.predicted_timeframe]}
                        </span>
                        <span>
                          ${pred.estimated_cost_low?.toLocaleString()}–${pred.estimated_cost_high?.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <button onClick={() => handleDismiss(pred.id)} className="p-1 text-muted-foreground/40 hover:text-muted-foreground transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Expandable reasoning */}
                  {reasons.length > 0 && (
                    <div className="mt-3">
                      <button
                        onClick={() => setExpanded(prev => ({ ...prev, [pred.id]: !isExpanded }))}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors bg-transparent border-none cursor-pointer"
                      >
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        Why we're predicting this
                      </button>
                      {isExpanded && (
                        <div className="mt-2 space-y-1.5 pl-4 border-l-2 border-border">
                          {reasons.map((r: any, i: number) => (
                            <div key={i} className="flex items-start gap-2">
                              <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                                r.impact === "high" ? "bg-destructive" : r.impact === "medium" ? "bg-amber-500" : "bg-emerald-500"
                              }`} />
                              <div>
                                <span className="text-xs font-medium text-foreground">{r.factor}:</span>{" "}
                                <span className="text-xs text-muted-foreground">{r.detail}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
