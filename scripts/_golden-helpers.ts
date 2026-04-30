// Shared helpers for Golden Path scripts.
// Keeps each flow-specific script short + focused.

export interface StepResult {
  name: string;
  status: "PASS" | "FAIL";
  dataVisible: string;
  note?: string;
}

export interface GoldenContext {
  supabaseUrl: string;
  serviceRoleKey: string;
  anonKey: string;
  cleanups: Array<() => Promise<void>>;
}

export function loadEnv(): GoldenContext {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl) throw new Error("SUPABASE_URL not set");
  if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY not set");
  if (!anonKey) throw new Error("SUPABASE_ANON_KEY not set");
  return { supabaseUrl, serviceRoleKey, anonKey, cleanups: [] };
}

export async function restPost<T = unknown>(
  ctx: GoldenContext,
  path: string,
  body: unknown,
  returnRepr = true,
  authJWT?: string,
): Promise<T> {
  const headers: Record<string, string> = {
    "apikey": ctx.anonKey,
    "Authorization": `Bearer ${authJWT || ctx.serviceRoleKey}`,
    "Content-Type": "application/json",
  };
  if (returnRepr) headers["Prefer"] = "return=representation";
  else headers["Prefer"] = "return=minimal";
  const res = await fetch(`${ctx.supabaseUrl}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path} → ${res.status}: ${await res.text()}`);
  return (returnRepr ? await res.json() : undefined) as T;
}

export async function restGet<T = unknown>(
  ctx: GoldenContext,
  path: string,
  authJWT?: string,
): Promise<T> {
  const res = await fetch(`${ctx.supabaseUrl}${path}`, {
    headers: {
      "apikey": ctx.anonKey,
      "Authorization": `Bearer ${authJWT || ctx.serviceRoleKey}`,
    },
  });
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}: ${await res.text()}`);
  return await res.json() as T;
}

export async function restPatch(
  ctx: GoldenContext,
  path: string,
  body: unknown,
  authJWT?: string,
): Promise<void> {
  const res = await fetch(`${ctx.supabaseUrl}${path}`, {
    method: "PATCH",
    headers: {
      "apikey": ctx.anonKey,
      "Authorization": `Bearer ${authJWT || ctx.serviceRoleKey}`,
      "Content-Type": "application/json",
      "Prefer": "return=minimal",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PATCH ${path} → ${res.status}: ${await res.text()}`);
}

export async function restDelete(ctx: GoldenContext, path: string): Promise<void> {
  await fetch(`${ctx.supabaseUrl}${path}`, {
    method: "DELETE",
    headers: { "apikey": ctx.serviceRoleKey, "Authorization": `Bearer ${ctx.serviceRoleKey}` },
  });
}

