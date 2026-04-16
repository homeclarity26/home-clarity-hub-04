import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callAI } from "../_shared/ai-client.ts";
import { requireAuth, corsHeaders, json } from "../_shared/auth.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const auth = await requireAuth(req);
  if ("error" in auth) return auth.error;

  try {
    const body = await req.json();

    // ── HOME VALUE MODE ──
    if (body.type === "home_value") {
      const { value, low_estimate, high_estimate, neighborhood_avg, address } = body;

      const parts: string[] = [];
      if (value) parts.push(`Estimated value: $${value.toLocaleString()}`);
      if (low_estimate && high_estimate) parts.push(`Range: $${low_estimate.toLocaleString()} – $${high_estimate.toLocaleString()}`);
      if (neighborhood_avg) {
        const diff = value - neighborhood_avg;
        const pct = ((diff / neighborhood_avg) * 100).toFixed(1);
        parts.push(`Neighborhood median: $${neighborhood_avg.toLocaleString()} (your home is ${diff >= 0 ? "+" : ""}${pct}% vs. the area)`);
      }

      const prompt = `You are a knowledgeable real estate advisor writing a brief valuation summary for a homeowner. Keep it conversational, 2–3 sentences, no jargon.

Property: ${address || "this property"}
${parts.join("\n")}

Write a plain-English insight explaining what these numbers mean for the homeowner — what's driving the value, how they compare to the neighborhood, and one practical takeaway.`;

      const explanation = await callAI({
        system: "You are a friendly real estate advisor. Be concise, specific, and genuinely helpful.",
        prompt,
        model: "google/gemini-2.5-flash",
      });

      return new Response(JSON.stringify({ explanation: explanation.trim() }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── HEALTH SCORE MODE (original) ──
    const { sections } = body;
    const results = [];
    for (const section of sections) {
      const prompt = `You are a home health advisor. The "${section.sectionName}" section received a score of ${section.scoreValue}/100. Individual item ratings: ${section.itemRatings.map((i: any) => `${i.name}: ${i.rating}`).join(", ")}. Write a 2-3 sentence plain-English explanation of why this section received this score. Be specific about which items are dragging the score down or propping it up.`;

      const explanation = await callAI({
        prompt,
        model: "google/gemini-2.5-flash",
      });

      results.push({ section: section.sectionName, score: section.scoreValue, explanation: explanation.trim() });
    }

    return new Response(JSON.stringify({ explanations: results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
