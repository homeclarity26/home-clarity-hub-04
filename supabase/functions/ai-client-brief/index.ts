import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callAI, parseJSON } from "../_shared/ai-client.ts";
import { requireAuth } from "../_shared/auth.ts";
import { rateLimit, getClientIP, rateLimitResponse } from "../_shared/rate-limit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Authenticated + rate-limited: this spends AI credits on caller input.
  if (!rateLimit(getClientIP(req), 20)) return rateLimitResponse(corsHeaders);
  const auth = await requireAuth(req);
  if ("error" in auth) return auth.error;

  try {
    const { client_name, property_address, report_pages, equipment, projects, invoices } = await req.json();
    const prompt = `Generate a comprehensive client briefing for a home stewardship advisor who is about to meet with this client.

Client: ${client_name}
Property: ${property_address}

Report Pages (system assessments):
${JSON.stringify(report_pages || [], null, 2)}

Equipment Registry:
${JSON.stringify(equipment || [], null, 2)}

Active Projects:
${JSON.stringify(projects || [], null, 2)}

Financial Summary:
${JSON.stringify(invoices || [], null, 2)}

Create a briefing in JSON format:
{
  "talking_points": ["point 1", "point 2", "point 3"],
  "concerns_to_address": ["concern 1", "concern 2"],
  "upsell_opportunities": ["opportunity 1"],
  "client_sentiment": "positive|neutral|concerned",
  "priority_actions": ["action 1", "action 2"],
  "conversation_starters": ["starter 1", "starter 2"],
  "summary": "2-3 sentence executive summary"
}`;

    const _aiText = await callAI({ system: "You are a home stewardship business advisor. Create concise, actionable meeting briefs.", messages: [
          { role: "system", content: "You are a home stewardship business advisor. Create concise, actionable meeting briefs." },
          { role: "user", content: prompt },
        ], model: "google/gemini-2.5-flash-lite", json: true });
    const response = { ok: true, json: async () => ({ choices: [{ message: { content: _aiText } }] }) };

    if (!response.ok) throw new Error(`AI error: ${response.status}`);

    const result = await response.json();
    const briefing = JSON.parse(result.choices[0].message.content);

    return new Response(JSON.stringify(briefing), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Client brief error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
