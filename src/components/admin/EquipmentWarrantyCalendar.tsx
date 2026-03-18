import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, AlertTriangle, Shield, Wrench } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, isPast, addDays, isAfter, isBefore } from "date-fns";

const EquipmentWarrantyCalendar = () => {
  const { data: equipment = [] } = useQuery({
    queryKey: ["all-equipment-warranties"],
    queryFn: async () => {
      const { data } = await supabase
        .from("equipment")
        .select("id, name, category, warranty_expiry, next_service_date, condition, property_id, properties(property_name, address)")
        .not("warranty_expiry", "is", null)
        .order("warranty_expiry", { ascending: true });
      return data || [];
    },
  });

  const now = new Date();
  const soon = addDays(now, 90);

  const expired = equipment.filter((e: any) => e.warranty_expiry && isPast(new Date(e.warranty_expiry)));
  const expiringSoon = equipment.filter((e: any) => {
    if (!e.warranty_expiry) return false;
    const d = new Date(e.warranty_expiry);
    return !isPast(d) && isBefore(d, soon);
  });
  const active = equipment.filter((e: any) => {
    if (!e.warranty_expiry) return false;
    const d = new Date(e.warranty_expiry);
    return !isPast(d) && !isBefore(d, soon);
  });

  if (equipment.length === 0) return null;

  const Section = ({ title, items, icon, badgeClass }: { title: string; items: any[]; icon: React.ReactNode; badgeClass: string }) => {
    if (items.length === 0) return null;
    return (
      <div>
        <div className="flex items-center gap-2 mb-2">
          {icon}
          <span className="text-xs font-sans font-semibold text-foreground">{title}</span>
          <Badge className={`text-[10px] border-none ${badgeClass}`}>{items.length}</Badge>
        </div>
        <div className="space-y-1.5">
          {items.slice(0, 5).map((e: any) => (
            <div key={e.id} className="flex items-center justify-between py-1.5 px-2 rounded bg-muted/30">
              <div className="min-w-0">
                <p className="text-xs font-sans text-foreground truncate">{e.name}</p>
                <p className="text-[10px] font-sans text-muted-foreground truncate">
                  {(e as any).properties?.property_name || (e as any).properties?.address || ""}
                </p>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground whitespace-nowrap ml-2">
                {format(new Date(e.warranty_expiry), "MMM d, yyyy")}
              </span>
            </div>
          ))}
          {items.length > 5 && (
            <p className="text-[10px] font-sans text-muted-foreground text-center">+{items.length - 5} more</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-sm font-sans font-semibold text-foreground">Warranty Tracker</h3>
        <Badge variant="secondary" className="text-[10px]">{equipment.length} items</Badge>
      </div>
      <div className="space-y-4">
        <Section
          title="Expired"
          items={expired}
          icon={<AlertTriangle className="w-3.5 h-3.5 text-destructive" />}
          badgeClass="bg-destructive/10 text-destructive"
        />
        <Section
          title="Expiring Soon (90 days)"
          items={expiringSoon}
          icon={<Calendar className="w-3.5 h-3.5 text-orange-500" />}
          badgeClass="bg-orange-500/10 text-orange-700 dark:text-orange-400"
        />
        <Section
          title="Active"
          items={active}
          icon={<Shield className="w-3.5 h-3.5 text-emerald-500" />}
          badgeClass="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
        />
      </div>
    </Card>
  );
};

export default EquipmentWarrantyCalendar;
