import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Bell, CheckCheck, MessageSquare, FileText, DollarSign, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  type: string;
  message: string;
  propertyId?: string;
  propertyName?: string;
  timestamp: string;
  read: boolean;
}

const iconMap: Record<string, React.ReactNode> = {
  message: <MessageSquare className="w-3.5 h-3.5 text-blue-500" />,
  comment: <MessageSquare className="w-3.5 h-3.5 text-purple-500" />,
  publish: <FileText className="w-3.5 h-3.5 text-emerald-500" />,
  edit: <FileText className="w-3.5 h-3.5 text-muted-foreground" />,
  payment: <DollarSign className="w-3.5 h-3.5 text-emerald-500" />,
  alert: <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />,
};

const NotificationBell = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const fetchNotifications = useCallback(async () => {
    const { data } = await supabase
      .from("activity_log")
      .select("id, action_type, message, property_id, created_at, metadata")
      .order("created_at", { ascending: false })
      .limit(20);

    if (data) {
      setNotifications(data.map((a) => ({
        id: a.id,
        type: a.action_type,
        message: a.message,
        propertyId: a.property_id || undefined,
        propertyName: (a.metadata as any)?.property_name || undefined,
        timestamp: a.created_at,
        read: false,
      })));
    }
  }, []);

  useEffect(() => {
    fetchNotifications();

    const channel = supabase
      .channel("notifications-bell")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "activity_log" }, () => {
        fetchNotifications();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleClick = (n: Notification) => {
    setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, read: true } : x));
    if (n.propertyId) {
      navigate(`/admin/clients/${n.propertyId}`);
      setOpen(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center min-w-[16px] h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold px-1">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-96">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle className="font-sans text-sm">Notifications</SheetTitle>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" className="text-xs font-sans gap-1" onClick={markAllRead}>
                <CheckCheck className="w-3 h-3" />Mark all read
              </Button>
            )}
          </div>
        </SheetHeader>
        <div className="mt-4 space-y-1 max-h-[calc(100vh-100px)] overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="text-sm font-sans text-muted-foreground text-center py-8">No notifications yet</p>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={`w-full text-left p-3 rounded-md transition-colors flex gap-3 bg-transparent border-none cursor-pointer ${
                  n.read ? "opacity-60 hover:bg-muted/30" : "bg-muted/50 hover:bg-muted/80"
                }`}
              >
                <div className="mt-0.5">{iconMap[n.type] || iconMap.edit}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-sans text-foreground truncate">{n.message}</p>
                  <p className="text-[10px] font-sans text-muted-foreground mt-0.5">
                    {formatDistanceToNow(new Date(n.timestamp), { addSuffix: true })}
                  </p>
                </div>
                {!n.read && <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />}
              </button>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default NotificationBell;
