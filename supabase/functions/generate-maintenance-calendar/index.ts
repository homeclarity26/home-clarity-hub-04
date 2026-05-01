// supabase/functions/generate-maintenance-calendar/index.ts
//
// Generates a four-season maintenance calendar for a property's Step 4
// strategy. Takes the wizard's page seeds + any equipment list and asks
// Claude Sonnet 4.6 to lay out the seasonal tasks any homeowner in Summit
// County Ohio should be running through their year.
//
// Voice rules (enforced):
//   - No em-dashes
//   - No salesy language

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callClaude, parseJSON } from "../_shared/ai-client.ts";
import { requireRole, corsHeaders, json } from "../_shared/auth.ts";

const MAX_OUTPUT_TOKENS = 3000;

const SEASONS = ["winter", "spring", "summer", "fall"] as const;
type Season = (typeof SEASONS)[number];

interface PageSeed {
  page_key: string;
  title: string;
  group?: string;
  suggested_condition?: string;
  key_observations?: string[];
}

interface EquipmentItem {
  name?: string;
  category?: string;
  brand?: string;
  model?: string;
  install_date?: string;
}

interface RequestBody {
  property_id: string;
  page_seeds?: PageSeed[];
  equipment_list?: EquipmentItem[];
}

interface MaintenanceTask {
  task: string;
  system: string;
  frequency: string;
}

interface MaintenanceCalendar {
  winter: MaintenanceTask[];
  spring: MaintenanceTask[];
  summer: MaintenanceTask[];
  fall: MaintenanceTask[];
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

function normalizeTask(raw: unknown): MaintenanceTask | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const task =
    typeof r.task === "string" && r.task.trim().length > 0 ? r.task.trim() : null;
  const system =
    typeof r.system === "string" && r.system.trim().length > 0 ? r.system.trim() : "general";
  const frequency =
    typeof r.frequency === "string" && r.frequency.trim().length > 0
      ? r.frequency.trim()
      : "once per season";
  if (!task) return null;
  return { task, system, frequency };
}

function normalizeCalendar(raw: unknown): MaintenanceCalendar | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const out: MaintenanceCalendar = { winter: [], spring: [], summer: [], fall: [] };
  for (const season of SEASONS) {
    const arr = Array.isArray(r[season]) ? (r[season] as unknown[]) : [];
    for (const item of arr) {
      const norm = normalizeTask(item);
      if (norm) out[season].push(norm);
    }
  }
  const total =
    out.winter.length + out.spring.length + out.summer.length + out.fall.length;
  return total > 0 ? out : null;
}

function buildPageSeedsBlock(seeds: PageSeed[] | undefined): string {
  if (!seeds || seeds.length === 0) return "No page seeds.";
  return seeds
    .map((s) => {
      const condition = s.suggested_condition ?? "unknown";
      const obs =
        Array.isArray(s.key_observations) && s.key_observations.length > 0
          ? ` — ${s.key_observations.slice(0, 2).join("; ")}`
          : "";
      return `- ${s.title} [${condition}]${obs}`;
    })
    .join("\n");
}

function buildEquipmentBlock(equipment: EquipmentItem[] | undefined): string {
  if (!equipment || equipment.length === 0) return "No equipment list.";
  return equipment
    .map((e) => {
      const parts = [
        e.name ?? "",
        e.category ? `(${e.category})` : "",
        e.brand && e.model ? `${e.brand} ${e.model}` : e.brand ?? e.model ?? "",
        e.install_date ? `installed ${e.install_date}` : "",
      ].filter(Boolean);
      return `- ${parts.join(" ")}`;
    })
    .join("\n");
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

  const systemPrompt = `You are HBC's home stewardship advisor building a four-season maintenance calendar for a residential property in Summit County, Ohio.

Output a JSON object with four arrays keyed by season: winter, spring, summer, fall. Each array holds 5 to 8 short tasks. Tasks are tactical (something the homeowner or HBC Concierge does that quarter), not abstract.

Each task object looks like:
{ "task": "Service the heat pump and replace filters", "system": "HVAC", "frequency": "twice yearly" }

Hard rules:
- Output JSON only with exactly the four keys winter, spring, summer, fall.
- "task" is one specific action under 14 words. Use plain language.
- "system" tags the area (HVAC, plumbing, roof, exterior, landscape, electrical, appliances, safety, etc.).
- "frequency" is human-readable (e.g. "annual", "twice yearly", "monthly during heating season").
- Never use em-dashes. Use commas or semicolons.
- Tailor to the page seeds and equipment list. Mention specific systems by name when relevant. Do not invent equipment.
- Cover the basics every Ohio home needs (gutter clearing in fall, sump pump check in spring, HVAC tune-up before each season, smoke alarm test, dryer vent clean) plus property-specific items.
- Do not output JSON inside markdown code fences.

Return JSON only.`;

  const userContent = `PROPERTY ID: ${body.property_id}

PAGE SEEDS:
${buildPageSeedsBlock(body.page_seeds)}

EQUIPMENT:
${buildEquipmentBlock(body.equipment_list)}

Build the four-season maintenance calendar now.`;

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
      console.error(
        "generate-maintenance-calendar: parse failed:",
        err,
        "raw head:",
        aiText.slice(0, 400),
      );
      return json({ error: "AI response could not be parsed" }, { status: 502 });
    }

    const normalized = normalizeCalendar(parsed);
    if (!normalized) {
      return json(
        { error: "AI returned an empty or malformed calendar; please retry" },
        { status: 502 },
      );
    }

    const cleaned = scrubObject(normalized);

    return json({
      ok: true,
      property_id: body.property_id,
      maintenance_calendar: cleaned,
      ai_model: "claude-sonnet-4-6",
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("generate-maintenance-calendar error:", err);
    return json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
});