export async function adminCreateUser(
  ctx: GoldenContext,
  email: string,
  password: string,
  metadata: Record<string, unknown>,
): Promise<string> {
  const res = await fetch(`${ctx.supabaseUrl}/auth/v1/admin/users`, {
    method: "POST",
    headers: { "apikey": ctx.serviceRoleKey, "Authorization": `Bearer ${ctx.serviceRoleKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, email_confirm: true, user_metadata: metadata }),
  });
  if (!res.ok) throw new Error(`create user → ${res.status}: ${await res.text()}`);
  const u = await res.json() as { id: string };
  return u.id;
}

export async function signIn(
  ctx: GoldenContext,
  email: string,
  password: string,
): Promise<string> {
  const res = await fetch(`${ctx.supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { "apikey": ctx.anonKey, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`sign-in → ${res.status}: ${await res.text()}`);
  const d = await res.json() as { access_token: string };
  return d.access_token;
}

export async function invokeFn<T = unknown>(
  ctx: GoldenContext,
  fn: string,
  userJWT: string,
  body: unknown,
  timeoutMs = 180_000,
): Promise<T> {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await fetch(`${ctx.supabaseUrl}/functions/v1/${fn}`, {
      method: "POST",
      headers: { "apikey": ctx.anonKey, "Authorization": `Bearer ${userJWT}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: ac.signal,
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`${fn} → ${res.status}: ${text.slice(0, 400)}`);
    return JSON.parse(text) as T;
  } finally {
    clearTimeout(t);
  }
}

export function randSuffix(): string {
  return Math.random().toString(36).slice(2, 8);
}

export interface SeededTestClient {
  /** auth.users.id of the throwaway client */
  userId: string;
  email: string;
  password: string;
  /** Signed-in JWT for the client */
  jwt: string;
  /** properties.id of the throwaway property owned by the client */
  propertyId: string;
}

export interface SeedTestClientOptions {
  fullName?: string;
  /** Defaults to "[GP] <prefix> <suffix>" */
  propertyName?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  /** "single_family" by default; the table column accepts free text. */
  propertyType?: string;
}

/**
 * Provision a fresh client + property for a single Golden Path run.
 *
 * Each script that needs a "client side" used to sign in as a pre-seeded
 * Sarah account at id 10ed2749…/property b9d0db18…. That made the suite
 * fragile: a DB clean slate (or anything that purges Sarah) takes down 9
 * jobs at once. This helper makes every flow self-contained — it creates
 * its own user + property, returns the IDs + JWT, and registers cleanups
 * on `ctx.cleanups` so `runCleanups(ctx)` deletes everything at the end.
 *
 * Cleanup order (LIFO via runCleanups): property first, then auth.users.
 * The property delete cascades through FKs to wipe per-test data
 * (reports, messages, schedule_events, etc.) without us having to track
 * each row.
 */
export async function seedTestClient(
  ctx: GoldenContext,
  prefix: string,
  options: SeedTestClientOptions = {},
): Promise<SeededTestClient> {
  const stamp = new Date().toISOString().replace(/[:.]/g, "").slice(0, 15);
  const email = `${prefix}-client-${stamp}-${randSuffix()}@clarityhub.test`;
  const password = `GP-${randSuffix()}-${randSuffix()}`;
  const fullName = options.fullName || `GP ${prefix} Client`;

  const userId = await adminCreateUser(ctx, email, password, {
    role: "client",
    full_name: fullName,
  });
  ctx.cleanups.push(async () => {
    await restDelete(ctx, `/auth/v1/admin/users/${userId}`);
  });

  const jwt = await signIn(ctx, email, password);

  const propertyName = options.propertyName || `[GP] ${prefix} ${randSuffix()}`;
  const [prop] = await restPost<Array<{ id: string }>>(
    ctx,
    "/rest/v1/properties",
    {
      client_user_id: userId,
      property_name: propertyName,
      address: options.address || "123 Golden Path Way",
      city: options.city || "Hudson",
      state: options.state || "OH",
      zip: options.zip || "44236",
      property_type: options.propertyType || "single_family",
    },
    true,
  );
  const propertyId = prop.id;
  ctx.cleanups.push(async () => {
    await restDelete(ctx, `/rest/v1/properties?id=eq.${propertyId}`);
  });

  return { userId, email, password, jwt, propertyId };
}

export function printResults(
  title: string,
  results: StepResult[],
  startedMs: number,
): { failed: StepResult | undefined; elapsed: string } {
  const widths = [6, 40, 8, 48];
  console.log(`\n═══ ${title} ═══`);
  console.log([...["#", "step", "status", "data visible"]].map((h, i) => h.padEnd(widths[i])).join(" │ "));
  console.log(widths.map((w) => "─".repeat(w)).join("─┼─"));
  for (const r of results) {
    const idx = (r.name.match(/^([\d.]+)/)?.[1] || "—").padEnd(widths[0]);
    const step = r.name.slice(0, widths[1]).padEnd(widths[1]);
    const status = (r.status === "PASS" ? "✓ PASS" : "✗ FAIL").padEnd(widths[2]);
    const data = (r.dataVisible || "—").slice(0, widths[3]).padEnd(widths[3]);
    console.log(`${idx} │ ${step} │ ${status} │ ${data}`);
    if (r.status === "FAIL" && r.note) console.log(`       └─ ${r.note.slice(0, 300)}`);
  }
  const elapsed = ((Date.now() - startedMs) / 1000).toFixed(1);
  const failed = results.find((r) => r.status === "FAIL");
  return { failed, elapsed };
}

export async function runCleanups(ctx: GoldenContext): Promise<void> {
  for (const fn of [...ctx.cleanups].reverse()) {
    try { await fn(); } catch (e) { console.error(`[cleanup] ${e}`); }
  }
}
