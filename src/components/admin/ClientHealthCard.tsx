import type { AdminClient } from "@/hooks/useAdminData";
import { Card } from "@/components/ui/card";
import { computeClientHealthScore } from "@/lib/clientHealthScore";
import { Activity } from "lucide-react";

interface ClientHealthCardProps {
  client: AdminClient;
}

// H4 refactor: render word-rating + color dot only. Per Master Plan H4
// spec, "No numerical score in any output". The numeric breakdown is
// no longer surfaced — we bucket the composite total into the 5 word
// ratings and show only that.
//
// Bucketing matches the H1 data-migration thresholds (Master Spec 5.7):
//   >= 90  Excellent
//   75-89  Good
//   60-74  Fair
//   40-59  Poor
//   < 40   Critical
//
// computeClientHealthScore() lives in clientHealthScore.ts. That lib
// itself gets deleted in a later H-batch sub-batch (after the other
// consumers — ClientHealthBadge, PortfolioHealthDashboard — also stop
// importing it).

type Rating = "Excellent" | "Good" | "Fair" | "Poor" | "Critical";

const RATING_COLORS: Record<Rating, string> = {
  Excellent: "#2F6E40",
  Good: "#5A8A4F",
  Fair: "#B58A1F",
  Poor: "#B7410E",
  Critical: "#8B0000",
};

function bucketTotal(total: number): Rating {
  if (total >= 90) return "Excellent";
  if (total >= 75) return "Good";
  if (total >= 60) return "Fair";
  if (total >= 40) return "Poor";
  return "Critical";
}

const ClientHealthCard = ({ client }: ClientHealthCardProps) => {
  const breakdown = computeClientHealthScore(client);
  const rating = bucketTotal(breakdown.total);
  const color = RATING_COLORS[rating];

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-sm font-sans font-semibold text-foreground">
          Client Condition
        </h3>
      </div>

      <div className="flex items-center gap-3">
        <span
          aria-hidden
          style={{
            width: 16,
            height: 16,
            borderRadius: 8,
            background: color,
            display: "inline-block",
          }}
        />
        <span
          className="font-mono text-sm uppercase tracking-[0.15em]"
          style={{ color }}
        >
          {rating}
        </span>
      </div>

      <p className="text-[11px] text-muted-foreground mt-3">
        Word-based rating. Numerical scoring removed in the v2 rebuild.
      </p>
    </Card>
  );
};

export default ClientHealthCard;
