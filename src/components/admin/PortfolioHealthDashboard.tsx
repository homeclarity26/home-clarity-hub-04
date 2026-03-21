import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle, Users, Activity } from "lucide-react";
import type { AdminClient } from "@/hooks/useAdminData";
import { computeClientHealthScore, getHealthLevel, getHealthLabel, getHealthBgColor } from "@/lib/clientHealthScore";

interface PortfolioHealthDashboardProps {
  clients: AdminClient[];
}

const PortfolioHealthDashboard = ({ clients }: PortfolioHealthDashboardProps) => {
  const analytics = useMemo(() => {
    if (!clients.length) return null;

    const scores = clients.map((c) => ({
      client: c,
      ...computeClientHealthScore(c),
    }));

    const avgScore = Math.round(scores.reduce((s, sc) => s + sc.total, 0) / scores.length);
    const distribution = { excellent: 0, good: 0, fair: 0, poor: 0, critical: 0 };
    scores.forEach((s) => { distribution[getHealthLevel(s.total)]++; });

    const atRisk = scores.filter((s) => s.total < 50).sort((a, b) => a.total - b.total);
    const topPerformers = scores.filter((s) => s.total >= 85).sort((a, b) => b.total - a.total);

    // Weakest dimensions across portfolio
    const dims = { reportCompletion: 0, reportStatus: 0, messageEngagement: 0, issueFlags: 0, onboarding: 0 };
    scores.forEach((s) => {
      dims.reportCompletion += s.reportCompletion;
      dims.reportStatus += s.reportStatus;
      dims.messageEngagement += s.messageEngagement;
      dims.issueFlags += s.issueFlags;
      dims.onboarding += s.onboarding;
    });
    const dimAvg = Object.entries(dims).map(([k, v]) => ({
      key: k,
      label: k === "reportCompletion" ? "Report Completion" : k === "reportStatus" ? "Report Status" : k === "messageEngagement" ? "Engagement" : k === "issueFlags" ? "Issue Resolution" : "Onboarding",
      avg: Math.round(v / scores.length),
      max: k === "reportCompletion" ? 30 : k === "reportStatus" ? 20 : k === "messageEngagement" ? 15 : k === "issueFlags" ? 20 : 15,
    })).sort((a, b) => (a.avg / a.max) - (b.avg / b.max));

    return { avgScore, distribution, atRisk, topPerformers, dimAvg, total: clients.length };
  }, [clients]);

  if (!analytics) return null;

  const scoreColor = analytics.avgScore >= 70 ? "text-primary" : analytics.avgScore >= 50 ? "text-accent" : "text-destructive";

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-sm font-sans font-semibold text-foreground">Portfolio Health</h3>
        <Badge variant="secondary" className="ml-auto text-[10px] font-mono">{analytics.total} clients</Badge>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {/* Average Score */}
        <div className="text-center">
          <p className={`text-3xl font-sans font-bold ${scoreColor}`}>{analytics.avgScore}</p>
          <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mt-1">Avg Score</p>
        </div>

        {/* Distribution */}
        <div className="space-y-1.5">
          {(["excellent", "good", "fair", "poor", "critical"] as const).map((level) => (
            <div key={level} className="flex items-center gap-2">
              <Badge className={`${getHealthBgColor(level)} text-[9px] px-1.5 py-0 border-none min-w-[60px] justify-center`}>
                {getHealthLabel(level)}
              </Badge>
              <span className="text-xs font-mono text-muted-foreground">{analytics.distribution[level]}</span>
            </div>
          ))}
        </div>

        {/* At Risk */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">At Risk</span>
          </div>
          {analytics.atRisk.length === 0 ? (
            <p className="text-xs font-sans text-muted-foreground">All clients healthy</p>
          ) : (
            <div className="space-y-1">
              {analytics.atRisk.slice(0, 3).map((s) => (
                <div key={s.client.id} className="flex items-center gap-2">
                  <span className="text-xs font-sans text-foreground truncate max-w-[100px]">{s.client.propertyName}</span>
                  <span className="text-[10px] font-mono text-destructive ml-auto">{s.total}</span>
                </div>
              ))}
              {analytics.atRisk.length > 3 && (
                <p className="text-[10px] font-sans text-muted-foreground">+{analytics.atRisk.length - 3} more</p>
              )}
            </div>
          )}
        </div>

        {/* Top Performers */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <CheckCircle className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Top Clients</span>
          </div>
          {analytics.topPerformers.length === 0 ? (
            <p className="text-xs font-sans text-muted-foreground">Keep improving!</p>
          ) : (
            <div className="space-y-1">
              {analytics.topPerformers.slice(0, 3).map((s) => (
                <div key={s.client.id} className="flex items-center gap-2">
                  <span className="text-xs font-sans text-foreground truncate max-w-[100px]">{s.client.propertyName}</span>
                  <span className="text-[10px] font-mono text-primary ml-auto">{s.total}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Dimension Breakdown */}
      <div>
        <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">Portfolio Dimensions</p>
        <div className="space-y-2">
          {analytics.dimAvg.map((dim) => {
            const pct = Math.round((dim.avg / dim.max) * 100);
            return (
              <div key={dim.key} className="flex items-center gap-3">
                <span className="text-xs font-sans text-muted-foreground w-28 shrink-0">{dim.label}</span>
                <Progress value={pct} className="h-1.5 flex-1" />
                <span className="text-[10px] font-mono text-muted-foreground w-8 text-right">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};

export default PortfolioHealthDashboard;
