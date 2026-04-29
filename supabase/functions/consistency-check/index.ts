import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callAI, callClaude, parseJSON, isGeminiRetryable } from "../_shared/ai-client.ts";
import { requireRole } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * consistency-check — Quality gate for the Step 5 Publish flow.
 *
 * Two outputs:
 *
 * 1. AI consistency analysis (legacy) — score, readabilityGrade, issues,
 *    summary, toneConsistency.
 *
 * 2. pre_publish_questions (E5 / Master Spec 5.4.4) — deterministic
 *    quality-gate questions the admin must answer before publishing.
 *    severity:"high" entries block Publish until acknowledged.
 *
 * Six pre_publish_questions categories per spec:
 *   - missing photos (medium)
 *   - missing replacement briefings on system pages (high)
 *   - missing design fee education on vision pages (high)
 *   - em-dashes detected in published copy (medium)
 *   - undefined paint colors (low)
 *   - undefined fixtures (low)
 */

interface PageInput {
  id?: string;
  page_key?: string;
  title?: string;
  group?: string;
  page_type?: string;
  conditionRating?: string | null;
  narrative?: string | string[] | null;
  specs?: Record<string, unknown> | null;
  photos?: unknown[] | null;
  replacement_briefing?: unknown;
  replacement_briefing_stub?: unknown;
  design_fee_education?: unknown;
  design_fee_education_html?: unknown;
}

interface PrePublishAction { id: string; label: string; }
interface PrePublishQuestion {
  id: string;
  severity: "high" | "medium" | "low";
  question: string;
  page_key?: string;
  actions: PrePublishAction[];
}

const ACK_ACTION: PrePublishAction = { id: "acknowledge", label: "Skip and acknowledge" };

const collectNarrative = (n: PageInput["narrative"]): string => {
  if (!n) return "";
  if (Array.isArray(n)) return n.join(" ");
  return n;
};

const hasValue = (v: unknown): boolean => {
  if (v === null || v === undefined) return false;
  if (typeof v === "string") return v.trim().length > 0;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "object") return Object.keys(v as object).length > 0;
  return true;
};

