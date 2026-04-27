// supabase/functions/generate-design-fee-education/index.ts
//
// E6 — Generate Design Fee Education content (HCR Master Spec 5.3.3).
//
// Generates the "Why Design Matters First" content block on Vision project
// pages per [v2.21]. Mostly static content, lightly personalized in three
// places:
//   1. project_name reference in the intro paragraph
//   2. scope-specific deliverables in each phase
//   3. design fee estimate scaled to project tier midpoints
//
// Auth: creator role only.
//
// Voice rules:
//   - No em-dashes
//   - No "saves money" or salesy language
//   - HBC voice: warm, direct, locally grounded

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callAI, parseJSON } from "../_shared/ai-client.ts";
import { requireRole, corsHeaders } from "../_shared/auth.ts";

const MAX_OUTPUT_TOKENS = 1500;

interface TierInput {
  id?: string;
  label?: string;
  price_low?: number;
  price_high?: number;
}

interface RequestBody {
  report_page_id: string;
  project_name: string;
  project_type?: string;
  rough_scope_html?: string;
  tiers?: TierInput[];
}

interface DesignPhase {
  phase: "Discovery" | "Concept" | "Documentation";
  duration_weeks: number;
  deliverables: string[];
}

interface ResponsePayload {
  design_fee_education_html: string;
  design_fee_estimate_low: number;
  design_fee_estimate_high: number;
  design_phases: DesignPhase[];
  ai_model: string;
  generated_at: string;
}

function scrubEmDashes(text: string): string {
  return text.replace(/—/g, ", ").replace(/–/g, "-").replace(/--/g, ", ");
}

function scrubObject<T>(obj: T): T {
  if (typeof obj === "string") return scrubEmDashes(obj) as unknown as T;
  if (Array.isArray(obj)) return obj.map((v) => scrubObject(v)) as unknown as T;
  if (obj && typeof obj === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      out[k] = scrubObject(v);
    }
    return out as T;
  }
  return obj;
}

// Compute a sensible design fee estimate from the project tiers. Industry
// rule of thumb: design fee runs 8 to 15 percent of construction budget for
// renovation projects in this size range. We anchor the low end to 8% of
// the lowest-tier midpoint and the high end to 15% of the highest-tier
// midpoint, then clamp to a sane absolute floor/ceiling.
const DEFAULT_LOW = 4500;
const DEFAULT_HIGH = 8500;
const ABSOLUTE_FLOOR = 2500;
const ABSOLUTE_CEILING = 75_000;

function deriveDesignFee(tiers: TierInput[] | undefined): { low: number; high: number } {
  if (!tiers || tiers.length === 0) {
    return { low: DEFAULT_LOW, high: DEFAULT_HIGH };
  }

  const midpoints: number[] = [];
  for (const t of tiers) {
    if (typeof t.price_low === "number" && typeof t.price_high === "number") {
      midpoints.push((t.price_low + t.price_high) / 2);
    }
  }
  if (midpoints.length === 0) return { low: DEFAULT_LOW, high: DEFAULT_HIGH };

  const lowestMid = Math.min(...midpoints);
  const highestMid = Math.max(...midpoints);

  const low = Math.max(ABSOLUTE_FLOOR, Math.round(lowestMid * 0.08 / 100) * 100);
  const high = Math.min(ABSOLUTE_CEILING, Math.round(highestMid * 0.15 / 100) * 100);

  // Ensure low <= high; if the math collapsed, fall back to defaults.
  if (low > high) return { low: DEFAULT_LOW, high: DEFAULT_HIGH };
  return { low, high };
}

// Default phase template — used as the seed for AI personalization.
function defaultPhases(): DesignPhase[] {
  return [
    {
      phase: "Discovery",
      duration_weeks: 2,
      deliverables: [
        "Site visit and existing-conditions review",
        "Lifestyle and use-pattern interview",
        "Budget and timeline alignment",
        "Inspiration boards and direction options",
      ],
    },
    {
      phase: "Concept",
      duration_weeks: 3,
      deliverables: [
        "Two to three layout options with floor plans",
        "Material and finish direction",
        "Preliminary fixture and lighting selections",
        "Concept review and one round of revisions",
      ],
    },
    {
      phase: "Documentation",
      duration_weeks: 4,
      deliverables: [
        "Permit-ready construction drawings",
        "Final material, fixture, and finish schedules",
        "Specifications package for trades",
        "Bid coordination support",
      ],
    },
  ];
}

