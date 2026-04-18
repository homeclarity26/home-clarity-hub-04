import { useState, useEffect } from "react";
import { X, Bell, Megaphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";

interface Announcement {
  id: string;
  title: string;
  body: string;
  display_type: string;
  start_date: string;
  end_date: string | null;
  created_at: string;
}

const AnnouncementBanner = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [bellOpen, setBellOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase.from("announcements")
        .select("*")
        .lte("start_date", new Date().toISOString())
        .order("created_at", { ascending: false });

      if (data) setAnnouncements(data as Announcement[]);

      const { data: dismissals } = await supabase.from("announcement_dismissals")
        .select("announcement_id")
        .eq("user_id", user.id);

      if (dismissals) {
        setDismissed(new Set((dismissals as any[]).map((d: any) => d.announcement_id)));
      }
    };
    load();
  }, [user]);

  const handleDismiss = async (announcementId: string) => {
    if (!user) return;
    setDismissed((prev) => new Set([...prev, announcementId]));
    await supabase.from("announcement_dismissals").insert({
      announcement_id: announcementId,
      user_id: user.id,
    });
  };

  const banners = announcements.filter((a) => a.display_type === "banner" && !dismissed.has(a.id));
  const notifications = announcements.filter((a) => a.display_type === "notification");
  const unreadNotifs = notifications.filter((a) => !dismissed.has(a.id));

  return (
    <>
      {/* Banner announcements */}
      {banners.map((a) => (
        <div key={a.id} className="bg-accent/10 border-b border-accent/20 px-6 py-3">
          <div className="max-w-[1200px] mx-auto flex items-start gap-3">
            <Megaphone className="w-4 h-4 text-accent shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-sans font-medium text-foreground">{a.title}</p>
              <p className="text-xs font-sans text-muted-foreground mt-0.5 line-clamp-2">{a.body}</p>
            </div>
            <button
              onClick={() => handleDismiss(a.id)}
              className="p-1 bg-transparent border-none cursor-pointer text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}

      {/* Notification bell */}
      {notifications.length > 0 && (
        <div className="relative">
          <button
            onClick={() => setBellOpen(!bellOpen)}
            className="relative p-2 bg-transparent border-none cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadNotifs.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center px-1">
                {unreadNotifs.length}
              </span>
            )}
          </button>

          {bellOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden">
              <div className="p-3 border-b border-border">
                <h3 className="text-xs font-sans font-semibold text-foreground">Notifications</h3>
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-xs font-sans text-muted-foreground p-4 text-center">No notifications</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3 border-b border-border last:border-0 ${!dismissed.has(n.id) ? "bg-accent/5" : ""}`}
                      onClick={() => !dismissed.has(n.id) && handleDismiss(n.id)}
                    >
                      <p className="text-xs font-sans font-medium text-foreground">{n.title}</p>
                      <p className="text-[11px] font-sans text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                      <p className="text-[10px] font-sans text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default AnnouncementBanner;
