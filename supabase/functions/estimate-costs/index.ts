import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callAI, parseJSON } from "../_shared/ai-client.ts";
import { requireRole, corsHeaders, json } from "../_shared/auth.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const auth = await requireRole(req, ["creator"]);
  if ("error" in auth) return auth.error;

  try {
    const { pageSlug, pageName, sqft, propertyType, regionHint } = await req.json();
    const systemPrompt = `You are a home renovation cost estimator. Based on the system/room type, property size, and region, provide realistic cost estimates for three tiers of work.

Return JSON:
- "essential": { "price": string (range like "$4,000 - $6,500"), "description": string }
- "enhanced": { "price": string, "description": string }
- "signature": { "price": string, "description": string }
- "costFactors": array of strings explaining what affects pricing
- "regionNote": string with any regional pricing considerations`;

    const _aiText = await callAI({ messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Estimate costs for: ${pageName || pageSlug}\nProperty: ${sqft || "Unknown"} sqft ${propertyType || "single family"}\nRegion: ${regionHint || "Midwest US"}` },
        ], model: "google/gemini-3-flash-preview" });
    const response = { ok: true, json: async () => ({ choices: [{ message: { content: _aiText } }] }) };

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "Credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI error: ${response.status}`);
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    const parsed = toolCall ? JSON.parse(toolCall.function.arguments) : null;

    return new Response(JSON.stringify(parsed || { error: "Could not estimate" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("estimate-costs error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
