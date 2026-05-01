// supabase/functions/generate-capital-plan/index.ts
//
// Generates a 10-year capital plan for a property's Step 4 strategy. Takes
// the wizard's page_seeds + sequence_risk findings + property context +
// clarifying answers and asks Claude Sonnet 4.6 to lay out the next ten
// years of meaningful spend, sequenced by phase. Returns ballpark cost
// ranges (low/high), a phase tag, and a one-line rationale per project.
//
// Voice rules (enforced):
//   - No em-dashes anywhere in the output
//   - Honest framing for HBC Concierge — never "saves money"

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callClaude, parseJSON } from "../_shared/ai-client.ts";
import { requireRole, corsHeaders, json } from "../_shared/auth.ts";

const MAX_OUTPUT_TOKENS = 4096;

const VALID_PHASES = ["defense", "offense", "expansion"] as const;
type Phase = (typeof VALID_PHASES)[number];

interface PageSeed {
  page_key: string;
  title: string;
  group?: string;
  suggested_condition?: string;
  key_observations?: string[];
  priority?: boolean;
  replacement_briefing_stub?: Record<string, unknown> | null;
}

interface SequenceRiskFinding {
  title: string;
  bullets: string[];
}

interface PropertyContext {
  address?: string;
  year_built?: string | number | null;
  sqft?: string | number | null;
  bedrooms?: string | number | null;
  bathrooms?: string | number | null;
  property_type?: string | null;
}

interface RequestBody {
  property_id: string;
  page_seeds?: PageSeed[];
  sequence_risk_flags?: SequenceRiskFinding[];
  property_context?: PropertyContext;
  clarifying_answers?: Record<string, string>;
}

interface CapitalPlanYear {
  year: number;
  phase: Phase;
  project: string;
  ballpark_low: number;
  ballpark_high: number;
  rationale: string;
}

interface CapitalPlan {
  years: CapitalPlanYear[];
  total_low: number;
  total_high: number;
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

function isValidPhase(s: string): s is Phase {
  return (VALID_PHASES as readonly string[]).includes(s);
}

function normalizePlan(raw: unknown): CapitalPlan | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const yearsRaw = Array.isArray(r.years) ? r.years : [];
  const years: CapitalPlanYear[] = [];
  for (const y of yearsRaw) {
    if (!y || typeof y !== "object") continue;
    const row = y as Record<string, unknown>;
    const year = typeof row.year === "number" && row.year > 0 ? Math.floor(row.year) : null;
    const phase =
      typeof row.phase === "string" && isValidPhase(row.phase.toLowerCase())
        ? (row.phase.toLowerCase() as Phase)
        : null;
    const project =
      typeof row.project === "string" && row.project.trim().length > 0
        ? row.project.trim()
        : null;
    const lowRaw = row.ballpark_low;
    const highRaw = row.ballpark_high;
    const low =
      typeof lowRaw === "number" && isFinite(lowRaw) && lowRaw >= 0
        ? Math.round(lowRaw)
        : null;
    const high =
      typeof highRaw === "number" && isFinite(highRaw) && highRaw >= 0
        ? Math.round(highRaw)
        : null;
    const rationale =
      typeof row.rationale === "string" && row.rationale.trim().length > 0
        ? row.rationale.trim()
        : "";
    if (year === null || phase === null || project === null || low === null || high === null) {
      continue;
    }
    years.push({
      year,
      phase,
      project,
      ballpark_low: low,
      ballpark_high: Math.max(low, high),
      rationale,
    });
  }
  years.sort((a, b) => a.year - b.year);
  const total_low = years.reduce((sum, y) => sum + y.ballpark_low, 0);
  const total_high = years.reduce((sum, y) => sum + y.ballpark_high, 0);
  return { years, total_low, total_high };
}

function buildPropertyContextBlock(ctx: PropertyContext | undefined): string {
  if (!ctx) return "Property facts: unknown.";
  const lines: string[] = [];
  if (ctx.address) lines.push(`Address: ${ctx.address}`);
  if (ctx.property_type) lines.push(`Type: ${ctx.property_type}`);
  if (ctx.year_built) lines.push(`Year built: ${ctx.year_built}`);
  if (ctx.sqft) lines.push(`Sq ft: ${ctx.sqft}`);
  if (ctx.bedrooms) lines.push(`Bedrooms: ${ctx.bedrooms}`);
  if (ctx.bathrooms) lines.push(`Bathrooms: ${ctx.bathrooms}`);
  return lines.length > 0 ? lines.join("\n") : "Property facts: unknown.";
}

