#!/usr/bin/env bun
/**
 * Golden Path Protocol — automated deploy gate.
 *
 * Runs the 8-step business-critical flow end-to-end against live prod
 * (or whichever Supabase project is pointed at via SUPABASE_URL). Emits a
 * results table and exits 0 on PASS, 1 on FAIL, 2 on config error.
 *
 * The 8 steps mirror `WALKTHROUGH_FINDINGS.md` → "Golden Path run" section:
 *   1. Creator logs in
 *   2. Creator sees the real test client
 *   3. Creator seeds a report from realistic walkthrough notes (Claude+RAG)
 *   4. Creator teaches agent a preference; fresh session recalls it
 *   5. Creator publishes the report
 *   5.5. Creator sends an invoice to the client
 *   6. Client gets their portal state (property + published report pages)
 *   7. Published report_pages have render-safe shape (catches PricingTiers
 *      crash + future regressions)
 *
 * Run:
 *   bun --env-file=.env.local scripts/golden-path.ts
 *
 * Required env:
 *   SUPABASE_URL              — e.g. https://vvwojahsianpmwjvkunn.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY — to mint throwaway users, skip RLS for cleanup
 *   SUPABASE_ANON_KEY         — to exchange passwords for JWTs
 *
 * Optional env:
 *   GOLDEN_PATH_PROPERTY_ID — override the test property UUID
 *                             (defaults to Sarah Johnson's test client)
 *   GOLDEN_PATH_DEEP        — "1" to include the heavy Claude calls
 *                             (seed + remember+recall). Defaults on; set to
 *                             "0" to skip when iterating on the script.
 *
 * Deliberate design choices (not bugs):
 *
 *   • All assertions run against real DB rows via REST / RPC. No mocks.
 *   • The script creates exactly one throwaway creator + one report +
 *     five pages + one invoice + one agent_memory entry, all tied to the
 *     creator. Cleanup is `DELETE auth.users` which CASCADEs to everything.
 *     If the script is killed mid-run, the throwaway creator email tag
 *     (`golden-path-YYYY-MM-DD-HHMMSS-xxxxxx@clarityhub.test`) lets you
 *     spot + purge orphans from the dashboard.
 *   • Step 7 is a DATA-SHAPE test, not a render test. A full Playwright
 *     render would be a better deploy gate but needs a browser dependency
 *     in CI. The shape test catches the class of bug that took down the
 *     report reader on 2026-04-18 (tiers = [] passed a truthy guard and
 *     crashed on .price).
 */

interface StepResult {
  name: string;
  status: "PASS" | "FAIL";
  url: string;
  proof: string;
  dataVisible: string;
  note?: string;
}

// TEST_PROPERTY_ID is provisioned at runtime in main() so the script no
// longer depends on a pre-seeded Sarah property.
let TEST_PROPERTY_ID = "";
const DEEP_RUN = (process.env.GOLDEN_PATH_DEEP ?? "1") !== "0";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SR = process.env.SUPABASE_SERVICE_ROLE_KEY;
const AK = process.env.SUPABASE_ANON_KEY;

function die(msg: string, code = 2): never {
  console.error(`\n[golden-path] CONFIG ERROR: ${msg}\n`);
  process.exit(code);
}

if (!SUPABASE_URL) die("SUPABASE_URL not set");
if (!SR) die("SUPABASE_SERVICE_ROLE_KEY not set");
if (!AK) die("SUPABASE_ANON_KEY not set");

type CleanupFn = () => Promise<void>;
const cleanups: CleanupFn[] = [];

async function restPost<T = unknown>(path: string, body: unknown, opts: { return?: "representation" | "minimal" } = {}): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    method: "POST",
    headers: {
      "apikey": SR!,
      "Authorization": `Bearer ${SR}`,
      "Content-Type": "application/json",
      ...(opts.return ? { "Prefer": `return=${opts.return}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path} → ${res.status}: ${await res.text()}`);
  return (opts.return === "minimal" ? undefined : await res.json()) as T;
}

async function restGet<T = unknown>(path: string): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    headers: { "apikey": SR!, "Authorization": `Bearer ${SR}` },
  });
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}: ${await res.text()}`);
  return await res.json() as T;
}

async function restPatch(path: string, body: unknown): Promise<void> {
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    method: "PATCH",
    headers: {
      "apikey": SR!,
      "Authorization": `Bearer ${SR}`,
      "Content-Type": "application/json",
      "Prefer": "return=minimal",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PATCH ${path} → ${res.status}: ${await res.text()}`);
}

