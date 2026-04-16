import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireRole, corsHeaders, json } from "../_shared/auth.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const auth = await requireRole(req, ["creator"]);
  if ("error" in auth) return auth.error;

  try {
    const { imageBase64, mimeType = "image/jpeg", pageSlug }: {
      imageBase64: string;
      mimeType?: string;
      pageSlug?: string;
    } = await req.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "imageBase64 is required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    const systemInstruction = `You are an expert at reading equipment labels, serial plates, and specification stickers found on home appliances and mechanical systems.

Extract all visible information from the equipment label or serial plate in the image. Return a JSON object with any of the following fields that you can read — use null for anything not visible or legible:

- "brand": manufacturer/brand name (e.g. "Carrier", "Lennox", "Rheem", "GE", "Bosch")
- "model": full model number (e.g. "58STA090-14")
- "serial": serial number
- "manufactured": manufacture date or year (e.g. "2018", "Jan 2019", "08/2017")
- "efficiency": efficiency rating (e.g. "96% AFUE", "16 SEER", "0.92 EF")
- "capacity": capacity or output rating (e.g. "90,000 BTU", "3.5 Ton", "50 Gallon")
- "voltage": electrical voltage (e.g. "240V", "120V/60Hz")
- "refrigerant": refrigerant type (e.g. "R-410A", "R-22")
- "weight": unit weight if visible
- "country": country of manufacture
- "certifications": safety certifications (e.g. "UL Listed", "CSA Certified")
- "notes": any other relevant specs or text from the label worth capturing
- "pageSlug": "${pageSlug || ""}" (pass through unchanged)

Only include fields where you can clearly read the text. Do not guess or hallucinate values. Return ONLY valid JSON — no markdown, no explanation.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemInstruction }] },
          contents: [
            {
              role: "user",
              parts: [
                {
                  inlineData: {
                    mimeType,
                    data: imageBase64,
                  },
                },
                { text: "Extract all readable information from this equipment label or serial plate." },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 800,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const aiResult = await response.json();
    const rawContent = aiResult.candidates?.[0]?.content?.parts?.[0]?.text || "";

    let parsed: Record<string, string | null>;
    try {
      const cleaned = rawContent.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = { notes: rawContent || "Could not parse equipment label." };
    }

    // Remove null values and empty strings to keep it clean
    const result = Object.fromEntries(
      Object.entries(parsed).filter(([, v]) => v !== null && v !== "" && v !== undefined)
    );

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("extract-serial-plate error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
