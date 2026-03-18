import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, DollarSign, MessageSquare, Wrench, Clock, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { isPast, differenceInDays, format } from "date-fns";

interface OverdueItem {
  id: string;
  type: "invoice" | "message" | "service" | "warranty";
  propertyId: string;
  propertyName: string;
  title: string;
  detail: string;
  daysOverdue: number;
  severity: "high" | "medium" | "low";
}

const typeConfig = {
  invoice: { icon: DollarSign, color: "text-destructive", bgColor: "bg-destructive/10" },
  message: { icon: MessageSquare, color: "text-amber-600", bgColor: "bg-amber-100" },
  service: { icon: Wrench, color: "text-orange-600", bgColor: "bg-orange-100" },
  warranty: { icon: Clock, color: "text-primary", bgColor: "bg-primary/10" },
};

const OverdueActionCenter = () => {
  const navigate = useNavigate();

  const { data: items } = useQuery({
    queryKey: ["overdue-action-center"],
    queryFn: async () => {
      const now = new Date();
      const results: OverdueItem[] = [];

      const [{ data: invoices }, { data: messages }, { data: equipment }, { data: properties }] = await Promise.all([
        supabase.from("invoices").select("id, property_id, description, due_date, balance_due, status"),
        supabase.from("property_messages").select("id, property_id, message, is_read, created_at, sender_id"),
        supabase.from("equipment").select("id, property_id, name, next_service_date, warranty_expiry"),
        supabase.from("properties").select("id, property_name, address, client_user_id"),
      ]);

      const propMap = new Map((properties || []).map((p) => [p.id, p.property_name || p.address]));

      // Overdue invoices
      (invoices || []).forEach((inv) => {
        if (inv.due_date && Number(inv.balance_due) > 0 && isPast(new Date(inv.due_date))) {
          const days = differenceInDays(now, new Date(inv.due_date));
          results.push({
            id: `inv-${inv.id}`, type: "invoice", propertyId: inv.property_id,
            propertyName: propMap.get(inv.property_id) || "Unknown",
            title: `$${Number(inv.balance_due).toLocaleString()} overdue`,
            detail: inv.description,
            daysOverdue: days,
            severity: days > 30 ? "high" : days > 14 ? "medium" : "low",
          });
        }
      });

      // Unread messages (from clients)
      const { data: userData } = await supabase.auth.getUser();
      const myId = userData?.user?.id;
      (messages || []).forEach((msg) => {
        if (!msg.is_read && msg.sender_id !== myId) {
          const days = differenceInDays(now, new Date(msg.created_at));
          if (days >= 1) {
            results.push({
              id: `msg-${msg.id}`, type: "message", propertyId: msg.property_id,
              propertyName: propMap.get(msg.property_id) || "Unknown",
              title: "Unread client message",
              detail: msg.message.slice(0, 80),
              daysOverdue: days,
              severity: days > 7 ? "high" : days > 3 ? "medium" : "low",
            });
          }
        }
      });

      // Overdue equipment service
      (equipment || []).forEach((eq) => {
        if (eq.next_service_date && isPast(new Date(eq.next_service_date))) {
          const days = differenceInDays(now, new Date(eq.next_service_date));
          results.push({
            id: `svc-${eq.id}`, type: "service", propertyId: eq.property_id,
            propertyName: propMap.get(eq.property_id) || "Unknown",
            title: `${eq.name} service overdue`,
            detail: `Due ${format(new Date(eq.next_service_date), "MMM d, yyyy")}`,
            daysOverdue: days,
            severity: days > 90 ? "high" : days > 30 ? "medium" : "low",
          });
        }
        if (eq.warranty_expiry && isPast(new Date(eq.warranty_expiry))) {
          const days = differenceInDays(now, new Date(eq.warranty_expiry));
          if (days <= 90) {
            results.push({
              id: `war-${eq.id}`, type: "warranty", propertyId: eq.property_id,
              propertyName: propMap.get(eq.property_id) || "Unknown",
              title: `${eq.name} warranty expired`,
              detail: `Expired ${format(new Date(eq.warranty_expiry), "MMM d, yyyy")}`,
              daysOverdue: days,
              severity: days > 30 ? "medium" : "low",
            });
          }
        }
      });

      return results.sort((a, b) => {
        const sev = { high: 3, medium: 2, low: 1 };
        return sev[b.severity] - sev[a.severity] || b.daysOverdue - a.daysOverdue;
      });
    },
  });

  if (!items || items.length === 0) return null;

  const highCount = items.filter((i) => i.severity === "high").length;

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-destructive" />
          <h2 className="text-sm font-sans font-semibold text-foreground">Action Center</h2>
          <Badge variant="destructive" className="text-[10px]">{items.length} items</Badge>
          {highCount > 0 && (
            <Badge variant="outline" className="text-[10px] text-destructive border-destructive/30">{highCount} urgent</Badge>
          )}
        </div>
      </div>

      <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
        {items.slice(0, 12).map((item) => {
          const config = typeConfig[item.type];
          const Icon = config.icon;
          return (
            <button
              key={item.id}
              onClick={() => navigate(`/admin/clients/${item.propertyId}`)}
              className="w-full flex items-center gap-3 p-2.5 rounded-md hover:bg-muted/50 transition-colors bg-transparent border-none cursor-pointer text-left"
            >
              <div className={`w-7 h-7 rounded-md flex items-center justify-center ${config.bgColor}`}>
                <Icon className={`w-3.5 h-3.5 ${config.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-sans font-medium text-foreground truncate">{item.title}</p>
                <p className="text-[10px] font-sans text-muted-foreground truncate">{item.propertyName} · {item.detail}</p>
              </div>
              <Badge
                variant="outline"
                className={`text-[10px] font-mono shrink-0 ${
                  item.severity === "high" ? "text-destructive border-destructive/30" :
                  item.severity === "medium" ? "text-amber-600 border-amber-200" :
                  "text-muted-foreground"
                }`}
              >
                {item.daysOverdue}d
              </Badge>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            </button>
          );
        })}
      </div>
    </Card>
  );
};

export default OverdueActionCenter;
