import { useState, useEffect } from "react";
import { Wrench, AlertTriangle, Clock, CheckCircle, ShieldAlert, ChevronRight, FileText, MessageSquare } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { supabase } from "@/integrations/supabase/client";
import { format, isPast, isAfter, addDays } from "date-fns";
import PredictiveMaintenanceCard from "@/components/portal/PredictiveMaintenanceCard";
import { Button } from "@/components/ui/button";

interface EquipmentTabProps {
  propertyId?: string;
  onTabChange?: (tab: string) => void;
  onSendMessage?: (msg: string) => void;
}

interface Equipment {
  id: string;
  name: string;
  category: string;
  brand: string | null;
  model: string | null;
  serial_number: string | null;
  install_date: string | null;
  warranty_expiry: string | null;
  last_service_date: string | null;
  next_service_date: string | null;
  estimated_replacement_cost: number | null;
  condition: string | null;
  notes: string | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  hvac: "HVAC",
  plumbing: "Plumbing",
  electrical: "Electrical",
  appliances: "Appliances",
  exterior: "Exterior",
  structure: "Structure",
  safety: "Safety",
  other: "Other",
};

const CATEGORY_ORDER = ["hvac", "electrical", "plumbing", "appliances", "safety", "exterior", "structure", "other"];

const conditionDot: Record<string, string> = {
  excellent: "bg-emerald-400",
  good: "bg-blue-400",
  fair: "bg-amber-400",
  poor: "bg-red-400",
  unknown: "bg-gray-300",
};

function getServiceStatus(item: Equipment): { label: string; cls: string; icon: typeof CheckCircle } {
  const now = new Date();
  if (item.next_service_date) {
    const next = new Date(item.next_service_date);
    if (isPast(next)) return { label: "Service Overdue", cls: "text-destructive", icon: AlertTriangle };
    if (isAfter(next, now) && !isAfter(next, addDays(now, 60))) return { label: "Service Due Soon", cls: "text-orange-500", icon: Clock };
  }
  if (item.warranty_expiry && isPast(new Date(item.warranty_expiry))) {
    return { label: "Warranty Expired", cls: "text-muted-foreground", icon: ShieldAlert };
  }
  return { label: "Up to Date", cls: "text-foreground", icon: CheckCircle };
}

const cardBase = "bg-card rounded-lg shadow-hbc-sm border border-border";

const DEMO_EQUIPMENT: Equipment[] = [
  { id: "eq-1", name: "Primary Furnace", category: "hvac", brand: "Carrier", model: "58STA090-14", serial_number: "3819C45820", install_date: "2012-09-15", warranty_expiry: "2022-09-15", last_service_date: "2025-10-01", next_service_date: "2026-10-01", estimated_replacement_cost: 8500, condition: "fair", notes: "2008 model, showing signs of reduced efficiency. Budget for replacement within 2 years." },
  { id: "eq-2", name: "Central A/C", category: "hvac", brand: "Carrier", model: "24ACC636A003", serial_number: "3819C98240", install_date: "2012-09-15", warranty_expiry: "2022-09-15", last_service_date: "2025-05-15", next_service_date: "2026-05-15", estimated_replacement_cost: 6500, condition: "fair", notes: null },
  { id: "eq-3", name: "Water Heater", category: "plumbing", brand: "Rheem", model: "XE40M09ST45U1", serial_number: "0519D487220", install_date: "2019-05-20", warranty_expiry: "2031-05-20", last_service_date: "2025-01-10", next_service_date: "2027-01-10", estimated_replacement_cost: 1400, condition: "good", notes: null },
  { id: "eq-4", name: "Main Electrical Panel", category: "electrical", brand: "Square D", model: "QO130L200PG", serial_number: null, install_date: "1998-01-01", warranty_expiry: null, last_service_date: null, next_service_date: null, estimated_replacement_cost: 4500, condition: "good", notes: "200A service. No issues noted." },
  { id: "eq-5", name: "Smoke Detectors (6x)", category: "safety", brand: "Kidde", model: "i12060", serial_number: null, install_date: "2023-03-01", warranty_expiry: "2033-03-01", last_service_date: "2026-01-01", next_service_date: "2027-01-01", estimated_replacement_cost: 200, condition: "good", notes: "Replace batteries annually." },
];

