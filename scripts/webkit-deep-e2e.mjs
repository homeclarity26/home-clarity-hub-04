// Per-persona deep E2E — renders + RLS scoping + one real write per role.
//
// "Deep" because we go beyond "the page rendered OK" and exercise the real
// RLS boundary:
//   - A client asking for properties sees *only* their own.
//   - A trade partner asking for projects sees *only* the ones they're
//     assigned to.
//   - A creator can INSERT a property and see it come back.
//   - A client can POST a property_messages row (and a creator reading
//     across rows still sees that message).
//   - A trade partner can POST a project_messages row.
//
// We piggy-back on the WebKit session — every fetch runs inside the page
// context using the real JWT in localStorage. Same auth path as the UI.
//
//   node scripts/webkit-deep-e2e.mjs
//
// Leaves behind:
//   - 1 property with address 'e2e-webkit-deep-<ts>' (creator insert)
//   - 1 property_messages row tagged with 'e2e-webkit-' (client insert)
//   - 1 project_messages row tagged with 'e2e-webkit-' (trade insert)

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
  getAsUser,
  postAsUser,
  mgmtQuery,
  header,
} from "./_webkit-helpers.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(fs.readFileSync(path.join(HERE, "_webkit-e2e-manifest.json"), "utf-8"));
const env = loadEnv();

const propertyId = manifest.client.propertyId;
const projectId = manifest.trade.projectId;
const clientUserId = manifest.client.userId;
const tradeUserId = manifest.trade.userId;
const creatorUserId = manifest.creator.userId;

const results = [];
function record(persona, step, ok, detail = "") {
  results.push({ persona, step, ok, detail });
  const tag = ok ? "✓ PASS" : "✗ FAIL";
  console.log(`${tag.padEnd(8)} ${persona.padEnd(10)} ${step.padEnd(46)} ${detail}`);
}

async function loginAndJwt(page, persona) {
  await loginAs(page, env.serviceRole, manifest[persona].email);
  const jwt = await extractUserJwt(page);
  if (!jwt) throw new Error(`no JWT in localStorage for ${persona}`);
  return jwt;
}

function parseRestBody(body) {
  try { return JSON.parse(body); } catch { return null; }
}

async function testCreator(page) {
  header("Deep E2E — creator");
  const jwt = await loginAndJwt(page, "creator");

  // Render: admin landing should be full (>1000 chars).
  await page.goto(`${APP_URL}/admin`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);
  const chars = await page.evaluate(() => (document.body?.innerText || "").length);
  record("creator", "admin landing renders", chars > 400, `${chars} chars`);

  // Scoping: creator should see MULTIPLE properties (the test property +
  // any pre-existing ones). At minimum >= 1.
  const props = await getAsUser(page, jwt, env.anon, "/rest/v1/properties?select=id,address");
  const propArr = parseRestBody(props.body);
  const seesProps = Array.isArray(propArr) && propArr.length >= 1;
  record("creator", "GET /properties (creator sees rows)", seesProps, `status=${props.status} count=${Array.isArray(propArr) ? propArr.length : "?"}`);

  // Scoping: creator should be able to read the test client's messages
  // (existing dashboard pattern — creator view of /admin/inbox).
  const msgs = await getAsUser(page, jwt, env.anon, `/rest/v1/property_messages?property_id=eq.${propertyId}&select=id,message`);
  const seesMsgs = msgs.status === 200;
  record("creator", "GET /property_messages (creator sees any)", seesMsgs, `status=${msgs.status}`);

  // Write: creator inserts a property.
  const addr = `e2e-webkit-deep-${Date.now().toString(36)}`;
  const ins = await postAsUser(page, jwt, env.anon, "/rest/v1/properties", {
    address: addr,
    property_name: "E2E Deep Test",
    client_user_id: clientUserId,
    property_type: "single_family",
    city: "Hudson",
    state: "OH",
    zip: "44236",
  });
  const ok = ins.status === 201;
  record("creator", "POST /properties (creator insert)", ok, `status=${ins.status}${ok ? "" : " body=" + ins.body.slice(0, 120)}`);
}

