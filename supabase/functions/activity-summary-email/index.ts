import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireCron } from "../_shared/cron-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-cron-secret",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Cron-only: service-role scan across all tenants. Gate before any work.
  const denied = requireCron(req);
  if (denied) return denied;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Get all properties with client users
    const { data: properties } = await supabase
      .from("properties")
      .select("id, property_name, address, client_user_id");

    if (!properties || properties.length === 0) {
      return new Response(JSON.stringify({ message: "No properties found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const summaries = [];

    for (const prop of properties) {
      if (!prop.client_user_id) continue;

      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      // Get recent activity
      const { data: activity } = await supabase
        .from("activity_log")
        .select("action_type, message, created_at")
        .eq("property_id", prop.id)
        .gte("created_at", thirtyDaysAgo)
        .order("created_at", { ascending: false })
        .limit(10);

      // Get pending invoices
      const { data: invoices } = await supabase
        .from("invoices")
        .select("title, amount, status, due_date")
        .eq("property_id", prop.id)
        .in("status", ["pending", "overdue"]);

      // Get upcoming maintenance
      const { data: equipment } = await supabase
        .from("equipment")
        .select("name, next_service_date")
        .eq("property_id", prop.id)
        .not("next_service_date", "is", null);

      const upcomingService = (equipment || []).filter((e) => {
        const d = new Date(e.next_service_date);
        return d <= new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
      });

      summaries.push({
        property_id: prop.id,
        property_name: prop.property_name || prop.address,
        client_id: prop.client_user_id,
        recent_activity_count: (activity || []).length,
        pending_invoices: (invoices || []).length,
        pending_amount: (invoices || []).reduce((s, i) => s + Number(i.amount), 0),
        upcoming_service: upcomingService.length,
        top_activities: (activity || []).slice(0, 5).map((a) => a.message),
      });
    }

    return new Response(JSON.stringify({ summaries, generated_at: new Date().toISOString() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
