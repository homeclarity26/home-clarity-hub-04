import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callClaude, isGeminiRetryable } from "../_shared/ai-client.ts";
import { requireRole, corsHeaders, json } from "../_shared/auth.ts";

interface AvailablePage {
  slug: string;
  name: string;
  group: string;
}

/**
 * Per Master Spec 5.4.2 the wizard now wants page recommendations grouped
 * into four sections matching the locked Step 2 TOC structure. We also
 * keep returning the legacy flat `recommended` list during the Phase 7
 * cutover so existing callers (NewReportWizard) keep working unchanged.
 *
 * Section mapping is derived from the page's `group` string. Anything that
 * doesn't fit the four canonical sections falls into `spaces` by default,
 * which is the safest catch-all for room/area-shaped templates.
 */
type SectionKey = "information" | "spaces" | "systems_appliances" | "strategy";

const groupToSection = (group: string): SectionKey => {
  const g = (group || "").toLowerCase();
  if (g === "information" || g.startsWith("info")) return "information";
  if (g === "strategy" || g.startsWith("strategy")) return "strategy";
  if (g.startsWith("system") || g.startsWith("appliance") || g.startsWith("safety")) {
    return "systems_appliances";
  }
  return "spaces";
};

interface SectionEntry {
  page_key: string;
  reason: string;
}

interface CustomSectionSuggestion {
  section_label: string;
  reason: string;
}

interface RawRecommendations {
  recommendations?: Partial<Record<SectionKey, SectionEntry[]>>;
  custom_section_suggestions?: CustomSectionSuggestion[];
  recommended?: string[];
  reasoning?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const auth = await requireRole(req, ["creator"]);
  if ("error" in auth) return auth.error;

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
      return json(
        { error: "intelligenceSummary and availablePages are required." },
        { status: 400 },
      );
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    const pageList = availablePages
      .map((p) => `- ${p.slug} (${p.name}, group: ${p.group})`)
      .join("\n");

    const systemInstruction = `You are an expert home consultant helping select which report pages to include in a Home Clarity Report.

Given a client intelligence summary and a list of available report page templates, group recommended pages into four sections that mirror the locked Step 2 TOC:

  1. information       - executive summary, property overview, contacts, etc.
  2. spaces            - rooms and exterior areas (kitchen, primary bath, roof, deck, etc.)
  3. systems_appliances - HVAC, plumbing, electrical, water heater, appliances, safety
  4. strategy          - financial roadmap, maintenance calendar, capital plan

Every report should include the core information and strategy pages (executive-summary, property-overview, financial-roadmap, maintenance-calendar) when those slugs are available.

ALSO: if the client's notes hint at a coherent group of items that does not fit the four canonical sections (a property with an outdoor kitchen + hot tub + pergola; a multi-generational property with an in-law suite; a working farm), suggest a custom section in custom_section_suggestions. Each suggestion is just a label and a reason; the admin decides whether to add it.

Return ONLY a JSON object with this exact shape:
{
  "recommendations": {
    "information":        [{"page_key": "<slug>", "reason": "<one short sentence>"}],
    "spaces":             [{"page_key": "<slug>", "reason": "<one short sentence>"}],
    "systems_appliances": [{"page_key": "<slug>", "reason": "<one short sentence>"}],
    "strategy":           [{"page_key": "<slug>", "reason": "<one short sentence>"}]
  },
  "custom_section_suggestions": [
    {"section_label": "Outdoor Living", "reason": "Property has outdoor kitchen + hot tub + pergola"}
  ]
}

Constraints:
- Every page_key MUST be a slug from the available list. Do not invent slugs.
- Each page_key must appear in exactly one section.
- Empty arrays are fine. Empty custom_section_suggestions is fine.
- No markdown, no preamble, no trailing commentary.

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
${pageList}`;

    let rawContent: string;
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemInstruction }] },
            contents: [
              {
                role: "user",
                parts: [{ text: "Group the most relevant report pages into the four sections for this client." }],
              },
            ],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 2048,
              responseMimeType: "application/json",
            },
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      const aiResult = await response.json();
      rawContent = aiResult.candidates?.[0]?.content?.parts?.[0]?.text || "";
    } catch (fetchErr) {
      if (!isGeminiRetryable(fetchErr)) throw fetchErr;
      console.warn("Gemini failed in recommend-report-pages, falling back to Claude:", fetchErr instanceof Error ? fetchErr.message : fetchErr);
      try {
        rawContent = await callClaude({
          system: systemInstruction,
          prompt: "Group the most relevant report pages into the four sections for this client.",
          json: true,
          geminiFallback: false,
        });
      } catch {
        throw fetchErr;
      }
    }

    let parsed: RawRecommendations;
    try {
      const cleaned = rawContent.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
      parsed = JSON.parse(cleaned) as RawRecommendations;
    } catch {
      const fallback = availablePages
        .filter((p) => p.group === "information" || p.group === "strategy")
        .map((p) => p.slug);
      parsed = {
        recommendations: { information: [], spaces: [], systems_appliances: [], strategy: [] },
        custom_section_suggestions: [],
        recommended: fallback,
        reasoning: "Could not parse AI response — defaulting to core pages.",
      };
    }

    const validSlugs = new Set(availablePages.map((p) => p.slug));
    const safeSection = (entries?: SectionEntry[]): SectionEntry[] =>
      Array.isArray(entries)
        ? entries.filter((e) => e && typeof e.page_key === "string" && validSlugs.has(e.page_key))
        : [];

    const recommendations = {
      information: safeSection(parsed.recommendations?.information),
      spaces: safeSection(parsed.recommendations?.spaces),
      systems_appliances: safeSection(parsed.recommendations?.systems_appliances),
      strategy: safeSection(parsed.recommendations?.strategy),
    };

    // De-dupe across sections in case the model double-listed something.
    const seen = new Set<string>();
    (Object.keys(recommendations) as SectionKey[]).forEach((key) => {
      recommendations[key] = recommendations[key].filter((e) => {
        if (seen.has(e.page_key)) return false;
        seen.add(e.page_key);
        return true;
      });
    });

    // If the model returned only the legacy flat list, slot those slugs
    // into sections derived from page.group so the new shape is never
    // empty when the legacy shape isn't.
    if (seen.size === 0 && Array.isArray(parsed.recommended)) {
      for (const slug of parsed.recommended) {
        if (typeof slug !== "string" || !validSlugs.has(slug) || seen.has(slug)) continue;
        const page = availablePages.find((p) => p.slug === slug);
        if (!page) continue;
        recommendations[groupToSection(page.group)].push({ page_key: slug, reason: "" });
        seen.add(slug);
      }
    }

    const custom_section_suggestions: CustomSectionSuggestion[] = Array.isArray(parsed.custom_section_suggestions)
      ? parsed.custom_section_suggestions.filter(
          (s) => s && typeof s.section_label === "string" && typeof s.reason === "string",
        )
      : [];

    const flatRecommended = Array.from(seen);
    const reasoning = parsed.reasoning || "";

    return json({
      recommendations,
      custom_section_suggestions,
      // Legacy shape kept until Phase 7 cutover (W2 reads the new structure;
      // existing wizard code reads `recommended` + `reasoning`).
      recommended: flatRecommended,
      reasoning,
    });
  } catch (err) {
    console.error("recommend-report-pages error:", err);
    return json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
});