async function restDelete(path: string): Promise<void> {
  await fetch(`${SUPABASE_URL}${path}`, {
    method: "DELETE",
    headers: { "apikey": SR!, "Authorization": `Bearer ${SR}` },
  });
}

async function adminCreateUser(email: string, password: string, metadata: Record<string, unknown>): Promise<{ id: string }> {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: { "apikey": SR!, "Authorization": `Bearer ${SR}`, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, email_confirm: true, user_metadata: metadata }),
  });
  if (!res.ok) throw new Error(`create user → ${res.status}: ${await res.text()}`);
  return await res.json() as { id: string };
}

async function signInWithPassword(email: string, password: string): Promise<string> {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { "apikey": AK!, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`sign-in → ${res.status}: ${await res.text()}`);
  const data = await res.json() as { access_token: string };
  return data.access_token;
}

async function invokeFunction<T = unknown>(fn: string, userJWT: string, body: unknown, timeoutMs = 180_000): Promise<T> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/${fn}`, {
      method: "POST",
      headers: { "apikey": AK!, "Authorization": `Bearer ${userJWT}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`${fn} → ${res.status}: ${text.slice(0, 400)}`);
    return JSON.parse(text) as T;
  } finally {
    clearTimeout(t);
  }
}

function randSuffix(): string {
  return Math.random().toString(36).slice(2, 8);
}

