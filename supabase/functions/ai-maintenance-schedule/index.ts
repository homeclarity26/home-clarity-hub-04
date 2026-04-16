import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callAI, parseJSON } from "../_shared/ai-client.ts";
import { requireRole, corsHeaders, json } from "../_shared/auth.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const auth = await requireRole(req, ["creator"]);
  if ("error" in auth) return auth.error;

  try {
    const { equipment, propertyAge, location } = await req.json();
    const prompt = `You are a home maintenance expert. Based on the following equipment registry, property age, and location, create a 12-month maintenance calendar.

Equipment: ${JSON.stringify(equipment)}
Property Age: ${propertyAge || "Unknown"} years
Location: ${location || "Unknown"}

Return a JSON array of maintenance tasks, each with: month (1-12), task_name, task_description, estimated_duration_hours, estimated_cost_range (string like "$50-$150"), priority (high/medium/low), equipment_name (if applicable).`;

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
    let schedule = [];
    if (toolCall) {
      try { schedule = JSON.parse(toolCall.function.arguments).schedule; } catch {}
    }

    return new Response(JSON.stringify({ schedule }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
