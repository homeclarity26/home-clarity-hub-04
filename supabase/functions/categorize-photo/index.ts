import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callAI, parseJSON } from "../_shared/ai-client.ts";
import { requireRole, corsHeaders, json } from "../_shared/auth.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const auth = await requireRole(req, ["creator"]);
  if ("error" in auth) return auth.error;

  try {
    const { imageBase64, mimeType, imageUrl, availablePages } = await req.json();
    if (!imageBase64 && !imageUrl) {
      return new Response(JSON.stringify({ error: "imageBase64 or imageUrl required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const categories = ["exterior", "interior", "system", "damage", "progress", "before", "after", "other"];

    const systemPrompt = `You are an expert home inspector analyzing photos. Given a home inspection photo, determine:
1. Which category it belongs to: ${categories.join(", ")}
2. What room or area of the home it shows
3. Relevant tags for the photo

Available report pages: ${(availablePages || []).map((p: any) => `${p.slug} (${p.name})`).join(", ")}`;

    const imageContent = imageBase64
      ? { type: "image_url", image_url: { url: `data:${mimeType || "image/jpeg"};base64,${imageBase64}` } }
      : { type: "image_url", image_url: { url: imageUrl } };

    const _aiText = await callAI({
      system: systemPrompt,
      prompt: "Categorize this photo. Return the category, room/area, pageSlug (if applicable), and tags as JSON.",
      model: "google/gemini-2.5-pro",
      json: true,
    });
    const response = { ok: true, json: async () => ({ choices: [{ message: { content: _aiText } }] }) };

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
