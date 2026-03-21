import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { property_address, equipment, report_pages, property_type, year_built, sqft } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not set");

    const now = new Date();
    const month = now.getMonth();
    const season = month >= 2 && month <= 4 ? "spring" : month >= 5 && month <= 7 ? "summer" : month >= 8 && month <= 10 ? "fall" : "winter";

    const prompt = `Based on this property's data, generate predictive maintenance alerts and recommendations.

Property: ${property_address}
Type: ${property_type || "single family"}
Year Built: ${year_built || "unknown"}
Sqft: ${sqft || "unknown"}
Current Season: ${season}

Equipment:
${JSON.stringify(equipment || [], null, 2)}

Report Conditions:
${JSON.stringify((report_pages || []).map((p: any) => ({ title: p.title, condition: p.condition_rating })), null, 2)}

Generate predictions in JSON:
{
  "alerts": [
    {
      "severity": "high|medium|low",
      "system": "system name",
      "prediction": "what might happen",
      "recommendation": "what to do",
      "timeframe": "when to act"
    }
  ],
  "seasonal_tips": ["tip 1", "tip 2", "tip 3"],
  "upcoming_milestones": ["milestone 1", "milestone 2"]
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: "You are a home maintenance prediction expert. Provide practical, actionable maintenance predictions." },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) throw new Error(`AI error: ${response.status}`);

    const result = await response.json();
    const predictions = JSON.parse(result.choices[0].message.content);

    return new Response(JSON.stringify(predictions), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Predictive maintenance error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