const EquipmentTab = ({ propertyId, onTabChange, onSendMessage }: EquipmentTabProps) => {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!propertyId) { setLoading(false); return; }
    if (propertyId.startsWith("mock-")) {
      setEquipment(DEMO_EQUIPMENT);
      setLoading(false);
      return;
    }
    (supabase
      .from("equipment" as any) as any)
      .select("*")
      .eq("property_id", propertyId)
      .order("category")
      .order("sort_order")
      .then(({ data }: any) => {
        setEquipment((data || []) as Equipment[]);
        setLoading(false);
      });
  }, [propertyId]);

  const byCategory = equipment.reduce((acc, e) => {
    if (!acc[e.category]) acc[e.category] = [];
    acc[e.category].push(e);
    return acc;
  }, {} as Record<string, Equipment[]>);

  const orderedCategories = [
    ...CATEGORY_ORDER.filter((c) => byCategory[c]),
    ...Object.keys(byCategory).filter((c) => !CATEGORY_ORDER.includes(c)),
  ];

  const overdueCount = equipment.filter((e) => e.next_service_date && isPast(new Date(e.next_service_date))).length;
  const dueSoonCount = equipment.filter((e) => {
    if (!e.next_service_date) return false;
    const next = new Date(e.next_service_date);
    return !isPast(next) && isAfter(addDays(new Date(), 60), next);
  }).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Hero */}
      <section className="text-center py-12 md:py-16 px-6 md:px-20 max-w-4xl mx-auto">
        <h1 className="font-display text-3xl md:text-[36px] text-foreground mb-3">Equipment Registry</h1>
        <p className="font-sans text-base text-muted-foreground">
          A complete record of your home's major systems and appliances.
        </p>
      </section>

      <div className="max-w-[1400px] mx-auto px-6 md:px-20 pb-16 flex flex-col gap-10">

        {/* Alerts */}
        {(overdueCount > 0 || dueSoonCount > 0) && (
          <div className="space-y-3">
            {overdueCount > 0 && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                <p className="text-sm font-sans text-foreground">
                  <strong>{overdueCount} item{overdueCount !== 1 ? "s" : ""}</strong> overdue for service. Contact your advisor to schedule.
                </p>
              </div>
            )}
            {dueSoonCount > 0 && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-orange-50 border border-orange-200">
                <Clock className="w-4 h-4 text-orange-500 shrink-0" />
                <p className="text-sm font-sans text-foreground">
                  <strong>{dueSoonCount} item{dueSoonCount !== 1 ? "s" : ""}</strong> due for service in the next 60 days.
                </p>
              </div>
            )}
          </div>
        )}

        {equipment.length === 0 ? (
          <EmptyState
            icon={Wrench}
            title="No Equipment on File"
            description="Your advisor will add your home's major systems and appliances to this registry."
            actionLabel="View Report"
            onAction={() => onTabChange?.("report")}
          />
        ) : (
          orderedCategories.map((category) => (
            <div key={category}>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent mb-6">
                {CATEGORY_LABELS[category] || category}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {byCategory[category].map((item) => {
                  const svc = getServiceStatus(item);
                  const SvcIcon = svc.icon;
                  const dot = conditionDot[item.condition || "unknown"] || conditionDot.unknown;

                  return (
                    <div key={item.id} className={`${cardBase} p-6`}>
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex items-center gap-2.5">
                          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dot}`} />
                          <h3 className="font-display text-xl text-foreground">{item.name}</h3>
                        </div>
                        <span className={`flex items-center gap-1.5 text-[10px] font-mono shrink-0 ${svc.cls}`}>
                          <SvcIcon className="w-3 h-3" />
                          {svc.label}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        {item.brand && (
                          <div>
                            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Brand</p>
                            <p className="font-sans text-foreground">{item.brand}</p>
                          </div>
                        )}
                        {item.model && (
                          <div>
                            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Model</p>
                            <p className="font-sans text-foreground">{item.model}</p>
                          </div>
                        )}
                        {item.serial_number && (
                          <div>
                            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Serial #</p>
                            <p className="font-mono text-xs text-foreground">{item.serial_number}</p>
                          </div>
                        )}
                        {item.install_date && (
                          <div>
                            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Installed</p>
                            <p className="font-sans text-foreground">{format(new Date(item.install_date), "MMM yyyy")}</p>
                          </div>
                        )}
                        {item.warranty_expiry && (
                          <div>
                            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Warranty</p>
                            <p className={`font-sans ${isPast(new Date(item.warranty_expiry)) ? "text-muted-foreground line-through" : "text-foreground"}`}>
                              {isPast(new Date(item.warranty_expiry)) ? "Expired " : "Until "}
                              {format(new Date(item.warranty_expiry), "MMM yyyy")}
                            </p>
                          </div>
                        )}
                        {item.next_service_date && (
                          <div>
                            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Next Service</p>
                            <p className={`font-sans ${isPast(new Date(item.next_service_date)) ? "text-destructive font-medium" : "text-foreground"}`}>
                              {format(new Date(item.next_service_date), "MMM d, yyyy")}
                            </p>
                          </div>
                        )}
                        {item.estimated_replacement_cost != null && (
                          <div>
                            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Est. Replacement</p>
                            <p className="font-sans text-foreground">${Number(item.estimated_replacement_cost).toLocaleString()}</p>
                          </div>
                        )}
                      </div>

                      {item.notes && (
                        <p className="text-sm font-sans text-muted-foreground mt-4 pt-4 border-t border-border italic">
                          {item.notes}
                        </p>
                      )}

                      {/* Schedule Service button for flagged items */}
                      {(svc.label === "Service Overdue" || svc.label === "Service Due Soon" || svc.label === "Warranty Expired") && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 text-xs font-sans mt-3 w-fit"
                          onClick={() => onSendMessage?.(`I'd like to schedule service for my ${item.name}.`)}
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          Schedule Service
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}

        {/* Quick Actions */}
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent mb-6">Quick Actions</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <button
              onClick={() => onTabChange?.("report")}
              className={`${cardBase} group p-6 text-left hover:shadow-hbc-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col gap-3`}
            >
              <FileText className="w-5 h-5 text-accent" />
              <h2 className="font-display text-xl text-foreground mb-1">View Report Details</h2>
              <p className="font-sans text-sm text-muted-foreground">See full system assessments in your Home Clarity Report</p>
              <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-accent self-end transition-colors" />
            </button>
            <button
              onClick={() => onTabChange?.("schedule")}
              className={`${cardBase} group p-6 text-left hover:shadow-hbc-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col gap-3`}
            >
              <Wrench className="w-5 h-5 text-accent" />
              <h2 className="font-display text-xl text-foreground mb-1">Schedule Service</h2>
              <p className="font-sans text-sm text-muted-foreground">Book maintenance and service appointments</p>
              <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-accent self-end transition-colors" />
            </button>
          </div>
        </div>

        {/* Predictive Maintenance — relocated from Home */}
        {propertyId && <PredictiveMaintenanceCard propertyId={propertyId} clientId={undefined} />}
      </div>
    </div>
  );
};

export default EquipmentTab;
