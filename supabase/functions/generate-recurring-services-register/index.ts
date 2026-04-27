// supabase/functions/generate-recurring-services-register/index.ts
//
// E4 — Generate Recurring Services Register (HCR Master Spec 5.3.4).
//
// Parses Step 1 intake signals (discovery notes, transcript, anything-else
// text) for service mentions, matches them to the recurring_services
// category enum, infers frequency from context, and returns an array of
// candidate rows. The function does NOT insert directly — admin reviews
// and bulk-inserts via the Supabase client. "Review-before-insert is
// intentional friction" per spec, because casual language about service
// cadences ("we do the lawn every other week or so") drifts.
//
// Auth: creator role only.
//
// Voice rules:
//   - No em-dashes
//   - No "saves money" or salesy language

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callAI, parseJSON } from "../_shared/ai-client.ts";
import { requireRole, corsHeaders } from "../_shared/auth.ts";

const MAX_OUTPUT_TOKENS = 1500;
// Cap input text size before sending to AI — discovery notes can run long.
const MAX_INPUT_CHARS = 12_000;

// CHECK constraint values from Master Spec 5.1.3. Keep this list in sync
// with the migration that creates the recurring_services table.
const VALID_CATEGORIES = [
  "lawn_landscaping",
  "pest_control",
  "hvac",
  "plumbing",
  "electrical",
  "roof_gutters",
  "pool_spa",
  "cleaning",
  "security",
  "pool_chemicals",
  "tree_care",
  "snow_removal",
  "septic",
  "well_water",
  "other",
] as const;

const VALID_FREQUENCIES = [
  "weekly",
  "biweekly",
  "monthly",
  "quarterly",
  "biannual",
  "annual",
  "as_needed",
] as const;

type Category = (typeof VALID_CATEGORIES)[number];
type Frequency = (typeof VALID_FREQUENCIES)[number];

interface IntakeSignals {
  discovery_notes_html?: string;
  transcript_html?: string;
  anything_else_html?: string;
}

interface RequestBody {
  property_id: string;
  intake_signals?: IntakeSignals;
}

