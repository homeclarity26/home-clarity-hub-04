import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const in14Days = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    const todayStr = now.toISOString().split("T")[0];
    const in30Str = in30Days.toISOString().split("T")[0];

    // Find equipment with service dates in next 30 days or already overdue
    const { data: equipment, error: eqErr } = await supabase
      .from("equipment")
      .select("id, name, category, brand, model, next_service_date, warranty_expiry, property_id")
      .not("next_service_date", "is", null)
      .lte("next_service_date", in30Str)
      .order("next_service_date", { ascending: true });

    if (eqErr) throw eqErr;
    if (!equipment || equipment.length === 0) {
      return new Response(JSON.stringify({ message: "No maintenance alerts needed", alerts_sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Group equipment by property
    const byProperty = new Map<string, typeof equipment>();
    for (const item of equipment) {
      const list = byProperty.get(item.property_id) || [];
      list.push(item);
      byProperty.set(item.property_id, list);
    }

    let alertsSent = 0;
    const results: { property_id: string; items: number; status: string }[] = [];

    for (const [propertyId, items] of byProperty.entries()) {
      // Classify items
      const overdue = items.filter((i) => i.next_service_date! <= todayStr);
      const dueSoon = items.filter((i) => i.next_service_date! > todayStr && i.next_service_date! <= in14Days.toISOString().split("T")[0]);
      const upcoming = items.filter((i) => i.next_service_date! > in14Days.toISOString().split("T")[0]);

      // Check if we already sent a reminder recently (within 7 days)
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: recentReminders } = await supabase
        .from("maintenance_reminders")
        .select("id")
        .eq("property_id", propertyId)
        .gte("last_sent_at", sevenDaysAgo)
        .limit(1);

      if (recentReminders && recentReminders.length > 0) {
        results.push({ property_id: propertyId, items: items.length, status: "skipped_recent" });
        continue;
      }

      // Build email data
      const emailItems = items.map((item) => {
        const serviceDate = new Date(item.next_service_date!);
        const daysUntil = Math.ceil((serviceDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return {
          name: item.name,
          brand: item.brand,
          model: item.model,
          category: item.category,
          service_date: item.next_service_date,
          days_until: daysUntil,
          urgency: daysUntil <= 0 ? "overdue" : daysUntil <= 14 ? "due_soon" : "upcoming",
        };
      });

      // Send notification email
      try {
        const notifyResponse = await fetch(`${supabaseUrl}/functions/v1/send-notification-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
          },
          body: JSON.stringify({
            type: "maintenance_reminder",
            property_id: propertyId,
            data: {
              items: emailItems,
              overdue_count: overdue.length,
              due_soon_count: dueSoon.length,
              upcoming_count: upcoming.length,
            },
          }),
        });

        const notifyResult = await notifyResponse.json();

        // Update maintenance_reminders last_sent_at
        for (const item of items) {
          await supabase
            .from("maintenance_reminders")
            .upsert({
              property_id: propertyId,
              equipment_id: item.id,
              title: `${item.name} service`,
              recommended_month: new Date(item.next_service_date!).getMonth() + 1,
              last_sent_at: now.toISOString(),
            }, { onConflict: "id" });
        }

        // Log timeline event
        await supabase.from("client_timeline_events").insert({
          client_id: propertyId,
          event_type: "maintenance_alert",
          event_description: `Maintenance alert sent: ${overdue.length} overdue, ${dueSoon.length} due soon, ${upcoming.length} upcoming`,
          actor: "System",
          is_admin_note: false,
        });

        alertsSent++;
        results.push({ property_id: propertyId, items: items.length, status: "sent" });
      } catch (sendErr) {
        console.error(`Failed to send alert for property ${propertyId}:`, sendErr);
        results.push({ property_id: propertyId, items: items.length, status: "failed" });
      }
    }

    return new Response(JSON.stringify({ message: "Maintenance alerts processed", alerts_sent: alertsSent, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("maintenance-alerts error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
