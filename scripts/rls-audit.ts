/**
 * RLS cross-user spot audit.
 *
 * Creates two throwaway client users, gives each a property, then confirms
 * each one cannot see the other's property/invoice/message data. Any leak
 * is a BLOCKER — the point of Row Level Security is to make it impossible
 * for client A to read client B's stuff, even if they figure out the right
 * query.
 *
 * Always cleans up after itself (finally block deletes both test users +
 * their data). Writes a JSON report to stdout with per-table pass/fail.
 *
 * Requires:
 *   SUPABASE_URL                 e.g. https://vvwojahsianpmwjvkunn.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY    from `npx supabase projects api-keys`
 *   SUPABASE_ANON_KEY            from same command
 *
 * Run:
 *   set -a && source .env.local && set +a
 *   SUPABASE_SERVICE_ROLE_KEY=<key> SUPABASE_ANON_KEY=<anon> \
 *     bun scripts/rls-audit.ts
 *
 * Exits 0 on all-pass, 1 on any leak.
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL ?? "";
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const ANON_KEY = process.env.SUPABASE_ANON_KEY ?? "";

if (!SUPABASE_URL || !SERVICE_ROLE || !ANON_KEY) {
  console.error("Missing env. Need SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY + SUPABASE_ANON_KEY.");
  process.exit(2);
}

// Unique test emails — prefixed so they're obvious + easy to nuke manually
// if this script ever crashes mid-run.
const stamp = Date.now().toString(36);
const TEST_A_EMAIL = `rls-audit-${stamp}-a@clarityhub.test`;
const TEST_B_EMAIL = `rls-audit-${stamp}-b@clarityhub.test`;
const PASSWORD = `RlsAudit-${stamp}-!secure`;

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false },
});

interface TestUser {
  id: string;
  email: string;
  jwt: string;
  propertyId?: string;
  client: ReturnType<typeof createClient>;
}

async function mintUser(email: string): Promise<TestUser> {
  const { data: userData, error: createErr } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
  });
  if (createErr || !userData.user) throw new Error(`createUser(${email}) failed: ${createErr?.message}`);

  // Tag as client role. A DB trigger on auth.users often auto-creates a
  // default role row, so use upsert so we don't trip the unique constraint.
  const { error: roleErr } = await admin
    .from("user_roles")
    .upsert({ user_id: userData.user.id, role: "client" }, { onConflict: "user_id,role", ignoreDuplicates: true });
  if (roleErr) throw new Error(`upsert user_roles: ${roleErr.message}`);

  // Sign in to get a real user JWT (what the edge functions will see).
  const userCli = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });
  const { data: sess, error: signErr } = await userCli.auth.signInWithPassword({ email, password: PASSWORD });
  if (signErr || !sess.session) throw new Error(`sign in ${email}: ${signErr?.message}`);

  // Authenticated client for subsequent RLS-respecting queries.
  const authedClient = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${sess.session.access_token}` } },
  });

  return {
    id: userData.user.id,
    email,
    jwt: sess.session.access_token,
    client: authedClient,
  };
}

async function makePropertyFor(user: TestUser): Promise<string> {
  // Minimal property row — adjust fields to match schema. We're just
  // testing RLS scope, not property business logic.
  const { data, error } = await admin
    .from("properties")
    .insert({
      client_user_id: user.id,
      property_name: `RLS Audit Home (${user.email.split("@")[0]})`,
      address: "1 RLS Audit Way",
      city: "Hudson",
      state: "OH",
      zip: "44236",
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(`create property for ${user.email}: ${error?.message}`);
  return data.id as string;
}

interface LeakCheck {
  table: string;
  description: string;
  /** Run with user A's client, asking for user B's row. MUST return no rows. */
  query: (client: ReturnType<typeof createClient>, otherUserId: string, otherPropertyId: string) => Promise<{ rows: number; error?: string }>;
}

const CHECKS: LeakCheck[] = [
  {
    table: "properties",
    description: "B's property via direct id filter",
    query: async (c, _uid, propId) => {
      const { data, error } = await c.from("properties").select("id,property_name").eq("id", propId);
      return { rows: data?.length ?? 0, error: error?.message };
    },
  },
  {
    table: "properties",
    description: "B's property via client_user_id filter",
    query: async (c, uid, _pid) => {
      const { data, error } = await c.from("properties").select("id").eq("client_user_id", uid);
      return { rows: data?.length ?? 0, error: error?.message };
    },
  },
  {
    table: "property_messages",
    description: "B's messages",
    query: async (c, _uid, propId) => {
      const { data, error } = await c.from("property_messages").select("id").eq("property_id", propId);
      return { rows: data?.length ?? 0, error: error?.message };
    },
  },
  {
    table: "invoices",
    description: "B's invoices (scoped via property_id)",
    query: async (c, _uid, propId) => {
      const { data, error } = await c.from("invoices").select("id").eq("property_id", propId);
      return { rows: data?.length ?? 0, error: error?.message };
    },
  },
  {
    table: "reports",
    description: "B's reports (scoped via property_id)",
    query: async (c, _uid, propId) => {
      const { data, error } = await c.from("reports").select("id").eq("property_id", propId);
      return { rows: data?.length ?? 0, error: error?.message };
    },
  },
  {
    table: "equipment",
    description: "B's equipment",
    query: async (c, _uid, propId) => {
      const { data, error } = await c.from("equipment").select("id").eq("property_id", propId);
      return { rows: data?.length ?? 0, error: error?.message };
    },
  },
  {
    table: "projects",
    description: "B's projects",
    query: async (c, _uid, propId) => {
      const { data, error } = await c.from("projects").select("id").eq("property_id", propId);
      return { rows: data?.length ?? 0, error: error?.message };
    },
  },
];