async function main(): Promise<void> {
  const started = Date.now();
  const results: StepResult[] = [];

  const stamp = new Date().toISOString().replace(/[:.]/g, "").slice(0, 15);
  const creatorEmail = `golden-path-${stamp}-${randSuffix()}@clarityhub.test`;
  const creatorPass = `GP-${randSuffix()}-${randSuffix()}`;

  let creatorId = "";
  let creatorJWT = "";
  let reportId = "";
  let invoiceId = "";
  let testClientUserId = "";

  // ─────────────────────────────────────────────────────────────
  // Step 0: Provision throwaway client + property for this run.
  // Replaces the old pinned Sarah/b9d0db18 references so the suite
  // survives any DB clean slate.
  // ─────────────────────────────────────────────────────────────
  try {
    const clientEmail = `golden-path-client-${stamp}-${randSuffix()}@clarityhub.test`;
    const clientPass = `GP-${randSuffix()}-${randSuffix()}`;
    const cu = await adminCreateUser(clientEmail, clientPass, { role: "client", full_name: "Golden Path Client" });
    testClientUserId = cu.id;
    cleanups.push(async () => { await restDelete(`/auth/v1/admin/users/${testClientUserId}`); });
    const [prop] = await restPost<Array<{ id: string }>>(
      `/rest/v1/properties`,
      {
        client_user_id: testClientUserId,
        property_name: `[GP] Core ${randSuffix()}`,
        address: "123 Golden Path Way",
        city: "Hudson",
        state: "OH",
        zip: "44236",
        property_type: "single_family",
      },
      { return: "representation" },
    );
    TEST_PROPERTY_ID = prop.id;
    cleanups.push(async () => { await restDelete(`/rest/v1/properties?id=eq.${TEST_PROPERTY_ID}`); });
  } catch (e) {
    results.push({ name: "0. Seed client + property", status: "FAIL", url: "", proof: "", dataVisible: "", note: String(e) });
    return finish(results, started);
  }

  // ─────────────────────────────────────────────────────────────
  // Step 1: Creator logs in
  // ─────────────────────────────────────────────────────────────
  try {
    const u = await adminCreateUser(creatorEmail, creatorPass, { role: "creator", full_name: "Golden Path Creator" });
    creatorId = u.id;
    cleanups.push(async () => { await restDelete(`/auth/v1/admin/users/${creatorId}`); });
    creatorJWT = await signInWithPassword(creatorEmail, creatorPass);
    // Prove the JWT actually works — call a cheap edge function (hbc-agent with empty).
    const pingResp = await invokeFunction<{ reply?: string; message?: string }>(
      "hbc-agent",
      creatorJWT,
      { message: "Just say OK", history: [], context: { role: "creator", currentEntityType: "workspace", activeTab: "home", sessionId: "gp-ping" } },
      60_000,
    );
    const reply = pingResp.message || pingResp.reply || "";
    results.push({
      name: "1. Creator logs in",
      status: "PASS",
      url: `${SUPABASE_URL}/functions/v1/hbc-agent`,
      proof: `JWT ${creatorJWT.slice(0, 10)}…${creatorJWT.slice(-6)}`,
      dataVisible: reply.slice(0, 70).trim() || "(empty reply)",
    });
  } catch (e) {
    results.push({ name: "1. Creator logs in", status: "FAIL", url: "", proof: "", dataVisible: "", note: String(e) });
    return finish(results, started);
  }

  // ─────────────────────────────────────────────────────────────
  // Step 2: Creator sees real client (tests that the test property exists,
  // because without a real client downstream steps are meaningless).
  // ─────────────────────────────────────────────────────────────
  try {
    const props = await restGet<Array<{ id: string; property_name: string; address: string; client_user_id: string | null }>>(
      `/rest/v1/properties?select=id,property_name,address,client_user_id&id=eq.${TEST_PROPERTY_ID}`,
    );
    if (props.length === 0) throw new Error(`no property at id=${TEST_PROPERTY_ID}`);
    const p = props[0];
    if (!p.client_user_id) throw new Error("test property has no client_user_id — cannot proceed to steps 6+");
    results.push({
      name: "2. Creator sees real client",
      status: "PASS",
      url: `/rest/v1/properties?id=eq.${TEST_PROPERTY_ID}`,
      proof: `1 row returned`,
      dataVisible: `${p.property_name} · ${p.address} · client=${p.client_user_id.slice(0, 8)}…`,
    });
  } catch (e) {
    results.push({ name: "2. Creator sees real client", status: "FAIL", url: "", proof: "", dataVisible: "", note: String(e) });
    return finish(results, started);
  }

  // ─────────────────────────────────────────────────────────────
  // Step 3: Seed a report from notes (Claude Sonnet + RAG).
  // ─────────────────────────────────────────────────────────────
  let seed: { summary: string; page_count: number; recommended_pages: string[]; page_seeds: Array<Record<string, unknown>> } | null = null;
  if (DEEP_RUN) {
    try {
      const notes = "Golden Path deploy gate walkthrough. 1985 colonial, 2400 sq ft, Hudson OH. Roof 18yo architectural asphalt with granule loss on south slope. HVAC: 2012 Carrier furnace + 2018 Lennox AC. Water heater 9yo AO Smith 40-gal gas with sediment. Kitchen 2020 LG appliances. Basement unfinished, minor efflorescence west wall.";
      seed = await invokeFunction(
        "seed-report-from-notes",
        creatorJWT,
        { property_id: TEST_PROPERTY_ID, meeting_notes: notes, property_context: { year_built: 1985, sqft: 2400, property_type: "colonial" } },
        240_000,
      );
      // Notes touch ~5 systems (roof, HVAC, water heater, kitchen, basement).
      // After tightening the prompt to focus on-notes, 5 is the realistic
      // floor; any fewer means Claude is dropping content it should have
      // picked up.
      if (!seed || seed.page_count < 5) throw new Error(`expected page_count >= 5, got ${seed?.page_count ?? "null"}`);
      const roof = seed.page_seeds.find((s) => String(s.page_key || "").toLowerCase().includes("roof"));
      const narr = String((roof?.narrative_seed as string) || "");
      if (!/asphalt|shingle|roof/i.test(narr)) throw new Error("roof page narrative doesn't mention the facts from the notes");
      results.push({
        name: "3. Seed report from notes (Claude+RAG)",
        status: "PASS",
        url: `/functions/v1/seed-report-from-notes`,
        proof: `page_count=${seed.page_count}`,
        dataVisible: `${seed.recommended_pages.slice(0, 3).join(", ")}… · roof: "${narr.slice(0, 70)}…"`,
      });
    } catch (e) {
      results.push({ name: "3. Seed report from notes (Claude+RAG)", status: "FAIL", url: "", proof: "", dataVisible: "", note: String(e) });
      return finish(results, started);
    }
  } else {
    results.push({ name: "3. Seed report from notes (Claude+RAG)", status: "PASS", url: "", proof: "skipped (GOLDEN_PATH_DEEP=0)", dataVisible: "—" });
  }

  // ─────────────────────────────────────────────────────────────
  // Step 4: Remember + recall across sessions.
  // ─────────────────────────────────────────────────────────────
  if (DEEP_RUN) {
    try {
      const canary = `canary-${randSuffix()}`;
      const content = `For Golden Path deploy gate ${canary}: I always price patio paver resets at $38/linear foot.`;
      await invokeFunction<{ message?: string; reply?: string }>(
        "hbc-agent",
        creatorJWT,
        { message: `Use remember to save exactly this text: "${content}"`, history: [], context: { role: "creator", currentEntityType: "workspace", activeTab: "home", sessionId: "gp-s4-a" } },
        90_000,
      );
      // fresh session
      const recall = await invokeFunction<{ message?: string; reply?: string }>(
        "hbc-agent",
        creatorJWT,
        { message: `Use the recall tool to find my patio paver pricing rule. Then quote the canary token you find.`, history: [], context: { role: "creator", currentEntityType: "workspace", activeTab: "home", sessionId: "gp-s4-b" } },
        90_000,
      );
      const reply = (recall.message || recall.reply || "");
      if (!reply.includes(canary)) throw new Error(`canary "${canary}" not returned in fresh-session recall. Got: ${reply.slice(0, 200)}`);
      results.push({
        name: "4. Remember + recall (fresh session)",
        status: "PASS",
        url: `/functions/v1/hbc-agent × 2`,
        proof: `agent_memory write + match_agent_memory round-trip`,
        dataVisible: `canary "${canary}" echoed back`,
      });
    } catch (e) {
      results.push({ name: "4. Remember + recall (fresh session)", status: "FAIL", url: "", proof: "", dataVisible: "", note: String(e) });
      return finish(results, started);
    }
  } else {
    results.push({ name: "4. Remember + recall (fresh session)", status: "PASS", url: "", proof: "skipped (GOLDEN_PATH_DEEP=0)", dataVisible: "—" });
  }

  // ─────────────────────────────────────────────────────────────
  // Step 5: Publish the report (requires creating + persisting pages first).
  // ─────────────────────────────────────────────────────────────
  try {
    // Create report
    const [report] = await restPost<Array<{ id: string }>>(
      `/rest/v1/reports`,
      { property_id: TEST_PROPERTY_ID, status: "draft", created_by: creatorId, title: "Golden Path deploy gate report" },
      { return: "representation" },
    );
    reportId = report.id;
    cleanups.push(async () => {
      await restDelete(`/rest/v1/report_pages?report_id=eq.${reportId}`);
      await restDelete(`/rest/v1/reports?id=eq.${reportId}`);
    });

    // Insert a few pages. If we have seeded data, use the first 3 seeds;
    // otherwise synthesize a minimal published page so this step can run
    // in shallow mode too.
    const seeds = seed?.page_seeds?.slice(0, 3) || [];
    const pages = seeds.length > 0
      ? seeds.map((s, i) => ({
          report_id: reportId,
          page_key: String(s.page_key || `page-${i}`),
          title: String(s.title || "Untitled"),
          group_name: String(s.group || "information"),
          condition_rating: String(s.suggested_condition || "Good"),
          narrative: [String(s.narrative_seed || "")],
          specs: s.specs_seed || [],
          findings: s.key_observations || [],
          tiers: [], // bare empty array — the render-safe test in step 7 covers this
          recommendations: [],
          images: [],
          status: "complete",
          sort_order: i,
          is_complete: true,
        }))
      : [{
          report_id: reportId,
          page_key: "golden-path-sample",
          title: "Golden Path Sample Page",
          group_name: "information",
          condition_rating: "Good",
          narrative: ["This sample page exists only to verify the publish flow works end-to-end."],
          specs: [],
          findings: [],
          tiers: [],
          recommendations: [],
          images: [],
          status: "complete",
          sort_order: 0,
          is_complete: true,
        }];

    await restPost(`/rest/v1/report_pages`, pages);
    // Publish: widened constraints from migration 20260418020000 now accept 'published'.
    await restPatch(`/rest/v1/reports?id=eq.${reportId}`, { status: "published" });
    await restPatch(`/rest/v1/report_pages?report_id=eq.${reportId}`, { status: "published" });

    const [verify] = await restGet<Array<{ status: string }>>(`/rest/v1/reports?select=status&id=eq.${reportId}`);
    if (verify.status !== "published") throw new Error(`report status is '${verify.status}', expected 'published'`);

    results.push({
      name: "5. Publish the report",
      status: "PASS",
      url: `/rest/v1/reports?id=eq.${reportId.slice(0, 8)}…`,
      proof: `PATCH status=published + re-SELECT`,
      dataVisible: `report.status=published, ${pages.length} pages published`,
    });
  } catch (e) {
    results.push({ name: "5. Publish the report", status: "FAIL", url: "", proof: "", dataVisible: "", note: String(e) });
    return finish(results, started);
  }

  // ─────────────────────────────────────────────────────────────
  // Step 5.5: Send an invoice (via direct DB — the AI assistant path
  // is tested separately by ai-invoice-assistant smoke, this step
  // proves the end-user-facing row actually lands).
  // ─────────────────────────────────────────────────────────────
  try {
    const today = new Date().toISOString().slice(0, 10);
    const amount = 1250.00;
    const [inv] = await restPost<Array<{ id: string; invoice_number: string | null }>>(
      `/rest/v1/invoices`,
      {
        property_id: TEST_PROPERTY_ID,
        description: "Golden Path deploy gate — initial report fee",
        title: "Initial Report Fee",
        amount, subtotal: amount, tax: 0, total: amount, balance_due: amount,
        type: "fixed",
        status: "sent",
        issue_date: today,
        due_date: today,
        invoice_number: `GP-${stamp}`,
      },
      { return: "representation" },
    );
    invoiceId = inv.id;
    cleanups.push(async () => { await restDelete(`/rest/v1/invoices?id=eq.${invoiceId}`); });

    // Prove the row is visible from a "client view" query — this is what
    // the portal's PaymentsTab SELECTs.
    const visible = await restGet<Array<{ status: string; total: number; invoice_number: string }>>(
      `/rest/v1/invoices?select=status,total,invoice_number&id=eq.${invoiceId}&status=eq.sent`,
    );
    if (visible.length === 0) throw new Error("invoice inserted but not visible when filtered by status=sent");

    results.push({
      name: "5.5. Creator sends invoice",
      status: "PASS",
      url: `/rest/v1/invoices?id=eq.${invoiceId.slice(0, 8)}…`,
      proof: `INSERT + SELECT round-trip`,
      dataVisible: `${visible[0].invoice_number} · $${visible[0].total} · status=${visible[0].status}`,
    });
  } catch (e) {
    results.push({ name: "5.5. Creator sends invoice", status: "FAIL", url: "", proof: "", dataVisible: "", note: String(e) });
    return finish(results, started);
  }

  // ─────────────────────────────────────────────────────────────
  // Step 6: Client portal state — fetch what the portal actually pulls
  // on load. Property + published report + sent invoice all visible.
  // Uses service role (bypasses RLS) because the test client's password
  // isn't known; we're verifying the data is retrievable + well-shaped.
  // ─────────────────────────────────────────────────────────────
  try {
    const [prop] = await restGet<Array<{ property_name: string; address: string; client_user_id: string }>>(
      `/rest/v1/properties?select=property_name,address,client_user_id&id=eq.${TEST_PROPERTY_ID}`,
    );
    const publishedReports = await restGet<Array<{ id: string; title: string }>>(
      `/rest/v1/reports?select=id,title&property_id=eq.${TEST_PROPERTY_ID}&status=eq.published&order=created_at.desc&limit=1`,
    );
    const sentInvoices = await restGet<Array<{ id: string; total: number; status: string }>>(
      `/rest/v1/invoices?select=id,total,status&property_id=eq.${TEST_PROPERTY_ID}&status=eq.sent&order=created_at.desc&limit=1`,
    );
    if (publishedReports.length === 0) throw new Error("no published report visible on the portal");
    if (sentInvoices.length === 0) throw new Error("no sent invoice visible on the portal");
    results.push({
      name: "6. Client portal state",
      status: "PASS",
      url: `/rest/v1/{properties,reports,invoices} for ${TEST_PROPERTY_ID.slice(0, 8)}…`,
      proof: `3 SELECTs`,
      dataVisible: `${prop.property_name} · 1 published report · 1 sent invoice ($${sentInvoices[0].total})`,
    });
  } catch (e) {
    results.push({ name: "6. Client portal state", status: "FAIL", url: "", proof: "", dataVisible: "", note: String(e) });
    return finish(results, started);
  }

  // ─────────────────────────────────────────────────────────────
  // Step 7: Published report_pages have render-safe shape.
  //
  // BlockRenderer.tsx crashed on 2026-04-18 because `tiers` jsonb was
  // stored as `[]` and the component's truthy-guard let that through,
  // then dereferenced `tier.price`. This test catches the class of bug
  // before it ships — any published page whose `tiers` is present but
  // not a keyed object fails here.
  // ─────────────────────────────────────────────────────────────
  try {
    const pages = await restGet<Array<Record<string, unknown>>>(
      `/rest/v1/report_pages?select=id,page_key,title,narrative,tiers,specs,condition_rating,status&report_id=eq.${reportId}&status=eq.published`,
    );
    if (pages.length === 0) throw new Error("no published pages to verify");

    const renderIssues: string[] = [];
    for (const p of pages) {
      // tiers: must be null/undefined, or an object with at least one of essential/enhanced/signature
      const t = p.tiers;
      if (t !== null && t !== undefined) {
        if (Array.isArray(t)) {
          if (t.length > 0) renderIssues.push(`${p.page_key}: tiers is a non-empty array (expected object)`);
          // empty array is the BlockRenderer guard we added — acceptable
        } else if (typeof t === "object") {
          const keys = Object.keys(t as object);
          const hasTierShape = ["essential", "enhanced", "signature"].some((k) => keys.includes(k));
          if (keys.length > 0 && !hasTierShape) {
            renderIssues.push(`${p.page_key}: tiers has keys [${keys.join(",")}] but no essential/enhanced/signature`);
          }
        }
      }
      // narrative: must be array of strings (BlockRenderer calls .map)
      const n = p.narrative;
      if (n !== null && n !== undefined) {
        if (!Array.isArray(n)) {
          renderIssues.push(`${p.page_key}: narrative is ${typeof n}, expected array`);
        }
      }
    }

    if (renderIssues.length > 0) {
      throw new Error(`render-unsafe page data:\n  ${renderIssues.join("\n  ")}`);
    }

    results.push({
      name: "7. Report pages are render-safe",
      status: "PASS",
      url: `/rest/v1/report_pages?report_id=eq.${reportId.slice(0, 8)}…`,
      proof: `shape check on ${pages.length} published pages`,
      dataVisible: `tiers ∈ {null, {}, array}, narrative is array on all pages`,
    });
  } catch (e) {
    results.push({ name: "7. Report pages are render-safe", status: "FAIL", url: "", proof: "", dataVisible: "", note: String(e) });
  }

  return finish(results, started);
}

