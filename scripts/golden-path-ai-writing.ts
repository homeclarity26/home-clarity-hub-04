#!/usr/bin/env bun
/**
 * Golden Path — AI writing functions (Claude Sonnet 4.6 tier).
 *
 * Six edge functions were swapped to Claude Sonnet on 2026-04-18.
 * `seed-report-from-notes` is covered by the core Golden Path.
 * This script covers the other five:
 *
 *   1. generate-exec-summary   — cover letter from a set of report pages
 *   2. ai-proposal-kickoff     — structured proposal from a description
 *   3. ai-invoice-assistant    — invoice line items / price suggestions
 *   4. generate-scope          — scope of work for a project
 *   5. generate-annual-review  — year-over-year client review briefing
 *
 * Each is a "does the function return real structured data, not a
 * silent fallback?" test. We send a minimal but realistic payload,
 * check the response shape, and surface the exact failure if any
 * step silently returns empty or malformed output.
 *
 * This is where the next round of pre-existing parseJSON bugs / wrong
 * shape bugs is likely to surface. Each fix is independent and can be
 * deployed separately.
 *
 * Exits 0/1. Cleans up.
 */

import {
  loadEnv, restPost, restGet, restPatch, restDelete,
  adminCreateUser, signIn, invokeFn, randSuffix,
  seedTestClient,
  printResults, runCleanups,
  type StepResult,
} from "./_golden-helpers.ts";

const ctx = loadEnv();
const startedAt = Date.now();
const results: StepResult[] = [];

