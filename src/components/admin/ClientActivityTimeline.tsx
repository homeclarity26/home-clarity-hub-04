import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow, format } from "date-fns";
import { MessageSquare, FileText, CreditCard, Edit, Send, HelpCircle, Upload, Wrench, Calendar } from "lucide-react";

interface ClientActivityTimelineProps {
  propertyId: string;
}

const iconMap: Record<string, typeof MessageSquare> = {
  comment: MessageSquare,
  publish: Send,
  upload: Upload,
  edit: Edit,
  question: HelpCircle,
  invoice: CreditCard,
  payment: CreditCard,
  project: Wrench,
  schedule: Calendar,
  message: MessageSquare,
};

const colorMap: Record<string, string> = {
  comment: "bg-blue-100 text-blue-600",
  publish: "bg-green-100 text-green-600",
  upload: "bg-purple-100 text-purple-600",
  edit: "bg-muted text-muted-foreground",
  question: "bg-amber-100 text-amber-600",
  invoice: "bg-emerald-100 text-emerald-600",
  payment: "bg-teal-100 text-teal-600",
  project: "bg-orange-100 text-orange-600",
  schedule: "bg-sky-100 text-sky-600",
  message: "bg-indigo-100 text-indigo-600",
};

const ClientActivityTimeline = ({ propertyId }: ClientActivityTimelineProps) => {
  const { data: activities, isLoading } = useQuery({
    queryKey: ["client-activity-timeline", propertyId],
    queryFn: async () => {
      // Fetch from activity_log
      const { data: logs } = await supabase
        .from("activity_log")
        .select("*")
        .eq("property_id", propertyId)
        .order("created_at", { ascending: false })
        .limit(50);

      // Fetch messages
      const { data: msgs } = await (supabase
        .from("property_messages" as any) as any)
        .select("id, message, sender_id, created_at")
        .eq("property_id", propertyId)
        .order("created_at", { ascending: false })
        .limit(20);

      // Fetch invoices
      const { data: invs } = await supabase
        .from("invoices")
        .select("id, title, description, total, status, created_at")
        .eq("property_id", propertyId)
        .order("created_at", { ascending: false })
        .limit(10);

      // Fetch payments
      const { data: payments } = await supabase
        .from("payments_posted")
        .select("id, amount, payment_date, method, invoice_id, created_at")
        .order("created_at", { ascending: false })
        .limit(20);

      // Filter payments by property invoices
      const invoiceIds = new Set(invs?.map(i => i.id) || []);
      const propPayments = (payments || []).filter(p => invoiceIds.has(p.invoice_id));

      // Build unified timeline
      type TimelineItem = { id: string; type: string; message: string; timestamp: string; meta?: string };
      const items: TimelineItem[] = [];

      (logs || []).forEach(l => items.push({
        id: l.id, type: l.action_type, message: l.message, timestamp: l.created_at,
      }));

      (msgs || []).forEach((m: any) => items.push({
        id: m.id, type: "message",
        message: `Message: "${m.message.substring(0, 80)}${m.message.length > 80 ? '...' : ''}"`,
        timestamp: m.created_at,
      }));

      (invs || []).forEach(i => items.push({
        id: `inv-${i.id}`, type: "invoice",
        message: `Invoice created: ${i.title || i.description}`,
        timestamp: i.created_at, meta: `$${Number(i.total).toLocaleString()}`,
      }));

      propPayments.forEach(p => items.push({
        id: `pay-${p.id}`, type: "payment",
        message: `Payment received via ${p.method}`,
        timestamp: p.created_at, meta: `$${Number(p.amount).toLocaleString()}`,
      }));

      // Deduplicate by id and sort
      const seen = new Set<string>();
      return items
        .filter(i => { if (seen.has(i.id)) return false; seen.add(i.id); return true; })
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    },
  });

  if (isLoading) return <p className="text-sm text-muted-foreground py-4">Loading timeline...</p>;

  if (!activities || activities.length === 0) {
    return <p className="text-sm font-sans text-muted-foreground text-center py-8">No activity recorded yet.</p>;
  }

  // Group by date
  const grouped: Record<string, typeof activities> = {};
  activities.forEach(a => {
    const dateKey = format(new Date(a.timestamp), "yyyy-MM-dd");
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(a);
  });

  return (
    <Card className="p-5">
      <h2 className="text-sm font-sans font-semibold text-foreground mb-4">Activity Timeline</h2>
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
        <div className="space-y-6">
          {Object.entries(grouped).map(([dateKey, items]) => (
            <div key={dateKey}>
              <div className="relative pl-10 mb-2">
                <p className="text-xs font-sans font-medium text-muted-foreground">
                  {format(new Date(dateKey), "MMMM d, yyyy")}
                </p>
              </div>
              <div className="space-y-1">
                {items.map((item) => {
                  const Icon = iconMap[item.type] || Edit;
                  const colors = colorMap[item.type] || "bg-muted text-muted-foreground";
                  return (
                    <div key={item.id} className="relative pl-10 py-1.5">
                      <div className={`absolute left-2 top-3 w-5 h-5 rounded-full flex items-center justify-center ${colors}`}>
                        <Icon className="w-2.5 h-2.5" />
                      </div>
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-sans text-foreground leading-snug">{item.message}</p>
                        <div className="flex items-center gap-2 shrink-0">
                          {item.meta && <Badge variant="secondary" className="text-[10px] h-5">{item.meta}</Badge>}
                          <span className="text-[10px] font-sans text-muted-foreground whitespace-nowrap">
                            {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default ClientActivityTimeline;
