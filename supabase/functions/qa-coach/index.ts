import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { page } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const narrativeText = Array.isArray(page.narrative) ? page.narrative.join("\n") : String(page.narrative || "");
    const specsText = Array.isArray(page.specs)
      ? page.specs.map((s: { label: string; value: string }) => `${s.label}: ${s.value}`).join(", ")
      : "";

    const prompt = `You are a QA coach for a home inspection report. Analyze this report page and return suggestions to improve it.

Page Title: ${page.title}
Condition Rating: ${page.condition_rating || "Not set"}
Narrative (${narrativeText.split(/\s+/).length} words):
${narrativeText || "(empty)"}
Specs: ${specsText || "(none)"}
Has Tiers: ${page.tiers ? "yes" : "no"}
Has Findings: ${Array.isArray(page.findings) && page.findings.length > 0 ? "yes" : "no"}
Has Key Observations: ${page.key_observations ? "yes" : "no"}
Has Images: ${Array.isArray(page.images) && page.images.length > 0 ? "yes" : "no"}

Return a JSON array of suggestions. Each suggestion has: severity ("error"|"warning"|"info"), message (string), category (string like "narrative","completeness","clarity","data").
Rules:
- If narrative < 50 words, add error "Narrative is too short"
- If no condition rating, add error "Missing condition rating"
- If no specs, add warning "No specifications provided"
- If no images, add info "Consider adding photos"
- If tiers exist but no cost detail, add warning
- Check for vague language and suggest specifics
- Max 8 suggestions`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a QA coach. Return only valid JSON array." },
          { role: "user", content: prompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "return_suggestions",
            description: "Return QA suggestions for the report page",
            parameters: {
              type: "object",
              properties: {
                suggestions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      severity: { type: "string", enum: ["error", "warning", "info"] },
                      message: { type: "string" },
                      category: { type: "string" },
                    },
                    required: ["severity", "message", "category"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["suggestions"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "return_suggestions" } },
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    let suggestions = [];
    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      suggestions = parsed.suggestions || [];
    }

    return new Response(JSON.stringify({ suggestions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("qa-coach error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
