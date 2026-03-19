import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { client_id, review_year, property_id } = await req.json();
    if (!client_id || !review_year) throw new Error("client_id and review_year required");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

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

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: contextParts.join("\n") },
        ],
        tools: [{
          type: "function",
          function: {
            name: "generate_annual_review",
            description: "Generate a structured annual review briefing",
            parameters: {
              type: "object",
              properties: {
                client_relationship_summary: { type: "object", properties: { member_since: { type: "string" }, relationship_health: { type: "string" }, engagement_level: { type: "string" }, summary: { type: "string" } }, required: ["member_since", "relationship_health", "engagement_level", "summary"] },
                year_in_review: { type: "string" },
                financial_summary: { type: "object", properties: { total_invested: { type: "number" }, total_invoiced: { type: "number" }, outstanding: { type: "number" }, roi_narrative: { type: "string" } }, required: ["total_invested", "total_invoiced", "outstanding", "roi_narrative"] },
                home_health_trajectory: { type: "object", properties: { direction: { type: "string" }, explanation: { type: "string" } }, required: ["direction", "explanation"] },
                top_three_wins: { type: "array", items: { type: "object", properties: { title: { type: "string" }, description: { type: "string" } }, required: ["title", "description"] } },
                open_items: { type: "array", items: { type: "object", properties: { item: { type: "string" }, category: { type: "string" }, priority: { type: "string" } }, required: ["item", "category", "priority"] } },
                client_signals: { type: "object", properties: { top_topics: { type: "array", items: { type: "string" } }, engagement_pattern: { type: "string" }, satisfaction_trend: { type: "string" }, risk_flags: { type: "array", items: { type: "string" } } }, required: ["top_topics", "engagement_pattern", "satisfaction_trend", "risk_flags"] },
                renewal_talking_points: { type: "array", items: { type: "string" } },
                recommended_next_year_priorities: { type: "array", items: { type: "object", properties: { title: { type: "string" }, rationale: { type: "string" }, estimated_investment: { type: "string" } }, required: ["title", "rationale"] } },
                suggested_renewal_offer: { type: "object", properties: { recommendation: { type: "string" }, reasoning: { type: "string" } }, required: ["recommendation", "reasoning"] },
              },
              required: ["client_relationship_summary", "year_in_review", "financial_summary", "home_health_trajectory", "top_three_wins", "open_items", "client_signals", "renewal_talking_points", "recommended_next_year_priorities", "suggested_renewal_offer"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "generate_annual_review" } },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI error:", response.status, errText);
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error("AI generation failed");
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    let briefing: any;
    if (toolCall?.function?.arguments) {
      briefing = typeof toolCall.function.arguments === "string" ? JSON.parse(toolCall.function.arguments) : toolCall.function.arguments;
    } else {
      throw new Error("No structured output from AI");
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