// Validate AI-provided phases. If anything is malformed, fall back to the
// default template — the educational content is largely static anyway.
function normalizePhases(raw: unknown): DesignPhase[] {
  if (!Array.isArray(raw)) return defaultPhases();

  const allowed = new Set(["Discovery", "Concept", "Documentation"]);
  const normalized: DesignPhase[] = [];
  for (const p of raw) {
    if (!p || typeof p !== "object") continue;
    const phase = (p as { phase?: unknown }).phase;
    const duration = (p as { duration_weeks?: unknown }).duration_weeks;
    const deliverables = (p as { deliverables?: unknown }).deliverables;
    if (typeof phase !== "string" || !allowed.has(phase)) continue;
    if (typeof duration !== "number" || duration <= 0) continue;
    if (!Array.isArray(deliverables) || deliverables.length === 0) continue;
    const cleanDeliverables = deliverables
      .filter((d): d is string => typeof d === "string" && d.trim().length > 0)
      .map((d) => d.trim());
    if (cleanDeliverables.length === 0) continue;
    normalized.push({
      phase: phase as DesignPhase["phase"],
      duration_weeks: duration,
      deliverables: cleanDeliverables,
    });
  }

  if (normalized.length !== 3) return defaultPhases();
  // Order matters: Discovery, Concept, Documentation.
  const order = ["Discovery", "Concept", "Documentation"];
  normalized.sort((a, b) => order.indexOf(a.phase) - order.indexOf(b.phase));
  return normalized;
}

// Static-ish HTML template. The AI is asked to fill in {project_name} in
// three specific places and otherwise leave the wording alone. This keeps
// brand voice tight and per-call cost low.
function buildEducationHtml(projectName: string): string {
  return `<section class="design-fee-education">
  <h3>Why design matters first for ${projectName}</h3>
  <p>Before a single fixture is ordered or a wall is opened, ${projectName} needs a design phase. This is not paperwork. It is the part of the project that decides whether your finished space actually works the way you live, or whether you spend the next ten years fighting choices that got rushed.</p>
  <p>A renovation design phase produces three things you cannot get from looking at photos online: a layout proven to fit your house, material selections that hold up to your daily use, and drawings detailed enough that your contractor, your electrician, and your tile setter all see the same picture. When any one of those is missing, the gap shows up later as change orders, callbacks, or finishes that look great on day one and tired on year three.</p>
  <p>Below is what the design process looks like for ${projectName} and what each phase delivers.</p>
</section>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const auth = await requireRole(req, ["creator"]);
  if ("error" in auth) return auth.error;

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!body.report_page_id || !body.project_name) {
    return new Response(
      JSON.stringify({ error: "report_page_id and project_name are required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const projectName = body.project_name.trim();
  const fee = deriveDesignFee(body.tiers);

  // Personalization layer 2: scope-specific deliverables. Ask the AI to
  // tweak the default phase deliverables based on the rough scope, but
  // only if a rough scope is provided. If not, return the static template.
  let phases: DesignPhase[];
  let usedAi = false;

  if (body.rough_scope_html && body.rough_scope_html.trim().length > 0) {
    const system = `You are personalizing the design phases for a Vision renovation project page.

Start from this default phase template:
${JSON.stringify(defaultPhases(), null, 2)}

Adjust the "deliverables" arrays to reflect the specific scope below. Keep:
- Phase names exactly: "Discovery", "Concept", "Documentation".
- Phase order exactly: Discovery, Concept, Documentation.
- duration_weeks within plus or minus 1 week of the defaults.
- 3 to 5 deliverables per phase.

Hard rules:
- Never use em-dashes (no "—" character, no "--" pair).
- Never use phrases like "saves money", "save money", or salesy language.
- Deliverables are short fragments, not full sentences.
- Do not introduce phases beyond the three listed.

Return JSON only:
{ "phases": [ { "phase": "Discovery", "duration_weeks": 2, "deliverables": ["...", "..."] }, ... ] }`;

    const userPrompt = `Project: ${projectName}
Project type: ${body.project_type ?? "vision_project"}

Rough scope:
${body.rough_scope_html.replace(/<[^>]+>/g, " ").slice(0, 2000)}

Personalize the phases now.`;

    try {
      const raw = await callAI({
        system,
        prompt: userPrompt,
        model: "gemini-flash-latest",
        json: true,
        maxOutputTokens: MAX_OUTPUT_TOKENS,
        temperature: 0.3,
      });
      const parsed = parseJSON<{ phases?: unknown }>(raw);
      phases = normalizePhases(parsed.phases);
      // normalizePhases falls back to the default template internally when
      // the AI output is malformed. Only count this as an AI personalization
      // when at least one deliverable differs from the default.
      const defaults = defaultPhases();
      usedAi = phases.some((p, i) =>
        p.deliverables.length !== defaults[i].deliverables.length ||
        p.deliverables.some((d, j) => d !== defaults[i].deliverables[j])
      );
    } catch (err) {
      // AI call failed; fall back to static template. Educational content
      // ships either way.
      console.warn("generate-design-fee-education: AI personalization failed, using defaults:", err);
      phases = defaultPhases();
    }
  } else {
    phases = defaultPhases();
  }

  const payload: ResponsePayload = {
    design_fee_education_html: scrubEmDashes(buildEducationHtml(projectName)),
    design_fee_estimate_low: fee.low,
    design_fee_estimate_high: fee.high,
    design_phases: scrubObject(phases),
    ai_model: usedAi ? "gemini-flash-latest" : "templated",
    generated_at: new Date().toISOString(),
  };

  return new Response(JSON.stringify(payload), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
