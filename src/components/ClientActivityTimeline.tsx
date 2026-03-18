import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { FileText, CreditCard, Wrench, MessageSquare, Calendar, Clock } from "lucide-react";

interface Activity {
  id: string;
  action_type: string;
  message: string;
  created_at: string;
}

const iconMap: Record<string, typeof FileText> = {
  edit: FileText,
  publish: FileText,
  payment: CreditCard,
  comment: MessageSquare,
  schedule: Calendar,
  equipment: Wrench,
};

const ClientActivityTimeline = ({ propertyId }: { propertyId?: string }) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!propertyId || propertyId.startsWith("mock-")) {
      setActivities([
        { id: "1", action_type: "publish", message: "Report published", created_at: new Date(Date.now() - 86400000 * 2).toISOString() },
        { id: "2", action_type: "payment", message: "Invoice HBC-0001 marked as paid", created_at: new Date(Date.now() - 86400000 * 5).toISOString() },
        { id: "3", action_type: "edit", message: "Roof System page updated", created_at: new Date(Date.now() - 86400000 * 7).toISOString() },
      ]);
      setLoading(false);
      return;
    }
    const load = async () => {
      const { data } = await supabase
        .from("activity_log")
        .select("id, action_type, message, created_at")
        .eq("property_id", propertyId)
        .order("created_at", { ascending: false })
        .limit(10);
      setActivities(data || []);
      setLoading(false);
    };
    load();
  }, [propertyId]);

  if (loading) return null;
  if (activities.length === 0) return null;

  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent mb-4">Recent Activity</p>
      <div className="space-y-3">
        {activities.map((a) => {
          const Icon = iconMap[a.action_type] || Clock;
          return (
            <div key={a.id} className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                <Icon className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-sans text-sm text-foreground">{a.message}</p>
                <p className="font-sans text-xs text-muted-foreground">{formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ClientActivityTimeline;
