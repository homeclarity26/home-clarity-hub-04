import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callAI, parseJSON } from "../_shared/ai-client.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { propertyId } = await req.json();
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const [propRes, reportRes, equipRes] = await Promise.all([
      supabase.from("properties").select("address, metadata, property_type").eq("id", propertyId).single(),
      supabase.from("reports").select("report_pages(title, condition_rating, current_age_years, expected_lifespan_years, replacement_cost_today, tiers, page_key)").eq("property_id", propertyId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("equipment").select("name, category, condition, install_date, warranty_expiry, estimated_replacement_cost, next_service_date").eq("property_id", propertyId),
    ]);

    const property = propRes.data;
    const pages = reportRes.data?.report_pages || [];
    const equipment = equipRes.data || [];

    const prompt = `Analyze this property and forecast condition trends for the next 1, 3, and 5 years. For each major system, predict:
- Future condition rating
- Estimated remaining useful life
- Expected maintenance costs
- Risk of failure
- Recommended preventive actions

Property: ${property?.address}, Type: ${property?.property_type}, Year Built: ${property?.metadata?.year_built || "Unknown"}

Current Systems:
${pages.map((p: any) => `- ${p.title}: ${p.condition_rating || "unknown"}, Age: ${p.current_age_years || "?"}yr, Lifespan: ${p.expected_lifespan_years || "?"}yr, Replacement: $${p.replacement_cost_today || "?"}`).join("\n")}

Equipment:
${equipment.map((e: any) => `- ${e.name} (${e.category}): ${e.condition}, Installed: ${e.install_date || "?"}, Warranty: ${e.warranty_expiry || "?"}, Cost: $${e.estimated_replacement_cost || "?"}`).join("\n")}

Return structured JSON with forecasts array.`;

    const _aiText = await callAI({ system: "You are a property condition forecasting expert. Analyze building systems and predict deterioration patterns.", messages: [
          { role: "system", content: "You are a property condition forecasting expert. Analyze building systems and predict deterioration patterns." },
          { role: "user", content: prompt },
        ], model: "google/gemini-3-flash-preview" });
    const response = { ok: true, json: async () => ({ choices: [{ message: { content: _aiText } }] }) };

    if (!response.ok) {
      const t = await response.text();
      console.error("AI error:", response.status, t);
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "Payment required" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    let forecast = null;
    if (toolCall?.function?.arguments) {
      forecast = JSON.parse(toolCall.function.arguments);
    }

    return new Response(JSON.stringify({ forecast }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-condition-forecast error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