const buildPrePublishQuestions = (pages: PageInput[]): PrePublishQuestion[] => {
  const out: PrePublishQuestion[] = [];

  for (const page of pages) {
    const key = page.page_key || page.id || page.title || "page";
    const title = page.title || key;
    const narrative = collectNarrative(page.narrative);
    const pageType = (page.page_type || page.group || "").toLowerCase();
    const photoCount = Array.isArray(page.photos) ? page.photos.length : 0;
    const specs = (page.specs ?? {}) as Record<string, unknown>;

    // 1) Missing photos — medium severity.
    if (photoCount === 0) {
      out.push({
        id: `missing_photo_${key}`,
        severity: "medium",
        page_key: page.page_key,
        question: `${title} has no photos attached. Add one now or acknowledge?`,
        actions: [{ id: "add_photo", label: "Add photo" }, ACK_ACTION],
      });
    }

    // 2) System page with a stub but no full replacement briefing — high.
    if (pageType.includes("system") && hasValue(page.replacement_briefing_stub) && !hasValue(page.replacement_briefing)) {
      out.push({
        id: `system_no_replacement_briefing_${key}`,
        severity: "high",
        page_key: page.page_key,
        question: `${title} has a replacement briefing stub but no full briefing. Generate it before publishing?`,
        actions: [{ id: "generate", label: "Generate replacement briefing" }, ACK_ACTION],
      });
    }

    // 3) Vision page missing design fee education — high.
    if (pageType.includes("vision") && !hasValue(page.design_fee_education_html) && !hasValue(page.design_fee_education)) {
      out.push({
        id: `vision_no_design_fee_${key}`,
        severity: "high",
        page_key: page.page_key,
        question: `${title} (Vision page) has no design fee education block. Add it?`,
        actions: [{ id: "generate", label: "Generate design fee block" }, ACK_ACTION],
      });
    }

    // 4) Em-dashes in narrative — medium. Brand voice forbids them.
    if (narrative.includes("—")) {
      out.push({
        id: `em_dash_${key}`,
        severity: "medium",
        page_key: page.page_key,
        question: `${title} narrative contains em-dashes. Replace with commas, periods, or colons before publishing?`,
        actions: [{ id: "fix_em_dashes", label: "Auto-replace em-dashes" }, ACK_ACTION],
      });
    }

    // 5) Undefined paint color on a paint-relevant page — low.
    const paintRelevant = pageType.includes("space") || pageType.includes("interior") || pageType.includes("exterior");
    if (paintRelevant && "paint_color" in specs && !hasValue(specs.paint_color)) {
      out.push({
        id: `undefined_paint_${key}`,
        severity: "low",
        page_key: page.page_key,
        question: `${title} has a paint color spec field but it is empty. Fill it in?`,
        actions: [{ id: "fill_spec", label: "Edit spec" }, ACK_ACTION],
      });
    }

    // 6) Undefined fixtures on a paint-relevant page — low.
    if (paintRelevant && "fixtures" in specs && !hasValue(specs.fixtures)) {
      out.push({
        id: `undefined_fixtures_${key}`,
        severity: "low",
        page_key: page.page_key,
        question: `${title} has a fixtures spec field but it is empty. Fill it in?`,
        actions: [{ id: "fill_spec", label: "Edit spec" }, ACK_ACTION],
      });
    }
  }

  return out;
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const auth = await requireRole(req, ["creator"]);
  if ("error" in auth) return auth.error;

  try {
    const { pages } = await req.json();
    if (!pages || !Array.isArray(pages)) {
      return new Response(JSON.stringify({ error: "pages array required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- AI consistency analysis ------------------------------------
    const allText = pages.map((p: PageInput) => {
      const narrative = collectNarrative(p.narrative);
      return `## ${p.title || p.page_key || "Page"} (Condition: ${p.conditionRating || "N/A"})\n${narrative}`;
    }).join("\n\n");

    const systemPrompt = `You are an expert editor reviewing a home inspection report for quality, consistency, and readability.

Return ONLY a JSON object with these exact keys:
- "score": number 0-100, the overall quality/consistency score
- "readabilityGrade": string - Flesch-Kincaid reading level (e.g., "8th grade", "College")
- "issues": array of { "type": "grammar"|"inconsistency"|"readability"|"tone", "page": string, "description": string, "suggestion": string }
- "summary": 2-3 sentence overview of report quality
- "toneConsistency": "consistent"|"mostly consistent"|"inconsistent"

Do not include any explanation outside the JSON.`;

    let analysis: Record<string, unknown> = {
      score: 0,
      readabilityGrade: "Unknown",
      issues: [],
      summary: "Could not analyze.",
      toneConsistency: "unknown",
    };

    try {
      const aiText = await callAI({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Review this report for quality and consistency:\n\n${allText}` },
        ],
        model: "google/gemini-3-flash-preview",
        json: true,
      });
      analysis = parseJSON<Record<string, unknown>>(aiText);
    } catch (e) {
      if (isGeminiRetryable(e)) {
        console.warn("Gemini failed in consistency-check, falling back to Claude:", e instanceof Error ? e.message : e);
        try {
          const claudeText = await callClaude({
            system: systemPrompt,
            prompt: `Review this report for quality and consistency:\n\n${allText}`,
            json: true,
            geminiFallback: false,
          });
          analysis = parseJSON<Record<string, unknown>>(claudeText);
        } catch (claudeErr) {
          console.error("consistency-check AI analysis failed (continuing with empty analysis):", claudeErr);
        }
      } else {
        console.error("consistency-check AI analysis failed (continuing with empty analysis):", e);
      }
    }

    // ---- Deterministic pre_publish_questions (E5 / Master Spec 5.4.4)
    const pre_publish_questions = buildPrePublishQuestions(pages as PageInput[]);

    // Backwards-compat alias: existing callers may read `issues`; new
    // callers may read `consistency_issues`. Same data, two keys.
    const consistency_issues = (analysis.issues ?? []) as unknown[];

    return new Response(
      JSON.stringify({
        ...analysis,
        consistency_issues,
        pre_publish_questions,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("consistency-check error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
