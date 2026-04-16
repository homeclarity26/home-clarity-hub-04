import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callAI, parseJSON } from "../_shared/ai-client.ts";
import { requireRole, corsHeaders, json } from "../_shared/auth.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const auth = await requireRole(req, ["creator"]);
  if ("error" in auth) return auth.error;

  try {
    const { fileName, fileType } = await req.json();
    const categories = [
      "Discovery Call", "Walkthrough", "Exterior Photos", "Interior Photos",
      "Serial Plates", "hover.to", "External Reports", "Invoices",
      "Warranties", "Permits", "Insurance", "General",
    ];

    const _aiText = await callAI({ system: `You categorize home-related documents. Available categories: ${categories.join(", ")}. Return the best matching category.`, messages: [
          {
            role: "system",
            content: `You categorize home-related documents. Available categories: ${categories.join(", ")}. Return the best matching category.`,
          },
          {
            role: "user",
            content: `Categorize this file: "${fileName}" (type: ${fileType || "unknown"})`,
          },
        ], model: "google/gemini-2.5-flash-lite" });
    const response = { ok: true, json: async () => ({ choices: [{ message: { content: _aiText } }] }) };

    if (!response.ok) {
      console.error("AI error:", response.status);
      return new Response(JSON.stringify({ category: "General" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    let category = "General";
    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      category = parsed.category || "General";
    }

    return new Response(JSON.stringify({ category }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("categorize-document error:", e);
    return new Response(JSON.stringify({ category: "General" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
