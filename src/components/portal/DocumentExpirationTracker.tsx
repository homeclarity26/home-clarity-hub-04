import { useState, useEffect } from "react";
import { AlertTriangle, Clock, CheckCircle2, FileText, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { isPast, isAfter, addDays, format } from "date-fns";

interface DocumentExpirationTrackerProps {
  propertyId: string;
}

interface ExpiringItem {
  id: string;
  name: string;
  type: "warranty" | "service" | "document";
  expiryDate: Date;
  status: "expired" | "expiring_soon" | "active";
  category?: string;
}

const DocumentExpirationTracker = ({ propertyId }: DocumentExpirationTrackerProps) => {
  const [items, setItems] = useState<ExpiringItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!propertyId || propertyId.startsWith("mock-")) {
      // Demo data
      const now = new Date();
      setItems([
        { id: "1", name: "HVAC Warranty — Carrier 24ACC636", type: "warranty", expiryDate: addDays(now, -30), status: "expired", category: "HVAC" },
        { id: "2", name: "Water Heater Warranty", type: "warranty", expiryDate: addDays(now, 45), status: "expiring_soon", category: "Plumbing" },
        { id: "3", name: "Roof Warranty — GAF Timberline", type: "warranty", expiryDate: addDays(now, 365), status: "active", category: "Roof" },
        { id: "4", name: "Annual HVAC Service", type: "service", expiryDate: addDays(now, 15), status: "expiring_soon", category: "HVAC" },
        { id: "5", name: "Electrical Panel Inspection", type: "service", expiryDate: addDays(now, 200), status: "active", category: "Electrical" },
      ]);
      setLoading(false);
      return;
    }

    const load = async () => {
      const { data: equipment } = await supabase
        .from("equipment")
        .select("id, name, category, warranty_expiry, next_service_date")
        .eq("property_id", propertyId);

      const now = new Date();
      const tracked: ExpiringItem[] = [];

      (equipment || []).forEach((eq) => {
        if (eq.warranty_expiry) {
          const d = new Date(eq.warranty_expiry);
          const status = isPast(d) ? "expired" : isAfter(addDays(now, 90), d) ? "expiring_soon" : "active";
          tracked.push({ id: `w-${eq.id}`, name: `${eq.name} Warranty`, type: "warranty", expiryDate: d, status, category: eq.category || undefined });
        }
        if (eq.next_service_date) {
          const d = new Date(eq.next_service_date);
          const status = isPast(d) ? "expired" : isAfter(addDays(now, 60), d) ? "expiring_soon" : "active";
          tracked.push({ id: `s-${eq.id}`, name: `${eq.name} Service`, type: "service", expiryDate: d, status, category: eq.category || undefined });
        }
      });

      tracked.sort((a, b) => a.expiryDate.getTime() - b.expiryDate.getTime());
      setItems(tracked);
      setLoading(false);
    };
    load();
  }, [propertyId]);

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  const expiredCount = items.filter((i) => i.status === "expired").length;
  const soonCount = items.filter((i) => i.status === "expiring_soon").length;

  if (items.length === 0) return null;

  return (
    <div className="max-w-[1400px] mx-auto px-6 md:px-20">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent mb-6">Warranty & Service Tracking</p>
      <div className="bg-card rounded-lg border border-border shadow-hbc-sm p-6">
        {/* Alert Banner */}
        {(expiredCount > 0 || soonCount > 0) && (
          <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
            <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
            <p className="font-sans text-sm text-foreground">
              {expiredCount > 0 && <span className="text-destructive font-medium">{expiredCount} expired</span>}
              {expiredCount > 0 && soonCount > 0 && " · "}
              {soonCount > 0 && <span className="text-amber-600 font-medium">{soonCount} expiring soon</span>}
            </p>
          </div>
        )}

        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                item.status === "expired" ? "border-destructive/30 bg-destructive/5" :
                item.status === "expiring_soon" ? "border-amber-400/30 bg-amber-50/50 dark:bg-amber-950/20" :
                "border-border"
              }`}
            >
              {item.status === "expired" ? (
                <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
              ) : item.status === "expiring_soon" ? (
                <Clock className="w-4 h-4 text-amber-500 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-sans text-sm text-foreground truncate">{item.name}</p>
                {item.category && (
                  <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">{item.category}</span>
                )}
              </div>
              <span className={`font-mono text-[10px] shrink-0 ${
                item.status === "expired" ? "text-destructive" :
                item.status === "expiring_soon" ? "text-amber-600" :
                "text-muted-foreground"
              }`}>
                {item.status === "expired" ? "Expired " : ""}
                {format(item.expiryDate, "MMM d, yyyy")}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DocumentExpirationTracker;
