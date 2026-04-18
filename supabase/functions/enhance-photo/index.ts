import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireRole, corsHeaders, json } from "../_shared/auth.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const auth = await requireRole(req, ["creator"]);
  if ("error" in auth) return auth.error;

  try {
    const { image_url, property_id } = await req.json();
    if (!image_url) return json({ error: "image_url required" }, { status: 400 });

    // For now, use Gemini Vision to analyze and suggest improvements.
    // Full AI upscaling (via Replicate Real-ESRGAN or similar) can be added
    // when a hosted image enhancement API key is configured.
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) return json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });

    // Fetch the image bytes
    const imgResp = await fetch(image_url);
    if (!imgResp.ok) return json({ error: "Failed to fetch image" }, { status: 400 });
    const imgBuffer = await imgResp.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(imgBuffer)));
    const mimeType = imgResp.headers.get("content-type") || "image/jpeg";

    // Ask Gemini Vision for enhancement recommendations
    const geminiResp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            role: "user",
            parts: [
              { inlineData: { mimeType, data: base64 } },
              { text: "Analyze this property photo. Rate its quality 1-10. Suggest specific improvements (brightness, contrast, cropping, white balance). Is this suitable as a professional home report photo? Respond in JSON: { quality_score: number, suitable_for_report: boolean, suggestions: string[], description: string }" }
            ]
          }],
          generationConfig: { responseMimeType: "application/json", temperature: 0.3 }
        })
      }
    );

    const geminiData = await geminiResp.json();
    const analysisText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    const analysis = JSON.parse(analysisText);

    return json({
      ok: true,
      analysis,
      message: "Photo analyzed. Full AI upscaling available when image enhancement API is configured.",
      // When Replicate or similar is added, the enhanced_url field will contain the upscaled image.
      enhanced_url: null,
    });
  } catch (e) {
    console.error("enhance-photo error:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 });
  }
});
