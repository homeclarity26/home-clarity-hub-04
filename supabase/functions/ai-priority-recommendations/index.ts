import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { propertyId, clientId, pages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey);

    // Gather context: equipment, invoices
    const [{ data: equipment }, { data: invoices }] = await Promise.all([
      sb.from("equipment").select("name, next_service_date, condition, category").eq("property_id", propertyId).limit(20),
      sb.from("invoices").select("title, amount, status, due_date").eq("property_id", propertyId).eq("status", "pending").limit(5),
    ]);

    const currentMonth = new Date().toLocaleString("en-US", { month: "long" });

    const prompt = `You are a home advisor AI for Hometown Builders Club. Based on the following property data, generate exactly 3 specific, actionable priorities for the homeowner in plain language.

Report pages: ${JSON.stringify(pages || [])}
Equipment: ${JSON.stringify(equipment || [])}
Pending invoices: ${JSON.stringify(invoices || [])}
Current month: ${currentMonth}

Return a JSON array of 3 objects with: title (short action phrase), description (2-3 sentences of friendly advice), category (one of: maintenance, financial, safety).`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a helpful home advisor. Return valid JSON only." },
          { role: "user", content: prompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "return_priorities",
            description: "Return 3 actionable home priorities",
            parameters: {
              type: "object",
              properties: {
                priorities: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      description: { type: "string" },
                      category: { type: "string", enum: ["maintenance", "financial", "safety"] },
                    },
                    required: ["title", "description", "category"],
                  },
                },
              },
              required: ["priorities"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "return_priorities" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, try again later" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    const priorities = toolCall ? JSON.parse(toolCall.function.arguments).priorities : [];

    // Store in DB
    await sb.from("ai_priority_cards").insert({
      client_id: clientId,
      property_id: propertyId,
      priorities_json: priorities,
    });

    return new Response(JSON.stringify({ priorities }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Priority recommendations error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
