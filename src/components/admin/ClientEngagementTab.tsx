import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, BarChart3, Calendar, Eye, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";

interface ClientEngagementTabProps {
  clientUserId: string;
  propertyId: string;
}

const ClientEngagementTab = ({ clientUserId, propertyId }: ClientEngagementTabProps) => {
  const { data, isLoading } = useQuery({
    queryKey: ["client-engagement", clientUserId],
    enabled: !!clientUserId,
    queryFn: async () => {
      // Sessions
      const { data: sessions } = await supabase.from("client_sessions").select("*").eq("client_id", clientUserId).order("login_at", { ascending: false });
      
      // Page views
      const { data: views } = await supabase.from("page_views").select("*").eq("client_id", clientUserId);
      
      // Messages sent by client
      const { data: msgs } = await (supabase.from("property_messages" as any) as any).select("id, sender_id").eq("property_id", propertyId);
      
      const totalLogins = (sessions || []).length;
      const lastLogin = sessions?.[0]?.login_at;
      
      // Page breakdown
      const pageBreakdown: Record<string, number> = {};
      (views || []).forEach(v => {
        pageBreakdown[v.page_name] = (pageBreakdown[v.page_name] || 0) + 1;
      });

      const clientMsgs = (msgs || []).filter((m: any) => m.sender_id === clientUserId).length;
      const adminMsgs = (msgs || []).filter((m: any) => m.sender_id !== clientUserId).length;

      // Average session duration
      const avgDuration = (sessions || []).reduce((s: number, se: any) => s + (se.session_duration_minutes || 0), 0) / Math.max(totalLogins, 1);

      // 30-day activity (simplified)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentLogins = (sessions || []).filter(s => new Date(s.login_at) > thirtyDaysAgo).length;

      return { totalLogins, lastLogin, pageBreakdown, clientMsgs, adminMsgs, avgDuration, recentLogins, totalViews: (views || []).length };
    },
  });

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  const sortedPages = Object.entries(data?.pageBreakdown || {}).sort(([, a], [, b]) => b - a);
  const maxViews = sortedPages[0]?.[1] || 1;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4 text-center">
          <Calendar className="w-5 h-5 text-primary mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{data?.lastLogin ? formatDistanceToNow(new Date(data.lastLogin), { addSuffix: true }) : "Never"}</p>
          <p className="text-xs text-muted-foreground">Last Login</p>
        </Card>
        <Card className="p-4 text-center">
          <Eye className="w-5 h-5 text-accent mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{data?.totalLogins || 0}</p>
          <p className="text-xs text-muted-foreground">Total Logins</p>
        </Card>
        <Card className="p-4 text-center">
          <BarChart3 className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{Math.round(data?.avgDuration || 0)}m</p>
          <p className="text-xs text-muted-foreground">Avg Session</p>
        </Card>
        <Card className="p-4 text-center">
          <MessageSquare className="w-5 h-5 text-primary mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{data?.clientMsgs || 0} / {data?.adminMsgs || 0}</p>
          <p className="text-xs text-muted-foreground">Msgs Sent / Received</p>
        </Card>
      </div>

      {/* Page Breakdown */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3">Page Visit Breakdown</h3>
        {sortedPages.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">No page views recorded yet.</p>
        ) : (
          <div className="space-y-2">
            {sortedPages.map(([page, count]) => (
              <div key={page} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-24 truncate capitalize">{page}</span>
                <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
                  <div className="h-full bg-primary/20 rounded-full transition-all" style={{ width: `${(count / maxViews) * 100}%` }} />
                </div>
                <span className="text-xs font-mono text-foreground w-8 text-right">{count}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Activity indicator */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-foreground">Active in last 30 days</span>
          <Badge variant={(data?.recentLogins || 0) > 0 ? "default" : "destructive"}>
            {(data?.recentLogins || 0) > 0 ? `${data?.recentLogins} logins` : "Inactive"}
          </Badge>
        </div>
      </Card>
    </div>
  );
};

export default ClientEngagementTab;