async function main(): Promise<number> {
  const stamp = new Date().toISOString().replace(/[:.]/g, "").slice(0, 15);
  let creatorId = "", creatorJWT = "";
  let testPropertyId = "", testClientUserId = "";
  let projectId = "", reportId = "", pageId = "";

  try {
    const email = `gp-ai-${stamp}-${randSuffix()}@clarityhub.test`;
    const pw = `GP-${randSuffix()}`;
    creatorId = await adminCreateUser(ctx, email, pw, { role: "creator", full_name: "GP AI Writing" });
    ctx.cleanups.push(async () => { await restDelete(ctx, `/auth/v1/admin/users/${creatorId}`); });
    creatorJWT = await signIn(ctx, email, pw);
    const seeded = await seedTestClient(ctx, "gp-ai");
    testClientUserId = seeded.userId;
    testPropertyId = seeded.propertyId;
  } catch (e) {
    results.push({ name: "0. Setup", status: "FAIL", dataVisible: "", note: String(e) });
    return finish();
  }

  // Step 1: generate-exec-summary (Claude Sonnet, no RAG — pages in = summary out).
  try {
    const pages = [
      { title: "Roof", conditionRating: "Fair", timing: "Within 2 years", narrative: ["18yo architectural asphalt, granule loss on south slope."], recommendations: ["Full replacement"] },
      { title: "HVAC", conditionRating: "Good", timing: "Routine", narrative: ["2012 Carrier furnace + 2018 Lennox AC, both functional."], recommendations: ["Annual tune-up"] },
      { title: "Water Heater", conditionRating: "Fair", timing: "Within 2 years", narrative: ["9yo AO Smith 40-gal gas, sediment buildup."], recommendations: ["Flush + anode check"] },
    ];
    const resp = await invokeFn<{ summary?: string[]; topPriorities?: unknown[]; overallHealthScore?: number }>(
      ctx,
      "generate-exec-summary",
      creatorJWT,
      { pages, propertyName: "Johnson Residence", propertyAddress: "1234 Maple Ridge Drive" },
      180_000,
    );
    if (!Array.isArray(resp.summary) || resp.summary.length === 0) {
      throw new Error(`generate-exec-summary returned no summary paragraphs: ${JSON.stringify(resp).slice(0, 200)}`);
    }
    if (!Array.isArray(resp.topPriorities)) throw new Error("missing topPriorities");
    if (typeof resp.overallHealthScore !== "number") throw new Error("missing overallHealthScore");
    results.push({
      name: "1. generate-exec-summary",
      status: "PASS",
      dataVisible: `${resp.summary.length} paragraphs, ${resp.topPriorities.length} priorities, score=${resp.overallHealthScore}`,
    });
  } catch (e) {
    results.push({ name: "1. generate-exec-summary", status: "FAIL", dataVisible: "", note: String(e) });
  }

  // Step 2: ai-proposal-kickoff
  try {
    const resp = await invokeFn<{ title?: string; lineItems?: unknown[]; scopeSections?: unknown[]; timelinePhases?: unknown[] }>(
      ctx,
      "ai-proposal-kickoff",
      creatorJWT,
      {
        userMessage: "Master bath remodel. Gut and replace everything — tub-to-shower conversion with custom tile, new vanity with quartz top, new flooring, new toilet, new lighting. Mid-range finishes.",
        clientName: "Jim & Mary Johnson",
        propertyAddress: "1234 Maple Ridge Drive",
        sqft: 2400,
        propertyType: "colonial",
      },
      180_000,
    );
    if (!resp.title) throw new Error(`no title in response: ${JSON.stringify(resp).slice(0, 200)}`);
    if (!Array.isArray(resp.lineItems) || resp.lineItems.length === 0) throw new Error("no lineItems");
    if (!Array.isArray(resp.scopeSections)) throw new Error("no scopeSections");
    results.push({
      name: "2. ai-proposal-kickoff",
      status: "PASS",
      dataVisible: `"${resp.title.slice(0, 40)}…" · ${resp.lineItems.length} line items · ${resp.scopeSections.length} scope sections`,
    });
  } catch (e) {
    results.push({ name: "2. ai-proposal-kickoff", status: "FAIL", dataVisible: "", note: String(e) });
  }

  // Step 3: ai-invoice-assistant. Valid tasks: generate_estimate,
  // from_transcript, draft_change_order, invoice_summary, payment_reminder,
  // suggest_price. Using generate_estimate as the representative.
  try {
    const resp = await invokeFn<Record<string, unknown>>(
      ctx,
      "ai-invoice-assistant",
      creatorJWT,
      {
        task: "generate_estimate",
        context: {
          description: "Kitchen backsplash install — 40 sq ft subway tile, labor + materials, mid-grade finish.",
          property_type: "colonial",
          sqft: 2400,
        },
      },
      180_000,
    );
    // Task-specific shapes vary. For generate_estimate Claude returns an
    // object with line items / totals / summary. Assert we got SOMETHING
    // substantive — not an error, not an empty object.
    if ((resp as Record<string, unknown>).error) {
      throw new Error(`error field set: ${String((resp as Record<string, unknown>).error)}`);
    }
    const keys = Object.keys(resp);
    if (keys.length === 0) throw new Error("ai-invoice-assistant returned empty object");
    results.push({
      name: "3. ai-invoice-assistant (generate_estimate)",
      status: "PASS",
      dataVisible: `keys: ${keys.slice(0, 6).join(", ")}`,
    });
  } catch (e) {
    results.push({ name: "3. ai-invoice-assistant (generate_estimate)", status: "FAIL", dataVisible: "", note: String(e) });
  }

  // Step 4: generate-scope — requires a project to attach to.
  try {
    const [project] = await restPost<Array<{ id: string }>>(
      ctx,
      `/rest/v1/projects`,
      {
        property_id: testPropertyId,
        title: `GP Scope Test — ${stamp}`,
        description: "Test scope for Golden Path — kitchen backsplash with subway tile.",
        status: "planned",
      },
    );
    projectId = project.id;
    ctx.cleanups.push(async () => { await restDelete(ctx, `/rest/v1/project_scopes?project_id=eq.${projectId}`); await restDelete(ctx, `/rest/v1/projects?id=eq.${projectId}`); });

    const resp = await invokeFn<{ scope?: Record<string, unknown>; markdown?: string; version_number?: number; ok?: boolean; [k: string]: unknown }>(
      ctx,
      "generate-scope",
      creatorJWT,
      {
        project_id: projectId,
        project_description: "Kitchen backsplash — 40 sq ft subway tile, mid-grade, white grout.",
      },
      180_000,
    );
    // generate-scope returns { scope: {...}, markdown: "...", version_number: N }
    // but the shape varies; check for a populated scope OR a markdown doc.
    const hasScope = resp.scope && typeof resp.scope === "object" && Object.keys(resp.scope as object).length > 0;
    const hasMarkdown = typeof resp.markdown === "string" && resp.markdown.length > 200;
    if (!hasScope && !hasMarkdown) {
      throw new Error(`generate-scope returned empty output: ${JSON.stringify(resp).slice(0, 300)}`);
    }
    results.push({
      name: "4. generate-scope",
      status: "PASS",
      dataVisible: `${hasMarkdown ? `${(resp.markdown as string).length} chars of markdown` : ""}${hasScope ? ` · ${Object.keys(resp.scope as object).length} scope fields` : ""}${resp.version_number ? ` · v${resp.version_number}` : ""}`,
    });
  } catch (e) {
    results.push({ name: "4. generate-scope", status: "FAIL", dataVisible: "", note: String(e) });
  }

  // Step 5: generate-annual-review (Claude, RAG, writes to annual_reviews).
  try {
    const thisYear = new Date().getFullYear();
    const resp = await invokeFn<{ review_id?: string; briefing?: Record<string, unknown>; ok?: boolean; [k: string]: unknown }>(
      ctx,
      "generate-annual-review",
      creatorJWT,
      {
        client_id: testClientUserId,
        review_year: thisYear,
        property_id: testPropertyId,
      },
      240_000,
    );
    // Schedule cleanup of any annual_reviews row that got created for this year
    ctx.cleanups.push(async () => {
      await restDelete(ctx, `/rest/v1/annual_reviews?client_id=eq.${testClientUserId}&review_year=eq.${thisYear}`);
    });
    const hasBriefing = resp.briefing && typeof resp.briefing === "object" && Object.keys(resp.briefing as object).length > 0;
    if (!hasBriefing) throw new Error(`generate-annual-review returned empty briefing: ${JSON.stringify(resp).slice(0, 300)}`);
    results.push({
      name: "5. generate-annual-review",
      status: "PASS",
      dataVisible: `briefing keys: ${Object.keys(resp.briefing as object).slice(0, 6).join(", ")}`,
    });
  } catch (e) {
    results.push({ name: "5. generate-annual-review", status: "FAIL", dataVisible: "", note: String(e) });
  }

  // Step 6: draft-page-narrative (Claude + RAG, uses knowledge_templates).
  try {
    // Create a throwaway report + page so the function has something to write against.
    const [r] = await restPost<Array<{ id: string }>>(
      ctx,
      `/rest/v1/reports`,
      { property_id: testPropertyId, status: "draft", created_by: creatorId, title: `GP Narrative ${stamp}` },
    );
    reportId = r.id;
    const [pg] = await restPost<Array<{ id: string }>>(
      ctx,
      `/rest/v1/report_pages`,
      [{ report_id: reportId, page_key: "roof", title: "Roof", group_name: "exterior", status: "draft", sort_order: 0, is_complete: false }],
    );
    pageId = pg.id;
    ctx.cleanups.push(async () => {
      await restDelete(ctx, `/rest/v1/report_pages?report_id=eq.${reportId}`);
      await restDelete(ctx, `/rest/v1/reports?id=eq.${reportId}`);
    });

    const resp = await invokeFn<{ narrative?: string[]; key_observations?: string[]; [k: string]: unknown }>(
      ctx,
      "draft-page-narrative",
      creatorJWT,
      {
        pageSlug: "roof",
        pageName: "Roof",
        propertyAddress: "1234 Maple Ridge Drive",
        yearBuilt: 1985,
        sqft: 2400,
        bedrooms: 4,
        bathrooms: 2.5,
        propertyType: "colonial",
        relationshipType: "membership",
        clientIntelligenceSummary: "The Johnsons are detail-oriented and want straight talk.",
        clientGoals: ["Refinish basement in 18 months"],
        clientPriorities: ["Roof condition"],
        existingConditionRating: "Fair",
      },
      180_000,
    );
    if (!Array.isArray(resp.narrative) || resp.narrative.length === 0) {
      throw new Error(`draft-page-narrative returned no narrative: ${JSON.stringify(resp).slice(0, 200)}`);
    }
    if (!Array.isArray(resp.key_observations)) throw new Error("missing key_observations");
    results.push({
      name: "6. draft-page-narrative",
      status: "PASS",
      dataVisible: `${resp.narrative.length} paragraphs · ${resp.key_observations.length} observations`,
    });
  } catch (e) {
    results.push({ name: "6. draft-page-narrative", status: "FAIL", dataVisible: "", note: String(e) });
  }

  return finish();
}

async function finish(): Promise<number> {
  await runCleanups(ctx);
  const { failed, elapsed } = printResults("Golden Path — AI writing functions", results, startedAt);
  console.log("");
  if (failed) {
    const n = failed.name.match(/^([\d.]+)/)?.[1] || "?";
    console.log(`Golden Path (AI writing) FAILS at step ${n} — root cause:\n  ${failed.note}`);
    console.log(`(${results.length} steps in ${elapsed}s)`);
    return 1;
  } else {
    console.log(`Golden Path (AI writing) PASSES — ship. (${results.length} steps in ${elapsed}s)`);
    return 0;
  }
}

main()
  .then((code) => process.exit(code))
  .catch(async (e) => {
    console.error("[golden-path-ai-writing] uncaught:", e);
    await runCleanups(ctx);
    process.exit(1);
  });
