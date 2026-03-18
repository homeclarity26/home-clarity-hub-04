import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { equipment, propertyAge, location } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const prompt = `You are a home maintenance expert. Based on the following equipment registry, property age, and location, create a 12-month maintenance calendar.

Equipment: ${JSON.stringify(equipment)}
Property Age: ${propertyAge || "Unknown"} years
Location: ${location || "Unknown"}

Return a JSON array of maintenance tasks, each with: month (1-12), task_name, task_description, estimated_duration_hours, estimated_cost_range (string like "$50-$150"), priority (high/medium/low), equipment_name (if applicable).`;

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
            name: "return_schedule",
            description: "Return maintenance schedule",
            parameters: {
              type: "object",
              properties: {
                schedule: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      month: { type: "number" },
                      task_name: { type: "string" },
                      task_description: { type: "string" },
                      estimated_duration_hours: { type: "number" },
                      estimated_cost_range: { type: "string" },
                      priority: { type: "string", enum: ["high", "medium", "low"] },
                      equipment_name: { type: "string" },
                    },
                    required: ["month", "task_name", "task_description", "priority"],
                  },
                },
              },
              required: ["schedule"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "return_schedule" } },
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
