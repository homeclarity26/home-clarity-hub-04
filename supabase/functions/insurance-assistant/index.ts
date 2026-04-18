import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callAI, parseJSON } from "../_shared/ai-client.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireRole } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  
  const auth = await requireRole(req, ["creator"]);
  if ("error" in auth) return auth.error;
try {
    const { propertyId } = await req.json();
    if (!propertyId) {
      return new Response(JSON.stringify({ error: "propertyId required", missing: ["propertyId"] }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey);

    // Load property data
    const { data: prop } = await sb.from("properties").select("*").eq("id", propertyId).single();
    if (!prop) {
      return new Response(JSON.stringify({ error: "Property not found", propertyId }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load report pages
    const { data: reports } = await sb.from("reports").select("id").eq("property_id", propertyId).limit(1);
    let reportSummary = "No report available.";
    if (reports && reports.length > 0) {
      const { data: pages } = await sb.from("report_pages").select("title, condition_rating, group_name, current_age_years, expected_lifespan_years, specs, narrative").eq("report_id", reports[0].id);
      if (pages) {
        reportSummary = pages.map((p: any) => {
          const specs = Array.isArray(p.specs) ? p.specs.map((s: any) => `${s.label}: ${s.value}`).join(", ") : "";
          return `${p.title} (${p.group_name}) — Condition: ${p.condition_rating || "Not assessed"}${p.current_age_years ? `, Age: ${p.current_age_years}yr` : ""}${specs ? `, Specs: ${specs}` : ""}`;
        }).join("\n");
      }
    }

    // Load equipment
    const { data: equipment } = await sb.from("equipment").select("name, category, condition, brand, model, install_date, warranty_expiry").eq("property_id", propertyId);
    const equipSummary = equipment && equipment.length > 0
      ? equipment.map((e: any) => `${e.name} (${e.category}) — ${e.condition}${e.install_date ? `, installed ${e.install_date}` : ""}${e.warranty_expiry ? `, warranty until ${e.warranty_expiry}` : ""}`).join("\n")
      : "No equipment data.";

    const metadata = (prop.metadata || {}) as Record<string, unknown>;

    const prompt = `You are an expert home insurance advisor. Based on this home's inspection data, provide a personalized insurance review.

PROPERTY: ${prop.address}
Type: ${prop.property_type || "Unknown"}, Year Built: ${metadata.year_built || "Unknown"}, Sq Ft: ${metadata.sqft || "Unknown"}
Estimated Value: $${prop.estimated_value?.toLocaleString() || "Unknown"}

REPORT FINDINGS:
${reportSummary}

EQUIPMENT:
${equipSummary}

Provide exactly 4 sections as JSON with these keys:
1. "premium_risks" — array of strings: specific issues in this home that insurers often flag
2. "premium_reducers" — array of strings: improvements that could lower premiums with estimated savings
3. "documentation_checklist" — array of strings: documents homeowners should have ready
4. "questions_for_insurer" — array of strings: personalized questions based on this home

Return ONLY valid JSON with these 4 keys.`;

    const _aiText = await callAI({ messages: [{ role: "user", content: prompt }], model: "google/gemini-2.5-flash" });
    const response = { ok: true, json: async () => ({ choices: [{ message: { content: _aiText } }] }) };

    if (!response.ok) {
      const t = await response.text();
      console.error("AI error:", response.status, t);
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error("AI service error");
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    let result;
    if (toolCall) {
      result = JSON.parse(toolCall.function.arguments);
    } else {
      // Fallback: try parsing content directly
      const content = aiData.choices?.[0]?.message?.content || "{}";
      result = JSON.parse(content);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("insurance-assistant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
