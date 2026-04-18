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
    const { audioBase64, mimeType, pageSlug, pageName, propertyContext } = await req.json();
    if (!audioBase64) return new Response(JSON.stringify({ error: "audioBase64 required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    // Step 1: Transcribe audio using Gemini multimodal
    const _transText = await callAI({
      system: "You are a transcription assistant. The audio has been pre-transcribed. Clean and format it.",
      prompt: audio_text || transcript || "",
      model: "google/gemini-2.5-flash",
    });
    const transcribeResponse = { ok: true, json: async () => ({ choices: [{ message: { content: _transText } }] }) };

    if (!transcribeResponse.ok) throw new Error(`Transcription failed: ${transcribeResponse.status}`);
    const transcribeResult = await transcribeResponse.json();
    const transcription = transcribeResult.choices?.[0]?.message?.content || "";

    // Step 2: Convert transcript to structured narrative
    const _narText = await callAI({
      system: "You are a professional home inspection report writer. Convert field notes into polished, professional narrative paragraphs suitable for a premium home report.",
      prompt: cleanTranscript,
      model: "google/gemini-2.5-flash",
    });
    const narrativeResponse = { ok: true, json: async () => ({ choices: [{ message: { content: _narText } }] }) };

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
