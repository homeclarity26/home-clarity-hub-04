import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Activity } from "lucide-react";
import type { AdminClient } from "@/hooks/useAdminData";
import { computeClientHealthScore } from "@/lib/clientHealthScore";

interface PortfolioHealthDashboardProps {
  clients: AdminClient[];
}

// H6 refactor: group by word-rating buckets instead of numeric histogram.
// Per Master Plan H6: "Group properties by word-rating buckets instead of
// score histogram. All numerical scores removed."

type Rating = "Excellent" | "Good" | "Fair" | "Poor" | "Critical";

const RATING_ORDER: Rating[] = ["Excellent", "Good", "Fair", "Poor", "Critical"];

const RATING_COLORS: Record<Rating, string> = {
  Excellent: "#2F6E40",
  Good: "#5A8A4F",
  Fair: "#B58A1F",
  Poor: "#B7410E",
  Critical: "#8B0000",
};

// Same buckets as ClientHealthCard + the H1 data migration thresholds
function bucketTotal(total: number): Rating {
  if (total >= 90) return "Excellent";
  if (total >= 75) return "Good";
  if (total >= 60) return "Fair";
  if (total >= 40) return "Poor";
  return "Critical";
}

const PortfolioHealthDashboard = ({ clients }: PortfolioHealthDashboardProps) => {
  const analytics = useMemo(() => {
    if (!clients.length) return null;

    const rated = clients.map((c) => {
      const breakdown = computeClientHealthScore(c);
      return { client: c, rating: bucketTotal(breakdown.total) };
    });

    const distribution: Record<Rating, number> = {
      Excellent: 0,
      Good: 0,
      Fair: 0,
      Poor: 0,
      Critical: 0,
    };
    rated.forEach((r) => {
      distribution[r.rating]++;
    });

    const atRisk = rated.filter((r) => r.rating === "Poor" || r.rating === "Critical");
    const topPerformers = rated.filter((r) => r.rating === "Excellent" || r.rating === "Good");

    return { distribution, atRisk, topPerformers, total: clients.length };
  }, [clients]);

  if (!analytics) return null;

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-sm font-sans font-semibold text-foreground">Portfolio Condition</h3>
        <Badge variant="secondary" className="ml-auto text-[10px] font-mono">
          {analytics.total} {analytics.total === 1 ? "client" : "clients"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Distribution by word-rating bucket */}
        <div>
          <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">
            Distribution
          </p>
          <div className="space-y-1.5">
            {RATING_ORDER.map((rating) => (
              <div key={rating} className="flex items-center gap-2">
                <span
                  aria-hidden
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    background: RATING_COLORS[rating],
                    display: "inline-block",
                  }}
                />
                <span
                  className="text-xs font-mono uppercase tracking-[0.15em] flex-1"
                  style={{ color: RATING_COLORS[rating] }}
                >
                  {rating}
                </span>
                <span className="text-xs font-mono text-muted-foreground">
                  {analytics.distribution[rating]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* At Risk (Poor + Critical) */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              At Risk
            </span>
          </div>
          {analytics.atRisk.length === 0 ? (
            <p className="text-xs font-sans text-muted-foreground">All clients in Fair or better</p>
          ) : (
            <div className="space-y-1">
              {analytics.atRisk.slice(0, 5).map((r) => (
                <div key={r.client.id} className="flex items-center gap-2">
                  <span className="text-xs font-sans text-foreground truncate flex-1">
                    {r.client.propertyName}
                  </span>
                  <span
                    className="text-[10px] font-mono uppercase tracking-[0.15em]"
                    style={{ color: RATING_COLORS[r.rating] }}
                  >
                    {r.rating}
                  </span>
                </div>
              ))}
              {analytics.atRisk.length > 5 && (
                <p className="text-[10px] font-sans text-muted-foreground">
                  + {analytics.atRisk.length - 5} more
                </p>
              )}
            </div>
          )}
        </div>

        {/* Top performers (Excellent + Good) */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <CheckCircle className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Healthy
            </span>
          </div>
          {analytics.topPerformers.length === 0 ? (
            <p className="text-xs font-sans text-muted-foreground">Work to do across the portfolio.</p>
          ) : (
            <div className="space-y-1">
              {analytics.topPerformers.slice(0, 5).map((r) => (
                <div key={r.client.id} className="flex items-center gap-2">
                  <span className="text-xs font-sans text-foreground truncate flex-1">
                    {r.client.propertyName}
                  </span>
                  <span
                    className="text-[10px] font-mono uppercase tracking-[0.15em]"
                    style={{ color: RATING_COLORS[r.rating] }}
                  >
                    {r.rating}
                  </span>
                </div>
              ))}
              {analytics.topPerformers.length > 5 && (
                <p className="text-[10px] font-sans text-muted-foreground">
                  + {analytics.topPerformers.length - 5} more
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground">
        Word-based rating. Numerical scoring removed in the v2 rebuild.
      </p>
    </Card>
  );
};

export default PortfolioHealthDashboard;
