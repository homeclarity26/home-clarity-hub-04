import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireRole, corsHeaders, json } from "../_shared/auth.ts";

/**
 * categorize-photo — auto-classify an uploaded photo by area/category/
 * tags so the admin doesn't have to tag every upload manually.
 *
 * Model: gemini-flash-latest (2.5 Flash, vision-capable). Pro was
 * dropped 2026-04-27 after CI showed chronic 503 "high demand" and
 * 504 idle-timeouts on every photos-suite run. Flash is fully
 * multimodal and easily handles a one-shot category + tag classification.
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
    const { imageBase64, mimeType: incomingMimeType, imageUrl, availablePages } = await req.json();
    if (!imageBase64 && !imageUrl) {
      return json({ error: "imageBase64 or imageUrl required" }, { status: 400 });
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) return json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });

    // Resolve image bytes + mimeType. Prefer the inline base64 if provided
    // (saves a network round-trip), otherwise fetch from the URL.
    let base64 = "";
    let mimeType = incomingMimeType || "image/jpeg";
    if (imageBase64) {
      base64 = imageBase64;
    } else {
      const imgResp = await fetch(imageUrl);
      if (!imgResp.ok) throw new Error(`Failed to download image: ${imgResp.status}`);
      const bytes = new Uint8Array(await imgResp.arrayBuffer());
      let binary = "";
      const CHUNK = 0x8000;
      for (let i = 0; i < bytes.length; i += CHUNK) {
        binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
      }
      base64 = btoa(binary);
      mimeType = imgResp.headers.get("content-type") || mimeType;
    }

    const categories = ["exterior", "interior", "system", "damage", "progress", "before", "after", "other"];
    const pagesHint = (availablePages || []).map((p: { slug: string; name: string }) => `${p.slug} (${p.name})`).join(", ");

    const systemInstruction = `You are an expert home inspector categorizing home-inspection photos.

Given the photo, return JSON:
{
  "category": one of [${categories.join(", ")}],
  "room_or_area": string (the visible space, e.g. "kitchen", "basement", "roof", "front elevation"),
  "pageSlug": string | null (best match from: ${pagesHint || "<none supplied>"}),
  "tags": [string] (3-7 short descriptors),
  "description": string (1-sentence summary),
  "confidence": "high" | "medium" | "low"
}

If the image is blank, corrupted, or not a home/property photo, use category "other", confidence "low", and say so in the description.`;

    const geminiResp = await fetchGeminiWithRetry(
      `https://generativelanguage.googleapis.com/v1beta/models/${VISION_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents: [{
          role: "user",
          parts: [
            { inlineData: { mimeType, data: base64 } },
            { text: "Categorize this photo and return the JSON." },
          ],
        }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.2,
          maxOutputTokens: 1024,
        },
      }),
    );

    if (!geminiResp.ok) {
      const errText = await geminiResp.text();
      console.error(`categorize-photo Gemini error ${geminiResp.status}:`, errText.slice(0, 500));
      if (geminiResp.status === 429) return json({ error: "Rate limited, please try again" }, { status: 429 });
      throw new Error(`Gemini error ${geminiResp.status}: ${errText.slice(0, 200)}`);
    }

    const data = await geminiResp.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    let categorization: Record<string, unknown>;
    try {
      categorization = JSON.parse(text);
    } catch (parseErr) {
      console.error("categorize-photo: Gemini returned non-JSON:", text.slice(0, 400));
      throw new Error("AI returned unparseable JSON");
    }

    return json({ ok: true, ...categorization });
  } catch (err) {
    console.error("categorize-photo error:", err);
    return json({
      ok: false,
      error: err instanceof Error ? err.message : "Unknown error",
      category: "other",
      room_or_area: null,
      pageSlug: null,
      tags: [],
      description: "Categorization failed — please tag manually.",
      confidence: "low",
    }, { status: 200 });
  }
});
