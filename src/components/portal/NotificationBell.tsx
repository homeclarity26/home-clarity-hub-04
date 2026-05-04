import { useState, useEffect } from "react";
import { Bell, X, MessageSquare, FileText, Calendar, Wrench } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";

interface Notification {
  id: string;
  type: "message" | "report" | "invoice" | "schedule" | "maintenance";
  title: string;
  body: string;
  created_at: string;
  is_read: boolean;
}

interface NotificationBellProps {
  propertyId?: string;
  onNavigate?: (tab: string) => void;
}

const TYPE_ICONS = {
  message: MessageSquare,
  report: FileText,
  invoice: FileText,
  schedule: Calendar,
  maintenance: Wrench,
};

const NotificationBell = ({ propertyId, onNavigate }: NotificationBellProps) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!propertyId || propertyId.startsWith("mock-") || !user) return;

    const load = async () => {
      // Fetch unread messages count
      const { count: msgCount } = await supabase.from("property_messages")
        .select("*", { count: "exact", head: true })
        .eq("property_id", propertyId)
        .eq("is_read", false)
        .neq("sender_id", user.id);

      // Fetch recent nudges  
      const { data: nudges } = await supabase.from("ai_notification_nudges")
        .select("*")
        .eq("property_id", propertyId)
        .eq("is_dismissed", false)
        .order("created_at", { ascending: false })
        .limit(5);

      const items: Notification[] = [];

      if (msgCount && msgCount > 0) {
        items.push({
          id: "unread-msgs",
          type: "message",
          title: `${msgCount} unread message${msgCount > 1 ? "s" : ""}`,
          body: "You have new messages from your advisor",
          created_at: new Date().toISOString(),
          is_read: false,
        });
      }

      if (nudges) {
        for (const n of nudges) {
          items.push({
            id: n.id,
            type: n.nudge_type as Notification["type"],
            title: n.title,
            body: n.message,
            created_at: n.created_at,
            is_read: n.is_read || false,
          });
        }
      }

      // Proactive alerts
      const { data: alerts } = await supabase.from("proactive_alerts")
        .select("*")
        .eq("property_id", propertyId)
        .in("status", ["pending", "shown"])
        .order("created_at", { ascending: false })
        .limit(10);

      if (alerts) {
        for (const a of alerts) {
          items.push({
            id: a.id,
            type: "maintenance",
            title: a.title,
            body: a.body,
            created_at: a.created_at,
            is_read: a.status === "shown",
          });
        }
      }

      setNotifications(items);
    };

    load();
  }, [propertyId, user, open]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const dismiss = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (id === "unread-msgs") return;

    // Try proactive_alerts first, then nudges
    const { error: alertErr } = await supabase.from("proactive_alerts")
      .update({ status: "dismissed" })
      .eq("id", id);

    if (alertErr) {
      await supabase.from("ai_notification_nudges")
        .update({ is_dismissed: true })
        .eq("id", id);
    }
  };

  const handleClick = (n: Notification) => {
    if (n.type === "message") onNavigate?.("messages");
    else if (n.type === "report") onNavigate?.("report");
    else if (n.type === "invoice") onNavigate?.("payments");
    else if (n.type === "schedule") onNavigate?.("schedule");
    else onNavigate?.("home");
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-full hover:bg-muted transition-colors bg-transparent border-none cursor-pointer">
          <Bell className="w-5 h-5 text-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1">
              {unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-3 border-b border-border">
          <h3 className="font-sans text-sm font-semibold text-foreground">Notifications</h3>
        </div>
        <div className="max-h-72 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-6 text-center">
              <Bell className="w-5 h-5 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs font-sans text-muted-foreground">All caught up!</p>
            </div>
          ) : (
            notifications.map((n) => {
              const Icon = TYPE_ICONS[n.type] || Bell;
              return (
                <div key={n.id} className="flex items-start gap-3 px-3 py-3 border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                  <button onClick={() => handleClick(n)} className="flex-1 flex items-start gap-3 text-left bg-transparent border-none cursor-pointer p-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${n.is_read ? "bg-muted" : "bg-primary/10"}`}>
                      <Icon className={`w-3.5 h-3.5 ${n.is_read ? "text-muted-foreground" : "text-primary"}`} />
                    </div>
                    <div className="min-w-0">
                      <p className={`text-xs font-sans ${n.is_read ? "text-muted-foreground" : "text-foreground font-medium"}`}>{n.title}</p>
                      <p className="text-[10px] font-sans text-muted-foreground line-clamp-2 mt-0.5">{n.body}</p>
                      <p className="text-[9px] font-sans text-muted-foreground/60 mt-1">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </button>
                  <button onClick={() => dismiss(n.id)} className="shrink-0 text-muted-foreground/50 hover:text-muted-foreground p-1 bg-transparent border-none cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
