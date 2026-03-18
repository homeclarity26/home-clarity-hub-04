import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { propertyAddress, yearBuilt, sqft, propertyType, relationshipType, discoveryNotes, clientIntelligenceSummary } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are an expert home inspector preparing for a property visit. Generate a comprehensive pre-inspection briefing document that helps the inspector know what to look for based on the property details.

Return a JSON object with:
- "summary": 2-3 sentence overview of what to expect
- "focusAreas": array of { "area": string, "reason": string, "priority": "high"|"medium"|"low" } - key areas to focus on during inspection
- "commonIssues": array of strings - common problems for this property type/age
- "questionsForOwner": array of strings - questions to ask the homeowner
- "equipmentToCheck": array of { "name": string, "expectedAge": string, "concern": string }
- "safetyFlags": array of strings - safety items to verify`;

    const prompt = `Property Details:
- Address: ${propertyAddress || "Unknown"}
- Year Built: ${yearBuilt || "Unknown"}
- Sq Ft: ${sqft || "Unknown"}
- Type: ${propertyType || "Unknown"}
- Relationship: ${relationshipType || "Unknown"}
${discoveryNotes ? `\nDiscovery Notes: ${discoveryNotes}` : ""}
${clientIntelligenceSummary ? `\nClient Intelligence: ${clientIntelligenceSummary}` : ""}

Generate a pre-inspection briefing for this property.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "generate_briefing",
            description: "Generate a pre-inspection briefing document",
            parameters: {
              type: "object",
              properties: {
                summary: { type: "string" },
                focusAreas: { type: "array", items: { type: "object", properties: { area: { type: "string" }, reason: { type: "string" }, priority: { type: "string", enum: ["high", "medium", "low"] } }, required: ["area", "reason", "priority"] } },
                commonIssues: { type: "array", items: { type: "string" } },
                questionsForOwner: { type: "array", items: { type: "string" } },
                equipmentToCheck: { type: "array", items: { type: "object", properties: { name: { type: "string" }, expectedAge: { type: "string" }, concern: { type: "string" } }, required: ["name", "expectedAge", "concern"] } },
                safetyFlags: { type: "array", items: { type: "string" } },
              },
              required: ["summary", "focusAreas", "commonIssues", "questionsForOwner", "equipmentToCheck", "safetyFlags"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "generate_briefing" } },
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limited, try again shortly." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI error: ${response.status} - ${t}`);
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    const parsed = toolCall ? JSON.parse(toolCall.function.arguments) : { summary: "Could not generate briefing.", focusAreas: [], commonIssues: [], questionsForOwner: [], equipmentToCheck: [], safetyFlags: [] };

    return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("pre-inspection-brief error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
