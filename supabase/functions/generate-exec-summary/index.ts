import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callClaude, parseJSON } from "../_shared/ai-client.ts";

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
    const pagesContext = pages.map((p: Record<string, unknown>) => {
      const narrative = Array.isArray(p.narrative) ? (p.narrative as string[]).join(" ") : "";
      const recs = Array.isArray(p.recommendations) ? (p.recommendations as string[]).join("; ") : "";
      return `## ${p.title} (Condition: ${p.conditionRating || "N/A"}, Timing: ${p.timing || "N/A"})\n${narrative}\nRecommendations: ${recs}`;
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

    // No RAG for exec summary: the pages array IS the full context. Adding
    // retrieval would dilute the signal. Keep it focused.
    const _aiText = await callClaude({
      system: systemPrompt,
      prompt: `Property: ${propertyName || "Home"} at ${propertyAddress || ""}.\n\nReport Pages:\n${pagesContext}\n\nGenerate the executive summary.`,
      json: true,
      temperature: 0.3,
      maxOutputTokens: 4096,
    });

    let parsed: Record<string, unknown>;
    try {
      parsed = parseJSON<Record<string, unknown>>(_aiText);
    } catch (e) {
      console.error("generate-exec-summary: JSON parse failed:", e, "raw:", _aiText.slice(0, 500));
      parsed = { summary: ["Could not generate summary."], topPriorities: [], overallHealthScore: 0, investmentRange: { low: "$0", high: "$0" }, keyStrengths: [], criticalConcerns: [] };
    }

    return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("generate-exec-summary error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
