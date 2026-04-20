// Cross-role redirect assertions in WebKit.
//
// Each persona tries to access routes that belong to the OTHER personas.
// Asserts the ProtectedRoute wrapper bounces them somewhere safe — NOT that
// they see the other persona's page. Renders-only sweeps miss this class of
// bug (leaky route guards); this script catches it directly.
//
// Expected redirect behavior (from src/App.tsx):
//   creator       /portal/<id> → stays (creators can view portals)
//   creator       /trade       → / → /admin (isTradePartner false)
//   client        /admin       → / → /portal
//   client        /trade       → / → /portal
//   trade_partner /admin       → / → /trade
//   trade_partner /portal/<id> → stays (ProtectedRoute doesn't gate by role)
//
// Bug surface: if any of these lands on the target route (or on /login, or
// on an ErrorBoundary), the guard is broken.
//
//   node scripts/webkit-persona-redirects.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  APP_URL,
  loadEnv,
  launchWebKit,
  loginAs,
  fmtRow,
  header,
} from "./_webkit-helpers.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(fs.readFileSync(path.join(HERE, "_webkit-e2e-manifest.json"), "utf-8"));
const env = loadEnv();

const propertyId = manifest.client.propertyId;

// For each persona, list the route they should NOT end up on AS-IS, plus
// the regex of where they MUST end up after the guard bounces them.
const CASES = [
  { persona: "client", hit: "/admin", mustLandOn: /\/portal/, description: "client hitting /admin redirects to portal" },
  { persona: "client", hit: "/admin/clients", mustLandOn: /\/portal/, description: "client hitting /admin/clients redirects to portal" },
  { persona: "client", hit: "/admin/projects", mustLandOn: /\/portal/, description: "client hitting /admin/projects redirects to portal" },
  { persona: "client", hit: "/trade", mustLandOn: /\/portal/, description: "client hitting /trade redirects to portal" },
  { persona: "client", hit: "/trade/projects", mustLandOn: /\/portal/, description: "client hitting /trade/projects redirects to portal" },

  { persona: "trade", hit: "/admin", mustLandOn: /\/trade/, description: "trade hitting /admin redirects to /trade" },
  { persona: "trade", hit: "/admin/clients", mustLandOn: /\/trade/, description: "trade hitting /admin/clients redirects to /trade" },
  { persona: "trade", hit: "/admin/projects", mustLandOn: /\/trade/, description: "trade hitting /admin/projects redirects to /trade" },

  { persona: "creator", hit: "/trade", mustLandOn: /\/admin/, description: "creator hitting /trade redirects to /admin" },
  { persona: "creator", hit: "/trade/projects", mustLandOn: /\/admin/, description: "creator hitting /trade/projects redirects to /admin" },
];

async function run() {
  const { browser, page } = await launchWebKit();
  const results = [];
  try {
    for (const persona of ["creator", "client", "trade"]) {
      header(`Redirect checks — ${persona}`);
      await loginAs(page, env.serviceRole, manifest[persona].email);
      const ours = CASES.filter((c) => c.persona === persona);
      for (const c of ours) {
        await page.goto(`${APP_URL}${c.hit}`, { waitUntil: "domcontentloaded", timeout: 12_000 });
        await page.waitForTimeout(2500);
        const final = page.url();
        const matched = c.mustLandOn.test(final);
        const landedOnLogin = /\/login/.test(final);
        const hasErrorBoundary = await page.evaluate(() => Array.from(document.querySelectorAll("h1, h2")).some((el) => /Something went wrong/i.test(el.textContent || "")));
        const ok = matched && !landedOnLogin && !hasErrorBoundary;
        const issues = [];
        if (!matched) issues.push(`final url "${final}" did not match ${c.mustLandOn}`);
        if (landedOnLogin) issues.push("bounced to /login");
        if (hasErrorBoundary) issues.push("ErrorBoundary rendered");
        results.push({ persona, hit: c.hit, final, ok, issues, description: c.description });
        console.log(fmtRow({ url: `${persona.padEnd(8)} ${c.hit} → ${final}`, ok, chars: "", issues }));
      }
    }
  } finally {
    await browser.close();
  }

  header("Redirect summary");
  const passed = results.filter((r) => r.ok).length;
  console.log(`  ${passed}/${results.length} PASS`);
  if (passed < results.length) {
    console.log("\n  Failures:");
    for (const r of results) {
      if (!r.ok) console.log(`   [${r.persona}] ${r.description} — ${r.issues.join("; ")}`);
    }
  }

  fs.writeFileSync(
    path.join(HERE, "_webkit-persona-redirects-result.json"),
    JSON.stringify(results, null, 2),
  );
  process.exit(passed < results.length ? 1 : 0);
}

run().catch((err) => {
  console.error("redirect run crashed:", err);
  process.exit(1);
});
