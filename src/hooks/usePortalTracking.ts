import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function usePortalTracking(activeTab: string) {
  const { user, isCreator } = useAuth();
  const sessionId = useRef<string | null>(null);
  const lastTab = useRef<string>("");

  // Create session on mount
  useEffect(() => {
    if (!user || isCreator) return;

    const createSession = async () => {
      const { data } = await (supabase.from("client_sessions" as any) as any).insert({
        client_id: user.id,
      }).select("id").single();
      if (data) sessionId.current = data.id;
    };
    createSession();

    // Update session duration on interval
    const interval = setInterval(async () => {
      if (!sessionId.current) return;
      await (supabase.from("client_sessions" as any) as any)
        .update({ last_active_at: new Date().toISOString() })
        .eq("id", sessionId.current);
    }, 60_000); // every minute

    return () => clearInterval(interval);
  }, [user, isCreator]);

  // Track page views
  useEffect(() => {
    if (!user || isCreator || !activeTab || activeTab === lastTab.current) return;
    lastTab.current = activeTab;

    const logView = async () => {
      await (supabase.from("page_views" as any) as any).insert({
        client_id: user.id,
        page_name: activeTab,
      });

      // Also log to activity_log for admin visibility
      // Find user's property
      const { data: props } = await supabase.from("properties").select("id").eq("client_user_id", user.id).limit(1);
      if (props && props.length > 0) {
        await (supabase.from("activity_log") as any).insert({
          user_id: user.id,
          property_id: props[0].id,
          action_type: "page_view",
          message: `Viewed ${activeTab} tab`,
          metadata: { page: activeTab },
        });
      }
    };
    logView();
  }, [activeTab, user, isCreator]);
}

export function usePortalEngagement(propertyId?: string) {
  const getEngagement = useCallback(async (clientUserId: string) => {
    // Get real counts (not limited) AND the most recent rows for display.
    // Previously this used `.limit(50)` + `sessions.length`, which meant
    // "Total Logins" capped at 50 forever — so a client with 63 real
    // sessions showed "Total Logins 50" while page views (not similarly
    // capped beyond 200) could appear larger or smaller in confusing ways.
    const [sessionsCountRes, viewsCountRes, sessionsRes, viewsRes] = await Promise.all([
      (supabase.from("client_sessions" as any) as any)
        .select("id", { count: "exact", head: true })
        .eq("client_id", clientUserId),
      (supabase.from("page_views" as any) as any)
        .select("id", { count: "exact", head: true })
        .eq("client_id", clientUserId),
      (supabase.from("client_sessions" as any) as any)
        .select("login_at")
        .eq("client_id", clientUserId)
        .order("login_at", { ascending: false })
        .limit(1),
      (supabase.from("page_views" as any) as any)
        .select("page_name")
        .eq("client_id", clientUserId)
        .order("viewed_at", { ascending: false })
        .limit(200),
    ]);

    const totalLogins = sessionsCountRes.count ?? 0;
    const totalViews = viewsCountRes.count ?? 0;
    const lastLogin = sessionsRes.data?.[0]?.login_at ?? null;

    // "Pages This Month" / "Most Visited" — computed from the capped
    // recent-views sample, which is fine for a top-5 ranking. If we ever
    // need historical exact counts-by-page, switch to a server-side group-by.
    const viewsByPage: Record<string, number> = {};
    (viewsRes.data || []).forEach((v: any) => {
      viewsByPage[v.page_name] = (viewsByPage[v.page_name] || 0) + 1;
    });

    const mostVisited = Object.entries(viewsByPage).sort(([, a], [, b]) => b - a)[0]?.[0] || "None";

    return { totalLogins, lastLogin, viewsByPage, mostVisited, totalViews };
  }, []);

  return { getEngagement };
}
