#!/usr/bin/env bun
/**
 * Golden Path — proposal / tier approval → project + invoice.
 *
 * The revenue flow. Client views a report page, clicks "Approve
 * Essential" (or Enhanced / Signature), and that should:
 *   1. Create a project row tied to the property
 *   2. Create an invoice for the tier's price
 *   3. Mark the report_page as having an approved_tier
 *
 * PricingTiers.tsx does all three INSERTs directly from the client
 * browser via supabase-js. That works only if RLS allows.
 *
 * 1. Creator seeds a report page with real tiers on the test property
 * 2. Client approves the Enhanced tier — emulates the button click
 * 3. Project row exists with approved_tier="Enhanced"
 * 4. Invoice row exists with total matching tier price
 * 5. Client portal queries surface both rows (simulates /portal/.../projects + /payments)
 * 6. Cleanup — delete project, invoice, page, report
 *
 * Exits 0/1. Cleans up all test rows.
 */

import {
  loadEnv, restPost, restGet, restPatch, restDelete,
  adminCreateUser, signIn, randSuffix,
  seedTestClient,
  printResults, runCleanups,
  type StepResult,
} from "./_golden-helpers.ts";

const ctx = loadEnv();
const startedAt = Date.now();
const results: StepResult[] = [];

async function main(): Promise<number> {
  const stamp = new Date().toISOString().replace(/[:.]/g, "").slice(0, 15);
  let creatorId = "", creatorJWT = "", clientJWT = "";
  let testPropertyId = "";
  let reportId = "", pageId = "";

  // Setup — creator throwaway + seeded client + property
  try {
    const email = `gp-prop-${stamp}-${randSuffix()}@clarityhub.test`;
    const pw = `GP-${randSuffix()}`;
    creatorId = await adminCreateUser(ctx, email, pw, { role: "creator", full_name: "GP Proposal Creator" });
    ctx.cleanups.push(async () => { await restDelete(ctx, `/auth/v1/admin/users/${creatorId}`); });
    creatorJWT = await signIn(ctx, email, pw);
    const seeded = await seedTestClient(ctx, "gp-prop");
    clientJWT = seeded.jwt;
    testPropertyId = seeded.propertyId;
  } catch (e) {
    results.push({ name: "0. Setup", status: "FAIL", dataVisible: "", note: String(e) });
    return finish();
  }

  // Step 1: Creator seeds a report + page with real tiers
  try {
    const [report] = await restPost<Array<{ id: string }>>(
      ctx,
      `/rest/v1/reports`,
      { property_id: testPropertyId, status: "draft", created_by: creatorId, title: `GP Proposal ${stamp}` },
    );
    reportId = report.id;
    ctx.cleanups.push(async () => {
      await restDelete(ctx, `/rest/v1/report_pages?report_id=eq.${reportId}`);
      await restDelete(ctx, `/rest/v1/reports?id=eq.${reportId}`);
    });

    const tiers = {
      essential: { price: "$8,500", description: "Repair only — patch the south-slope shingles and replace the splash block." },
      enhanced: { price: "$18,500", description: "Full roof replacement, architectural asphalt, 30-year warranty." },
      signature: { price: "$28,500", description: "Full replacement + ice-and-water shield, gutter guards, flashing rebuild." },
    };

    const [page] = await restPost<Array<{ id: string }>>(
      ctx,
      `/rest/v1/report_pages`,
      [{
        report_id: reportId,
        page_key: "roof",
        title: "Roof",
        group_name: "exterior",
        condition_rating: "Fair",
        narrative: ["Roof is 18 years old, architectural asphalt, granule loss on south slope."],
        specs: [],
        findings: ["Granule loss on south slope", "Splash block missing at back corner"],
        tiers,
        recommendations: [],
        images: [],
        status: "published",
        sort_order: 0,
        is_complete: true,
      }],
    );
    pageId = page.id;
    await restPatch(ctx, `/rest/v1/reports?id=eq.${reportId}`, { status: "published" });

    results.push({
      name: "1. Creator seeds published page with tiers",
      status: "PASS",
      dataVisible: `report=${reportId.slice(0, 8)}… page=${pageId.slice(0, 8)}… tiers=[essential,enhanced,signature]`,
    });
  } catch (e) {
    results.push({ name: "1. Creator seeds published page with tiers", status: "FAIL", dataVisible: "", note: String(e) });
    return finish();
  }

  // Step 2: the client approves the Enhanced tier — emulate the PricingTiers
  // button click exactly: two client-side inserts (projects, then invoices).
  let projectId = "", invoiceId = "";
  const APPROVED_TIER = "Enhanced";
  const COST = 18500;
  try {
    const [project] = await restPost<Array<{ id: string }>>(
      ctx,
      `/rest/v1/projects`,
      {
        property_id: testPropertyId,
        report_page_id: pageId,
        title: `Roof — ${APPROVED_TIER}`,
        description: "Full roof replacement, architectural asphalt, 30-year warranty.",
        estimated_cost: COST,
        approved_tier: APPROVED_TIER,
        status: "planned",
      },
      true,
      clientJWT, // ← client auth, NOT service role
    );
    projectId = project.id;
    ctx.cleanups.push(async () => { await restDelete(ctx, `/rest/v1/projects?id=eq.${projectId}`); });

    // Invoice
    const [invoice] = await restPost<Array<{ id: string }>>(
      ctx,
      `/rest/v1/invoices`,
      {
        property_id: testPropertyId,
        description: `Roof — ${APPROVED_TIER} Tier`,
        title: `Roof — ${APPROVED_TIER}`,
        amount: COST, subtotal: COST, tax: 0, total: COST, balance_due: COST,
        type: "project_tier",
        status: "draft",
      },
      true,
      clientJWT, // ← client auth
    );
    invoiceId = invoice.id;
    ctx.cleanups.push(async () => { await restDelete(ctx, `/rest/v1/invoices?id=eq.${invoiceId}`); });

    results.push({
      name: "2. Client approves tier (insert project + invoice)",
      status: "PASS",
      dataVisible: `project=${projectId.slice(0, 8)}… invoice=${invoiceId.slice(0, 8)}… tier=${APPROVED_TIER} cost=$${COST}`,
    });
  } catch (e) {
    results.push({ name: "2. Client approves tier (insert project + invoice)", status: "FAIL", dataVisible: "", note: String(e) });
    return finish();
  }

  // Step 3: Project exists + is tied to the page + has approved_tier
  try {
    const [p] = await restGet<Array<{ approved_tier: string; estimated_cost: number; status: string }>>(
      ctx,
      `/rest/v1/projects?select=approved_tier,estimated_cost,status&id=eq.${projectId}`,
    );
    if (p.approved_tier !== APPROVED_TIER) throw new Error(`approved_tier="${p.approved_tier}", expected "${APPROVED_TIER}"`);
    if (Number(p.estimated_cost) !== COST) throw new Error(`estimated_cost=${p.estimated_cost}, expected ${COST}`);
    results.push({
      name: "3. Project has approved_tier + cost",
      status: "PASS",
      dataVisible: `tier=${p.approved_tier} cost=$${p.estimated_cost} status=${p.status}`,
    });
  } catch (e) {
    results.push({ name: "3. Project has approved_tier + cost", status: "FAIL", dataVisible: "", note: String(e) });
  }

  // Step 4: Invoice exists with the right amount
  try {
    const [inv] = await restGet<Array<{ total: number; status: string }>>(
      ctx,
      `/rest/v1/invoices?select=total,status&id=eq.${invoiceId}`,
    );
    if (Number(inv.total) !== COST) throw new Error(`invoice.total=${inv.total}, expected ${COST}`);
    results.push({
      name: "4. Invoice created with tier price",
      status: "PASS",
      dataVisible: `total=$${inv.total} status=${inv.status}`,
    });
  } catch (e) {
    results.push({ name: "4. Invoice created with tier price", status: "FAIL", dataVisible: "", note: String(e) });
  }

  // Step 5: Both are visible to the client via her own RLS-scoped SELECTs
  try {
    const projs = await restGet<Array<{ id: string }>>(
      ctx,
      `/rest/v1/projects?select=id&property_id=eq.${testPropertyId}`,
      clientJWT,
    );
    const invs = await restGet<Array<{ id: string }>>(
      ctx,
      `/rest/v1/invoices?select=id&property_id=eq.${testPropertyId}`,
      clientJWT,
    );
    if (!projs.find((p) => p.id === projectId)) throw new Error("the client can't see her own newly-approved project");
    if (!invs.find((i) => i.id === invoiceId)) throw new Error("the client can't see her own newly-approved invoice");
    results.push({
      name: "5. Client sees both on portal-query",
      status: "PASS",
      dataVisible: `${projs.length} project(s), ${invs.length} invoice(s) visible to the client`,
    });
  } catch (e) {
    results.push({ name: "5. Client sees both on portal-query", status: "FAIL", dataVisible: "", note: String(e) });
  }

  return finish();
}

async function finish(): Promise<number> {
  await runCleanups(ctx);
  const { failed, elapsed } = printResults("Golden Path — proposal / tier approval", results, startedAt);
  console.log("");
  if (failed) {
    const n = failed.name.match(/^([\d.]+)/)?.[1] || "?";
    console.log(`Golden Path (proposal) FAILS at step ${n} — root cause:\n  ${failed.note}`);
    console.log(`(${results.length} steps in ${elapsed}s)`);
    return 1;
  } else {
    console.log(`Golden Path (proposal) PASSES — ship. (${results.length} steps in ${elapsed}s)`);
    return 0;
  }
}

main()
  .then((code) => process.exit(code))
  .catch(async (e) => {
    console.error("[golden-path-proposal] uncaught:", e);
    await runCleanups(ctx);
    process.exit(1);
  });
