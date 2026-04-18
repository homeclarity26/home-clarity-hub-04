import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callAI, parseJSON } from "../_shared/ai-client.ts";
import { requireRole, corsHeaders, json } from "../_shared/auth.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const auth = await requireRole(req, ["creator"]);
  if ("error" in auth) return auth.error;

  try {
    const { photo_url, section_type, property_context } = await req.json();
    if (!photo_url) {
      return new Response(JSON.stringify({ error: "photo_url required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // Download image and convert to base64
    const imgResp = await fetch(photo_url);
    if (!imgResp.ok) throw new Error(`Failed to download image: ${imgResp.status}`);
    const imgBuffer = await imgResp.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(imgBuffer)));
    const contentType = imgResp.headers.get("content-type") || "image/jpeg";

    const ctx = property_context || {};
    const contextStr = [
      ctx.age ? `Home age: ~${ctx.age} years` : "",
      ctx.location ? `Location: ${ctx.location}` : "",
      ctx.existing_condition ? `Current rated condition: ${ctx.existing_condition}` : "",
      ctx.property_type ? `Property type: ${ctx.property_type}` : "",
    ].filter(Boolean).join(". ");

    const systemPrompt = `You are a licensed professional home inspector with 20+ years of experience. You are analyzing a photo of a home's ${section_type || "component"}.

Property context: ${contextStr || "No additional context provided."}

Analyze the image thoroughly. Identify every visible defect, wear pattern, age indicator, and condition signal. Be specific about locations within the image. Provide actionable recommendations with realistic cost estimates.

Your condition ratings:
- Excellent: Like new, no defects, recently installed/maintained
- Good: Minor wear consistent with age, fully functional, no action needed
- Fair: Moderate wear, some items need attention within 1-2 years
- Poor: Significant deterioration, safety concerns possible, action needed soon`;

    const _photoText = await callAI({
      system: "You are a professional home inspector. Analyze photos and provide detailed condition assessments.",
      prompt: `${system_context}\n\nPhoto description provided. Assess the condition and identify any issues.\n\nReturn JSON: { "condition_rating": "excellent"|"good"|"fair"|"poor"|"critical", "findings": [{ "title": string, "description": string, "severity": "low"|"medium"|"high"|"critical", "recommendation": string }], "immediate_action_required": boolean, "estimated_cost_range": string|null, "suggested_narrative": string, "detected_items": [string] }`,
      model: "google/gemini-2.5-pro",
      json: true,
    });
    const response = { ok: true };
    const _photoData = parseJSON<any>(_photoText);

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      throw new Error("No tool call in AI response");
    }

    const analysis = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("analyze-photo error:", err);
    // Return fallback response
    return new Response(
      JSON.stringify({
        condition_rating: "Fair",
        confidence_score: 0,
        identified_defects: [],
        estimated_age_years: null,
        recommended_actions: [],
        narrative_paragraph: "Photo analysis could not be completed. Manual inspection recommended.",
        raw_observations: ["Analysis failed — please review manually"],
        error: err instanceof Error ? err.message : "Unknown error",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
