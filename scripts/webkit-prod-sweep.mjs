// WebKit-first cold-start sweep over live prod.
//
// For each persona (creator, client, trade_partner), logs in via magic link
// once on a reused page, then walks every meaningful route the persona is
// supposed to reach. Asserts per route:
//   - no ErrorBoundary splash ("Something went wrong")
//   - no CSP / WebSocket-insecure console violations
//   - not stuck on a <400-char Loading screen
//   - no uncaught page errors
//
// Safari = iOS. Chrome is more forgiving than Safari, so any bug that shows
// here would hit a real iPhone user too. Chrome MCP tests skip this.
//
//   node scripts/webkit-prod-sweep.mjs
//
// Requires: scripts/webkit-e2e-seed.mjs was run first (reads _webkit-e2e-manifest.json).

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  APP_URL,
  loadEnv,
  launchWebKit,
  loginAs,
  assertRouteHealthy,
  fmtRow,
  header,
} from "./_webkit-helpers.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(fs.readFileSync(path.join(HERE, "_webkit-e2e-manifest.json"), "utf-8"));
const env = loadEnv();

const propertyId = manifest.client.propertyId;
const projectId = manifest.trade.projectId;

const ROUTES = {
  creator: [
    "/admin",
    "/admin/analytics",
    "/admin/inbox",
    "/admin/clients",
    "/admin/clients/new",
    "/admin/tasks",
    "/admin/vendors",
    "/admin/goals",
    "/admin/referrals",
    "/admin/automations",
    "/admin/knowledge-base",
    "/admin/help",
    "/admin/settings",
    "/admin/announcements",
    "/admin/calendar",
    "/admin/projects",
    "/admin/projects/new",
    `/admin/projects/${projectId}`,
    "/admin/crm",
    "/admin/crm/pipeline",
    "/admin/annual-reviews",
    "/admin/team",
  ],
  client: [
    "/portal",
    `/portal/${propertyId}`,
    `/portal/${propertyId}/report`,
    `/portal/${propertyId}/projects`,
    `/portal/${propertyId}/payments`,
    `/portal/${propertyId}/equipment`,
    `/portal/${propertyId}/schedule`,
    `/portal/${propertyId}/documents`,
    `/portal/${propertyId}/messages`,
    `/portal/${propertyId}/services`,
  ],
  trade: [
    "/trade",
    "/trade/projects",
    "/trade/tasks",
    "/trade/schedule",
    "/trade/messages",
    "/trade/documents",
    "/trade/bids",
  ],
};

async function sweep() {
  const { browser, page } = await launchWebKit();
  const results = { creator: [], client: [], trade: [] };

  try {
    for (const persona of ["creator", "client", "trade"]) {
      header(`WebKit sweep — persona: ${persona}`);
      await loginAs(page, env.serviceRole, manifest[persona].email);
      for (const route of ROUTES[persona]) {
        const url = `${APP_URL}${route}`;
        const r = await assertRouteHealthy(page, url);
        results[persona].push({ url: route, ...r });
        console.log(fmtRow({ url: route, ...r }));
      }
    }
  } finally {
    await browser.close();
  }

  // Report
  header("Sweep summary");
  let totalPass = 0;
  let totalFail = 0;
  for (const persona of ["creator", "client", "trade"]) {
    const pass = results[persona].filter((r) => r.ok).length;
    const fail = results[persona].length - pass;
    totalPass += pass;
    totalFail += fail;
    console.log(`  ${persona.padEnd(10)} ${pass}/${results[persona].length} PASS${fail ? ` (${fail} FAIL)` : ""}`);
  }
  console.log(`\n  TOTAL   ${totalPass}/${totalPass + totalFail} PASS`);
  if (totalFail > 0) {
    console.log("\n  Failures:");
    for (const persona of ["creator", "client", "trade"]) {
      for (const r of results[persona]) {
        if (!r.ok) console.log(`   [${persona}] ${r.url}: ${r.issues.join("; ")}`);
      }
    }
  }

  fs.writeFileSync(
    path.join(HERE, "_webkit-prod-sweep-result.json"),
    JSON.stringify(results, null, 2),
  );
  process.exit(totalFail > 0 ? 1 : 0);
}

sweep().catch((err) => {
  console.error("sweep crashed:", err);
  process.exit(1);
});
