import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callAI, parseJSON } from "../_shared/ai-client.ts";
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
    const { pages } = await req.json();
    if (!pages || !Array.isArray(pages)) {
      return new Response(JSON.stringify({ error: "pages array required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
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

    const _aiText = await callAI({ messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Review this report for quality and consistency:\n\n${allText}` },
        ], model: "google/gemini-3-flash-preview" });
    const response = { ok: true, json: async () => ({ choices: [{ message: { content: _aiText } }] }) };

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
