import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface AvailablePage {
  slug: string;
  name: string;
  group: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const {
      intelligenceSummary,
      goals = [],
      priorities = [],
      constraints = [],
      propertyType,
      relationshipType,
      yearBuilt,
      sqft,
      availablePages,
    }: {
      intelligenceSummary: string;
      goals: string[];
      priorities: string[];
      constraints: string[];
      propertyType?: string;
      relationshipType?: string;
      yearBuilt?: string;
      sqft?: string;
      availablePages: AvailablePage[];
    } = await req.json();

    if (!intelligenceSummary || !availablePages?.length) {
      return new Response(
        JSON.stringify({ error: "intelligenceSummary and availablePages are required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    const pageList = availablePages
      .map((p) => `- ${p.slug} (${p.name}, group: ${p.group})`)
      .join("\n");

    const systemInstruction = `You are an expert home consultant helping select which report pages to include in a Home Clarity Report.

Given a client intelligence summary and a list of available report page templates, select the most relevant pages for this specific client and property. Every report should include Information and Strategy pages (executive-summary, property-overview, financial-roadmap, maintenance-calendar). Then select systems and spaces that are most relevant given the client's context, priorities, and property type.

Return a JSON object with:
- "recommended": array of page slugs to include (from the available list only)
- "reasoning": a 1-2 sentence explanation of why these pages were selected

Property context:
- Type: ${propertyType || "unknown"}
- Relationship: ${relationshipType || "unknown"}
- Year built: ${yearBuilt || "unknown"}
- Sq ft: ${sqft || "unknown"}

Client intelligence:
${intelligenceSummary}

Goals: ${goals.join(", ") || "none specified"}
Priorities: ${priorities.join(", ") || "none specified"}
Constraints: ${constraints.join(", ") || "none specified"}

Available pages:
${pageList}

Return ONLY valid JSON.`;

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
              parts: [{ text: "Select the most relevant report pages for this client." }],
            },
          ],
          generationConfig: {
            temperature: 0.2,
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

    let parsed;
    try {
      const cleaned = rawContent.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      // Fallback: recommend all pages in Information + Strategy groups
      const fallback = availablePages
        .filter((p) => p.group === "information" || p.group === "strategy")
        .map((p) => p.slug);
      parsed = { recommended: fallback, reasoning: "Could not parse AI response — defaulting to core pages." };
    }

    // Validate all recommended slugs exist in available pages
    const validSlugs = new Set(availablePages.map((p) => p.slug));
    const recommended = (Array.isArray(parsed.recommended) ? parsed.recommended : [])
      .filter((s: string) => validSlugs.has(s));

    return new Response(
      JSON.stringify({ recommended, reasoning: parsed.reasoning || "" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("recommend-report-pages error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