interface ProposedService {
  category: Category;
  service_name: string;
  vendor_name: string | null;
  frequency: Frequency;
  frequency_months: number | null;
  cost_per_visit: number | null;
  annual_cost: number | null;
  notes_html: string | null;
  hbc_managed: boolean;
  status: "current";
  // Source quote that justifies this row, so admin can verify against the
  // intake before approving.
  source_quote: string | null;
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

// Strip HTML tags down to plain text for AI input. We keep paragraph breaks
// as newlines so the model can still see structure.
function htmlToPlainText(html: string | undefined | null): string {
  if (!html) return "";
  return html
    .replace(/<\s*br\s*\/?\s*>/gi, "\n")
    .replace(/<\/\s*p\s*>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Map common frequency words back to enum values + months. The AI is asked
// to use enum strings directly, but we sanity-check anything it sends.
function frequencyToMonths(freq: Frequency): number | null {
  switch (freq) {
    case "weekly": return 0; // sub-monthly tracked via cadence_months=null + frequency=weekly
    case "biweekly": return 0;
    case "monthly": return 1;
    case "quarterly": return 3;
    case "biannual": return 6;
    case "annual": return 12;
    case "as_needed": return null;
  }
}

function isValidCategory(s: string): s is Category {
  return (VALID_CATEGORIES as readonly string[]).includes(s);
}

function isValidFrequency(s: string): s is Frequency {
  return (VALID_FREQUENCIES as readonly string[]).includes(s);
}

// Normalize one AI-proposed row to the shape we return. Drop invalid
// categories/frequencies rather than coercing — admin can re-trigger.
function normalizeProposal(raw: unknown): ProposedService | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;

  const category = typeof r.category === "string" ? r.category.toLowerCase().trim() : "";
  const frequency = typeof r.frequency === "string" ? r.frequency.toLowerCase().trim() : "";
  if (!isValidCategory(category)) return null;
  if (!isValidFrequency(frequency)) return null;

  const serviceName = typeof r.service_name === "string" && r.service_name.trim().length > 0
    ? r.service_name.trim()
    : null;
  if (!serviceName) return null;

  const costPerVisit = typeof r.cost_per_visit === "number" && isFinite(r.cost_per_visit)
    ? r.cost_per_visit
    : null;
  const annualCost = typeof r.annual_cost === "number" && isFinite(r.annual_cost)
    ? r.annual_cost
    : null;

  const vendorName = typeof r.vendor_name === "string" && r.vendor_name.trim().length > 0
    ? r.vendor_name.trim()
    : null;

  const notesHtml = typeof r.notes_html === "string" && r.notes_html.trim().length > 0
    ? r.notes_html.trim()
    : null;

  const sourceQuote = typeof r.source_quote === "string" && r.source_quote.trim().length > 0
    ? r.source_quote.trim()
    : null;

  return {
    category,
    service_name: serviceName,
    vendor_name: vendorName,
    frequency,
    frequency_months: frequencyToMonths(frequency),
    cost_per_visit: costPerVisit,
    annual_cost: annualCost,
    notes_html: notesHtml,
    hbc_managed: false,
    status: "current",
    source_quote: sourceQuote,
  };
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

  if (!body.property_id) {
    return new Response(JSON.stringify({ error: "property_id is required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Concatenate all intake signal sources into one prompt-ready string. If
  // nothing was provided, return an empty array immediately — no AI call.
  const signals = body.intake_signals ?? {};
  const sources: Array<{ label: string; text: string }> = [
    { label: "Discovery notes", text: htmlToPlainText(signals.discovery_notes_html) },
    { label: "Transcript", text: htmlToPlainText(signals.transcript_html) },
    { label: "Anything else", text: htmlToPlainText(signals.anything_else_html) },
  ].filter((s) => s.text.length > 0);

  if (sources.length === 0) {
    return new Response(
      JSON.stringify({ proposals: [], note: "No intake signals provided; nothing to parse." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // Concatenate then truncate. We bias toward keeping the start of each
  // section so we don't lose context if the discovery notes are huge.
  let combined = sources.map((s) => `--- ${s.label} ---\n${s.text}`).join("\n\n");
  if (combined.length > MAX_INPUT_CHARS) {
    combined = combined.slice(0, MAX_INPUT_CHARS) + "\n[truncated]";
  }

  const system = `You are HBC's intake parser building the initial Recurring Services Register for a property.

Read the intake material below and extract every recurring service mention you can find: lawn care, pest control, HVAC service, plumbing maintenance, etc. For each one, return a row with:

- "category": one of ${VALID_CATEGORIES.join(", ")}
- "service_name": short, specific (e.g. "Lawn mowing and edging", "HVAC spring tune-up", "Quarterly pest treatment")
- "vendor_name": the vendor name if mentioned, otherwise null
- "frequency": one of ${VALID_FREQUENCIES.join(", ")}
- "cost_per_visit": dollar amount per visit if mentioned, otherwise null
- "annual_cost": annual total if mentioned, otherwise null
- "notes_html": short HTML paragraph capturing useful context, or null
- "source_quote": the verbatim phrase from the intake that supports this row

Hard rules:
- Never use em-dashes (no "—" character, no "--" pair).
- Never use phrases like "saves money", "save money", or salesy language.
- Use only the categories and frequencies listed above. If a service does not fit any category, use "other".
- If frequency is unclear, use "as_needed".
- Do not invent vendor names or prices. Leave them null when not stated.
- Do not include one-time projects, repairs, or events. Only standing recurring services.

Return JSON only:
{ "proposals": [ { ... }, ... ] }

Return an empty array if no recurring services are mentioned.`;

  const userPrompt = `Property ID: ${body.property_id}

Intake material:
${combined}

Extract the recurring services now.`;

  try {
    const raw = await callAI({
      system,
      prompt: userPrompt,
      model: "gemini-flash-latest",
      json: true,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      temperature: 0.2,
    });

    let parsed: { proposals?: unknown[] };
    try {
      parsed = parseJSON(raw);
    } catch (err) {
      console.error("generate-recurring-services-register: parse failed:", err, "raw:", raw);
      return new Response(
        JSON.stringify({ error: "AI response could not be parsed" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const rawProposals = Array.isArray(parsed.proposals) ? parsed.proposals : [];
    const normalized: ProposedService[] = [];
    let droppedCount = 0;
    for (const p of rawProposals) {
      const norm = normalizeProposal(p);
      if (norm) normalized.push(norm);
      else droppedCount++;
    }

    // Final em-dash scrub on the entire payload (covers notes_html and
    // source_quote, which the AI sometimes embellishes with dashes).
    const cleaned = scrubObject(normalized);

    return new Response(
      JSON.stringify({
        property_id: body.property_id,
        proposals: cleaned,
        dropped_invalid_count: droppedCount,
        ai_model: "gemini-flash-latest",
        generated_at: new Date().toISOString(),
        // Reminder for callers: this function does not insert. Admin must
        // review and call .insert() on recurring_services themselves.
        note: "Review proposals before inserting. This function does not write to the database.",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("generate-recurring-services-register error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
