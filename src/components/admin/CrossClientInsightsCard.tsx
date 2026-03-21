import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Brain, TrendingUp, AlertTriangle, Lightbulb, DollarSign, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface InsightsData {
  portfolio_health: string;
  key_insights: string[];
  action_items: string[];
  trends: string[];
  revenue_opportunity: string;
}

const CrossClientInsightsCard = () => {
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-cross-client-insights");
      if (error) throw error;
      setInsights(data);
    } catch (err) {
      console.error("Failed to fetch insights:", err);
    } finally {
      setLoading(false);
    }
  };

  const healthColors: Record<string, string> = {
    excellent: "bg-primary/10 text-primary",
    good: "bg-primary/10 text-primary",
    fair: "bg-accent/20 text-accent-foreground",
    poor: "bg-destructive/10 text-destructive",
  };

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-sans font-semibold text-foreground">AI Portfolio Insights</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchInsights}
          disabled={loading}
          className="ml-auto gap-1.5 text-xs font-sans"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          {insights ? "Refresh" : "Analyze"}
        </Button>
      </div>

      {!insights && !loading && (
        <div className="text-center py-6">
          <Brain className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm font-sans text-muted-foreground">Click "Analyze" to generate cross-client portfolio insights using AI.</p>
        </div>
      )}

      {loading && (
        <div className="text-center py-6">
          <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
          <p className="text-sm font-sans text-muted-foreground">Analyzing your portfolio…</p>
        </div>
      )}

      {insights && !loading && (
        <div className="space-y-4">
          <Badge className={`${healthColors[insights.portfolio_health] || healthColors.fair} border-none font-sans`}>
            Portfolio: {insights.portfolio_health}
          </Badge>

          {/* Key Insights */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Lightbulb className="w-3.5 h-3.5 text-accent" />
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Key Insights</span>
            </div>
            <ul className="space-y-1.5">
              {insights.key_insights.map((insight, i) => (
                <li key={i} className="text-xs font-sans text-foreground leading-relaxed pl-3 border-l-2 border-primary/20">{insight}</li>
              ))}
            </ul>
          </div>

          {/* Action Items */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Action Items</span>
            </div>
            <ul className="space-y-1.5">
              {insights.action_items.map((item, i) => (
                <li key={i} className="text-xs font-sans text-foreground leading-relaxed pl-3 border-l-2 border-destructive/20">{item}</li>
              ))}
            </ul>
          </div>

          {/* Revenue Opportunity */}
          {insights.revenue_opportunity && (
            <div className="bg-primary/5 rounded-md p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <DollarSign className="w-3.5 h-3.5 text-primary" />
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Revenue Opportunity</span>
              </div>
              <p className="text-xs font-sans text-foreground leading-relaxed">{insights.revenue_opportunity}</p>
            </div>
          )}

          {/* Trends */}
          {insights.trends.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <TrendingUp className="w-3.5 h-3.5 text-primary" />
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Trends</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {insights.trends.map((trend, i) => (
                  <Badge key={i} variant="outline" className="text-[10px] font-sans">{trend}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default CrossClientInsightsCard;
