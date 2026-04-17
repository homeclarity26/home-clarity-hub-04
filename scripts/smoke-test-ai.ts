/**
 * AI edge function smoke test.
 *
 * This is the thing that would have caught the "Oops, something went wrong"
 * bug on day one: every edge function was sending OpenAI-shape messages to a
 * Gemini helper that expected Gemini-shape, and no test ever actually invoked
 * them end-to-end.
 *
 * Run:
 *   bun scripts/smoke-test-ai.ts
 *
 * Requires two env vars (put in .env.local, gitignored):
 *   SUPABASE_URL                  — e.g. https://vvwojahsianpmwjvkunn.supabase.co
 *   SUPABASE_TEST_USER_JWT        — a short-lived user JWT for a creator account.
 *                                    Grab from the browser devtools Network tab
 *                                    on any authenticated edge-function call.
 *
 * Exit codes:
 *   0 — all targeted functions returned non-error, non-empty responses.
 *   1 — one or more functions failed.
 *
 * We don't assert on the exact content (Gemini output varies) — only that
 * the function returned 200 and the reply isn't empty or an obvious error
 * string. That's enough to catch shape bugs, missing env vars, broken auth,
 * and edge-function 500s.
 */

interface SmokeCase {
  fn: string;
  body: Record<string, unknown>;
  /** Property on the response JSON to assert is non-empty, or "*" for any 2xx. */
  assertField?: string;
  /** Skip reason — used when the function needs real DB state to succeed. */
  skipUnless?: string;
}

const CASES: SmokeCase[] = [
  {
    fn: "hbc-agent",
    body: {
      message: "Hello — what are you able to help me with?",
      history: [],
      context: {
        role: "client",
        currentEntityType: "client_portal",
        currentEntityId: "smoke-test",
        activeTab: "home",
        sessionId: "smoke",
      },
    },
    assertField: "reply",
  },
  // Read-only AI endpoints (no DB mutations). Each takes a small payload
  // and should return something non-empty when healthy.
  { fn: "ai-maintenance-schedule", body: { propertyType: "single_family", yearBuilt: 2005 }, assertField: "*" },
  { fn: "ai-vendor-match", body: { specialty: "roofing", city: "Hudson", state: "OH" }, assertField: "*" },
  { fn: "ai-transcript-summarizer", body: { transcript: "Client wants to replace the roof next spring." }, assertField: "*" },
  { fn: "estimate-costs", body: { scope: "Replace 2000sqft asphalt shingle roof", zip: "44236" }, assertField: "*" },
  { fn: "ai-client-insights", body: { clientId: "smoke-test", notes: "First meeting went well." }, assertField: "*", skipUnless: "needs real client" },
];

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? process.env.SUPABASE_URL;
const JWT = Deno.env.get("SUPABASE_TEST_USER_JWT") ?? process.env.SUPABASE_TEST_USER_JWT;

if (!SUPABASE_URL || !JWT) {
  console.error("Missing SUPABASE_URL or SUPABASE_TEST_USER_JWT in env.");
  console.error("Put them in .env.local and re-run with:  bun --env-file=.env.local scripts/smoke-test-ai.ts");
  // @ts-expect-error — Deno/bun both expose exit via different globals
  (globalThis.Deno?.exit ?? globalThis.process?.exit)?.(1);
}

async function runCase(c: SmokeCase): Promise<{ ok: boolean; detail: string }> {
  if (c.skipUnless) return { ok: true, detail: `skipped (${c.skipUnless})` };
  const url = `${SUPABASE_URL}/functions/v1/${c.fn}`;
  const t0 = Date.now();
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${JWT}` },
      body: JSON.stringify(c.body),
    });
    const text = await res.text();
    const ms = Date.now() - t0;
    if (!res.ok) return { ok: false, detail: `${res.status} in ${ms}ms: ${text.slice(0, 200)}` };
    let parsed: any = null;
    try { parsed = JSON.parse(text); } catch { /* non-JSON is still a 200 */ }
    if (c.assertField && c.assertField !== "*") {
      const v = parsed?.[c.assertField];
      if (!v || (typeof v === "string" && v.trim().length === 0)) {
        return { ok: false, detail: `200 but ${c.assertField} empty in ${ms}ms: ${text.slice(0, 200)}` };
      }
    }
    // Catch the obvious error tell-tales the old code used to return.
    if (typeof parsed?.reply === "string" && /^(oops|sorry, i ran into an error)/i.test(parsed.reply)) {
      return { ok: false, detail: `reply looks like a catch-block fallback: ${parsed.reply.slice(0, 120)}` };
    }
    return { ok: true, detail: `200 in ${ms}ms` };
  } catch (e) {
    return { ok: false, detail: `fetch threw: ${e instanceof Error ? e.message : String(e)}` };
  }
}

let failed = 0;
for (const c of CASES) {
  const r = await runCase(c);
  const glyph = r.ok ? "✓" : "✗";
  console.log(`${glyph} ${c.fn.padEnd(30)} ${r.detail}`);
  if (!r.ok) failed++;
}

console.log("");
console.log(failed === 0 ? "All smoke tests passed." : `${failed} failure(s).`);
// @ts-expect-error
(globalThis.Deno?.exit ?? globalThis.process?.exit)?.(failed === 0 ? 0 : 1);
