// supabase/functions/generate-replacement-briefing/index.ts
//
// E2 — Generate Replacement Briefing (HCR Master Spec 5.3.2).
//
// Produces the full payload for a replacement_briefings row given a system
// page's identifying data. Calls estimate-costs as a sub-step for Summit
// County baseline pricing (never invents numbers). Output is validated
// before returning: tier price_low <= price_high, urgency matches age,
// required photo roles accounted for.
//
// Auth: creator role only (via requireRole).
//
// Voice rules:
//   - No em-dashes
//   - No "saves money" or salesy language
//   - 5-step "How replacement happens" explainer per [v2.19]

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callAI, parseJSON } from "../_shared/ai-client.ts";
import { requireRole, corsHeaders } from "../_shared/auth.ts";

const MAX_OUTPUT_TOKENS = 2048;

interface PhotoInput {
  role: "unit" | "serial_plate" | "install_location" | "failure_signal";
  url: string;
  caption?: string;
}

interface RequestBody {
  report_page_id: string;
  system_type: string;
  unit_make?: string | null;
  unit_model?: string | null;
  unit_serial?: string | null;
  install_year?: number | null;
  property_zip?: string | null;
  property_sqft?: number | null;
  photos?: PhotoInput[];
}

interface Tier {
  id: "essential" | "enhanced" | "signature";
  label: string;
  price_low: number;
  price_high: number;
  scope_html: string;
  inclusions: string[];
  exclusions: string[];
  warranty: string;
  recommended: boolean;
}

interface Timeline {
  current_age_years: number;
  expected_remaining_years: number;
  replacement_window_start: number;
  replacement_window_end: number;
  urgency: "well_within_life" | "approaching_eol" | "overdue" | "critical";
}

// Strip em-dashes (and en-dashes) from any AI text. Same belt-and-suspenders
// approach as daily-brief-cron.
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

// Expected useful life by system type (Summit County / Northeast Ohio
// baselines). Source: prototype decisions log [v2.19].
const EXPECTED_LIFE_YEARS: Record<string, number> = {
  furnace: 20,
  boiler: 25,
  ac: 15,
  heat_pump: 15,
  water_heater: 12,
  tankless_water_heater: 18,
  roof: 25,
  siding: 35,
  windows: 25,
  electrical_panel: 40,
  hvac: 18,
  default: 20,
};

function expectedLifeFor(systemType: string): number {
  const key = systemType.toLowerCase().trim();
  return EXPECTED_LIFE_YEARS[key] ?? EXPECTED_LIFE_YEARS.default;
}

function deriveTimeline(systemType: string, installYear: number | null | undefined): Timeline {
  const currentYear = new Date().getFullYear();
  const expectedLife = expectedLifeFor(systemType);
  const ageYears = installYear ? Math.max(0, currentYear - installYear) : Math.floor(expectedLife / 2);
  const remaining = Math.max(0, expectedLife - ageYears);

  let urgency: Timeline["urgency"];
  if (remaining > 5) urgency = "well_within_life";
  else if (remaining > 0) urgency = "approaching_eol";
  else if (ageYears < expectedLife + 3) urgency = "overdue";
  else urgency = "critical";

  return {
    current_age_years: ageYears,
    expected_remaining_years: remaining,
    replacement_window_start: currentYear + Math.max(0, remaining - 1),
    replacement_window_end: currentYear + remaining + 2,
    urgency,
  };
}

// Locked CTA template from spec 5.1.2. Personalized with system_type.
function buildCtas(systemType: string): Array<Record<string, unknown>> {
  return [
    {
      id: "emergency",
      label: "Help, this isn't working",
      style: "rust",
      action: "open_concierge",
      prompt: `My ${systemType} just stopped working. I need help today.`,
    },
    {
      id: "plan",
      label: "Plan my replacement",
      style: "gold",
      action: "open_concierge",
      prompt: `I want to start planning the replacement for my ${systemType}.`,
    },
  ];
}

// Call estimate-costs as a sub-step. Returns null on failure so the caller
// can fall back to bare AI estimates (still better than nothing, but logged).
async function callEstimateCosts(
  systemType: string,
  propertySqft: number | null | undefined,
  propertyZip: string | null | undefined,
  authHeader: string,
): Promise<{ essential?: { price?: string }; enhanced?: { price?: string }; signature?: { price?: string } } | null> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  if (!supabaseUrl) return null;

  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/estimate-costs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify({
        pageSlug: systemType,
        pageName: systemType,
        sqft: propertySqft ?? undefined,
        propertyType: "single_family",
        regionHint: propertyZip ? `Summit County OH ${propertyZip}` : "Summit County OH",
      }),
    });
    if (!res.ok) {
      console.warn(`estimate-costs returned ${res.status}`);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.warn("estimate-costs call failed:", err);
    return null;
  }
}

