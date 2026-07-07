// supabase/functions/daily-brief-cron/index.ts
//
// E1 — Daily brief cron (HCR Master Spec 5.3.1, 5.8).
//
// Runs hourly via Supabase Cron. For each property whose local time is 5 AM
// right now, the function generates one daily brief and upserts it into
// public.daily_briefs. Idempotent via the unique (property_id, brief_date)
// constraint.
//
// Auth: this function uses verify_jwt = false in supabase/config.toml. The
// only protection is the x-supabase-cron-secret header, which the cron job
// sets and which the function checks against the CRON_SECRET env var.
//
// Cost discipline (per Master Spec 5.8):
//   - One AI call per property per day, max
//   - Calm days (no actionable signals) skip the AI call entirely and write
//     a templated brief
//   - Inactive properties (no client_user_id, no activity in 90 days) skipped
//   - 30-second per-call timeout on the AI call
//   - Token budget: 500 input + 300 output, larger inputs truncated
//
// Voice rules (HCR brand):
//   - No em-dashes anywhere in generated text
//   - No salesy language, no "saves money" phrasing
//   - Warm, direct, locally grounded

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { callAI, parseJSON } from "../_shared/ai-client.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-cron-secret",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

// Token + timeout budgets (Master Spec 5.8).
const MAX_INPUT_TOKENS = 500;
const MAX_OUTPUT_TOKENS = 300;
const AI_TIMEOUT_MS = 30_000;

// "Active property" window — properties without recent activity get skipped
// to keep daily cost bounded.
const ACTIVITY_WINDOW_DAYS = 90;

interface PropertyRow {
  id: string;
  client_user_id: string | null;
  status: string | null;
  property_name: string | null;
  address: string | null;
  metadata: Record<string, unknown> | null;
  // Timezone lives in metadata.timezone if set; we default to America/New_York
  // when unset (most HCR properties are Eastern). Cron is timezone-aware
  // intentionally — see Master Spec 5.3.1 "Why hourly cron, not 24-hour".
}

interface Signal {
  type: string;
  [k: string]: unknown;
}

interface BriefPayload {
  brief_html: string;
  why_it_matters_html: string | null;
  source_signals: Signal[];
  ai_model: string;
}

// Strip em-dashes from any AI output. Belt-and-suspenders on top of the
// system prompt rule, because models occasionally ignore the instruction.
function scrubEmDashes(text: string): string {
  return text
    .replace(/—/g, ", ") // em-dash
    .replace(/–/g, "-")   // en-dash, also banned
    .replace(/--/g, ", ");      // double-hyphen, common em-dash substitute
}

// Approximate token count: ~4 chars per token for English text. Good enough
// for budget enforcement; we don't need exact tokenization here.
function approxTokens(s: string): number {
  return Math.ceil(s.length / 4);
}

function truncateToTokens(s: string, maxTokens: number): string {
  const maxChars = maxTokens * 4;
  if (s.length <= maxChars) return s;
  return s.slice(0, maxChars) + "...";
}

// Property's local timezone, defaulting to America/New_York. metadata is
// Record<string, unknown> per the properties type; we narrow safely.
function tzFor(property: PropertyRow): string {
  const md = property.metadata ?? {};
  const tz = (md as { timezone?: unknown }).timezone;
  if (typeof tz === "string" && tz.length > 0) return tz;
  return "America/New_York";
}

// Returns the local hour (0-23) at the given IANA timezone. Uses Intl
// formatter so no extra deps needed in the Deno runtime.
function localHourAt(tz: string, now: Date): number {
  try {
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hour: "numeric",
      hour12: false,
    });
    const parts = fmt.formatToParts(now);
    const hourPart = parts.find((p) => p.type === "hour");
    if (!hourPart) return -1;
    // "24" can come back from some runtimes; normalize to 0.
    const h = parseInt(hourPart.value, 10);
    return h === 24 ? 0 : h;
  } catch {
    return -1;
  }
}

// Local date YYYY-MM-DD at the given IANA timezone.
function localDateAt(tz: string, now: Date): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  // en-CA gives YYYY-MM-DD natively.
  return fmt.format(now);
}