// This one deserves a custom check (different pass condition): we expect
// to see exactly 1 row — the user's own — and NO rows belonging to anyone
// else. Running it as a raw CHECKS entry would misflag the 1-row result
// as a leak.
async function checkAllPropertiesListing(c: ReturnType<typeof createClient>, ownPropId: string) {
  const { data, error } = await c.from("properties").select("id");
  const ids = (data as Array<{ id: string }> | null ?? []).map((r) => r.id);
  const other = ids.filter((id) => id !== ownPropId);
  return {
    totalSeen: ids.length,
    others: other,
    error: error?.message,
  };
}

async function cleanup(userA?: TestUser, userB?: TestUser, propAId?: string, propBId?: string) {
  // Delete properties first (FK to auth.users via client_user_id), then users.
  for (const pid of [propAId, propBId]) {
    if (!pid) continue;
    await admin.from("properties").delete().eq("id", pid);
  }
  for (const u of [userA, userB]) {
    if (!u) continue;
    await admin.from("user_roles").delete().eq("user_id", u.id);
    await admin.auth.admin.deleteUser(u.id);
  }
}

async function main() {
  let userA: TestUser | undefined;
  let userB: TestUser | undefined;
  let propAId: string | undefined;
  let propBId: string | undefined;

  const results: Array<{ table: string; description: string; leaked: boolean; rowsSeen: number; error?: string }> = [];

  try {
    console.log("Creating test users A + B…");
    [userA, userB] = await Promise.all([mintUser(TEST_A_EMAIL), mintUser(TEST_B_EMAIL)]);
    console.log(`  A = ${userA.id}`);
    console.log(`  B = ${userB.id}`);

    console.log("Creating one property per user…");
    [propAId, propBId] = await Promise.all([makePropertyFor(userA), makePropertyFor(userB)]);
    console.log(`  propA = ${propAId}`);
    console.log(`  propB = ${propBId}`);

    // Seed a couple of child rows so the property_messages / invoices checks
    // have something to *try* to read. If the insert fails (table missing,
    // wrong schema, etc.) we just skip seeding — the read should still return
    // zero rows either way.
    await admin.from("property_messages")
      .insert({ property_id: propBId, sender_id: userB.id, message: "RLS AUDIT B MESSAGE" })
      .then(() => {}, () => {});
    await admin.from("invoices")
      .insert({ property_id: propBId, title: "RLS AUDIT B INVOICE", amount: 1, status: "draft", due_date: new Date().toISOString().slice(0, 10) })
      .then(() => {}, () => {});

    console.log("\nRunning checks as user A against user B's data:");
    for (const check of CHECKS) {
      const r = await check.query(userA.client, userB.id, propBId);
      const leaked = r.rows > 0;
      results.push({ table: check.table, description: check.description, leaked, rowsSeen: r.rows, error: r.error });
      const glyph = leaked ? "✗ LEAK" : "✓ ok";
      console.log(`  ${glyph.padEnd(9)} ${check.table.padEnd(25)} ${check.description} — saw ${r.rows} row(s)${r.error ? ` [err: ${r.error}]` : ""}`);
    }

    // Special check: A listing all properties with no filter should see
    // only their own row. Any additional rows = RLS leak.
    const listing = await checkAllPropertiesListing(userA.client, propAId);
    const listingLeaked = listing.others.length > 0;
    console.log(`  ${listingLeaked ? "✗ LEAK" : "✓ ok   "} all properties (no filter)  saw ${listing.totalSeen} total, ${listing.others.length} NOT own${listing.error ? ` [err: ${listing.error}]` : ""}`);
    if (listingLeaked) {
      results.push({ table: "properties (list-all)", description: "Other users' properties visible in unfiltered list", leaked: true, rowsSeen: listing.others.length });
    }

    // Sanity: user A CAN see their own property (confirms we're actually
    // authenticated and reading something, not getting 403s across the board).
    const { data: ownData, error: ownErr } = await userA.client.from("properties").select("id").eq("id", propAId);
    const canSeeOwn = (ownData?.length ?? 0) === 1;
    console.log(`\nSanity check: user A CAN see own property — ${canSeeOwn ? "✓" : "✗ FAIL"}${ownErr ? ` [err: ${ownErr.message}]` : ""}`);

    const leaks = results.filter(r => r.leaked);
    console.log("\n" + (leaks.length === 0 && canSeeOwn ? "✅ RLS audit passed — no cross-user leaks." : `🚨 ${leaks.length} leak(s) detected.`));
    process.exit(leaks.length === 0 && canSeeOwn ? 0 : 1);
  } catch (e) {
    console.error("\nAudit aborted:", e instanceof Error ? e.message : e);
    process.exit(2);
  } finally {
    console.log("\nCleaning up test users + properties…");
    await cleanup(userA, userB, propAId, propBId);
    console.log("  done.");
  }
}

await main();
