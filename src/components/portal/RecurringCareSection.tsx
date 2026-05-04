import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface RecurringService {
  id: string;
  service_name: string;
  category: string;
  vendor_name: string | null;
  frequency: string;
  cost_per_visit: number | null;
  last_service_date: string | null;
  next_due_date: string | null;
  status: string;
  hbc_managed: boolean;
}

interface RecurringCareSectionProps {
  propertyId: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  current: { label: "Current", color: "bg-emerald-100 text-emerald-800", icon: CheckCircle2 },
  overdue: { label: "Overdue", color: "bg-red-100 text-red-800", icon: AlertCircle },
  lapsed: { label: "Lapsed", color: "bg-amber-100 text-amber-800", icon: AlertCircle },
  paused: { label: "Paused", color: "bg-gray-100 text-gray-600", icon: RefreshCw },
};

const FREQUENCY_LABELS: Record<string, string> = {
  weekly: "Weekly",
  biweekly: "Every 2 weeks",
  monthly: "Monthly",
  quarterly: "Quarterly",
  biannual: "Twice a year",
  annual: "Annually",
  as_needed: "As needed",
};

export function RecurringCareSection({ propertyId }: RecurringCareSectionProps) {
  const [services, setServices] = useState<RecurringService[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!propertyId || propertyId.startsWith("mock-")) {
      setLoading(false);
      return;
    }
    supabase
      .from("recurring_services")
      .select("id, service_name, category, vendor_name, frequency, cost_per_visit, last_service_date, next_due_date, status, hbc_managed")
      .eq("property_id", propertyId)
      .order("category")
      .order("display_order")
      .then(({ data }) => {
        if (data) setServices(data);
        setLoading(false);
      });
  }, [propertyId]);

  if (loading || services.length === 0) return null;

  const grouped = services.reduce<Record<string, RecurringService[]>>((acc, s) => {
    const cat = s.category.replace(/_/g, " ");
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl text-foreground">Recurring Care</h2>
        <p className="text-xs font-sans text-muted-foreground mt-1">
          Standing services that keep your home maintained.
        </p>
      </div>

      {Object.entries(grouped).map(([category, items]) => (
        <div key={category}>
          <h3 className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2 capitalize">
            {category}
          </h3>
          <div className="space-y-2">
            {items.map((svc) => {
              const statusCfg = STATUS_CONFIG[svc.status] ?? STATUS_CONFIG.current;
              const StatusIcon = statusCfg.icon;
              return (
                <Card key={svc.id} className="p-4 flex items-center gap-3">
                  <StatusIcon className="w-4 h-4 shrink-0 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-sans font-medium text-foreground truncate">
                        {svc.service_name}
                      </p>
                      {svc.hbc_managed && (
                        <Badge variant="secondary" className="text-[9px] font-mono uppercase tracking-wider shrink-0">
                          HBC Managed
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-[11px] font-sans text-muted-foreground">
                      {svc.vendor_name && <span>{svc.vendor_name}</span>}
                      <span>{FREQUENCY_LABELS[svc.frequency] ?? svc.frequency}</span>
                      {svc.cost_per_visit != null && (
                        <span>${Number(svc.cost_per_visit).toLocaleString()}/visit</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <Badge className={`text-[9px] font-mono ${statusCfg.color}`}>
                      {statusCfg.label}
                    </Badge>
                    {svc.next_due_date && (
                      <span className="text-[10px] font-mono text-muted-foreground">
                        Next: {new Date(svc.next_due_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
