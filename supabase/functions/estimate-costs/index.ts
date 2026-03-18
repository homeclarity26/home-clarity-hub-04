import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { pageSlug, pageName, sqft, propertyType, regionHint } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are a home renovation cost estimator. Based on the system/room type, property size, and region, provide realistic cost estimates for three tiers of work.

Return JSON:
- "essential": { "price": string (range like "$4,000 - $6,500"), "description": string }
- "enhanced": { "price": string, "description": string }
- "signature": { "price": string, "description": string }
- "costFactors": array of strings explaining what affects pricing
- "regionNote": string with any regional pricing considerations`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Estimate costs for: ${pageName || pageSlug}\nProperty: ${sqft || "Unknown"} sqft ${propertyType || "single family"}\nRegion: ${regionHint || "Midwest US"}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "estimate_costs",
            description: "Estimate renovation/repair costs",
            parameters: {
              type: "object",
              properties: {
                essential: { type: "object", properties: { price: { type: "string" }, description: { type: "string" } }, required: ["price", "description"] },
                enhanced: { type: "object", properties: { price: { type: "string" }, description: { type: "string" } }, required: ["price", "description"] },
                signature: { type: "object", properties: { price: { type: "string" }, description: { type: "string" } }, required: ["price", "description"] },
                costFactors: { type: "array", items: { type: "string" } },
                regionNote: { type: "string" },
              },
              required: ["essential", "enhanced", "signature", "costFactors", "regionNote"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "estimate_costs" } },
      }),
    });

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
