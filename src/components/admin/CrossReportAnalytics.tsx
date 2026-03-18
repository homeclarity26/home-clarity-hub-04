import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const RATING_SCORES: Record<string, number> = {
  Excellent: 5, Good: 4, Fair: 3, Poor: 2, Critical: 1,
};

const ratingColors: Record<string, string> = {
  Excellent: "bg-emerald-100 text-emerald-700",
  Good: "bg-blue-100 text-blue-700",
  Fair: "bg-amber-100 text-amber-700",
  Poor: "bg-orange-100 text-orange-700",
  Critical: "bg-destructive/10 text-destructive",
};

const CrossReportAnalytics = () => {
  const { data: analytics } = useQuery({
    queryKey: ["cross-report-analytics"],
    queryFn: async () => {
      const { data: pages } = await supabase
        .from("report_pages")
        .select("page_key, title, condition_rating, group_name")
        .not("condition_rating", "is", null);
      if (!pages) return [];

      // Group by page_key and calculate distribution
      const bySystem = new Map<string, { title: string; ratings: string[]; group: string }>();
      for (const p of pages) {
        if (!bySystem.has(p.page_key)) {
          bySystem.set(p.page_key, { title: p.title, ratings: [], group: p.group_name });
        }
        bySystem.get(p.page_key)!.ratings.push(p.condition_rating!);
      }

      return Array.from(bySystem.entries())
        .filter(([, data]) => data.ratings.length >= 2)
        .map(([key, data]) => {
          const dist: Record<string, number> = {};
          data.ratings.forEach((r) => { dist[r] = (dist[r] || 0) + 1; });
          const avgScore = data.ratings.reduce((s, r) => s + (RATING_SCORES[r] || 3), 0) / data.ratings.length;
          const avgRating = avgScore >= 4.5 ? "Excellent" : avgScore >= 3.5 ? "Good" : avgScore >= 2.5 ? "Fair" : avgScore >= 1.5 ? "Poor" : "Critical";
          return { key, title: data.title, group: data.group, count: data.ratings.length, distribution: dist, avgRating };
        })
        .sort((a, b) => b.count - a.count);
    },
  });

  if (!analytics || analytics.length === 0) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <BarChart3 className="w-4 h-4" />
          <span className="text-sm font-sans">Cross-report analytics available after 2+ reports with rated pages.</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-muted-foreground" />
        <h4 className="text-sm font-sans font-semibold">Cross-Report Analytics</h4>
        <Badge variant="outline" className="text-[10px]">{analytics.length} systems tracked</Badge>
      </div>
      <div className="space-y-2">
        {analytics.slice(0, 10).map((sys) => (
          <div key={sys.key} className="flex items-center gap-3 text-xs font-sans">
            <span className="w-36 truncate font-medium">{sys.title}</span>
            <Badge className={`${ratingColors[sys.avgRating]} text-[9px] border-none`}>{sys.avgRating}</Badge>
            <div className="flex-1 flex items-center gap-1">
              {Object.entries(sys.distribution).map(([rating, count]) => (
                <span key={rating} className="text-[9px] text-muted-foreground">
                  {rating}: {count}
                </span>
              ))}
            </div>
            <span className="text-[9px] text-muted-foreground font-mono">{sys.count} reports</span>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default CrossReportAnalytics;
