// Edge-function smoke over the AI surface of the app.
//
// This hits each function with a realistic body using the seeded creator's
// JWT (auth-on-by-default functions reject the anon key with 401). PASS =
// 2xx or an expected 4xx validation error from an intentionally light
// body. FAIL = 5xx, BOOT_ERROR, or a timeout.
//
// We are NOT trying to exercise the full AI pipeline end-to-end — that's
// what Golden Paths do. This is "did the function boot, did it read its
// secrets, did it survive auth." One-line signal that the bundle deployed.
//
//   node scripts/smoke-agents.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  APP_URL,
  SUPABASE_URL,
  loadEnv,
  launchWebKit,
  loginAs,
  extractUserJwt,
  header,
} from "./_webkit-helpers.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(fs.readFileSync(path.join(HERE, "_webkit-e2e-manifest.json"), "utf-8"));
const env = loadEnv();

const propertyId = manifest.client.propertyId;
const projectId = manifest.trade.projectId;

// Each entry: { name, body, timeoutMs (optional, default 30s) }
// Bump timeout on the slow LLM writers (generate-scope, ai-edit, etc.) —
// Claude Sonnet + Gemini Pro calls routinely take 30–60s.
const CALLS = [
  { name: "hbc-agent", body: { message: "Say hello in one short sentence.", history: [], context: {} } },
  { name: "chat-assistant", body: { messages: [{ role: "user", content: "hi" }], reportContext: {} } },
  { name: "ai-edit", body: { currentContent: "The kitchen is clean.", instruction: "Make it one sentence shorter.", contentType: "text" }, timeoutMs: 60_000 },
  { name: "ai-invoice-assistant", body: { task: "explain", context: { invoice_id: null } } },
  { name: "ai-proposal-kickoff", body: { property_id: propertyId, notes: "quick bathroom remodel" }, timeoutMs: 60_000 },
  { name: "ai-client-insights", body: { property_id: propertyId }, timeoutMs: 60_000 },
  { name: "seed-report-from-notes", body: { property_id: propertyId, meeting_notes: "roof 10 yrs old", photo_descriptions: [], property_context: {} }, timeoutMs: 60_000 },
  { name: "retrieve-similar", body: { query: "roof replacement", property_id: propertyId, limit: 3 } },
  { name: "embed-content", body: { text: "sample text for embedding" } },
  // generate-scope uses Claude Sonnet + RAG retrieval + long output (often
  // 60–120s). Smoke gives it 150s; anything longer is a real issue.
  { name: "generate-scope", body: { project_id: projectId }, timeoutMs: 150_000 },
  { name: "draft-page-narrative", body: { report_page_id: null, property_id: propertyId, page_title: "Roof" } },
  { name: "generate-exec-summary", body: { property_id: propertyId } },
];

async function smokeOne(page, jwt, call) {
  const start = Date.now();
  const timeoutMs = call.timeoutMs ?? 30_000;
  const r = await page.evaluate(async ({ url, jwt, apikey, name, body, timeoutMs }) => {
    const ctl = new AbortController();
    const tid = setTimeout(() => ctl.abort(), timeoutMs);
    try {
      const res = await fetch(`${url}/functions/v1/${name}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwt}`,
          apikey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: ctl.signal,
      });
      const text = await res.text();
      return { status: res.status, body: text.slice(0, 300) };
    } catch (e) {
      return { status: 0, body: e?.name === "AbortError" ? "timeout" : (e?.message || "error") };
    } finally {
      clearTimeout(tid);
    }
  }, { url: SUPABASE_URL, jwt, apikey: env.anon, name: call.name, body: call.body, timeoutMs });
  const elapsed = Date.now() - start;
  return { ...call, ...r, elapsedMs: elapsed };
}

async function main() {
  const { browser, page } = await launchWebKit();
  let jwt;
  try {
    await loginAs(page, env.serviceRole, manifest.creator.email);
    jwt = await extractUserJwt(page);
    if (!jwt) throw new Error("no JWT after login");
  } catch (e) {
    await browser.close();
    throw e;
  }

  const results = [];
  try {
    header(`Edge function smoke (${CALLS.length} functions)`);
    for (const call of CALLS) {
      const r = await smokeOne(page, jwt, call);
      const catastrophic = r.status === 0 || r.status >= 500;
      const pass = !catastrophic; // 4xx is "function booted + validated", fine for smoke.
      const tag = pass ? "✓ PASS" : "✗ FAIL";
      console.log(`${tag.padEnd(8)} ${call.name.padEnd(28)} ${String(r.status).padStart(3)} ${String(r.elapsedMs).padStart(5)}ms ${r.body.replace(/\s+/g, " ").slice(0, 120)}`);
      results.push({ ...r, pass });
    }
  } finally {
    await browser.close();
  }

  header("Smoke summary");
  const pass = results.filter((r) => r.pass).length;
  console.log(`  ${pass}/${results.length} PASS`);
  if (pass < results.length) {
    console.log("\n  Failures:");
    for (const r of results) {
      if (!r.pass) console.log(`   ${r.name} — status=${r.status} body=${r.body.slice(0, 150)}`);
    }
  }

  fs.writeFileSync(
    path.join(HERE, "_smoke-agents-result.json"),
    JSON.stringify(results, null, 2),
  );
  process.exit(pass < results.length ? 1 : 0);
}

main().catch((err) => {
  console.error("smoke crashed:", err);
  process.exit(1);
});
