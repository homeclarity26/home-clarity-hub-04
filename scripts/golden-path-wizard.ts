#!/usr/bin/env bun
/**
 * Golden Path — Wizard + Daily Brief + AI Expand (tests 48-50).
 *
 * 48. 5-step wizard happy path — create property+report via DB inserts,
 *     seed pages via seed-report-from-notes (toc_generation stage), mark
 *     3 pages complete, publish. Verify report.status=published.
 * 49. Daily brief cron creates row — invoke daily-brief-cron and verify
 *     the daily_briefs table gets a row with brief_html + source_signals.
 *     Invoke again; verify idempotency (no second row for same date).
 * 50. AI expand returns longer content — invoke ai-edit with mode=expand,
 *     verify result is longer than input and contains no em-dashes.
 *
 * Exits 0/1. Cleans up all test rows.
 */

import {
  loadEnv, restPost, restGet, restPatch, restDelete,
  adminCreateUser, signIn, invokeFn, randSuffix,
  printResults, runCleanups,
  type StepResult,
} from "./_golden-helpers.ts";

const TEST_PROPERTY_ID = process.env.GOLDEN_PATH_PROPERTY_ID || "b9d0db18-aeec-4298-bebe-534d9809d0b4";
const SARAH_USER_ID = "10ed2749-39cc-4861-b1f8-fc9b53647f82";

const ctx = loadEnv();
const startedAt = Date.now();
const results: StepResult[] = [];

