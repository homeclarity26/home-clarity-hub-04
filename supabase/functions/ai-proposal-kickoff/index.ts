import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callClaude, parseJSON } from "../_shared/ai-client.ts";
import { requireRole, corsHeaders, json as jsonRes } from "../_shared/auth.ts";
import { retrieveContext } from "../_shared/rag.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const auth = await requireRole(req, ["creator"]);
  if ("error" in auth) return auth.error;

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

    // Pull Adam's past similar scopes and any saved scope-style memories
    // so pricing + structure stays consistent across proposals.
    const ragContext = await retrieveContext({
      query: `${propertyType || ""} ${userMessage}`.slice(0, 3000),
      adminSupabase: auth.adminSupabase as unknown as { rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown[] | null; error: unknown }> },
      creatorUserId: auth.user.id,
      sources: ["report_pages", "knowledge_templates", "agent_memory"],
      perSource: 3,
    });

    const _aiText = await callClaude({
      system: systemPrompt,
      cacheableContext: ragContext || undefined,
      prompt: userMessage,
      json: true,
      temperature: 0.3,
      maxOutputTokens: 8192,
    });

    let result: Record<string, unknown>;
    try {
      result = parseJSON<Record<string, unknown>>(_aiText);
    } catch (e) {
      console.error("ai-proposal-kickoff: JSON parse failed:", e, "raw:", _aiText.slice(0, 500));
      return jsonRes({ error: "AI returned non-JSON — please retry" }, { status: 500 });
    }

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
