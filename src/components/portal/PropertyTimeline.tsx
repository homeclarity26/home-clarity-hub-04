import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow, format } from "date-fns";
import { FileText, CreditCard, Wrench, MessageSquare, Calendar, Camera, Star, CheckCircle, Home, Shield } from "lucide-react";

interface TimelineEvent {
  id: string;
  action_type: string;
  message: string;
  created_at: string;
}

const iconMap: Record<string, typeof FileText> = {
  publish: FileText,
  edit: FileText,
  payment: CreditCard,
  comment: MessageSquare,
  schedule: Calendar,
  equipment: Wrench,
  photo: Camera,
  milestone: CheckCircle,
  project: Wrench,
  inspection: Shield,
  report: FileText,
  default: Home,
};

const colorMap: Record<string, string> = {
  publish: "bg-accent/20 text-accent",
  payment: "bg-green-100 text-green-700",
  equipment: "bg-blue-100 text-blue-700",
  project: "bg-primary/10 text-primary",
  milestone: "bg-accent/20 text-accent",
  default: "bg-muted text-muted-foreground",
};

const PropertyTimeline = ({ propertyId }: { propertyId?: string }) => {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!propertyId || propertyId.startsWith("mock-")) {
      setEvents([
        { id: "1", action_type: "publish", message: "Home Clarity Report published", created_at: new Date(Date.now() - 86400000 * 2).toISOString() },
        { id: "2", action_type: "payment", message: "Invoice HBC-0001 marked as paid — $2,500", created_at: new Date(Date.now() - 86400000 * 5).toISOString() },
        { id: "3", action_type: "equipment", message: "Furnace added to Equipment Registry", created_at: new Date(Date.now() - 86400000 * 10).toISOString() },
        { id: "4", action_type: "project", message: "Furnace Replacement project created", created_at: new Date(Date.now() - 86400000 * 14).toISOString() },
        { id: "5", action_type: "milestone", message: "Vendor selected for Furnace Replacement", created_at: new Date(Date.now() - 86400000 * 20).toISOString() },
        { id: "6", action_type: "edit", message: "Roof System page updated with new findings", created_at: new Date(Date.now() - 86400000 * 30).toISOString() },
        { id: "7", action_type: "comment", message: "Your advisor left a message about your HVAC", created_at: new Date(Date.now() - 86400000 * 45).toISOString() },
        { id: "8", action_type: "schedule", message: "Annual inspection scheduled", created_at: new Date(Date.now() - 86400000 * 60).toISOString() },
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
        .limit(50);
      setEvents(data || []);
      setLoading(false);
    };
    load();
  }, [propertyId]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (events.length === 0) return null;

  // Group events by month/year
  const grouped: Record<string, TimelineEvent[]> = {};
  events.forEach(ev => {
    const key = format(new Date(ev.created_at), "MMMM yyyy");
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(ev);
  });

  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent mb-8">Your Property History</p>

      <div className="relative">
        {/* Vertical gold line */}
        <div className="absolute left-[19px] top-0 bottom-0 w-[2px] bg-accent/20" />

        {Object.entries(grouped).map(([month, monthEvents]) => (
          <div key={month} className="mb-8">
            <div className="flex items-center gap-3 mb-4 relative">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center z-10 shadow-md">
                <Calendar className="w-4 h-4 text-primary-foreground" />
              </div>
              <h3 className="font-display text-base text-foreground">{month}</h3>
            </div>

            <div className="space-y-4 ml-[19px] pl-8 border-l-0">
              {monthEvents.map((event) => {
                const Icon = iconMap[event.action_type] || iconMap.default;
                const colors = colorMap[event.action_type] || colorMap.default;

                return (
                  <div key={event.id} className="flex items-start gap-4 relative">
                    {/* Gold dot on the line */}
                    <div className="absolute -left-8 top-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-accent shadow-sm ring-2 ring-background" />
                    </div>

                    <div className={`w-8 h-8 rounded-full ${colors} flex items-center justify-center shrink-0`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>

                    <div className="flex-1 min-w-0 pb-2">
                      <p className="font-sans text-sm text-foreground leading-relaxed">{event.message}</p>
                      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PropertyTimeline;
