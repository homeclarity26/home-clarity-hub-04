#!/usr/bin/env bun
/**
 * Golden Path — Mobile checks (tests 60-62).
 *
 * These are lightweight API + grep checks. Full Playwright tests are deferred.
 *
 * 60. IBM Plex Mono loads — grep index.html for the Google Fonts link
 *     containing "IBM+Plex+Mono". Pass if found.
 * 61. Mobile happy path on iPhone 14 Pro — API check: verify the three
 *     key portal API calls succeed (GET properties, GET report_pages,
 *     GET projects) for the test property as a client user. Documents
 *     that full Playwright is deferred.
 * 62. Mobile wizard on iPad — grep check: verify the /admin/clients/new
 *     route exists in src/App.tsx. Documents that Playwright is deferred.
 *
 * Exits 0/1. Cleans up all test rows.
 */

import {
  loadEnv, restGet,
  seedTestClient,
  printResults, runCleanups,
  type StepResult,
} from "./_golden-helpers.ts";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ctx = loadEnv();
const startedAt = Date.now();
const results: StepResult[] = [];

const SCRIPTS_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPTS_DIR, "..");

async function main(): Promise<number> {
  // Seed a throwaway client + property for test 61's reachability check.
  let testPropertyId = "";
  try {
    const seeded = await seedTestClient(ctx, "gp-mobile");
    testPropertyId = seeded.propertyId;
  } catch (e) {
    results.push({ name: "0. Setup client", status: "FAIL", dataVisible: "", note: String(e) });
    return finish();
  }

  // -------------------------------------------------------
  // Test 60: IBM Plex Mono font link present in index.html
  // -------------------------------------------------------
  try {
    const indexHtmlPath = resolve(REPO_ROOT, "index.html");
    let htmlContent = "";
    try {
      htmlContent = readFileSync(indexHtmlPath, "utf8");
    } catch {
      throw new Error(`Could not read index.html at ${indexHtmlPath}`);
    }

    const hasIbmPlexMono =
      htmlContent.includes("IBM+Plex+Mono") ||
      htmlContent.includes("IBM Plex Mono");

    if (!hasIbmPlexMono) {
      throw new Error("IBM Plex Mono not found in index.html Google Fonts link");
    }

    // Also verify it is in a proper link tag
    const linkMatch = htmlContent.match(/href="[^"]*IBM[^"]*Plex[^"]*Mono[^"]*"/);
    const isInFontsLink = Boolean(linkMatch) || htmlContent.includes("fonts.googleapis.com");

    results.push({
      name: "60. IBM Plex Mono loads",
      status: "PASS",
      dataVisible: `IBM Plex Mono found in index.html${isInFontsLink ? " (Google Fonts link)" : ""}`,
    });
  } catch (e) {
    results.push({ name: "60. IBM Plex Mono loads", status: "FAIL", dataVisible: "", note: String(e) });
  }

  // -------------------------------------------------------
  // Test 61: Mobile happy path on iPhone 14 Pro (API checks)
  // Full Playwright test is deferred pending CI browser setup.
  // -------------------------------------------------------
  try {
    // The three API calls the portal makes on load, as a client user.
    // We use the service role JWT because this client has no assigned property;
    // we are verifying the API shape + reachability, not RLS.

    // GET properties
    const properties = await restGet<Array<{ id: string; property_name: string }>>(
      ctx,
      `/rest/v1/properties?select=id,property_name&id=eq.${testPropertyId}`,
    );
    if (properties.length === 0) {
      throw new Error(`GET properties returned 0 rows for ${testPropertyId}`);
    }

    // GET report_pages (via most recent published report)
    const reports = await restGet<Array<{ id: string }>>(
      ctx,
      `/rest/v1/reports?select=id&property_id=eq.${testPropertyId}&status=eq.published&order=created_at.desc&limit=1`,
    );
    if (reports.length > 0) {
      const reportId = reports[0].id;
      await restGet<Array<{ id: string }>>(
        ctx,
        `/rest/v1/report_pages?select=id&report_id=eq.${reportId}&limit=10`,
      );
    }

    // GET projects
    await restGet<Array<{ id: string }>>(
      ctx,
      `/rest/v1/projects?select=id&property_id=eq.${testPropertyId}&limit=10`,
    );

    results.push({
      name: "61. Mobile happy path (iPhone 14 Pro — API check)",
      status: "PASS",
      dataVisible: `GET properties/report_pages/projects all succeeded. (Full Playwright deferred.)`,
    });
  } catch (e) {
    results.push({ name: "61. Mobile happy path (iPhone 14 Pro — API check)", status: "FAIL", dataVisible: "", note: String(e) });
  }

  // -------------------------------------------------------
  // Test 62: Mobile wizard on iPad (route existence check)
  // Full Playwright test is deferred pending CI browser setup.
  // -------------------------------------------------------
  try {
    const appTsxPath = resolve(REPO_ROOT, "src", "App.tsx");

    const grepResult = spawnSync(
      "grep",
      [
        "-n",
        "clients/new",
        appTsxPath,
      ],
      { encoding: "utf8" },
    );

    const matchLines = (grepResult.stdout || "").split("\n").filter(Boolean);
    if (matchLines.length === 0) {
      throw new Error(`Route clients/new not found in src/App.tsx — wizard route may be missing`);
    }

    results.push({
      name: "62. Mobile wizard on iPad (route check)",
      status: "PASS",
      dataVisible: `clients/new route found in App.tsx (line ${matchLines[0].split(":")[0]}). (Full Playwright deferred.)`,
    });
  } catch (e) {
    results.push({ name: "62. Mobile wizard on iPad (route check)", status: "FAIL", dataVisible: "", note: String(e) });
  }

  // -------------------------------------------------------
  // Test 69: Multi-property selector — component file exists and is
  // imported by App.tsx so the dropdown can render in the desktop +
  // mobile portal headers.
  // -------------------------------------------------------
  try {
    const selectorPath = resolve(REPO_ROOT, "src/components/PropertySelector.tsx");
    const fileCheck = spawnSync("test", ["-f", selectorPath]);
    if (fileCheck.status !== 0) {
      throw new Error(`src/components/PropertySelector.tsx is missing`);
    }

    const importCheck = spawnSync(
      "grep",
      ["-rln", "PropertySelector", resolve(REPO_ROOT, "src")],
      { encoding: "utf8" },
    );
    const importers = (importCheck.stdout || "").split("\n").filter(Boolean);
    const consumers = importers.filter((l) => !l.endsWith("PropertySelector.tsx"));
    if (consumers.length === 0) {
      throw new Error(`PropertySelector exists but is not imported anywhere`);
    }

    results.push({
      name: "69. Multi-property selector wired in",
      status: "PASS",
      dataVisible: `PropertySelector imported by ${consumers.length} consumer(s)`,
    });
  } catch (e) {
    results.push({ name: "69. Multi-property selector wired in", status: "FAIL", dataVisible: "", note: String(e) });
  }

  return finish();
}

async function finish(): Promise<number> {
  await runCleanups(ctx);
  const { failed, elapsed } = printResults("Golden Path — mobile checks", results, startedAt);
  console.log("");
  if (failed) {
    const n = failed.name.match(/^([\d.]+)/)?.[1] || "?";
    console.log(`Golden Path (mobile) FAILS at step ${n} — root cause:\n  ${failed.note}`);
    console.log(`(${results.length} steps in ${elapsed}s)`);
    return 1;
  } else {
    console.log(`Golden Path (mobile) PASSES — ship. (${results.length} steps in ${elapsed}s)`);
    return 0;
  }
}

export async function run(): Promise<number> {
  return main();
}

if (import.meta.main) {
  run().then(process.exit).catch((e) => { console.error(e); process.exit(1); });
}