async function main(): Promise<number> {
  const stamp = new Date().toISOString().replace(/[:.]/g, "").slice(0, 15);

  let creatorId = "", creatorJWT = "";
  let reportId = "";

  try {
    const email = `gp-wizard-${stamp}-${randSuffix()}@clarityhub.test`;
    const pw = `GP-${randSuffix()}`;
    creatorId = await adminCreateUser(ctx, email, pw, { role: "creator", full_name: "GP Wizard Creator" });
    ctx.cleanups.push(async () => { await restDelete(ctx, `/auth/v1/admin/users/${creatorId}`); });
    creatorJWT = await signIn(ctx, email, pw);
  } catch (e) {
    results.push({ name: "0. Setup", status: "FAIL", dataVisible: "", note: String(e) });
    return finish();
  }

  // -------------------------------------------------------
  // Test 48: 5-step wizard happy path
  // -------------------------------------------------------
  try {
    // Step 1 of wizard: create report
    const [report] = await restPost<Array<{ id: string }>>(
      ctx,
      `/rest/v1/reports`,
      {
        property_id: TEST_PROPERTY_ID,
        status: "draft",
        created_by: creatorId,
        title: `GP Wizard Test ${stamp}`,
      },
    );
    reportId = report.id;
    ctx.cleanups.push(async () => {
      await restDelete(ctx, `/rest/v1/report_pages?report_id=eq.${reportId}`);
      await restDelete(ctx, `/rest/v1/reports?id=eq.${reportId}`);
    });

    // Step 2: seed via seed-report-from-notes (toc_generation stage)
    const seed = await invokeFn<{
      page_count?: number;
      recommended_pages?: string[];
      page_seeds?: Array<Record<string, unknown>>;
      summary?: string;
    }>(
      ctx,
      "seed-report-from-notes",
      creatorJWT,
      {
        property_id: TEST_PROPERTY_ID,
        meeting_notes: "1985 colonial, Hudson OH. Roof 18yo granule loss. HVAC 2012 furnace. Water heater 9yo sediment. Kitchen 2020 appliances.",
        property_context: { year_built: 1985, sqft: 2400, property_type: "colonial" },
        stage: "toc_generation",
      },
      240_000,
    );

    const pageSeeds = seed.page_seeds || [];
    if (!seed || (seed.page_count ?? 0) < 1) {
      throw new Error(`seed-report-from-notes returned page_count=${seed?.page_count ?? "null"}`);
    }

    // Step 3: insert pages from the seed (up to 5)
    const pagesToInsert = pageSeeds.slice(0, 5).map((s, i) => ({
      report_id: reportId,
      page_key: String(s.page_key || `page-${i}`),
      title: String(s.title || `Page ${i + 1}`),
      group_name: String(s.group || "information"),
      condition_rating: String(s.suggested_condition || "Good"),
      narrative: Array.isArray(s.narrative_seed) ? s.narrative_seed : [String(s.narrative_seed || "")],
      specs: Array.isArray(s.specs_seed) ? s.specs_seed : [],
      findings: Array.isArray(s.key_observations) ? s.key_observations : [],
      tiers: [],
      recommendations: [],
      images: [],
      status: "draft",
      sort_order: i,
      is_complete: false,
    }));

    if (pagesToInsert.length === 0) {
      // Fallback: insert a minimal page
      pagesToInsert.push({
        report_id: reportId,
        page_key: "wizard-test-page",
        title: "Wizard Test Page",
        group_name: "information",
        condition_rating: "Good",
        narrative: ["Wizard test narrative."],
        specs: [],
        findings: [],
        tiers: [],
        recommendations: [],
        images: [],
        status: "draft",
        sort_order: 0,
        is_complete: false,
      });
    }

    await restPost(ctx, `/rest/v1/report_pages`, pagesToInsert);

    // Step 4: mark 3 pages complete
    const allPages = await restGet<Array<{ id: string }>>(
      ctx,
      `/rest/v1/report_pages?select=id&report_id=eq.${reportId}&limit=3`,
    );
    const idsToComplete = allPages.slice(0, 3).map((p) => p.id);
    for (const pid of idsToComplete) {
      await restPatch(ctx, `/rest/v1/report_pages?id=eq.${pid}`, { status: "complete", is_complete: true });
    }

    // Step 5: publish the report
    await restPatch(ctx, `/rest/v1/reports?id=eq.${reportId}`, { status: "published" });
    await restPatch(ctx, `/rest/v1/report_pages?report_id=eq.${reportId}`, { status: "published" });

    // Verify
    const [verified] = await restGet<Array<{ status: string }>>(
      ctx,
      `/rest/v1/reports?select=status&id=eq.${reportId}`,
    );
    if (verified.status !== "published") {
      throw new Error(`report status is '${verified.status}', expected 'published'`);
    }

    const completedPages = await restGet<Array<{ id: string; status: string }>>(
      ctx,
      `/rest/v1/report_pages?select=id,status&report_id=eq.${reportId}&status=eq.published`,
    );

    results.push({
      name: "48. 5-step wizard happy path",
      status: "PASS",
      dataVisible: `report=published, ${pagesToInsert.length} pages seeded, ${completedPages.length} pages published`,
    });
  } catch (e) {
    results.push({ name: "48. 5-step wizard happy path", status: "FAIL", dataVisible: "", note: String(e) });
  }

  // -------------------------------------------------------
  // Test 49: Daily brief cron creates row + idempotent
  // -------------------------------------------------------
  try {
    const today = new Date().toISOString().slice(0, 10);

    // Delete any pre-existing brief for today to get a clean slate
    await restDelete(
      ctx,
      `/rest/v1/daily_briefs?property_id=eq.${TEST_PROPERTY_ID}&client_user_id=eq.${SARAH_USER_ID}&brief_date=eq.${today}`,
    );
    ctx.cleanups.push(async () => {
      await restDelete(
        ctx,
        `/rest/v1/daily_briefs?property_id=eq.${TEST_PROPERTY_ID}&client_user_id=eq.${SARAH_USER_ID}&brief_date=eq.${today}`,
      );
    });

    // First invocation — should create a row
    await invokeFn<Record<string, unknown>>(
      ctx,
      "daily-brief-cron",
      creatorJWT,
      {
        property_id: TEST_PROPERTY_ID,
        client_user_id: SARAH_USER_ID,
        date: today,
      },
      120_000,
    );

    const briefsAfterFirst = await restGet<Array<{ id: string; brief_html: string; source_signals: unknown; brief_date: string }>>(
      ctx,
      `/rest/v1/daily_briefs?select=id,brief_html,source_signals,brief_date&property_id=eq.${TEST_PROPERTY_ID}&client_user_id=eq.${SARAH_USER_ID}&brief_date=eq.${today}`,
    );

    if (briefsAfterFirst.length === 0) {
      throw new Error("daily-brief-cron did not create a daily_briefs row");
    }
    const brief = briefsAfterFirst[0];
    if (!brief.brief_html || brief.brief_html.length < 10) {
      throw new Error(`brief_html is empty or too short: "${brief.brief_html}"`);
    }

    // Verify source_signals is valid JSON (non-null object or array)
    if (brief.source_signals === null || brief.source_signals === undefined) {
      throw new Error("source_signals is null");
    }

    // Second invocation — idempotent (no new row for same date)
    await invokeFn<Record<string, unknown>>(
      ctx,
      "daily-brief-cron",
      creatorJWT,
      {
        property_id: TEST_PROPERTY_ID,
        client_user_id: SARAH_USER_ID,
        date: today,
      },
      120_000,
    );

    const briefsAfterSecond = await restGet<Array<{ id: string }>>(
      ctx,
      `/rest/v1/daily_briefs?select=id&property_id=eq.${TEST_PROPERTY_ID}&client_user_id=eq.${SARAH_USER_ID}&brief_date=eq.${today}`,
    );

    if (briefsAfterSecond.length > 1) {
      throw new Error(`idempotency failed: ${briefsAfterSecond.length} rows after 2 invocations (expected 1)`);
    }

    results.push({
      name: "49. Daily brief cron creates row (idempotent)",
      status: "PASS",
      dataVisible: `brief_html=${brief.brief_html.length} chars, source_signals present, 2nd call idempotent`,
    });
  } catch (e) {
    results.push({ name: "49. Daily brief cron creates row (idempotent)", status: "FAIL", dataVisible: "", note: String(e) });
  }

  // -------------------------------------------------------
  // Test 50: AI expand returns longer content, no em-dashes
  // -------------------------------------------------------
  try {
    const input = "Roof is old.";
    const resp = await invokeFn<{ result?: string; content?: string; output?: string; [k: string]: unknown }>(
      ctx,
      "ai-edit",
      creatorJWT,
      {
        mode: "expand",
        content: input,
        pageTitle: "Roof",
      },
      120_000,
    );

    const result = resp.result || resp.content || resp.output || "";
    if (typeof result !== "string" || result.length === 0) {
      throw new Error(`ai-edit expand returned no result string. Keys: ${Object.keys(resp).join(", ")}`);
    }
    if (result.length <= input.length) {
      throw new Error(`expanded result (${result.length} chars) is not longer than input (${input.length} chars)`);
    }
    if (result.includes("—")) {
      throw new Error(`result contains em-dash character: "${result.slice(0, 200)}"`);
    }

    results.push({
      name: "50. AI expand returns expanded content",
      status: "PASS",
      dataVisible: `input=${input.length} chars, output=${result.length} chars, no em-dashes`,
    });
  } catch (e) {
    results.push({ name: "50. AI expand returns expanded content", status: "FAIL", dataVisible: "", note: String(e) });
  }

  return finish();
}

async function finish(): Promise<number> {
  await runCleanups(ctx);
  const { failed, elapsed } = printResults("Golden Path — wizard + daily brief + ai expand", results, startedAt);
  console.log("");
  if (failed) {
    const n = failed.name.match(/^([\d.]+)/)?.[1] || "?";
    console.log(`Golden Path (wizard) FAILS at step ${n} — root cause:\n  ${failed.note}`);
    console.log(`(${results.length} steps in ${elapsed}s)`);
    return 1;
  } else {
    console.log(`Golden Path (wizard) PASSES — ship. (${results.length} steps in ${elapsed}s)`);
    return 0;
  }
}

export async function run(): Promise<number> {
  return main();
}

if (import.meta.main) {
  run().then(process.exit).catch((e) => { console.error(e); process.exit(1); });
}
