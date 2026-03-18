import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { transcript } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const prompt = `You are an expert home consultant analyst. Analyze this discovery call transcript and extract structured insights.

Transcript:
${transcript}

Extract the following and return as JSON:
- key_findings: array of important findings (strings)
- red_flags: array of concerning items (strings)  
- client_goals: array of what the client wants (strings)
- recommended_report_sections: array of objects with section_name and bullet_points (array of strings)
- client_personality_notes: brief text about client communication style
- urgency_level: low, medium, or high`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        tools: [{
          type: "function",
          function: {
            name: "return_analysis",
            description: "Return transcript analysis",
            parameters: {
              type: "object",
              properties: {
                key_findings: { type: "array", items: { type: "string" } },
                red_flags: { type: "array", items: { type: "string" } },
                client_goals: { type: "array", items: { type: "string" } },
                recommended_report_sections: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      section_name: { type: "string" },
                      bullet_points: { type: "array", items: { type: "string" } },
                    },
                    required: ["section_name", "bullet_points"],
                  },
                },
                client_personality_notes: { type: "string" },
                urgency_level: { type: "string", enum: ["low", "medium", "high"] },
              },
              required: ["key_findings", "red_flags", "client_goals", "recommended_report_sections", "client_personality_notes", "urgency_level"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "return_analysis" } },
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI generation failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const json = await response.json();
    const toolCall = json.choices?.[0]?.message?.tool_calls?.[0];
    let summary = {};
    if (toolCall) {
      try { summary = JSON.parse(toolCall.function.arguments); } catch {}
    }

    return new Response(JSON.stringify({ summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
