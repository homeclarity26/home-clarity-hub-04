import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callClaude, parseJSON } from "../_shared/ai-client.ts";
import { retrieveContext } from "../_shared/rag.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireRole } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  
  const auth = await requireRole(req, ["creator"]);
  if ("error" in auth) return auth.error;
try {
    const { client_id, review_year, property_id } = await req.json();
    if (!client_id || !review_year) {
      return new Response(JSON.stringify({ error: "client_id and review_year required", missing: [!client_id && "client_id", !review_year && "review_year"].filter(Boolean) }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey);

    // Load all data in parallel
    const yearStart = `${review_year}-01-01`;
    const yearEnd = `${review_year}-12-31`;

    const propFilter = property_id || client_id;

    const [
      { data: property },
      { data: memberships },
      { data: reports },
      { data: projects },
      { data: invoices },
      { data: messages },
      { data: equipment },
      { data: predictions },
      { data: satisfaction },
      { data: sessions },
      { data: valuations },
    ] = await Promise.all([
      property_id
        ? sb.from("properties").select("*").eq("id", property_id).single()
        : sb.from("properties").select("*").eq("client_user_id", client_id).limit(1).single(),
      sb.from("client_memberships").select("*, membership_tiers(*)").eq("client_id", client_id).limit(1),
      property_id
        ? sb.from("reports").select("id, title, status, completion_percent, created_at").eq("property_id", property_id)
        : Promise.resolve({ data: [] }),
      property_id
        ? sb.from("projects").select("*").eq("property_id", property_id)
        : Promise.resolve({ data: [] }),
      property_id
        ? sb.from("invoices").select("*").eq("property_id", property_id)
        : Promise.resolve({ data: [] }),
      property_id
        ? sb.from("property_messages").select("id, message, created_at, sender_id").eq("property_id", property_id).gte("created_at", yearStart).lte("created_at", yearEnd + "T23:59:59").order("created_at")
        : Promise.resolve({ data: [] }),
      property_id
        ? sb.from("equipment").select("*").eq("property_id", property_id)
        : Promise.resolve({ data: [] }),
      sb.from("maintenance_predictions").select("*").eq("client_id", client_id),
      sb.from("client_satisfaction_scores").select("*").eq("client_id", client_id).gte("submitted_at", yearStart),
      sb.from("client_sessions").select("*").eq("client_id", client_id).gte("login_at", yearStart).lte("login_at", yearEnd + "T23:59:59"),
      property_id
        ? sb.from("property_valuations").select("*").eq("property_id", property_id).order("fetched_at")
        : Promise.resolve({ data: [] }),
    ]);

    // Load report pages if we have reports
    let reportPages: any[] = [];
    if (reports && reports.length > 0) {
      const reportIds = reports.map((r: any) => r.id);
      const { data: pages } = await sb.from("report_pages").select("title, condition_rating, status, updated_at").in("report_id", reportIds);
      reportPages = pages || [];
    }

    // Build context
    const meta = property?.metadata || {};
    const membership = memberships?.[0];
    const memberSince = membership?.created_at ? new Date(membership.created_at).toLocaleDateString() : "Unknown";

    const yearProjects = (projects || []).filter((p: any) => {
      const created = new Date(p.created_at);
      return created.getFullYear() === review_year;
    });
    const completedProjects = yearProjects.filter((p: any) => p.status === "complete" || p.status === "completed");
    const activeProjects = yearProjects.filter((p: any) => p.status !== "complete" && p.status !== "completed" && p.status !== "cancelled");

    const yearInvoices = (invoices || []).filter((i: any) => new Date(i.created_at).getFullYear() === review_year);
    const totalInvoiced = yearInvoices.reduce((s: number, i: any) => s + Number(i.amount || 0), 0);
    const paidInvoices = yearInvoices.filter((i: any) => i.status === "paid");
    const totalPaid = paidInvoices.reduce((s: number, i: any) => s + Number(i.amount || 0), 0);
    const outstanding = totalInvoiced - totalPaid;

    const messageCount = messages?.length || 0;
    const sessionCount = sessions?.length || 0;
    const avgSatisfaction = satisfaction && satisfaction.length > 0
      ? (satisfaction.reduce((s: number, sc: any) => s + sc.score, 0) / satisfaction.length).toFixed(1)
      : null;

    const contextParts = [
      `CLIENT ANNUAL REVIEW — ${review_year}`,
      `Property: ${property?.address || "N/A"}, ${property?.city || ""}, ${property?.state || ""}`,
      `Year Built: ${meta.year_built || "?"}  |  Sq Ft: ${meta.sqft || "?"}`,
      `Member Since: ${memberSince}`,
      membership ? `Tier: ${membership.membership_tiers?.name || membership.tier_id}  |  Status: ${membership.status}` : "No membership on file",
      "",
      `PORTAL ENGAGEMENT:`,
      `Sessions this year: ${sessionCount}`,
      `Messages exchanged: ${messageCount}`,
      avgSatisfaction ? `Average satisfaction: ${avgSatisfaction}/5` : "No satisfaction scores",
      "",
      `FINANCIAL:`,
      `Total invoiced: $${totalInvoiced.toLocaleString()}`,
      `Total paid: $${totalPaid.toLocaleString()}`,
      `Outstanding: $${outstanding.toLocaleString()}`,
      "",
      `PROJECTS THIS YEAR (${yearProjects.length}):`,
      ...yearProjects.map((p: any) => `- ${p.title} [${p.status}] Budget=$${p.budget || 0} Spent=$${p.actual_spent || 0}`),
      "",
      `REPORT SECTIONS:`,
      ...reportPages.map((rp: any) => `- ${rp.title}: ${rp.condition_rating || "unrated"} (${rp.status})`),
      "",
      `EQUIPMENT (${(equipment || []).length} items):`,
      ...(equipment || []).slice(0, 20).map((e: any) => `- ${e.name} (${e.category}): condition=${e.condition}, installed=${e.install_date || "?"}`),
      "",
      `PREDICTIONS:`,
      ...(predictions || []).filter((p: any) => p.status === "active").slice(0, 10).map((p: any) => `- ${p.system_type}: ${p.prediction_type} in ${p.predicted_timeframe} (${p.probability_score}% likely)`),
      "",
      `VALUATIONS:`,
      ...(valuations || []).slice(-5).map((v: any) => `- ${new Date(v.fetched_at).toLocaleDateString()}: $${v.price?.toLocaleString() || "?"}`),
    ];

    const systemPrompt = `You are a senior client success manager at Hometown Builders Club (HBC), preparing a comprehensive advisor briefing document for an annual membership review call. This briefing is INTERNAL — for the advisor only, not the client.

Generate a complete advisor briefing with these sections. Return a JSON object with these keys:

{
  "client_relationship_summary": { "member_since": string, "relationship_health": "strong"|"stable"|"at_risk", "engagement_level": "high"|"moderate"|"low", "summary": string (2-3 sentences) },
  "year_in_review": string (3-4 paragraph narrative of what happened to the home this year),
  "financial_summary": { "total_invested": number, "total_invoiced": number, "outstanding": number, "roi_narrative": string },
  "home_health_trajectory": { "direction": "improving"|"stable"|"declining", "explanation": string },
  "top_three_wins": [{ "title": string, "description": string }],
  "open_items": [{ "item": string, "category": "finding"|"project"|"recommendation", "priority": "high"|"medium"|"low" }],
  "client_signals": { "top_topics": [string], "engagement_pattern": string, "satisfaction_trend": string, "risk_flags": [string] },
  "renewal_talking_points": [string],
  "recommended_next_year_priorities": [{ "title": string, "rationale": string, "estimated_investment": string }],
  "suggested_renewal_offer": { "recommendation": "standard"|"upgrade"|"loyalty_rate", "reasoning": string }
}`;

    const userContent = contextParts.join("\n");
    // Annual reviews benefit hugely from RAG — we want to pull THIS client's
    // past report pages and any memories we have about them so the review
    // sounds like a continuation, not a fresh template.
    const ragContext = await retrieveContext({
      query: userContent.slice(0, 3000),
      adminSupabase: sb as unknown as { rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown[] | null; error: unknown }> },
      creatorUserId: property?.creator_user_id || "",
      propertyId: property_id || property?.id,
      clientUserId: property?.client_user_id,
      sources: ["report_pages", "home_knowledge_base", "agent_memory"],
      perSource: 3,
    });

    const _aiText = await callClaude({
      system: systemPrompt,
      cacheableContext: ragContext || undefined,
      prompt: userContent,
      json: true,
      temperature: 0.3,
      maxOutputTokens: 8192,
    });

    let briefing: Record<string, unknown>;
    try {
      briefing = parseJSON<Record<string, unknown>>(_aiText);
    } catch (parseErr) {
      console.error("generate-annual-review: JSON parse failed:", parseErr, "raw:", _aiText.slice(0, 500));
      throw new Error("AI returned non-JSON — please retry");
    }

    // Upsert the review
    const { data: existing } = await sb.from("annual_reviews")
      .select("id")
      .eq("property_id", property_id || property?.id)
      .eq("review_year", review_year)
      .single();

    if (existing) {
      await sb.from("annual_reviews").update({
        briefing_json: briefing,
        status: "brief_generated",
        generated_at: new Date().toISOString(),
      }).eq("id", existing.id);
    } else {
      await sb.from("annual_reviews").insert({
        client_id,
        property_id: property_id || property?.id,
        review_year,
        briefing_json: briefing,
        status: "brief_generated",
        generated_at: new Date().toISOString(),
      });
    }

    return new Response(JSON.stringify({ briefing }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("generate-annual-review error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
