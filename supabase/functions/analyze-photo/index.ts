import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireRole, corsHeaders, json } from "../_shared/auth.ts";

/**
 * analyze-photo — professional home-inspector condition assessment of
 * a single photo. Returns a JSON structure with condition rating,
 * identified defects, and recommended actions.
 *
 * Model: gemini-flash-latest (2.5 Flash, vision-capable). Previously hit
 * gemini-pro-latest but Pro is chronically overloaded for vision calls —
 * golden-path-photos failed in CI with HTTP 503 "high demand" or 504
 * idle-timeout (150s) on every attempt. Flash is multimodal-capable,
 * 5-10x faster, and doesn't get rate-limited the way Pro does. Quality
 * is more than sufficient for inspector-style structured-JSON output.
 *
 * Wraps the Gemini call in an AbortController with a 90s budget — well
 * under Supabase's 150s function idle timeout — so a hung upstream gets
 * a clean error instead of being killed mid-response. One retry on 503.
 */
const GEMINI_TIMEOUT_MS = 90_000;
const VISION_MODEL = "gemini-flash-latest";

async function fetchGeminiWithRetry(url: string, body: string): Promise<Response> {
  for (let attempt = 1; attempt <= 2; attempt++) {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), GEMINI_TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        signal: ac.signal,
      });
      clearTimeout(timer);
      // Retry once on transient overload; otherwise return.
      if (res.status === 503 && attempt === 1) {
        await new Promise((r) => setTimeout(r, 2000));
        continue;
      }
      return res;
    } catch (e) {
      clearTimeout(timer);
      if (attempt === 2) throw e;
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  throw new Error("unreachable");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const auth = await requireRole(req, ["creator"]);
  if ("error" in auth) return auth.error;

  try {
    const { photo_url, section_type, property_context } = await req.json();
    if (!photo_url) return json({ error: "photo_url required" }, { status: 400 });

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) return json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });

    // Fetch + base64-encode the image. btoa chokes on large binary strings,
    // so we chunk via reduce.
    const imgResp = await fetch(photo_url);
    if (!imgResp.ok) throw new Error(`Failed to download image: ${imgResp.status}`);
    const bytes = new Uint8Array(await imgResp.arrayBuffer());
    let binary = "";
    const CHUNK = 0x8000;
    for (let i = 0; i < bytes.length; i += CHUNK) {
      binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
    }
    const base64 = btoa(binary);
    const mimeType = imgResp.headers.get("content-type") || "image/jpeg";

    // Build the context string safely.
    const ctx = property_context || {};
    const contextStr = [
      ctx.age ? `Home age: ~${ctx.age} years` : "",
      ctx.location ? `Location: ${ctx.location}` : "",
      ctx.existing_condition ? `Current rated condition: ${ctx.existing_condition}` : "",
      ctx.property_type ? `Property type: ${ctx.property_type}` : "",
    ].filter(Boolean).join(". ");

    const systemInstruction = `You are a licensed professional home inspector with 20+ years of experience analyzing residential property. You are looking at a photo of a home's ${section_type || "component"}.

${contextStr ? `Property context: ${contextStr}.` : "No additional property context provided."}

Analyze the image thoroughly. Identify every visible defect, wear pattern, age indicator, and condition signal. Be specific about locations within the image. Provide actionable recommendations with realistic cost estimates when possible. If the image is blank, corrupted, or clearly not a property photo, say so explicitly in the narrative and set confidence_score low.

Your condition ratings:
- Excellent: Like new, no defects, recently installed / maintained
- Good: Minor wear consistent with age, fully functional, no action needed
- Fair: Moderate wear, some items need attention within 1-2 years
- Poor: Significant deterioration, safety concerns possible, action needed soon
- Critical: Immediate repair or replacement required

Respond in JSON exactly matching:
{
  "condition_rating": "Excellent"|"Good"|"Fair"|"Poor"|"Critical",
  "confidence_score": 0-1,
  "identified_defects": [{ "name": string, "severity": "low"|"medium"|"high"|"critical", "location_in_image": string, "description": string, "recommended_action": string }],
  "estimated_age_years": number | null,
  "recommended_actions": [string],
  "narrative_paragraph": string,
  "raw_observations": [string]
}`;

    const geminiResp = await fetchGeminiWithRetry(
      `https://generativelanguage.googleapis.com/v1beta/models/${VISION_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents: [{
          role: "user",
          parts: [
            { inlineData: { mimeType, data: base64 } },
            { text: `Analyze this ${section_type || "home component"} photo and return the structured JSON.` },
          ],
        }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.3,
          maxOutputTokens: 2048,
        },
      }),
    );

    if (!geminiResp.ok) {
      const errText = await geminiResp.text();
      console.error(`analyze-photo Gemini error ${geminiResp.status}:`, errText.slice(0, 500));
      if (geminiResp.status === 429) return json({ error: "Rate limited, please try again" }, { status: 429 });
      throw new Error(`Gemini error ${geminiResp.status}: ${errText.slice(0, 200)}`);
    }

    const data = await geminiResp.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    let analysis: Record<string, unknown>;
    try {
      analysis = JSON.parse(text);
    } catch (parseErr) {
      console.error("analyze-photo: Gemini returned non-JSON:", text.slice(0, 400));
      throw new Error("AI returned unparseable JSON");
    }

    return json({ ok: true, analysis });
  } catch (err) {
    console.error("analyze-photo error:", err);
    return json({
      ok: false,
      error: err instanceof Error ? err.message : "Unknown error",
      // Keep the shape so old callers that destructure don't crash, but
      // this is an explicit failure — no more silent fallback to "Fair".
      analysis: {
        condition_rating: "Unknown",
        confidence_score: 0,
        narrative_paragraph: "Photo analysis failed; manual inspection required.",
      },
    }, { status: 200 });
  }
});