// Last activity timestamp for a property — looks at a few obvious tables.
// Returning null = no activity recorded, treat as inactive.
async function lastActivityAt(
  supabase: ReturnType<typeof createClient>,
  propertyId: string,
): Promise<Date | null> {
  // Check the cheapest, most-frequently-updated tables first.
  const queries = [
    supabase
      .from("property_messages")
      .select("created_at")
      .eq("property_id", propertyId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("schedule_events")
      .select("created_at")
      .eq("property_id", propertyId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("reports")
      .select("updated_at")
      .eq("property_id", propertyId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ];

  const results = await Promise.all(queries);
  let latest: Date | null = null;
  for (const r of results) {
    const row = (r as { data?: Record<string, unknown> | null }).data;
    if (!row) continue;
    const stamp = (row.created_at ?? row.updated_at) as string | undefined;
    if (!stamp) continue;
    const d = new Date(stamp);
    if (!isNaN(d.getTime()) && (!latest || d > latest)) latest = d;
  }
  return latest;
}

// Collect actionable signals for a property. Only signals that should change
// what the client sees today belong here. If this returns an empty array,
// the function writes a templated brief and skips the AI call (Master Spec
// 5.8 rule 2).
async function collectSignals(
  supabase: ReturnType<typeof createClient>,
  property: PropertyRow,
  todayLocal: string,
): Promise<Signal[]> {
  const signals: Signal[] = [];

  // 1. Overdue or due-today recurring services.
  const { data: dueServices } = await supabase
    .from("recurring_services")
    .select("id, service_name, category, next_due_date, status")
    .eq("property_id", property.id)
    .in("status", ["current", "overdue"])
    .lte("next_due_date", todayLocal)
    .limit(5);

  for (const s of (dueServices ?? []) as Array<Record<string, unknown>>) {
    const dueDate = s.next_due_date as string | null;
    const daysOverdue = dueDate
      ? Math.max(0, Math.floor((new Date(todayLocal).getTime() - new Date(dueDate).getTime()) / 86_400_000))
      : 0;
    signals.push({
      type: "recurring_service_due",
      service_id: s.id,
      service_name: s.service_name,
      category: s.category,
      days_overdue: daysOverdue,
    });
  }

  // 2. Replacement briefings approaching EOL (within 1 year).
  const todayYear = new Date(todayLocal).getFullYear();
  const { data: eolBriefings } = await supabase
    .from("replacement_briefings")
    .select("id, system_type, expected_eol_year, unit_make")
    .eq("property_id", property.id)
    .lte("expected_eol_year", todayYear + 1)
    .limit(3);

  for (const b of (eolBriefings ?? []) as Array<Record<string, unknown>>) {
    signals.push({
      type: "system_approaching_eol",
      briefing_id: b.id,
      system_type: b.system_type,
      unit_make: b.unit_make,
      expected_eol_year: b.expected_eol_year,
    });
  }

  // 3. Capital plan items scheduled in the current year.
  const { data: capitalItems } = await supabase
    .from("capital_plan_items")
    .select("id, project_name, year_start, year_end, phase")
    .eq("property_id", property.id)
    .lte("year_start", todayYear)
    .gte("year_end", todayYear)
    .limit(3);

  for (const c of (capitalItems ?? []) as Array<Record<string, unknown>>) {
    signals.push({
      type: "capital_plan_current_year",
      item_id: c.id,
      project_name: c.project_name,
      phase: c.phase,
    });
  }

  // 4. Recent project_updates in the last 24 hours. (Optional table — handle
  // gracefully if it doesn't exist in this project schema.)
  try {
    const { data: updates } = await supabase
      .from("project_updates")
      .select("id, title, created_at")
      .eq("property_id", property.id)
      .gte("created_at", new Date(Date.now() - 86_400_000).toISOString())
      .limit(3);
    for (const u of (updates ?? []) as Array<Record<string, unknown>>) {
      signals.push({
        type: "recent_project_update",
        update_id: u.id,
        title: u.title,
      });
    }
  } catch {
    // project_updates may not exist; that's fine, just skip.
  }

  return signals;
}

// Templated brief for calm days — zero AI cost. Deliberately short and warm.
function buildCalmDayBrief(property: PropertyRow, todayLocal: string): BriefPayload {
  const propertyName = property.property_name ?? "your home";
  const briefText = `Quiet morning at ${propertyName}. No items need your attention today. ` +
    `We will keep watching and let you know the moment something changes.`;
  return {
    brief_html: `<p>${briefText}</p>`,
    why_it_matters_html: null,
    source_signals: [{ type: "calm_day", date: todayLocal }],
    ai_model: "templated_calm_day",
  };
}

// Build a tight signal summary for the AI. Trimmed to MAX_INPUT_TOKENS.
function summarizeSignalsForAI(signals: Signal[]): string {
  const lines: string[] = [];
  for (const s of signals) {
    switch (s.type) {
      case "recurring_service_due": {
        const days = s.days_overdue as number;
        const status = days > 0 ? `${days} days overdue` : "due today";
        lines.push(`Recurring service "${s.service_name}" (${s.category}) is ${status}.`);
        break;
      }
      case "system_approaching_eol":
        lines.push(
          `${s.system_type} (${s.unit_make ?? "unknown brand"}) is approaching end of life in ${s.expected_eol_year}.`,
        );
        break;
      case "capital_plan_current_year":
        lines.push(`Capital plan project "${s.project_name}" (${s.phase}) is on the calendar this year.`);
        break;
      case "recent_project_update":
        lines.push(`A new project update was posted: "${s.title}".`);
        break;
      default:
        lines.push(`Signal: ${JSON.stringify(s)}`);
    }
  }
  return truncateToTokens(lines.join("\n"), MAX_INPUT_TOKENS);
}

// AI call wrapped in a 30 s timeout. Falls back to templated brief on error
// or timeout — Master Spec 5.8 rule 4 (failed generations don't retry).
async function generateBriefWithAI(
  property: PropertyRow,
  signals: Signal[],
  todayLocal: string,
): Promise<BriefPayload> {
  const propertyName = property.property_name ?? "the property";
  const signalSummary = summarizeSignalsForAI(signals);

  const system = `You are HBC Concierge writing the daily brief for a homeowner.
Write in HBC voice: warm, direct, locally grounded, expert-neighbor tone.

Hard rules:
- Never use em-dashes (no "—" character, no "--" pair).
- Never use phrases like "saves money", "save money", or salesy language.
- No corporate jargon. No second-person scolding.
- Lead with the most actionable signal.
- 2 to 4 sentences for the brief. End with one suggested next step.
- 1 to 2 sentences for "why it matters now".

Return JSON only:
{ "brief_html": "<p>...</p>", "why_it_matters_html": "<p>...</p>", "suggested_action": "..." }`;

  const userPrompt = `Property: ${propertyName}
Date: ${todayLocal}

Signals from the home this morning:
${signalSummary}

Write the brief now.`;

  const aiPromise = callAI({
    system,
    prompt: userPrompt,
    model: "gemini-flash-latest",
    json: true,
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    temperature: 0.4,
  });

  // Race the AI against a 30 s timeout. Whichever finishes first wins.
  const timeoutPromise = new Promise<string>((_, reject) =>
    setTimeout(() => reject(new Error("AI timeout after 30s")), AI_TIMEOUT_MS),
  );

  let raw: string;
  try {
    raw = await Promise.race([aiPromise, timeoutPromise]);
  } catch (err) {
    console.error(`daily-brief-cron: AI failed for property ${property.id}:`, err);
    return buildCalmDayBrief(property, todayLocal);
  }

  try {
    const parsed = parseJSON<{
      brief_html?: string;
      why_it_matters_html?: string;
      suggested_action?: string;
    }>(raw);

    const brief_html = scrubEmDashes(parsed.brief_html ?? `<p>Quiet morning at ${propertyName}.</p>`);
    const why_it_matters_html = parsed.why_it_matters_html
      ? scrubEmDashes(parsed.why_it_matters_html)
      : null;

    return {
      brief_html,
      why_it_matters_html,
      source_signals: signals,
      ai_model: "gemini-flash-latest",
    };
  } catch (err) {
    console.error(`daily-brief-cron: parse failed for property ${property.id}:`, err);
    return buildCalmDayBrief(property, todayLocal);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Auth: x-supabase-cron-secret header must match the configured secret.
  // verify_jwt is false on this function, so this is the only gate.
  const cronSecret = Deno.env.get("CRON_SECRET");
  const providedSecret = req.headers.get("x-supabase-cron-secret");
  if (!cronSecret || providedSecret !== cronSecret) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: "Edge function misconfigured: missing Supabase env" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const now = new Date();
  const summary = {
    examined: 0,
    eligible_at_5am_local: 0,
    skipped_inactive: 0,
    already_briefed: 0,
    calm_day_writes: 0,
    ai_writes: 0,
    errors: 0,
  };

  try {
    // Pull the candidate property set: any property with a client_user_id
    // and status='active'. Filtering by 5 AM local + activity happens in
    // the loop because timezone math is per-property.
    const { data: properties, error } = await supabase
      .from("properties")
      .select("id, client_user_id, status, property_name, address, metadata")
      .not("client_user_id", "is", null)
      .eq("status", "active");

    if (error) throw error;

    for (const property of (properties ?? []) as PropertyRow[]) {
      summary.examined++;
      if (!property.client_user_id) continue;

      const tz = tzFor(property);
      const localHour = localHourAt(tz, now);
      if (localHour !== 5) continue;
      summary.eligible_at_5am_local++;

      // Activity check (Master Spec 5.8 rule 3).
      const lastActivity = await lastActivityAt(supabase, property.id);
      if (lastActivity) {
        const ageMs = now.getTime() - lastActivity.getTime();
        if (ageMs > ACTIVITY_WINDOW_DAYS * 86_400_000) {
          summary.skipped_inactive++;
          continue;
        }
      } else {
        // No activity recorded at all — skip.
        summary.skipped_inactive++;
        continue;
      }

      const todayLocal = localDateAt(tz, now);

      // Idempotency check (Master Spec 5.8 rule 1).
      const { data: existing } = await supabase
        .from("daily_briefs")
        .select("id")
        .eq("property_id", property.id)
        .eq("brief_date", todayLocal)
        .maybeSingle();
      if (existing) {
        summary.already_briefed++;
        continue;
      }

      try {
        const signals = await collectSignals(supabase, property, todayLocal);

        const brief: BriefPayload = signals.length === 0
          ? buildCalmDayBrief(property, todayLocal)
          : await generateBriefWithAI(property, signals, todayLocal);

        if (brief.ai_model === "templated_calm_day") summary.calm_day_writes++;
        else summary.ai_writes++;

        // Upsert protects against the case where two cron invocations race
        // (shouldn't happen with hourly cron + 5 AM local check, but cheap
        // insurance). The unique constraint on (property_id, brief_date)
        // backs this up.
        const { error: upsertError } = await supabase
          .from("daily_briefs")
          .upsert(
            {
              property_id: property.id,
              client_user_id: property.client_user_id,
              brief_date: todayLocal,
              brief_html: brief.brief_html,
              why_it_matters_html: brief.why_it_matters_html,
              source_signals: brief.source_signals,
              ai_model: brief.ai_model,
              generated_at: new Date().toISOString(),
            },
            { onConflict: "property_id,brief_date" },
          );

        if (upsertError) {
          console.error(`daily-brief-cron: upsert failed for ${property.id}:`, upsertError);
          summary.errors++;
        }
      } catch (err) {
        console.error(`daily-brief-cron: per-property failure ${property.id}:`, err);
        summary.errors++;
      }
    }

    return new Response(JSON.stringify({ ok: true, summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("daily-brief-cron: fatal error:", err);
    return new Response(
      JSON.stringify({ ok: false, error: err instanceof Error ? err.message : "Unknown error", summary }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
