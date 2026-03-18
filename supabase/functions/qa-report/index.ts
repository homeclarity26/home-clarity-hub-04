import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ReportPage {
  title: string;
  group: string;
  conditionRating?: string;
  narrative?: string[];
  specs?: Record<string, unknown>;
  tiers?: { label: string; cost: string }[];
  recommendations?: string[];
  key_observations?: string[];
  status?: string;
}

interface QAIssue {
  severity: "error" | "warning" | "info";
  page: string;
  message: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const {
      pages,
      propertyName,
      propertyAddress,
      reportCompletionPercent,
    }: {
      pages: ReportPage[];
      propertyName?: string;
      propertyAddress?: string;
      reportCompletionPercent?: number;
    } = await req.json();

    if (!pages || pages.length === 0) {
      return new Response(
        JSON.stringify({ error: "pages array is required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    const pagesSummary = pages.map((p) => ({
      title: p.title,
      group: p.group,
      conditionRating: p.conditionRating || "not set",
      hasNarrative: Array.isArray(p.narrative) && p.narrative.some((n) => n.trim().length > 20),
      narrativeWordCount: Array.isArray(p.narrative)
        ? p.narrative.join(" ").trim().split(/\s+/).length
        : 0,
      hasTiers: Array.isArray(p.tiers) && p.tiers.length > 0,
      hasSpecs: p.specs && Object.keys(p.specs).length > 0,
      hasKeyObservations: Array.isArray(p.key_observations) && p.key_observations.length > 0,
      status: p.status || "draft",
      hasDefaultText: Array.isArray(p.narrative) && p.narrative.some(
        (n) =>
          n.toLowerCase().includes("lorem ipsum") ||
          n.toLowerCase().includes("placeholder") ||
          n.toLowerCase().includes("your text here") ||
          n.toLowerCase().includes("add content") ||
          (n.trim().length > 0 && n.trim().length < 30 && p.group !== "strategy")
      ),
    }));

    const systemInstruction = `You are a quality assurance reviewer for Home Clarity Hub, a home advisory service. You are reviewing a home assessment report before it is published to the client.

Review the report pages summary below and identify any quality issues that should be addressed before publishing. Be thorough but practical — this is a professional client-facing document.

Property: ${propertyName || "Unknown"} at ${propertyAddress || "Unknown"}
Total pages: ${pages.length}
Completion: ${reportCompletionPercent ?? 0}%

Pages summary (JSON):
${JSON.stringify(pagesSummary, null, 2)}

Check for these types of issues:
1. **Errors** (must fix before publishing):
   - Pages with no narrative at all, or extremely short narratives (< 30 words) that likely haven't been filled in
   - Pages with default/placeholder text that wasn't replaced
   - Pages rated "Poor" or "Critical" with no recommendations or action items
   - Pages that still have status "draft" (not "complete")
   - Critical systems pages (HVAC, electrical, roof) with no condition rating

2. **Warnings** (should fix, but can publish):
   - Pages with condition rating "Not set" or missing
   - Pages with very short narratives (30-80 words) that could be more informative
   - System pages (HVAC, plumbing, electrical) with no specs provided
   - Pages with Poor/Fair condition but no pricing tiers
   - More than 30% of pages still in draft status

3. **Info** (nice to have):
   - Pages that could benefit from key observations
   - Strategy pages (financial-roadmap, maintenance-calendar) with minimal content

Return a JSON object with:
- "issues": array of { "severity": "error"|"warning"|"info", "page": "page title", "message": "specific actionable issue description" }
- "overallScore": number 0-100 (readiness to publish)
- "summary": one sentence summary of the report's readiness

Be specific in your messages — name the page and describe exactly what needs to be done. Limit to the most important 15 issues max.`;

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
              parts: [{ text: "Review this report and identify quality issues before publishing." }],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 2000,
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

    let parsed: { issues: QAIssue[]; overallScore: number; summary: string };
    try {
      const cleaned = rawContent.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      // Fallback: run basic client-side checks
      const issues: QAIssue[] = [];
      pagesSummary.forEach((p) => {
        if (!p.hasNarrative) {
          issues.push({ severity: "error", page: p.title, message: "No narrative content — this page appears empty." });
        } else if (p.narrativeWordCount < 30) {
          issues.push({ severity: "warning", page: p.title, message: "Narrative is very short — consider adding more detail." });
        }
        if (p.conditionRating === "not set") {
          issues.push({ severity: "warning", page: p.title, message: "No condition rating set." });
        }
        if (p.hasDefaultText) {
          issues.push({ severity: "error", page: p.title, message: "Contains placeholder or default text that should be replaced." });
        }
      });
      parsed = {
        issues,
        overallScore: Math.max(0, 100 - issues.filter((i) => i.severity === "error").length * 15 - issues.filter((i) => i.severity === "warning").length * 5),
        summary: "AI QA unavailable — basic checks applied.",
      };
    }

    // Ensure arrays are valid
    const issues = Array.isArray(parsed.issues) ? parsed.issues : [];
    const overallScore = typeof parsed.overallScore === "number" ? parsed.overallScore : 70;
    const summary = typeof parsed.summary === "string" ? parsed.summary : "";

    return new Response(
      JSON.stringify({ issues, overallScore, summary }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("qa-report error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
