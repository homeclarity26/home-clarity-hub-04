import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callAI, parseJSON } from "../_shared/ai-client.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { userMessage, clientName, propertyAddress, sqft, propertyType } = await req.json();
    const systemPrompt = `You are an expert home renovation proposal assistant for a home consulting company. 
The admin is describing a project in plain language. Extract ALL relevant details and generate a structured estimate.

Return a JSON object with these fields:
- title: string (concise project title, e.g. "Master Bathroom Remodel")
- lineItems: array of { description: string, quantity: number, unit_price: number } — break the project into logical line items with realistic pricing
- notes: string (any terms or notes mentioned)
- scopeSections: array of { number: string like "01", title: string, bullets: array of { label: string, desc: string } } — structured scope of work sections
- clientSelections: array of { label: string, items: array of { name: string, desc: string, shop: string } } — items the client selects/purchases
- terms: array of { label: string, value: string } — project terms like payment schedule, warranty, timeline
- timelinePhases: array of { phase: string, duration: string } — project timeline phases
- introText: string — a professional 2-3 sentence proposal introduction
- tagline: string — a short compelling tagline for the cover page

Context about the client:
- Client: ${clientName || "Unknown"}
- Property: ${propertyAddress || "Unknown"}
- Square footage: ${sqft || "Unknown"}
- Property type: ${propertyType || "Unknown"}

Be thorough and professional. Generate realistic pricing based on the scope described. If the user is vague, make reasonable assumptions and note them.`;

    const _aiText = await callAI({ messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ], model: "google/gemini-2.5-flash" });
    const response = { ok: true, json: async () => ({ choices: [{ message: { content: _aiText } }] }) };

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited — try again in a moment" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${status}`);
    }

    const json = await response.json();
    const toolCall = json.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No structured response from AI");

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-proposal-kickoff error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
