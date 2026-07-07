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
    const { project, vendors, clientLocation } = await req.json();
    const prompt = `You are a home consultant matching vendors to projects. Given the project details and vendor list, rank the top 3 best-fit vendors with a brief justification for each.

Project: ${JSON.stringify(project)}
Client Location: ${clientLocation}
Available Vendors: ${JSON.stringify(vendors)}

Return top 3 ranked vendors with justification.`;

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
    let matches = [];
    if (toolCall) {
      try { matches = JSON.parse(toolCall.function.arguments).matches; } catch {}
    }

    return new Response(JSON.stringify({ matches }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
