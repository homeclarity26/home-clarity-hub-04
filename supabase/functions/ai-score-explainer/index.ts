import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { sections } = await req.json();
    // sections: Array of { sectionName, scoreValue, itemRatings: [{name, rating}] }
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const results = [];
    for (const section of sections) {
      const prompt = `You are a home health advisor. The "${section.sectionName}" section received a score of ${section.scoreValue}/100. Individual item ratings: ${section.itemRatings.map((i: any) => `${i.name}: ${i.rating}`).join(", ")}. Write a 2-3 sentence plain-English explanation of why this section received this score. Be specific about which items are dragging the score down or propping it up.`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "user", content: prompt }],
        }),
      });

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
