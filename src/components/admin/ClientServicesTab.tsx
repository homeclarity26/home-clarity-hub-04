import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, Package, ShoppingCart, FileText, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

interface ClientServicesTabProps {
  propertyId: string;
  clientUserId?: string;
}

const ClientServicesTab = ({ propertyId, clientUserId }: ClientServicesTabProps) => {
  // Get client membership
  const { data: membership } = useQuery({
    queryKey: ["client-membership", clientUserId],
    enabled: !!clientUserId,
    queryFn: async () => {
      const { data } = await supabase.from("client_memberships").select("*, membership_tiers(*)").eq("client_id", clientUserId).eq("status", "active").single();
      return data;
    },
  });

  // Get tier services
  const { data: tierServiceIds = [] } = useQuery({
    queryKey: ["tier-services", membership?.tier_id],
    enabled: !!membership?.tier_id,
    queryFn: async () => {
      const { data } = await supabase.from("membership_tier_services").select("service_id").eq("tier_id", membership.tier_id);
      return data?.map((ts: any) => ts.service_id) || [];
    },
  });

  const { data: allServices = [] } = useQuery({
    queryKey: ["services-library"],
    queryFn: async () => {
      const { data } = await supabase.from("services").select("*").eq("is_active", true).order("name");
      return data || [];
    },
  });

  // Get service requests
  const { data: requests = [] } = useQuery({
    queryKey: ["client-service-requests", propertyId],
    queryFn: async () => {
      const { data } = await supabase.from("service_requests").select("*, service_request_items(*, services(*))").eq("property_id", propertyId).order("created_at", { ascending: false });
      return data || [];
    },
  });

  // Get estimates
  const { data: estimates = [] } = useQuery({
    queryKey: ["estimates", propertyId],
    queryFn: async () => {
      const { data } = await supabase.from("estimates").select("*").eq("property_id", propertyId).order("created_at", { ascending: false });
      return data || [];
    },
  });

  const includedServices = allServices.filter((s: any) => tierServiceIds.includes(s.id));
  const tier = membership?.membership_tiers;

  return (
    <div className="space-y-6">
      {/* Current Tier */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Crown className="w-5 h-5 text-accent" />
          <h3 className="text-base font-sans font-semibold text-foreground">Current Membership</h3>
        </div>

        {tier ? (
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg font-sans font-bold text-foreground">{tier.name}</span>
                <Badge className="bg-green-100 text-green-800 text-[10px]">Active</Badge>
              </div>
              {tier.description && <p className="text-sm font-sans text-muted-foreground mb-3">{tier.description}</p>}
              <p className="text-sm font-mono text-foreground">
                {fmt(tier.price_annually)}/{tier.price_type === "monthly" ? "mo" : "yr"}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm font-sans text-muted-foreground">No active membership. Assign a tier to this client.</p>
        )}
      </Card>

      {/* Included Services */}
      {includedServices.length > 0 && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-accent" />
            <h3 className="text-base font-sans font-semibold text-foreground">Included Services</h3>
            <Badge variant="outline" className="text-[10px] font-mono">{includedServices.length}</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {includedServices.map((s: any) => (
              <div key={s.id} className="flex items-center gap-2 py-2 px-3 rounded-md bg-muted/30">
                <Check className="w-3.5 h-3.5 text-green-600" />
                <span className="text-sm font-sans text-foreground flex-1">{s.name}</span>
                <span className="text-[10px] font-mono text-muted-foreground">{fmt(s.price)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Service Requests */}
      {requests.length > 0 && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-accent" />
            <h3 className="text-base font-sans font-semibold text-foreground">À La Carte Requests</h3>
          </div>
          <div className="space-y-3">
            {requests.map((req: any) => (
              <div key={req.id} className="border border-border rounded-md p-3">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className="text-[10px]">{req.status}</Badge>
                  <span className="text-[10px] font-mono text-muted-foreground">{new Date(req.created_at).toLocaleDateString()}</span>
                </div>
                <div className="space-y-1">
                  {req.service_request_items?.map((item: any) => (
                    <div key={item.id} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                      <span className="text-xs font-sans text-foreground">{item.services?.name || "Service"}</span>
                    </div>
                  ))}
                </div>
                {req.notes && <p className="text-[10px] font-sans text-muted-foreground mt-2">{req.notes}</p>}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Estimates/Billing History */}
      {estimates.length > 0 && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-accent" />
            <h3 className="text-base font-sans font-semibold text-foreground">Billing History</h3>
          </div>
          <div className="space-y-2">
            {estimates.map((est: any) => (
              <div key={est.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <span className="text-sm font-sans text-foreground">{est.title}</span>
                  <p className="text-[10px] font-sans text-muted-foreground">{new Date(est.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono font-bold">{fmt(est.total)}</span>
                  <Badge variant="outline" className="text-[9px]">{est.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default ClientServicesTab;
