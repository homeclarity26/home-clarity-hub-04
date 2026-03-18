import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingDown, TrendingUp, Minus, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Forecast {
  system: string;
  current_condition: string;
  year_1: string;
  year_3: string;
  year_5: string;
  failure_risk: string;
  estimated_cost_5yr: number;
  recommendation: string;
}

interface ForecastData {
  overall_health_trend: string;
  total_5yr_estimated_cost: number;
  forecasts: Forecast[];
  top_priorities: string[];
}

interface ConditionForecastProps {
  propertyId: string;
}

const riskColor: Record<string, string> = {
  low: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  moderate: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  high: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  critical: "bg-destructive/10 text-destructive",
};

const trendIcon: Record<string, React.ReactNode> = {
  improving: <TrendingUp className="w-4 h-4 text-emerald-500" />,
  stable: <Minus className="w-4 h-4 text-muted-foreground" />,
  declining: <TrendingDown className="w-4 h-4 text-orange-500" />,
  critical: <AlertTriangle className="w-4 h-4 text-destructive" />,
};

const ConditionForecast = ({ propertyId }: ConditionForecastProps) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ForecastData | null>(null);
  const [expanded, setExpanded] = useState(false);

  const runForecast = async () => {
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("ai-condition-forecast", {
        body: { propertyId },
      });
      if (error) throw error;
      setData(result.forecast);
      setExpanded(true);
    } catch (err) {
      console.error("Condition forecast error:", err);
      toast.error("Failed to generate condition forecast");
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n.toFixed(0)}`;

  return (
    <Card className="p-4">
      <button onClick={() => data ? setExpanded(!expanded) : runForecast()} className="flex items-center justify-between w-full text-left bg-transparent border-none cursor-pointer">
        <div className="flex items-center gap-2">
          <Badge className="bg-accent/20 text-accent-foreground text-[10px] font-mono border-none">AI</Badge>
          <h4 className="text-sm font-sans font-semibold text-foreground">5-Year Condition Forecast</h4>
          {data && trendIcon[data.overall_health_trend]}
        </div>
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        ) : data ? (
          expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />
        ) : (
          <Badge variant="outline" className="text-[10px] font-sans">Click to generate</Badge>
        )}
      </button>

      {expanded && data && (
        <div className="mt-4 space-y-4">
          <div className="flex items-center gap-4 text-xs font-sans">
            <span className="text-muted-foreground">Overall: <strong className="text-foreground capitalize">{data.overall_health_trend}</strong></span>
            <span className="text-muted-foreground">Est. 5-yr Cost: <strong className="text-foreground">{fmt(data.total_5yr_estimated_cost)}</strong></span>
          </div>

          {data.top_priorities.length > 0 && (
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs font-sans font-semibold text-foreground mb-2">Top Priorities</p>
              <ul className="space-y-1">
                {data.top_priorities.map((p, i) => (
                  <li key={i} className="text-xs font-sans text-muted-foreground flex gap-2">
                    <span className="text-accent font-bold">{i + 1}.</span> {p}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-xs font-sans">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 text-muted-foreground font-medium">System</th>
                  <th className="text-center py-2 text-muted-foreground font-medium">Current</th>
                  <th className="text-center py-2 text-muted-foreground font-medium">1 Year</th>
                  <th className="text-center py-2 text-muted-foreground font-medium">3 Year</th>
                  <th className="text-center py-2 text-muted-foreground font-medium">5 Year</th>
                  <th className="text-center py-2 text-muted-foreground font-medium">Risk</th>
                  <th className="text-right py-2 text-muted-foreground font-medium">5yr Cost</th>
                </tr>
              </thead>
              <tbody>
                {data.forecasts.map((f, i) => (
                  <tr key={i} className="border-b border-border/50 last:border-0">
                    <td className="py-2 font-medium text-foreground">{f.system}</td>
                    <td className="py-2 text-center text-muted-foreground">{f.current_condition}</td>
                    <td className="py-2 text-center text-muted-foreground">{f.year_1}</td>
                    <td className="py-2 text-center text-muted-foreground">{f.year_3}</td>
                    <td className="py-2 text-center text-muted-foreground">{f.year_5}</td>
                    <td className="py-2 text-center">
                      <Badge className={`text-[10px] border-none ${riskColor[f.failure_risk] || ""}`}>{f.failure_risk}</Badge>
                    </td>
                    <td className="py-2 text-right font-mono text-foreground">{fmt(f.estimated_cost_5yr)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Card>
  );
};

export default ConditionForecast;
