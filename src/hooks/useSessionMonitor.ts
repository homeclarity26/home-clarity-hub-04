import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

/**
 * Monitors auth session and warns user before token expiry.
 * Also handles auth errors gracefully.
 */
export function useSessionMonitor() {
  const { user, signOut } = useAuth();
  const warnedRef = useRef(false);

  useEffect(() => {
    if (!user) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "TOKEN_REFRESHED") {
        warnedRef.current = false;
      }
      if (event === "SIGNED_OUT") {
        // Session expired
        if (warnedRef.current) return;
        warnedRef.current = true;
        toast.error("Your session has expired. Please sign in again.");
      }
    });

    // Periodic session check every 5 minutes
    const interval = setInterval(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session && user) {
        toast.error("Your session has expired. Please sign in again.");
        signOut();
      }
    }, 5 * 60 * 1000);

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, [user, signOut]);
}
