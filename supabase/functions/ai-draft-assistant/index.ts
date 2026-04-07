import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callAI, parseJSON } from "../_shared/ai-client.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { notes, sectionType, propertyContext } = await req.json();
    const systemPrompt = `You are a professional home advisor writing report narratives for a Home Building Consultants (HBC) report. Write in a warm but direct, professional tone. You are trusted and knowledgeable. Write in third person. Use specific details from the field notes. Return a single cohesive narrative paragraph (2-4 sentences) suitable for the "${sectionType}" section of a home health report.`;

    const userPrompt = `Property context: ${JSON.stringify(propertyContext || {})}

Field notes for the ${sectionType} section:
${notes}

Write a professional narrative paragraph based on these field notes.`;

    const _aiText = await callAI({ messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ], model: "google/gemini-2.5-flash" });
    const response = { ok: true, json: async () => ({ choices: [{ message: { content: _aiText } }] }) };

    if (!response.ok) {
      const t = await response.text();
      console.error("AI error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI generation failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const json = await response.json();
    const text = json.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ generatedText: text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
