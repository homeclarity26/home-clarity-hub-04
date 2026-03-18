import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { notes, propertyAddress, clientName } = await req.json();

    if (!notes || typeof notes !== "string" || notes.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Discovery notes are required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    const systemInstruction = `You are an expert home consultant analyst for Home Clarity Hub. Your job is to analyze raw discovery call notes from a client consultation and extract structured intelligence.

Given the raw notes from a discovery call, produce a JSON object with these exact fields:
- "summary": A 2-3 sentence executive summary of the client's situation and priorities
- "goals": An array of strings — the client's stated goals and priorities (3-6 items)
- "constraints": An array of strings — budget limits, timeline constraints, family considerations, or other limitations (1-4 items)
- "priorities": An array of strings — the most urgent or important items that should be flagged for immediate attention (1-4 items)

Be concise and professional. Extract only what is stated or clearly implied. Do not invent information.

Client: ${clientName || "Unknown"}
Property: ${propertyAddress || "Unknown"}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemInstruction }],
          },
          contents: [
            {
              role: "user",
              parts: [{ text: notes }],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 1024,
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

    // Parse the JSON response (Gemini with responseMimeType: "application/json" returns clean JSON)
    let parsed;
    try {
      const cleaned = rawContent.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = {
        summary: rawContent,
        goals: [],
        constraints: [],
        priorities: [],
      };
    }

    const result = {
      summary: parsed.summary || "",
      goals: Array.isArray(parsed.goals) ? parsed.goals : [],
      constraints: Array.isArray(parsed.constraints) ? parsed.constraints : [],
      priorities: Array.isArray(parsed.priorities) ? parsed.priorities : [],
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("analyze-discovery-notes error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
