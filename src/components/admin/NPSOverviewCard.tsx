import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

interface Survey {
  id: string;
  score: number;
  comment: string | null;
  created_at: string;
  property_id: string;
  snoozed_until: string | null;
}

const NPSOverviewCard = () => {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await (supabase.from("satisfaction_surveys" as any) as any)
        .select("*")
        .is("snoozed_until", null)
        .order("created_at", { ascending: false })
        .limit(50);
      if (data) setSurveys(data as Survey[]);
      setIsLoading(false);
    };
    load();
  }, []);

  if (isLoading || surveys.length === 0) return null;

  const avgScore = surveys.reduce((s, r) => s + r.score, 0) / surveys.length;
  const promoters = surveys.filter((s) => s.score >= 9).length;
  const detractors = surveys.filter((s) => s.score <= 6).length;
  const nps = Math.round(((promoters - detractors) / surveys.length) * 100);
  const recentComments = surveys.filter((s) => s.comment).slice(0, 3);

  return (
    <Card className="p-5">
      <h3 className="text-sm font-sans font-semibold text-foreground mb-3">NPS Overview</h3>
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <p className="text-2xl font-sans font-bold text-foreground">{nps > 0 ? "+" : ""}{nps}</p>
          <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">NPS Score</p>
        </div>
        <div>
          <p className="text-2xl font-sans font-bold text-foreground">{avgScore.toFixed(1)}</p>
          <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Avg Score</p>
        </div>
        <div>
          <p className="text-2xl font-sans font-bold text-foreground">{surveys.length}</p>
          <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Responses</p>
        </div>
      </div>

      {/* Score distribution */}
      <div className="flex gap-0.5 mb-4 h-8">
        {Array.from({ length: 11 }, (_, i) => {
          const count = surveys.filter((s) => s.score === i).length;
          const pct = (count / surveys.length) * 100;
          const color = i <= 6 ? "bg-destructive/60" : i <= 8 ? "bg-accent/60" : "bg-primary/60";
          return (
            <div key={i} className="flex-1 flex flex-col justify-end" title={`${i}: ${count} responses`}>
              <div className={`${color} rounded-t-sm transition-all`} style={{ height: `${Math.max(pct, 4)}%` }} />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-[9px] font-mono text-muted-foreground mb-4">
        <span>0</span><span>5</span><span>10</span>
      </div>

      {recentComments.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-sans font-medium text-foreground">Recent Comments</p>
          {recentComments.map((s) => (
            <div key={s.id} className="bg-muted/50 rounded-md p-2.5">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant={s.score >= 9 ? "default" : s.score <= 6 ? "destructive" : "secondary"} className="text-[10px]">
                  {s.score}/10
                </Badge>
                <span className="text-[10px] font-sans text-muted-foreground">
                  {formatDistanceToNow(new Date(s.created_at), { addSuffix: true })}
                </span>
              </div>
              <p className="text-xs font-sans text-muted-foreground italic">"{s.comment}"</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default NPSOverviewCard;
