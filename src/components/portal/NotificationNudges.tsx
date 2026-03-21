import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Bell, Wrench, Receipt, Shield, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Nudge {
  id: string;
  nudge_type: string;
  title: string;
  message: string;
  action_url: string | null;
  is_read: boolean;
  is_dismissed: boolean;
  created_at: string;
}

interface NotificationNudgesProps {
  propertyId?: string;
  onNavigate: (tab: string) => void;
}

const NUDGE_ICONS: Record<string, React.ElementType> = {
  maintenance_overdue: Wrench,
  payment_reminder: Receipt,
  warranty_expiring: Shield,
};

const NUDGE_COLORS: Record<string, string> = {
  maintenance_overdue: "border-l-destructive bg-destructive/5",
  payment_reminder: "border-l-accent bg-accent/5",
  warranty_expiring: "border-l-primary bg-primary/5",
};

const NotificationNudges = ({ propertyId, onNavigate }: NotificationNudgesProps) => {
  const { user } = useAuth();
  const [nudges, setNudges] = useState<Nudge[]>([]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await (supabase.from("ai_notification_nudges" as any) as any)
        .select("*")
        .eq("client_id", user.id)
        .eq("is_dismissed", false)
        .order("created_at", { ascending: false })
        .limit(5);
      if (data) setNudges(data);
    };
    load();

    // Realtime subscription
    const channel = supabase
      .channel("nudges-" + user.id)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "ai_notification_nudges",
        filter: `client_id=eq.${user.id}`,
      }, (payload: any) => {
        setNudges((prev) => [payload.new as Nudge, ...prev].slice(0, 5));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const dismiss = async (id: string) => {
    await (supabase.from("ai_notification_nudges" as any) as any)
      .update({ is_dismissed: true })
      .eq("id", id);
    setNudges((prev) => prev.filter((n) => n.id !== id));
  };

  if (nudges.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-1">
        <Bell className="w-4 h-4 text-muted-foreground" />
        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Smart Alerts</span>
        <Badge variant="secondary" className="text-[9px] font-mono ml-auto">{nudges.length}</Badge>
      </div>
      {nudges.map((nudge) => {
        const Icon = NUDGE_ICONS[nudge.nudge_type] || Bell;
        const colorClass = NUDGE_COLORS[nudge.nudge_type] || "border-l-muted bg-muted/30";
        return (
          <div key={nudge.id} className={`rounded-md border-l-4 p-3 ${colorClass} flex items-start gap-3`}>
            <Icon className="w-4 h-4 text-foreground shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-sans font-medium text-foreground">{nudge.title}</p>
              <p className="text-xs font-sans text-muted-foreground mt-0.5">{nudge.message}</p>
              {nudge.action_url && (
                <button
                  onClick={() => onNavigate(nudge.action_url!.replace("/", ""))}
                  className="text-xs font-sans text-primary flex items-center gap-1 mt-1.5 bg-transparent border-none cursor-pointer hover:underline"
                >
                  View details <ChevronRight className="w-3 h-3" />
                </button>
              )}
            </div>
            <button
              onClick={() => dismiss(nudge.id)}
              className="bg-transparent border-none cursor-pointer p-1 rounded hover:bg-muted/50 transition-colors shrink-0"
            >
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default NotificationNudges;
