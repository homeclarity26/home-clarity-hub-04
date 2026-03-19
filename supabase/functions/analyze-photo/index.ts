import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { photo_url, section_type, property_context } = await req.json();
    if (!photo_url) {
      return new Response(JSON.stringify({ error: "photo_url required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

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

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "image_url", image_url: { url: `data:${contentType};base64,${base64}` } },
              {
                type: "text",
                text: `Analyze this ${section_type || "home component"} photo as a professional home inspector. Provide your complete assessment.`,
              },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "photo_analysis",
              description: "Return structured home inspection photo analysis results",
              parameters: {
                type: "object",
                properties: {
                  condition_rating: {
                    type: "string",
                    enum: ["Poor", "Fair", "Good", "Excellent"],
                    description: "Overall condition rating based on visual evidence",
                  },
                  confidence_score: {
                    type: "integer",
                    description: "Confidence in the rating from 0-100",
                  },
                  identified_defects: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        defect_name: { type: "string" },
                        severity: { type: "string", enum: ["low", "medium", "high", "critical"] },
                        location_in_image: { type: "string" },
                        description: { type: "string" },
                      },
                      required: ["defect_name", "severity", "location_in_image", "description"],
                    },
                  },
                  estimated_age_years: {
                    type: "integer",
                    description: "Estimated age of the component in years based on visual cues",
                  },
                  recommended_actions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        action: { type: "string" },
                        urgency: { type: "string", enum: ["immediate", "soon", "planned", "monitor"] },
                        estimated_cost_low: { type: "integer" },
                        estimated_cost_high: { type: "integer" },
                      },
                      required: ["action", "urgency", "estimated_cost_low", "estimated_cost_high"],
                    },
                  },
                  narrative_paragraph: {
                    type: "string",
                    description: "A professionally written 2-3 sentence assessment suitable for a home inspection report",
                  },
                  raw_observations: {
                    type: "array",
                    items: { type: "string" },
                    description: "Bullet list of everything visible in the image",
                  },
                },
                required: [
                  "condition_rating",
                  "confidence_score",
                  "identified_defects",
                  "recommended_actions",
                  "narrative_paragraph",
                  "raw_observations",
                ],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "photo_analysis" } },
      }),
    });

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
