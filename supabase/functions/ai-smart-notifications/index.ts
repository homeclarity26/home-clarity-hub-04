import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not set");

    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch all properties with their reports, equipment, and recent activity
    const { data: properties } = await sb.from("properties").select("id, property_name, client_user_id, address");
    if (!properties || properties.length === 0) {
      return new Response(JSON.stringify({ nudges_created: 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: equipment } = await sb.from("equipment").select("*");
    const { data: invoices } = await sb.from("invoices").select("*");

    const nudges: any[] = [];

    for (const prop of properties) {
      if (!prop.client_user_id) continue;
      const propEquipment = (equipment || []).filter((e: any) => e.property_id === prop.id);
      const propInvoices = (invoices || []).filter((i: any) => i.property_id === prop.id);

      // Check overdue equipment service
      const now = new Date();
      const overdueEquip = propEquipment.filter((e: any) => e.next_service_date && new Date(e.next_service_date) < now);
      if (overdueEquip.length > 0) {
        nudges.push({
          property_id: prop.id,
          client_id: prop.client_user_id,
          nudge_type: "maintenance_overdue",
          title: `${overdueEquip.length} system${overdueEquip.length > 1 ? "s" : ""} overdue for service`,
          message: `${overdueEquip.map((e: any) => e.name).join(", ")} ${overdueEquip.length > 1 ? "are" : "is"} past the scheduled service date.`,
          action_url: "/equipment",
        });
      }

      // Check overdue invoices
      const overdueInv = propInvoices.filter((i: any) => i.due_date && new Date(i.due_date) < now && Number(i.balance_due) > 0);
      if (overdueInv.length > 0) {
        nudges.push({
          property_id: prop.id,
          client_id: prop.client_user_id,
          nudge_type: "payment_reminder",
          title: "Payment reminder",
          message: `You have ${overdueInv.length} outstanding invoice${overdueInv.length > 1 ? "s" : ""}.`,
          action_url: "/payments",
        });
      }

      // Check equipment warranty expiring soon (within 90 days)
      const soonExpiry = propEquipment.filter((e: any) => {
        if (!e.warranty_expiry) return false;
        const exp = new Date(e.warranty_expiry);
        const daysLeft = (exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        return daysLeft > 0 && daysLeft <= 90;
      });
      if (soonExpiry.length > 0) {
        nudges.push({
          property_id: prop.id,
          client_id: prop.client_user_id,
          nudge_type: "warranty_expiring",
          title: "Warranty expiring soon",
          message: `${soonExpiry[0].name} warranty expires within 90 days. Consider scheduling service.`,
          action_url: "/equipment",
        });
      }
    }

    // Insert nudges (avoid duplicates by checking recent ones)
    let created = 0;
    for (const nudge of nudges) {
      const { data: existing } = await sb
        .from("ai_notification_nudges")
        .select("id")
        .eq("property_id", nudge.property_id)
        .eq("nudge_type", nudge.nudge_type)
        .eq("is_dismissed", false)
        .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .limit(1);

      if (!existing || existing.length === 0) {
        await sb.from("ai_notification_nudges").insert(nudge);
        created++;
      }
    }

    return new Response(JSON.stringify({ nudges_created: created, total_checked: properties.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Smart notifications error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
