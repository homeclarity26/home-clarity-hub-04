import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageBase64, mimeType, imageUrl, availablePages } = await req.json();
    if (!imageBase64 && !imageUrl) {
      return new Response(JSON.stringify({ error: "imageBase64 or imageUrl required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const categories = ["exterior", "interior", "system", "damage", "progress", "before", "after", "other"];

    const systemPrompt = `You are an expert home inspector analyzing photos. Given a home inspection photo, determine:
1. Which category it belongs to: ${categories.join(", ")}
2. What room or area of the home it shows
3. Relevant tags for the photo

Available report pages: ${(availablePages || []).map((p: any) => `${p.slug} (${p.name})`).join(", ")}`;

    const imageContent = imageBase64
      ? { type: "image_url", image_url: { url: `data:${mimeType || "image/jpeg"};base64,${imageBase64}` } }
      : { type: "image_url", image_url: { url: imageUrl } };

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: [
            imageContent,
            { type: "text", text: "Categorize this photo. Return the category, room/area, pageSlug (if applicable), and tags." },
          ]},
        ],
        tools: [{
          type: "function",
          function: {
            name: "categorize_photo",
            description: "Categorize a home photo",
            parameters: {
              type: "object",
              properties: {
                category: { type: "string", enum: categories },
                room_or_area: { type: "string", description: "e.g. Kitchen, Roof, HVAC Room" },
                pageSlug: { type: "string", description: "Report page slug if applicable" },
                description: { type: "string" },
                tags: { type: "array", items: { type: "string" } },
                confidence: { type: "string", enum: ["high", "medium", "low"] },
              },
              required: ["category", "room_or_area", "description", "confidence"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "categorize_photo" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "Credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI error: ${response.status}`);
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    const parsed = toolCall
      ? JSON.parse(toolCall.function.arguments)
      : { category: "other", room_or_area: null, description: "Could not categorize", confidence: "low", tags: [] };

    return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("categorize-photo error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
