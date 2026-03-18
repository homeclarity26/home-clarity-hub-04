import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, RefreshCw, AlertTriangle, Lightbulb, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface AIClientInsightsCardProps {
  propertyId: string;
  clientData: Record<string, any>;
}

const TYPE_CONFIG = {
  risk: { icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/5", badge: "destructive" as const },
  opportunity: { icon: Lightbulb, color: "text-accent", bg: "bg-accent/5", badge: "default" as const },
  info: { icon: Info, color: "text-muted-foreground", bg: "bg-muted", badge: "secondary" as const },
};

const AIClientInsightsCard = ({ propertyId, clientData }: AIClientInsightsCardProps) => {
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: existing } = useQuery({
    queryKey: ["ai-client-insights", propertyId],
    queryFn: async () => {
      const { data } = await (supabase.from("ai_client_insights") as any).select("*").eq("client_id", propertyId).order("generated_at", { ascending: false }).limit(1);
      return data?.[0] || null;
    },
  });

  const generate = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-client-insights", { body: { clientData } });
      if (error) throw error;

      await (supabase.from("ai_client_insights") as any).insert({
        client_id: propertyId,
        insights_json: data.insights || [],
      });
      queryClient.invalidateQueries({ queryKey: ["ai-client-insights", propertyId] });
      toast.success("Insights generated");
    } catch (e: any) {
      toast.error(e.message || "Failed to generate insights");
    }
    setIsGenerating(false);
  };

  const insights = existing?.insights_json || [];

  return (
    <Card className="p-5 border-l-[3px] border-l-accent">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-semibold text-foreground">AI Insights</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={generate} disabled={isGenerating} className="gap-1 text-xs">
          {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          {insights.length === 0 ? "Generate" : "Refresh"}
        </Button>
      </div>

      {insights.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">Click Generate to get AI-powered insights about this client.</p>
      ) : (
        <div className="space-y-2">
          {insights.map((insight: any, i: number) => {
            const config = TYPE_CONFIG[insight.type as keyof typeof TYPE_CONFIG] || TYPE_CONFIG.info;
            const Icon = config.icon;
            return (
              <div key={i} className={`p-3 rounded-lg ${config.bg}`}>
                <div className="flex items-start gap-2">
                  <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${config.color}`} />
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-medium text-foreground">{insight.title}</p>
                      <Badge variant={config.badge} className="text-[10px] h-4">{insight.type}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{insight.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};

export default AIClientInsightsCard;
