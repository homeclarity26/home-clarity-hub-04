import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { audioBase64, mimeType, pageSlug, pageName, propertyContext } = await req.json();
    if (!audioBase64) return new Response(JSON.stringify({ error: "audioBase64 required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Step 1: Transcribe audio using Gemini multimodal
    const transcribeResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Transcribe this audio recording from a home inspector. Return the exact transcription as plain text." },
          { role: "user", content: [
            { type: "input_audio", input_audio: { data: audioBase64, format: mimeType?.includes("wav") ? "wav" : "mp3" } },
            { type: "text", text: "Transcribe this audio." },
          ]},
        ],
      }),
    });

    if (!transcribeResponse.ok) throw new Error(`Transcription failed: ${transcribeResponse.status}`);
    const transcribeResult = await transcribeResponse.json();
    const transcription = transcribeResult.choices?.[0]?.message?.content || "";

    // Step 2: Convert transcript to structured narrative
    const narrativeResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: `You are a professional home report writer. Convert the inspector's spoken notes into polished, professional narrative paragraphs for a "${pageName || pageSlug}" section of a Home Clarity Report. Maintain all technical details but use clear, client-friendly language.

${propertyContext ? `Property context: ${JSON.stringify(propertyContext)}` : ""}

Return JSON with:
- "narrative": array of paragraphs (3-5 paragraphs)
- "key_observations": array of bullet points extracted from the notes
- "condition_suggestion": suggested condition rating based on notes ("Excellent"|"Good"|"Fair"|"Poor"|"Critical")` },
          { role: "user", content: `Inspector's notes transcription:\n\n${transcription}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "format_narrative",
            description: "Convert transcription to narrative",
            parameters: {
              type: "object",
              properties: {
                narrative: { type: "array", items: { type: "string" } },
                key_observations: { type: "array", items: { type: "string" } },
                condition_suggestion: { type: "string" },
              },
              required: ["narrative", "key_observations", "condition_suggestion"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "format_narrative" } },
      }),
    });

    if (!narrativeResponse.ok) throw new Error(`Narrative generation failed: ${narrativeResponse.status}`);
    const narrativeResult = await narrativeResponse.json();
    const toolCall = narrativeResult.choices?.[0]?.message?.tool_calls?.[0];
    const parsed = toolCall ? JSON.parse(toolCall.function.arguments) : { narrative: [transcription], key_observations: [], condition_suggestion: "Fair" };

    return new Response(JSON.stringify({ transcription, ...parsed }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("voice-to-narrative error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