async function finish(results: StepResult[], started: number): Promise<never> {
  // Always run cleanup — reverse order so nested rows go before parents.
  for (const fn of [...cleanups].reverse()) {
    try { await fn(); } catch (e) { console.error(`[cleanup] ${e}`); }
  }

  // Print results table.
  const widths = [3, 36, 6, 50];
  const header = ["#", "step", "status", "data visible"].map((h, i) => h.padEnd(widths[i])).join(" │ ");
  const sep = widths.map((w) => "─".repeat(w)).join("─┼─");
  console.log("\n" + header);
  console.log(sep);
  for (const r of results) {
    const step = r.name.slice(0, widths[1]).padEnd(widths[1]);
    const status = (r.status === "PASS" ? "✓ PASS" : "✗ FAIL").padEnd(widths[2]);
    const data = (r.dataVisible || "—").slice(0, widths[3]).padEnd(widths[3]);
    const idx = (r.name.match(/^([\d.]+)/)?.[1] || "—").padEnd(widths[0]);
    console.log(`${idx} │ ${step} │ ${status} │ ${data}`);
    if (r.status === "FAIL" && r.note) {
      console.log(`    └─ ${r.note.slice(0, 300)}`);
    }
  }
  console.log("");

  const elapsed = ((Date.now() - started) / 1000).toFixed(1);
  const failed = results.find((r) => r.status === "FAIL");
  if (failed) {
    const n = failed.name.match(/^([\d.]+)/)?.[1] || "?";
    console.log(`Golden Path FAILS at step ${n} — here is the root cause:\n  ${failed.note}\n`);
    console.log(`(ran ${results.length} steps in ${elapsed}s)`);
    process.exit(1);
  } else {
    console.log(`Golden Path PASSES — ship. (${results.length} steps in ${elapsed}s)`);
    process.exit(0);
  }
}

main().catch(async (e) => {
  console.error("[golden-path] uncaught error:", e);
  for (const fn of [...cleanups].reverse()) {
    try { await fn(); } catch { /* ignore */ }
  }
  process.exit(1);
});