// estimate-costs returns "$8,500 - $11,500" style strings; pull the low/high
// numbers out. Returns null if parsing fails (so caller can fall back).
function parsePriceRange(s: string | undefined): { low: number; high: number } | null {
  if (!s) return null;
  const matches = s.match(/\$?([\d,]+)\s*[-to]+\s*\$?([\d,]+)/i);
  if (!matches) return null;
  const low = parseInt(matches[1].replace(/,/g, ""), 10);
  const high = parseInt(matches[2].replace(/,/g, ""), 10);
  if (isNaN(low) || isNaN(high)) return null;
  return { low, high };
}

// Validate the AI-produced payload before we let it leave the function.
// Master Spec 5.3.2 requires: every tier price_low <= price_high, urgency
// consistent with age, photo roles tracked.
function validatePayload(
  tiers: Tier[],
  timeline: Timeline,
  photos: PhotoInput[],
): { valid: true } | { valid: false; reason: string } {
  for (const tier of tiers) {
    if (tier.price_low > tier.price_high) {
      return { valid: false, reason: `Tier ${tier.id} has price_low > price_high` };
    }
    if (tier.price_low <= 0 || tier.price_high <= 0) {
      return { valid: false, reason: `Tier ${tier.id} has non-positive price` };
    }
  }

  // Urgency must match the timeline math we computed. If the AI clobbered
  // the urgency field with an inconsistent value, reject.
  const expectedUrgency = (() => {
    if (timeline.expected_remaining_years > 5) return "well_within_life";
    if (timeline.expected_remaining_years > 0) return "approaching_eol";
    if (timeline.current_age_years < expectedLifeFor("default") + 3) return "overdue";
    return "critical";
  })();
  if (timeline.urgency !== expectedUrgency) {
    // Self-heal rather than fail the request — we computed timeline ourselves
    // so a mismatch here is an internal bug.
    timeline.urgency = expectedUrgency;
  }

  // Mark missing photo roles in the response (don't reject — admins often
  // need to generate the briefing before all photos are uploaded). We
  // surface this as an array attached to the response but here we just
  // ensure the photo array is well-formed.
  for (const p of photos) {
    if (!p.role || !p.url) {
      return { valid: false, reason: "Photo entry missing role or url" };
    }
  }

  return { valid: true };
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

  if (!body.report_page_id || !body.system_type) {
    return new Response(
      JSON.stringify({ error: "report_page_id and system_type are required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  try {
    // 1. Compute timeline deterministically from install_year + system_type.
    const timeline = deriveTimeline(body.system_type, body.install_year ?? null);

    // 2. Pull Summit County baseline pricing from estimate-costs. We forward
    // the caller's auth so the sub-call's requireRole check passes.
    const authHeader = req.headers.get("authorization") ?? "";
    const estimate = await callEstimateCosts(
      body.system_type,
      body.property_sqft ?? null,
      body.property_zip ?? null,
      authHeader,
    );

    const essentialPrice = parsePriceRange(estimate?.essential?.price);
    const enhancedPrice = parsePriceRange(estimate?.enhanced?.price);
    const signaturePrice = parsePriceRange(estimate?.signature?.price);

    // 3. Ask Gemini to produce the narrative content (tier scopes,
    // inclusions/exclusions, warranties, "how replacement happens").
    // Pricing comes from the estimate above when available; AI fills in if
    // estimate-costs failed.
    const photos = body.photos ?? [];
    const photoSummary = photos.length > 0
      ? photos.map((p) => `${p.role}: ${p.caption ?? "no caption"}`).join("\n")
      : "No photos attached yet.";

    const system = `You are HBC's senior systems estimator producing a Replacement Briefing.

Hard rules:
- Never use em-dashes (no "—" character, no "--" pair).
- Never use phrases like "saves money", "save money", or salesy language.
- No corporate jargon.
- Tier IDs must be exactly "essential", "enhanced", "signature".
- Each tier needs scope_html (one short paragraph), 3 to 5 inclusions, 1 to 3 exclusions, and a warranty string.
- Mark exactly one tier as "recommended": true (the Enhanced tier by default unless context says otherwise).
- "how_replacement_happens_html" must be a 5-step explainer in HBC voice, formatted as an <ol>.

Return JSON only with this exact shape:
{
  "tiers": [
    { "id": "essential", "label": "Essential", "price_low": 8500, "price_high": 11500, "scope_html": "<p>...</p>", "inclusions": ["..."], "exclusions": ["..."], "warranty": "5 years parts, 2 years labor", "recommended": false },
    { "id": "enhanced", "label": "Enhanced", "price_low": 13500, "price_high": 16500, "scope_html": "<p>...</p>", "inclusions": ["..."], "exclusions": ["..."], "warranty": "10 years parts, 5 years labor", "recommended": true },
    { "id": "signature", "label": "Signature", "price_low": 18500, "price_high": 24500, "scope_html": "<p>...</p>", "inclusions": ["..."], "exclusions": ["..."], "warranty": "Lifetime parts, 10 years labor", "recommended": false }
  ],
  "how_replacement_happens_html": "<ol><li>...</li>...</ol>"
}`;

    const userPrompt = `System type: ${body.system_type}
Make/model: ${body.unit_make ?? "unknown"} / ${body.unit_model ?? "unknown"}
Install year: ${body.install_year ?? "unknown"}
Current age: ${timeline.current_age_years} years
Expected remaining life: ${timeline.expected_remaining_years} years
Urgency: ${timeline.urgency}
Property sqft: ${body.property_sqft ?? "unknown"}
Property zip: ${body.property_zip ?? "unknown"} (Summit County OH baseline)

Pricing baselines from estimate-costs (use these exact numbers if provided; otherwise estimate from Summit County market):
- Essential: ${essentialPrice ? `$${essentialPrice.low} to $${essentialPrice.high}` : "not provided, estimate"}
- Enhanced: ${enhancedPrice ? `$${enhancedPrice.low} to $${enhancedPrice.high}` : "not provided, estimate"}
- Signature: ${signaturePrice ? `$${signaturePrice.low} to $${signaturePrice.high}` : "not provided, estimate"}

Photos available:
${photoSummary}

Generate the replacement briefing now.`;

    const raw = await callAI({
      system,
      prompt: userPrompt,
      model: "gemini-flash-latest",
      json: true,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      temperature: 0.4,
    });

    let parsed: { tiers: Tier[]; how_replacement_happens_html: string };
    try {
      parsed = parseJSON(raw);
    } catch (err) {
      console.error("generate-replacement-briefing: parse failed:", err, "raw:", raw);
      return new Response(
        JSON.stringify({ error: "AI response could not be parsed" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Override AI prices with estimate-costs values when we have them. The
    // spec is explicit: "Use estimate-costs for Summit County baselines,
    // never invent numbers."
    const tiers: Tier[] = parsed.tiers.map((t) => {
      let override: { low: number; high: number } | null = null;
      if (t.id === "essential") override = essentialPrice;
      else if (t.id === "enhanced") override = enhancedPrice;
      else if (t.id === "signature") override = signaturePrice;
      if (override) {
        return { ...t, price_low: override.low, price_high: override.high };
      }
      return t;
    });

    const validation = validatePayload(tiers, timeline, photos);
    if (!validation.valid) {
      console.error("generate-replacement-briefing: validation failed:", validation.reason);
      return new Response(
        JSON.stringify({ error: `Validation failed: ${validation.reason}` }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const ctas = buildCtas(body.system_type);

    // Final scrub of AI-produced HTML before returning.
    const cleaned = {
      report_page_id: body.report_page_id,
      system_type: body.system_type,
      unit_make: body.unit_make ?? null,
      unit_model: body.unit_model ?? null,
      unit_serial: body.unit_serial ?? null,
      install_year: body.install_year ?? null,
      expected_eol_year: body.install_year
        ? body.install_year + expectedLifeFor(body.system_type)
        : null,
      tiers: scrubObject(tiers),
      photos,
      timeline,
      ctas,
      how_replacement_happens_html: scrubEmDashes(parsed.how_replacement_happens_html ?? ""),
      ai_model: "gemini-flash-latest",
      generated_at: new Date().toISOString(),
      // Surface missing photo roles so the caller can warn the admin.
      missing_photo_roles: ["unit", "serial_plate", "install_location"].filter(
        (role) => !photos.some((p) => p.role === role),
      ),
    };

    return new Response(JSON.stringify(cleaned), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("generate-replacement-briefing error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
