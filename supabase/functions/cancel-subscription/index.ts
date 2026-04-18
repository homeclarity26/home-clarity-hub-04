import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireRole } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  
  const auth = await requireRole(req, ["creator"]);
  if ("error" in auth) return auth.error;
try {
    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    if (!STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { client_id, immediately } = await req.json();
    if (!client_id) throw new Error("Missing client_id");

    // Get subscription ID from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_subscription_id, email")
      .eq("user_id", client_id)
      .single();

    if (!profile?.stripe_subscription_id) throw new Error("No active subscription found");

    if (immediately) {
      // Cancel immediately
      const res = await fetch(`https://api.stripe.com/v1/subscriptions/${profile.stripe_subscription_id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` },
      });
      const sub = await res.json();
      if (sub.error) throw new Error(sub.error.message);

      await supabase
        .from("profiles")
        .update({ subscription_status: "canceled" })
        .eq("user_id", client_id);

      await supabase
        .from("client_memberships")
        .update({ status: "canceled", cancelled_at: new Date().toISOString() })
        .eq("client_id", client_id)
        .eq("status", "active");

    } else {
      // Cancel at period end
      const res = await fetch(`https://api.stripe.com/v1/subscriptions/${profile.stripe_subscription_id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ cancel_at_period_end: "true" }),
      });
      const sub = await res.json();
      if (sub.error) throw new Error(sub.error.message);

      // Status stays active, but we note the cancellation date
      await supabase
        .from("client_memberships")
        .update({ cancelled_at: new Date(sub.current_period_end * 1000).toISOString() })
        .eq("client_id", client_id)
        .eq("status", "active");
    }

    // Log the event
    await supabase.from("subscription_events").insert({
      client_id,
      event_type: immediately ? "canceled_immediately" : "canceled_at_period_end",
    });

    // Log activity
    await supabase.from("activity_log").insert({
      user_id: client_id,
      action_type: "subscription_canceled",
      message: `Subscription ${immediately ? "canceled immediately" : "set to cancel at period end"}`,
    });

    return new Response(
      JSON.stringify({ success: true, cancel_type: immediately ? "immediate" : "at_period_end" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
