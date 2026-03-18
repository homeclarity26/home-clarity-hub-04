import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface HealthScoreTrendProps {
  clientId: string;
  compact?: boolean;
}

const HealthScoreTrend = ({ clientId, compact }: HealthScoreTrendProps) => {
  const { data: history = [] } = useQuery({
    queryKey: ["health-score-history", clientId],
    queryFn: async () => {
      const { data } = await (supabase.from("health_score_history") as any)
        .select("*")
        .eq("client_id", clientId)
        .order("recorded_at", { ascending: true });
      return data || [];
    },
  });

  if (history.length === 0) {
    return compact ? null : (
      <Card className="p-4 text-center">
        <p className="text-xs font-sans text-muted-foreground">Score trend will appear once reports are published.</p>
      </Card>
    );
  }

  const chartData = history.map((h: any) => ({
    date: new Date(h.recorded_at).toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
    overall: h.overall_score,
    exterior: h.exterior_score,
    interior: h.interior_score,
    systems: h.systems_score,
  }));

  const first = history[0];
  const last = history[history.length - 1];
  const diff = (last?.overall_score || 0) - (first?.overall_score || 0);
  const TrendIcon = diff > 0 ? TrendingUp : diff < 0 ? TrendingDown : Minus;

  return (
    <Card className={compact ? "p-4" : "p-5"}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-sans font-semibold text-foreground">Score Trend</h4>
        {history.length > 1 && (
          <Badge variant={diff > 0 ? "secondary" : diff < 0 ? "destructive" : "outline"} className="text-[10px] gap-1">
            <TrendIcon className="w-3 h-3" />
            {diff > 0 ? "+" : ""}{diff} since first report
          </Badge>
        )}
      </div>
      {history.length === 1 ? (
        <div className="text-center py-4">
          <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-2">
            <span className="text-lg font-sans font-bold text-accent">{first.overall_score}</span>
          </div>
          <p className="text-xs font-sans text-muted-foreground">Score trend will appear after a second report is published.</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={compact ? 140 : 200}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
            <Tooltip />
            <Line type="monotone" dataKey="overall" stroke="hsl(var(--primary))" strokeWidth={2} name="Overall" dot={{ r: 3 }} />
            <Line type="monotone" dataKey="exterior" stroke="hsl(var(--accent))" strokeWidth={1} strokeDasharray="4 2" name="Exterior" />
            <Line type="monotone" dataKey="interior" stroke="hsl(143,55%,45%)" strokeWidth={1} strokeDasharray="4 2" name="Interior" />
            <Line type="monotone" dataKey="systems" stroke="hsl(25,80%,55%)" strokeWidth={1} strokeDasharray="4 2" name="Systems" />
          </LineChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
};

export default HealthScoreTrend;