function buildPageSeedsBlock(seeds: PageSeed[] | undefined): string {
  if (!seeds || seeds.length === 0) return "No page seeds.";
  const lines: string[] = [];
  for (const s of seeds) {
    const condition = s.suggested_condition ?? "unknown";
    const priority = s.priority ? " (priority)" : "";
    const briefing =
      s.replacement_briefing_stub && typeof s.replacement_briefing_stub === "object"
        ? " [replacement briefing flagged]"
        : "";
    const obs =
      Array.isArray(s.key_observations) && s.key_observations.length > 0
        ? ` — ${s.key_observations.slice(0, 3).join("; ")}`
        : "";
    lines.push(`- ${s.title} [${condition}]${priority}${briefing}${obs}`);
  }
  return lines.join("\n");
}

function buildSequenceRiskBlock(flags: SequenceRiskFinding[] | undefined): string {
  if (!flags || flags.length === 0) return "No sequence-risk flags.";
  const lines: string[] = [];
  for (const f of flags) {
    lines.push(`- ${f.title}`);
    for (const b of f.bullets) {
      lines.push(`  · ${b}`);
    }
  }
  return lines.join("\n");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const auth = await requireRole(req, ["creator"]);
  if ("error" in auth) return auth.error;

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.property_id) {
    return json({ error: "property_id is required" }, { status: 400 });
  }

  const systemPrompt = `You are HBC's planning advisor building a 10-year capital plan for a single residential property.

Sequence projects across three phases:
- "defense": stabilize what is at risk (roof, water intrusion, life safety, end-of-life mechanicals)
- "offense": high-leverage upgrades that move the home forward (kitchen refresh, finished basement, primary bath, landscape, exterior paint)
- "expansion": vision projects (kitchens with addition, additions, design-fee work, larger renovations)

Use the page seeds, sequence-risk flags, and property facts to decide what spends meaningfully matter for THIS home over the next ten years. Stretch defense earlier (years 1 to 4), offense in the middle (years 3 to 7), expansion later (years 5 to 10) where appropriate.

Output JSON only with this exact shape:
{
  "years": [
    { "year": 1, "phase": "defense", "project": "Roof replacement", "ballpark_low": 18000, "ballpark_high": 26000, "rationale": "Architectural shingles end-of-life within 24 months." },
    ...
  ]
}

Hard rules:
- Years are integers 1 through 10 (relative offsets from today). Multiple projects per year are allowed; 8 to 14 line items total is the right shape.
- ballpark_low and ballpark_high are integer USD totals for that project. Use realistic Northeast Ohio renovation pricing (Summit County market). Be honest about ranges; do not lowball.
- phase must be exactly one of: defense, offense, expansion.
- rationale is one short sentence (under 18 words) tying back to a specific page seed or sequence-risk note.
- Never use em-dashes (no "—" character, no "--" pair). Use commas or semicolons.
- Never use phrases like "saves money", "save money", or salesy language.
- Do not output the JSON inside markdown code fences. Return raw JSON.

Return JSON only.`;

  const userContent = `PROPERTY:
${buildPropertyContextBlock(body.property_context)}

PAGE SEEDS (with conditions):
${buildPageSeedsBlock(body.page_seeds)}

SEQUENCE-RISK FLAGS:
${buildSequenceRiskBlock(body.sequence_risk_flags)}

CLARIFYING ANSWERS:
${
  body.clarifying_answers && Object.keys(body.clarifying_answers).length > 0
    ? Object.entries(body.clarifying_answers).map(([k, v]) => `- ${k}: ${v}`).join("\n")
    : "(none)"
}

Build the 10-year capital plan now.`;

  try {
    const aiText = await callClaude({
      system: systemPrompt,
      prompt: userContent,
      json: true,
      temperature: 0.3,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
    });

    let parsed: unknown;
    try {
      parsed = parseJSON(aiText);
    } catch (err) {
      console.error("generate-capital-plan: parse failed:", err, "raw head:", aiText.slice(0, 400));
      return json({ error: "AI response could not be parsed" }, { status: 502 });
    }

    const normalized = normalizePlan(parsed);
    if (!normalized || normalized.years.length === 0) {
      return json({ error: "AI returned an empty or malformed plan; please retry" }, { status: 502 });
    }

    const cleaned = scrubObject(normalized);

    return json({
      ok: true,
      property_id: body.property_id,
      capital_plan: cleaned,
      ai_model: "claude-sonnet-4-6",
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("generate-capital-plan error:", err);
    return json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
});
