import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Activity, Clock, Eye, BarChart3 } from "lucide-react";
import { usePortalEngagement } from "@/hooks/usePortalTracking";
import { formatDistanceToNow } from "date-fns";

interface PortalEngagementCardProps {
  clientUserId: string;
}

const PortalEngagementCard = ({ clientUserId }: PortalEngagementCardProps) => {
  const { getEngagement } = usePortalEngagement();
  const [data, setData] = useState<{ totalLogins: number; lastLogin: string | null; viewsByPage: Record<string, number>; mostVisited: string; totalViews: number } | null>(null);

  useEffect(() => {
    getEngagement(clientUserId).then(setData);
  }, [clientUserId, getEngagement]);

  if (!data) return null;

  const topPages = Object.entries(data.viewsByPage).sort(([, a], [, b]) => b - a).slice(0, 5);
  const maxViews = topPages.length > 0 ? topPages[0][1] : 1;

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-sm font-sans font-semibold text-foreground">Portal Engagement</h3>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-[11px] font-mono text-muted-foreground uppercase">Last Login</p>
          <p className="text-sm font-sans font-medium text-foreground">
            {data.lastLogin ? formatDistanceToNow(new Date(data.lastLogin), { addSuffix: true }) : "Never"}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-mono text-muted-foreground uppercase">Portal Opens</p>
          <p className="text-sm font-sans font-medium text-foreground">{data.totalLogins}</p>
        </div>
        <div>
          <p className="text-[11px] font-mono text-muted-foreground uppercase">Most Visited</p>
          <p className="text-sm font-sans font-medium text-foreground capitalize">{data.mostVisited}</p>
        </div>
        <div>
          <p className="text-[11px] font-mono text-muted-foreground uppercase">Total Page Views</p>
          <p className="text-sm font-sans font-medium text-foreground">{data.totalViews}</p>
        </div>
      </div>

      {topPages.length > 0 && (
        <div>
          <p className="text-[10px] font-mono text-muted-foreground uppercase mb-2">Pages This Month</p>
          <div className="space-y-1.5">
            {topPages.map(([page, count]) => (
              <div key={page} className="flex items-center gap-2">
                <span className="text-xs font-sans text-muted-foreground capitalize w-20 truncate">{page}</span>
                <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-accent rounded-full" style={{ width: `${(count / maxViews) * 100}%` }} />
                </div>
                <span className="text-[10px] font-mono text-foreground w-6 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

export default PortalEngagementCard;
