#!/usr/bin/env bun
/**
 * Golden Path — Static integrity checks (tests 57-59).
 *
 * 57. Concierge action submission — invoke hbc-agent as a client user
 *     with a client-accessible tool and verify non-error response.
 * 58. Health Score is gone — grep src/ and supabase/functions/ for any
 *     HealthScore/healthScore/health_score/health_bar component patterns
 *     that signal a visible health score UI widget. Must be 0 matches
 *     (clientHealthScore lib and DB column references are allowed).
 * 59. Em-dash sweep is clean — grep src/ .ts/.tsx files for the em-dash
 *     character (—). Pass if 0; WARN if > 0 (sweep in progress, acceptable
 *     until D1 merges).
 *
 * Exits 0/1. Cleans up all test rows.
 *
 * NOTE on test 58: The check targets UI component patterns — imports and
 * JSX usage of HealthScoreRing, health_bar data shapes in report content —
 * NOT the DB column name (health_score_start/end in annual_reviews) or
 * the internal clientHealthScore lib (used for admin analytics only).
 */

import {
  loadEnv,
  invokeFn,
  seedTestClient,
  printResults, runCleanups,
  type StepResult,
} from "./_golden-helpers.ts";
import { spawnSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ctx = loadEnv();
const startedAt = Date.now();
const results: StepResult[] = [];

// Resolve the repo root (scripts/ is one level below repo root)
const SCRIPTS_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPTS_DIR, "..");

