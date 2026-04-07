import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callAI, parseJSON } from "../_shared/ai-client.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { sections } = await req.json();
    // sections: Array of { sectionName, scoreValue, itemRatings: [{name, rating}] }
    const results = [];
    for (const section of sections) {
      const prompt = `You are a home health advisor. The "${section.sectionName}" section received a score of ${section.scoreValue}/100. Individual item ratings: ${section.itemRatings.map((i: any) => `${i.name}: ${i.rating}`).join(", ")}. Write a 2-3 sentence plain-English explanation of why this section received this score. Be specific about which items are dragging the score down or propping it up.`;

      const _aiText = await callAI({ messages: [{ role: "user", content: prompt }], model: "google/gemini-2.5-flash" });
    const response = { ok: true, json: async () => ({ choices: [{ message: { content: _aiText } }] }) };

      if (!response.ok) { await response.text(); results.push({ section: section.sectionName, explanation: "Unable to generate explanation." }); continue; }
      const json = await response.json();
      results.push({ section: section.sectionName, score: section.scoreValue, explanation: json.choices?.[0]?.message?.content || "" });
    }

    return new Response(JSON.stringify({ explanations: results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
