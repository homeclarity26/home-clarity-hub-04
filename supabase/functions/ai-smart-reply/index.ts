import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callAI, parseJSON } from "../_shared/ai-client.ts";
import { requireRole } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  
  const auth = await requireRole(req, ["creator"]);
  if ("error" in auth) return auth.error;
try {
    const { messages, clientName, propertyAddress, reportContext } = await req.json();
    const recentMessages = (messages || [])
      .slice(-10)
      .map((m: { senderName: string; message: string }) => `${m.senderName}: ${m.message}`)
      .join("\n");

    const prompt = `You are an AI assistant helping a home consultant reply to a client message.

Client: ${clientName || "Client"}
Property: ${propertyAddress || "Unknown"}
${reportContext ? `Report Context: ${reportContext}` : ""}

Recent conversation:
${recentMessages}

Generate 3 suggested reply options. Each should be professional, warm, and helpful. Vary the tone: one concise, one detailed, one action-oriented.`;

    const _aiText = await callAI({ system: "You are a professional home consultant's AI assistant.", messages: [
          { role: "system", content: "You are a professional home consultant's AI assistant." },
          { role: "user", content: prompt },
        ], model: "google/gemini-3-flash-preview" });
    const response = { ok: true, json: async () => ({ choices: [{ message: { content: _aiText } }] }) };

    if (!response.ok) {
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    let replies: { label: string; message: string }[] = [];
    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      replies = parsed.replies || [];
    }

    return new Response(JSON.stringify({ replies }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-smart-reply error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