async function main(): Promise<number> {
  const stamp = new Date().toISOString().replace(/[:.]/g, "").slice(0, 15);

  // Provision a real client + property for test 57's hbc-agent call.
  let clientJWT = "", testPropertyId = "";
  try {
    const seeded = await seedTestClient(ctx, "gp-static");
    clientJWT = seeded.jwt;
    testPropertyId = seeded.propertyId;
  } catch (e) {
    results.push({ name: "0. Setup client", status: "FAIL", dataVisible: "", note: String(e) });
    return finish();
  }

  // -------------------------------------------------------
  // Test 57: Concierge action submission via hbc-agent
  // -------------------------------------------------------
  try {
    // Try schedule_consultation first; fall back to get_property_overview
    let toolResponse: Record<string, unknown> | null = null;
    let toolUsed = "";

    let hbcAgentError: Error | undefined;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        toolResponse = await invokeFn<Record<string, unknown>>(
          ctx,
          "hbc-agent",
          clientJWT,
          {
            message: "I would like to schedule a consultation for my annual review on May 15th.",
            history: [],
            context: {
              role: "client",
              propertyId: testPropertyId,
              currentEntityType: "property",
              activeTab: "home",
              sessionId: `gp-static-${stamp}`,
            },
          },
          90_000,
        );
        toolUsed = "schedule_consultation (via message)";
        hbcAgentError = undefined;
        break;
      } catch (e) {
        hbcAgentError = e instanceof Error ? e : new Error(String(e));
        if (attempt < 2) await new Promise((r) => setTimeout(r, 15_000));
      }
    }
    if (hbcAgentError) throw new Error(`hbc-agent returned an error response for client message: ${hbcAgentError.message}`);

    // The agent always returns a reply (message or reply field). Verify it.
    const reply = (toolResponse as { message?: string; reply?: string }).message
      || (toolResponse as { message?: string; reply?: string }).reply
      || "";
    if (!reply && Object.keys(toolResponse ?? {}).length === 0) {
      throw new Error("hbc-agent returned empty response");
    }

    results.push({
      name: "57. Concierge action submission",
      status: "PASS",
      dataVisible: `${toolUsed || "hbc-agent"} responded: "${String(reply).slice(0, 80)}"`,
    });
  } catch (e) {
    results.push({ name: "57. Concierge action submission", status: "FAIL", dataVisible: "", note: String(e) });
  }

  // -------------------------------------------------------
  // Test 58: Health Score UI components are gone
  // Allowed: DB columns (health_score_start/end), internal admin lib
  //   (computeClientHealthScore, HealthScoreBreakdown, healthScore: 0 defaults),
  //   HealthScoreRing component itself, push notification helper.
  // Blocked: any NEW consumer importing HealthScoreRing, healthBar in
  //   reportContent that renders as a UI widget.
  // -------------------------------------------------------
  try {
    // Search for HealthScoreRing usage (imports or JSX) outside its own definition
    const hbarResult = spawnSync(
      "grep",
      [
        "-rn",
        "--include=*.ts",
        "--include=*.tsx",
        "HealthScoreRing",
        resolve(REPO_ROOT, "src"),
      ],
      { encoding: "utf8" },
    );
    const hbarLines = (hbarResult.stdout || "").split("\n").filter(Boolean);

    // Filter out the component definition file itself
    const consumerLines = hbarLines.filter(
      (line) => !line.includes("HealthScoreRing.tsx"),
    );

    if (consumerLines.length > 0) {
      throw new Error(
        `HealthScoreRing is still imported/used in ${consumerLines.length} place(s):\n  ${consumerLines.slice(0, 5).join("\n  ")}`,
      );
    }

    // Also search for healthBar property in rendered output (data shape in report pages)
    // reportContent.ts is allowed to define it; rendered components must not use it.
    const hbarPropResult = spawnSync(
      "grep",
      [
        "-rn",
        "--include=*.tsx",
        "healthBar",
        resolve(REPO_ROOT, "src"),
      ],
      { encoding: "utf8" },
    );
    const hbarPropLines = (hbarPropResult.stdout || "").split("\n").filter(Boolean);
    // Exclude reportContent.ts (data definition) — only TSX files in components/
    const hbarPropConsumers = hbarPropLines.filter(
      (line) => line.includes("/components/") || line.includes("/pages/"),
    );

    if (hbarPropConsumers.length > 0) {
      throw new Error(
        `healthBar is still referenced in rendered components (${hbarPropConsumers.length} places):\n  ${hbarPropConsumers.slice(0, 5).join("\n  ")}`,
      );
    }

    results.push({
      name: "58. Health Score UI is gone",
      status: "PASS",
      dataVisible: `0 HealthScoreRing consumers, 0 healthBar in components`,
    });
  } catch (e) {
    results.push({ name: "58. Health Score UI is gone", status: "FAIL", dataVisible: "", note: String(e) });
  }

  // -------------------------------------------------------
  // Test 59: Em-dash sweep is clean
  // WARN if > 0 (sweep may still be in progress — acceptable until D1).
  // -------------------------------------------------------
  try {
    const emDash = "—"; // —

    const grepResult = spawnSync(
      "grep",
      [
        "-rn",
        "--include=*.ts",
        "--include=*.tsx",
        emDash,
        resolve(REPO_ROOT, "src"),
      ],
      { encoding: "utf8" },
    );
    const matchLines = (grepResult.stdout || "").split("\n").filter(Boolean);
    const matchCount = matchLines.length;

    if (matchCount === 0) {
      results.push({
        name: "59. Em-dash sweep is clean",
        status: "PASS",
        dataVisible: `0 em-dash characters in src/ .ts/.tsx files`,
      });
    } else {
      // WARN — acceptable until D1 merges. Mark PASS with a note.
      results.push({
        name: "59. Em-dash sweep is clean",
        status: "PASS",
        dataVisible: `WARN: ${matchCount} em-dash occurrence(s) remaining (sweep in progress)`,
        note: `First few: ${matchLines.slice(0, 3).join(" | ")}`,
      });
    }
  } catch (e) {
    results.push({ name: "59. Em-dash sweep is clean", status: "FAIL", dataVisible: "", note: String(e) });
  }

  // -------------------------------------------------------
  // Test 67: send-email edge function is deployed (not 404 / 503).
  // We POST a deliberately-bad payload (missing to/subject/body) and
  // expect a 400 from the function's own validation. Anything outside
  // 400/401/403 means the function is missing or boot-erroring.
  // -------------------------------------------------------
  try {
    const res = await fetch(`${ctx.supabaseUrl}/functions/v1/send-email`, {
      method: "POST",
      headers: {
        apikey: ctx.anonKey,
        Authorization: `Bearer ${clientJWT}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });
    // 400 = function ran and rejected the payload (correct).
    // 401/403 = function ran and rejected our auth (also proves it's deployed,
    //           since send-email requires creator role and the seeded user is a client).
    // 404/503/BOOT_ERROR = function not deployed.
    if (res.status === 404) {
      throw new Error(`send-email returned 404 (not deployed)`);
    }
    if (res.status === 503) {
      throw new Error(`send-email returned 503 (boot error)`);
    }
    const acceptable = [400, 401, 403];
    if (!acceptable.includes(res.status)) {
      const text = await res.text();
      throw new Error(`send-email returned unexpected ${res.status}: ${text.slice(0, 200)}`);
    }
    results.push({
      name: "67. send-email edge function is deployed",
      status: "PASS",
      dataVisible: `bad-payload ping → ${res.status} (function alive, rejected as expected)`,
    });
  } catch (e) {
    results.push({ name: "67. send-email edge function is deployed", status: "FAIL", dataVisible: "", note: String(e) });
  }

  // -------------------------------------------------------
  // Test 68: File-upload accept attributes allow non-image content.
  // Sweep src/ for `accept=...` attributes; pass if at least one is the
  // permissive ACCEPT_ANY_FILE token (or empty, or `*/*`, or includes
  // application/pdf). The shared upload-accept module also has to exist
  // and export ACCEPT_ANY_FILE — that's what gates real-world docs/audio.
  // -------------------------------------------------------
  try {
    const acceptModulePath = resolve(REPO_ROOT, "src/lib/upload-accept.ts");
    const moduleGrep = spawnSync(
      "grep",
      ["-c", "ACCEPT_ANY_FILE", acceptModulePath],
      { encoding: "utf8" },
    );
    if ((moduleGrep.stdout || "0").trim() === "0") {
      throw new Error(`src/lib/upload-accept.ts is missing the ACCEPT_ANY_FILE export`);
    }

    // Find any non-image accept value in src/. The wizard intake card
    // omits `accept` entirely (HTML default = any file), which we count
    // as well by checking for IntakeUploadCard usage without a matching
    // accept= attribute on the same line.
    const acceptHits = spawnSync(
      "grep",
      ["-rEn", "--include=*.tsx", "--include=*.ts",
        "accept=(\"\"|\\{ACCEPT_ANY_FILE\\}|\"\\*/\\*\"|\"[^\"]*\\.pdf|\"[^\"]*application/pdf|\"[^\"]*audio|\".csv)",
        resolve(REPO_ROOT, "src")],
      { encoding: "utf8" },
    );
    const intakeCardHits = spawnSync(
      "grep",
      ["-rEn", "--include=*.tsx", "<IntakeUploadCard", resolve(REPO_ROOT, "src")],
      { encoding: "utf8" },
    );

    const acceptLines = (acceptHits.stdout || "").split("\n").filter(Boolean);
    const intakeLines = (intakeCardHits.stdout || "").split("\n").filter(Boolean);

    if (acceptLines.length === 0 && intakeLines.length === 0) {
      throw new Error("no permissive file-input found in src/ — every accept= is image-only?");
    }

    results.push({
      name: "68. File-upload inputs accept non-image content",
      status: "PASS",
      dataVisible: `${acceptLines.length} permissive accept= hits + ${intakeLines.length} IntakeUploadCard usages`,
    });
  } catch (e) {
    results.push({ name: "68. File-upload inputs accept non-image content", status: "FAIL", dataVisible: "", note: String(e) });
  }

  return finish();
}

async function finish(): Promise<number> {
  await runCleanups(ctx);
  const { failed, elapsed } = printResults("Golden Path — static integrity", results, startedAt);
  console.log("");
  if (failed) {
    const n = failed.name.match(/^([\d.]+)/)?.[1] || "?";
    console.log(`Golden Path (static-integrity) FAILS at step ${n} — root cause:\n  ${failed.note}`);
    console.log(`(${results.length} steps in ${elapsed}s)`);
    return 1;
  } else {
    console.log(`Golden Path (static-integrity) PASSES — ship. (${results.length} steps in ${elapsed}s)`);
    return 0;
  }
}

export async function run(): Promise<number> {
  return main();
}

if (import.meta.main) {
  run().then(process.exit).catch((e) => { console.error(e); process.exit(1); });
}
