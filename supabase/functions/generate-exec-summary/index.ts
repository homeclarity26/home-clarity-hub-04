import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { pages, propertyName, propertyAddress } = await req.json();
    if (!pages || !Array.isArray(pages)) {
      return new Response(JSON.stringify({ error: "pages array required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const pagesContext = pages.map((p: any) => {
      const narrative = Array.isArray(p.narrative) ? p.narrative.join(" ") : "";
      return `## ${p.title} (Condition: ${p.conditionRating || "N/A"}, Timing: ${p.timing || "N/A"})\n${narrative}\nRecommendations: ${(p.recommendations || []).join("; ")}`;
    }).join("\n\n");

    const systemPrompt = `You are a professional home consultant writing an executive summary for a Home Clarity Report. 

Based on ALL the report pages provided, create a comprehensive 1-page executive summary that a homeowner can read to understand the overall state of their home.

Return JSON:
- "summary": array of 4-5 paragraphs covering overall condition, key strengths, critical concerns, recommended priorities, and investment outlook
- "topPriorities": array of 5 { "title": string, "urgency": "immediate"|"near-term"|"planned", "estimatedCost": string, "reason": string }
- "overallHealthScore": number 0-100
- "investmentRange": { "low": string, "high": string }
- "keyStrengths": array of 3 strings
- "criticalConcerns": array of 3 strings`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Property: ${propertyName || "Home"} at ${propertyAddress || ""}.\n\nReport Pages:\n${pagesContext}\n\nGenerate the executive summary.` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "generate_summary",
            description: "Generate executive summary",
            parameters: {
              type: "object",
              properties: {
                summary: { type: "array", items: { type: "string" } },
                topPriorities: { type: "array", items: { type: "object", properties: { title: { type: "string" }, urgency: { type: "string" }, estimatedCost: { type: "string" }, reason: { type: "string" } }, required: ["title", "urgency", "estimatedCost", "reason"] } },
                overallHealthScore: { type: "number" },
                investmentRange: { type: "object", properties: { low: { type: "string" }, high: { type: "string" } }, required: ["low", "high"] },
                keyStrengths: { type: "array", items: { type: "string" } },
                criticalConcerns: { type: "array", items: { type: "string" } },
              },
              required: ["summary", "topPriorities", "overallHealthScore", "investmentRange", "keyStrengths", "criticalConcerns"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "generate_summary" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "Credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI error: ${response.status}`);
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    const parsed = toolCall ? JSON.parse(toolCall.function.arguments) : { summary: ["Could not generate summary."], topPriorities: [], overallHealthScore: 0, investmentRange: { low: "$0", high: "$0" }, keyStrengths: [], criticalConcerns: [] };

    return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("generate-exec-summary error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
