import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Handshake, TrendingUp, AlertTriangle, MessageSquare, Phone, Plus, Loader2 } from "lucide-react";
import { useCRMClientsEnriched, useCRMTradePartnersEnriched } from "@/hooks/useCRMData";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

const fmt = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n.toFixed(0)}`;

const CRMDashboardWidget = () => {
  const navigate = useNavigate();
  const { data: clients, isLoading: cl } = useCRMClientsEnriched();
  const { data: partners, isLoading: pl } = useCRMTradePartnersEnriched();

  const { data: recentActivity } = useQuery({
    queryKey: ["crm-recent-activity-widget"],
    queryFn: async () => {
      const { data } = await supabase.from("crm_activity_log")
        .select("*")
        .order("logged_at", { ascending: false })
        .limit(5);
      return data || [];
    },
  });

  const isLoading = cl || pl;
  const totalClients = (clients || []).length;
  const totalPartners = (partners || []).length;
  const atRiskClients = (clients || []).filter((c: any) => c.client_stage === "at_risk").length;
  const totalLTV = (clients || []).reduce((s: number, c: any) => s + (c.lifetime_value || 0), 0);

  // Stage distribution for clients
  const stageCounts: Record<string, number> = {};
  (clients || []).forEach((c: any) => {
    const s = c.client_stage || "lead";
    stageCounts[s] = (stageCounts[s] || 0) + 1;
  });

  const activityIcon = (type: string) => {
    if (type.includes("message") || type.includes("email")) return <MessageSquare className="w-3 h-3" />;
    if (type.includes("call")) return <Phone className="w-3 h-3" />;
    return <TrendingUp className="w-3 h-3" />;
  };

  if (isLoading) {
    return (
      <Card className="p-5">
        <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-sans font-semibold text-foreground">Relationships at a Glance</h2>
        <Button variant="ghost" size="sm" className="text-xs font-sans" onClick={() => navigate("/admin/crm")}>
          View CRM →
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <Users className="w-4 h-4 text-primary mx-auto mb-1" />
          <p className="text-lg font-sans font-bold text-foreground">{totalClients}</p>
          <p className="text-[10px] font-sans text-muted-foreground">Clients</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <Handshake className="w-4 h-4 text-primary mx-auto mb-1" />
          <p className="text-lg font-sans font-bold text-foreground">{totalPartners}</p>
          <p className="text-[10px] font-sans text-muted-foreground">Trade Partners</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <TrendingUp className="w-4 h-4 text-accent mx-auto mb-1" />
          <p className="text-lg font-sans font-bold text-foreground">{fmt(totalLTV)}</p>
          <p className="text-[10px] font-sans text-muted-foreground">Total LTV</p>
        </div>
        <div className={`rounded-lg p-3 text-center ${atRiskClients > 0 ? "bg-destructive/10" : "bg-muted/50"}`}>
          <AlertTriangle className={`w-4 h-4 mx-auto mb-1 ${atRiskClients > 0 ? "text-destructive" : "text-muted-foreground"}`} />
          <p className="text-lg font-sans font-bold text-foreground">{atRiskClients}</p>
          <p className="text-[10px] font-sans text-muted-foreground">At Risk</p>
        </div>
      </div>

      {/* Pipeline Mini Summary */}
      {Object.keys(stageCounts).length > 0 && (
        <div className="flex gap-1 mb-4 flex-wrap">
          {Object.entries(stageCounts).map(([stage, count]) => (
            <Badge key={stage} variant="outline" className="text-[9px] font-sans">
              {stage.replace(/_/g, " ")}: {count}
            </Badge>
          ))}
        </div>
      )}

      {/* Recent Activity */}
      {(recentActivity || []).length > 0 && (
        <div className="mb-4">
          <h3 className="text-xs font-sans font-semibold text-muted-foreground mb-2">Recent CRM Activity</h3>
          <div className="space-y-1.5">
            {(recentActivity || []).slice(0, 5).map((a: any) => (
              <div key={a.id} className="flex items-center gap-2 text-xs font-sans">
                <span className="text-muted-foreground shrink-0">{activityIcon(a.activity_type)}</span>
                <span className="text-foreground truncate flex-1">{a.content_preview || a.activity_type}</span>
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {format(new Date(a.logged_at), "MMM d")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex gap-2 flex-wrap">
        <Button variant="outline" size="sm" className="text-xs font-sans gap-1" onClick={() => navigate("/admin/crm")}>
          <Plus className="w-3 h-3" /> Add Contact
        </Button>
        <Button variant="outline" size="sm" className="text-xs font-sans gap-1" onClick={() => navigate("/admin/crm/pipeline")}>
          Pipeline
        </Button>
      </div>
    </Card>
  );
};

export default CRMDashboardWidget;
