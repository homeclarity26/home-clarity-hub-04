import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { fileName, fileType } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const categories = [
      "Discovery Call", "Walkthrough", "Exterior Photos", "Interior Photos",
      "Serial Plates", "hover.to", "External Reports", "Invoices",
      "Warranties", "Permits", "Insurance", "General",
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: `You categorize home-related documents. Available categories: ${categories.join(", ")}. Return the best matching category.`,
          },
          {
            role: "user",
            content: `Categorize this file: "${fileName}" (type: ${fileType || "unknown"})`,
          },
        ],
        tools: [{
          type: "function",
          function: {
            name: "categorize",
            description: "Return the document category",
            parameters: {
              type: "object",
              properties: {
                category: { type: "string", enum: categories },
              },
              required: ["category"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "categorize" } },
      }),
    });

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
