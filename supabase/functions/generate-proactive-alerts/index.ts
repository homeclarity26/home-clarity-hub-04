// Cron-triggered function. verify_jwt is false; the x-supabase-cron-secret
// header (set by the pg_cron schedule) is the only gate — see requireCron.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from "../_shared/auth.ts";
import { requireCron } from "../_shared/cron-auth.ts";

const MAX_ALERTS_PER_PROPERTY_PER_WEEK = 3;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Cron-only: service-role scan across all tenants. Gate before any work.
  const denied = requireCron(req);
  if (denied) return denied;

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceRoleKey);

  try {
    const { data: properties } = await admin
      .from("properties")
      .select("id, year_built, client_user_id");

    if (!properties || properties.length === 0) {
      return new Response(JSON.stringify({ ok: true, generated: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let totalGenerated = 0;

    for (const property of properties) {
      // Frequency cap: count alerts created this week
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { count: recentCount } = await admin
        .from("proactive_alerts")
        .select("*", { count: "exact", head: true })
        .eq("property_id", property.id)
        .gte("created_at", weekAgo);

      if ((recentCount || 0) >= MAX_ALERTS_PER_PROPERTY_PER_WEEK) continue;

      const alerts: Array<{
        property_id: string;
        severity: string;
        type: string;
        title: string;
        body: string;
        due_date?: string;
      }> = [];

      // Age-based: systems past 80% lifespan
      const { data: pages } = await admin
        .from("report_pages")
        .select("title, specs, group_id")
        .eq("property_id", property.id)
        .eq("status", "published");

      if (pages) {
        for (const page of pages) {
          const specs = page.specs as Record<string, string> | null;
          if (!specs) continue;

          const ageStr = specs.age || specs.install_year || specs.year_installed;
          if (!ageStr) continue;

          let installYear: number | null = null;
          if (/^\d{4}$/.test(ageStr)) {
            installYear = parseInt(ageStr);
          } else if (/\d+\s*year/i.test(ageStr)) {
            const match = ageStr.match(/(\d+)/);
            if (match) installYear = new Date().getFullYear() - parseInt(match[1]);
          }
          if (!installYear) continue;

          const lifespan = specs.expected_lifespan || specs.lifespan;
          let expectedYears = 20;
          if (lifespan) {
            const match = lifespan.match(/(\d+)/);
            if (match) expectedYears = parseInt(match[1]);
          }

          const age = new Date().getFullYear() - installYear;
          if (age >= expectedYears * 0.8) {
            alerts.push({
              property_id: property.id,
              severity: age >= expectedYears ? "urgent" : "recommended",
              type: "age_based",
              title: `${page.title} approaching end of life`,
              body: `Installed ~${installYear}, expected lifespan ${expectedYears} years. Consider planning for replacement.`,
            });
          }
        }
      }

      // Service overdue: recurring_services with last_service_date > 12 months
      const { data: services } = await admin
        .from("recurring_services")
        .select("service_name, last_service_date, frequency")
        .eq("property_id", property.id);

      if (services) {
        const twelveMonthsAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
        for (const svc of services) {
          if (!svc.last_service_date) continue;
          const lastDate = new Date(svc.last_service_date);
          if (lastDate < twelveMonthsAgo) {
            alerts.push({
              property_id: property.id,
              severity: "recommended",
              type: "service_overdue",
              title: `${svc.service_name} is overdue`,
              body: `Last serviced ${svc.last_service_date}. Recommended frequency: ${svc.frequency || "annually"}.`,
            });
          }
        }
      }

      // Seasonal alerts by month
      const month = new Date().getMonth() + 1;
      const seasonalMap: Record<number, { title: string; body: string }[]> = {
        3: [{ title: "Spring HVAC tune-up", body: "Schedule AC maintenance before summer heat arrives." }],
        4: [{ title: "Gutter cleaning", body: "Clear debris from gutters before spring storms." }],
        9: [{ title: "Fall furnace inspection", body: "Schedule heating system maintenance before cold weather." }],
        10: [{ title: "Winterize exterior", body: "Disconnect hoses, cover outdoor faucets, check weatherstripping." }],
        11: [{ title: "Fireplace & chimney check", body: "Schedule chimney sweep and inspection before heavy use season." }],
      };

      if (seasonalMap[month]) {
        // Only add if not already generated this month
        const monthStart = new Date(new Date().getFullYear(), month - 1, 1).toISOString();
        const { count: existingSeasonal } = await admin
          .from("proactive_alerts")
          .select("*", { count: "exact", head: true })
          .eq("property_id", property.id)
          .eq("type", "seasonal")
          .gte("created_at", monthStart);

        if (!existingSeasonal || existingSeasonal === 0) {
          for (const s of seasonalMap[month]) {
            alerts.push({
              property_id: property.id,
              severity: "info",
              type: "seasonal",
              title: s.title,
              body: s.body,
            });
          }
        }
      }

      // Cap to remaining budget
      const remaining = MAX_ALERTS_PER_PROPERTY_PER_WEEK - (recentCount || 0);
      const toInsert = alerts.slice(0, remaining);

      if (toInsert.length > 0) {
        await admin.from("proactive_alerts").insert(toInsert);
        totalGenerated += toInsert.length;
      }
    }

    return new Response(
      JSON.stringify({ ok: true, generated: totalGenerated }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generate-proactive-alerts error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
