import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callAI, parseJSON } from "../_shared/ai-client.ts";
import { requireRole } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  
  const auth = await requireRole(req, ["creator"]);
  if ("error" in auth) return auth.error;
try {
    const { transcript } = await req.json();
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

    const _aiText = await callAI({ messages: [{ role: "user", content: prompt }], model: "google/gemini-2.5-flash" });
    const response = { ok: true, json: async () => ({ choices: [{ message: { content: _aiText } }] }) };

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
