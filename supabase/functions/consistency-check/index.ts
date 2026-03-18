import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { pages } = await req.json();
    if (!pages || !Array.isArray(pages)) {
      return new Response(JSON.stringify({ error: "pages array required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build combined text for analysis
    const allText = pages.map((p: any) => {
      const narrative = Array.isArray(p.narrative) ? p.narrative.join(" ") : (p.narrative || "");
      return `## ${p.title} (Condition: ${p.conditionRating || "N/A"})\n${narrative}`;
    }).join("\n\n");

    const systemPrompt = `You are an expert editor reviewing a home inspection report for quality, consistency, and readability.

Analyze the report and return a JSON object with:
- "score": number 0-100, the overall quality/consistency score
- "readabilityGrade": string - Flesch-Kincaid reading level (e.g., "8th grade", "College")
- "issues": array of { "type": "grammar"|"inconsistency"|"readability"|"tone", "page": string, "description": string, "suggestion": string }
- "summary": 2-3 sentence overview of report quality
- "toneConsistency": "consistent"|"mostly consistent"|"inconsistent"`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Review this report for quality and consistency:\n\n${allText}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "review_report",
            description: "Review report quality",
            parameters: {
              type: "object",
              properties: {
                score: { type: "number" },
                readabilityGrade: { type: "string" },
                issues: { type: "array", items: { type: "object", properties: { type: { type: "string" }, page: { type: "string" }, description: { type: "string" }, suggestion: { type: "string" } }, required: ["type", "page", "description", "suggestion"] } },
                summary: { type: "string" },
                toneConsistency: { type: "string" },
              },
              required: ["score", "readabilityGrade", "issues", "summary", "toneConsistency"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "review_report" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "Credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI error: ${response.status}`);
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    const parsed = toolCall ? JSON.parse(toolCall.function.arguments) : { score: 0, readabilityGrade: "Unknown", issues: [], summary: "Could not analyze.", toneConsistency: "unknown" };

    return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("consistency-check error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
