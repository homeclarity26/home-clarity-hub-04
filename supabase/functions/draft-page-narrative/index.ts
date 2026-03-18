import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const {
      pageSlug,
      pageName,
      propertyAddress,
      yearBuilt,
      sqft,
      bedrooms,
      bathrooms,
      propertyType,
      relationshipType,
      clientIntelligenceSummary,
      clientGoals,
      clientPriorities,
      existingConditionRating,
      existingSpecs,
    }: {
      pageSlug: string;
      pageName: string;
      propertyAddress?: string;
      yearBuilt?: string | number;
      sqft?: string | number;
      bedrooms?: string | number;
      bathrooms?: string | number;
      propertyType?: string;
      relationshipType?: string;
      clientIntelligenceSummary?: string;
      clientGoals?: string[];
      clientPriorities?: string[];
      existingConditionRating?: string;
      existingSpecs?: Record<string, unknown>;
    } = await req.json();

    if (!pageSlug || !pageName) {
      return new Response(
        JSON.stringify({ error: "pageSlug and pageName are required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    const specsStr = existingSpecs && Object.keys(existingSpecs).length > 0
      ? Object.entries(existingSpecs).map(([k, v]) => `${k}: ${v}`).join(", ")
      : "none provided";

    const systemInstruction = `You are an expert home consultant writing professional report content for Home Clarity Hub. Your writing is clear, authoritative, and client-friendly — no jargon, plain English, but with the confidence of a knowledgeable advisor.

Write a narrative section for the "${pageName}" page of a home assessment report. The narrative should:
1. Describe the current state of this system/space based on available context
2. Note any relevant concerns, age factors, or maintenance considerations
3. Reference the client's specific situation and goals where relevant
4. Be 2-3 short paragraphs, each as a separate string in the array

Also generate 3-5 key observations — concise bullet points highlighting the most important findings.

Property context:
- Address: ${propertyAddress || "unknown"}
- Year built: ${yearBuilt || "unknown"}
- Sq ft: ${sqft || "unknown"}
- Bedrooms: ${bedrooms || "unknown"}, Bathrooms: ${bathrooms || "unknown"}
- Property type: ${propertyType || "unknown"}
- Client relationship: ${relationshipType || "unknown"}

Page being written: ${pageName} (${pageSlug})
Condition rating: ${existingConditionRating || "not yet assessed"}
Known specs: ${specsStr}

${clientIntelligenceSummary ? `Client intelligence summary:\n${clientIntelligenceSummary}` : ""}
${clientGoals?.length ? `Client goals: ${clientGoals.join("; ")}` : ""}
${clientPriorities?.length ? `Flagged priorities: ${clientPriorities.join("; ")}` : ""}

Return a JSON object with:
- "narrative": array of 2-3 paragraph strings
- "key_observations": array of 3-5 concise observation strings (no bullet symbols, just the text)`;

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
              parts: [{ text: `Write the narrative and key observations for the "${pageName}" page.` }],
            },
          ],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 1500,
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

    let parsed;
    try {
      const cleaned = rawContent.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = {
        narrative: [rawContent],
        key_observations: [],
      };
    }

    return new Response(
      JSON.stringify({
        narrative: Array.isArray(parsed.narrative) ? parsed.narrative : [parsed.narrative || ""],
        key_observations: Array.isArray(parsed.key_observations) ? parsed.key_observations : [],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("draft-page-narrative error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