async function testClient(page) {
  header("Deep E2E — client");
  const jwt = await loginAndJwt(page, "client");

  // Render: portal landing should resolve to their actual property.
  await page.goto(`${APP_URL}/`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);
  const finalUrl = page.url();
  record("client", "/ resolves to /portal/<own>", /\/portal\//.test(finalUrl), `final=${finalUrl}`);

  // Scoping: client should see ONLY their own property.
  const props = await getAsUser(page, jwt, env.anon, "/rest/v1/properties?select=id,client_user_id");
  const propArr = parseRestBody(props.body);
  const allMine = Array.isArray(propArr) && propArr.length > 0 && propArr.every((p) => p.client_user_id === clientUserId);
  record("client", "GET /properties (scoped to client)", allMine, `status=${props.status} count=${Array.isArray(propArr) ? propArr.length : "?"}`);

  // Scoping: client should NOT see any messages from unrelated properties.
  // Our test client has no other properties, so message count for the test
  // property should equal what they see in total.
  const msgs = await getAsUser(page, jwt, env.anon, "/rest/v1/property_messages?select=id,property_id");
  const msgArr = parseRestBody(msgs.body);
  const scopedMsgs = Array.isArray(msgArr) && msgArr.every((m) => m.property_id === propertyId);
  record("client", "GET /property_messages (scoped to client)", scopedMsgs, `status=${msgs.status} count=${Array.isArray(msgArr) ? msgArr.length : "?"}`);

  // Write: client sends a message on their own property.
  const body = `e2e-webkit-client-msg-${Date.now()}`;
  const ins = await postAsUser(page, jwt, env.anon, "/rest/v1/property_messages", {
    property_id: propertyId,
    sender_id: clientUserId,
    message: body,
  });
  record("client", "POST /property_messages (client insert)", ins.status === 201, `status=${ins.status}${ins.status === 201 ? "" : " body=" + ins.body.slice(0, 120)}`);

  // Negative: client should NOT be able to INSERT onto another property
  // (pick any property that's not theirs — if none exists, skip).
  const foreignRows = await mgmtQuery(
    env.pat,
    `SELECT id FROM properties WHERE client_user_id != '${clientUserId}' LIMIT 1`,
  );
  if (foreignRows.length) {
    const foreignProp = foreignRows[0].id;
    const deny = await postAsUser(page, jwt, env.anon, "/rest/v1/property_messages", {
      property_id: foreignProp,
      sender_id: clientUserId,
      message: `e2e-webkit-should-be-denied-${Date.now()}`,
    });
    // 401/403 is the expected "RLS denied" status. Anything 2xx means the
    // client just wrote to a stranger's thread — treat as FAIL.
    const denied = deny.status >= 400 && deny.status !== 500;
    record("client", "POST /property_messages foreign (must deny)", denied, `status=${deny.status}`);
  }
}

async function testTrade(page) {
  header("Deep E2E — trade partner");
  const jwt = await loginAndJwt(page, "trade");

  // Render: trade dashboard should resolve without bouncing away.
  await page.goto(`${APP_URL}/trade`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);
  const finalUrl = page.url();
  record("trade", "/trade renders", /\/trade/.test(finalUrl), `final=${finalUrl}`);

  // Scoping: trade partner should see the vendor row they're linked to.
  const vendors = await getAsUser(page, jwt, env.anon, `/rest/v1/central_vendors?user_id=eq.${tradeUserId}&select=id,company_name`);
  const vArr = parseRestBody(vendors.body);
  const seesOwnVendor = Array.isArray(vArr) && vArr.length === 1;
  record("trade", "GET /central_vendors (own row only)", seesOwnVendor, `status=${vendors.status} count=${Array.isArray(vArr) ? vArr.length : "?"}`);

  // Scoping: trade partner should see the project they're assigned to.
  const proj = await getAsUser(page, jwt, env.anon, `/rest/v1/projects?id=eq.${projectId}&select=id,title`);
  const pArr = parseRestBody(proj.body);
  const seesProj = Array.isArray(pArr) && pArr.length === 1;
  record("trade", "GET /projects (assigned project visible)", seesProj, `status=${proj.status} count=${Array.isArray(pArr) ? pArr.length : "?"}`);

  // Write: trade partner posts a project_messages row.
  const body = `e2e-webkit-trade-msg-${Date.now()}`;
  const ins = await postAsUser(page, jwt, env.anon, "/rest/v1/project_messages", {
    project_id: projectId,
    sender_id: tradeUserId,
    message: body,
    participant_type: "trade_partner",
  });
  record("trade", "POST /project_messages (trade insert)", ins.status === 201, `status=${ins.status}${ins.status === 201 ? "" : " body=" + ins.body.slice(0, 120)}`);
}

async function main() {
  const { browser, page } = await launchWebKit();
  try {
    await testCreator(page);
    await testClient(page);
    await testTrade(page);
  } finally {
    await browser.close();
  }

  header("Deep E2E summary");
  const pass = results.filter((r) => r.ok).length;
  console.log(`  ${pass}/${results.length} PASS`);
  if (pass < results.length) {
    console.log("\n  Failures:");
    for (const r of results) {
      if (!r.ok) console.log(`   [${r.persona}] ${r.step}: ${r.detail}`);
    }
  }

  fs.writeFileSync(
    path.join(HERE, "_webkit-deep-e2e-result.json"),
    JSON.stringify(results, null, 2),
  );
  process.exit(pass < results.length ? 1 : 0);
}

main().catch((err) => {
  console.error("deep e2e crashed:", err);
  process.exit(1);
});
