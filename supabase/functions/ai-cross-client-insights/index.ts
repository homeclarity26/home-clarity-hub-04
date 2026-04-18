import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callAI, parseJSON } from "../_shared/ai-client.ts";
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
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: properties } = await sb.from("properties").select("*");
    const { data: reports } = await sb.from("reports").select("*");
    const { data: reportPages } = await sb.from("report_pages").select("id, report_id, title, condition_rating, status");
    const { data: invoices } = await sb.from("invoices").select("*");
    const { data: equipment } = await sb.from("equipment").select("*");
    const { data: projects } = await sb.from("projects").select("*");

    // Build summary for AI analysis
    const summary = {
      total_properties: properties?.length || 0,
      reports: {
        total: reports?.length || 0,
        published: reports?.filter((r: any) => r.status === "published").length || 0,
        draft: reports?.filter((r: any) => r.status === "draft").length || 0,
      },
      conditions: {} as Record<string, number>,
      revenue: {
        total_invoiced: invoices?.reduce((s: number, i: any) => s + Number(i.total), 0) || 0,
        outstanding: invoices?.reduce((s: number, i: any) => s + Number(i.balance_due), 0) || 0,
      },
      equipment_count: equipment?.length || 0,
      projects_active: projects?.filter((p: any) => p.status !== "completed" && p.status !== "cancelled").length || 0,
      common_issues: [] as string[],
    };

    // Aggregate condition ratings
    (reportPages || []).forEach((p: any) => {
      if (p.condition_rating) {
        summary.conditions[p.condition_rating] = (summary.conditions[p.condition_rating] || 0) + 1;
      }
    });

    // Find most common poor/critical systems
    const poorPages = (reportPages || []).filter((p: any) => p.condition_rating === "poor" || p.condition_rating === "critical");
    const issueFrequency: Record<string, number> = {};
    poorPages.forEach((p: any) => {
      const normalized = p.title?.toLowerCase() || "";
      issueFrequency[normalized] = (issueFrequency[normalized] || 0) + 1;
    });
    summary.common_issues = Object.entries(issueFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([k, v]) => `${k} (${v} properties)`);

    const prompt = `Analyze this home stewardship portfolio and provide actionable insights for the advisor.

Portfolio Data:
${JSON.stringify(summary, null, 2)}

Respond in JSON format:
{
  "portfolio_health": "excellent|good|fair|poor",
  "key_insights": ["insight 1", "insight 2", "insight 3"],
  "action_items": ["action 1", "action 2", "action 3"],
  "trends": ["trend 1", "trend 2"],
  "revenue_opportunity": "description of revenue opportunity"
}`;

    const _aiText = await callAI({ system: "You are a business intelligence analyst for a home stewardship platform. Provide concise, actionable insights.", messages: [
          { role: "system", content: "You are a business intelligence analyst for a home stewardship platform. Provide concise, actionable insights." },
          { role: "user", content: prompt },
        ], model: "google/gemini-2.5-flash-lite", json: true });
    const response = { ok: true, json: async () => ({ choices: [{ message: { content: _aiText } }] }) };

    if (!response.ok) {
      const text = await response.text();
      console.error("AI error:", response.status, text);
      throw new Error("AI analysis failed");
    }

    const aiResult = await response.json();
    const insights = JSON.parse(aiResult.choices[0].message.content);

    // Store snapshot
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const userSb = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user } } = await userSb.auth.getUser();
      if (user) {
        await sb.from("portfolio_snapshots").upsert({
          admin_id: user.id,
          snapshot_date: new Date().toISOString().split("T")[0],
          total_clients: summary.total_properties,
          avg_health_score: 0,
          total_revenue: summary.revenue.total_invoiced,
          total_projects: summary.projects_active,
          metrics_json: insights,
        }, { onConflict: "admin_id,snapshot_date" });
      }
    }

    return new Response(JSON.stringify({ ...insights, summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Cross-client insights error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
