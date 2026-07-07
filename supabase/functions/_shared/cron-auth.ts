/**
 * Guard for cron-only edge functions.
 *
 * These functions have `verify_jwt = false` in config.toml and use a
 * service-role client to scan across all tenants, so this header check is the
 * only thing standing between them and an anonymous caller dumping or mutating
 * every property's data.
 *
 * A call is accepted as trusted if EITHER:
 *   1. it carries the service-role key as the Bearer token — which is exactly
 *      what Supabase pg_cron / dashboard-scheduled jobs already send (see the
 *      schedule_*_cron migrations), so no DB setting or reschedule is needed; or
 *   2. it carries the shared CRON_SECRET in the x-supabase-cron-secret header
 *      (a convenience for manual/testing invocation; optional).
 *
 * Usage:
 *   const denied = requireCron(req);
 *   if (denied) return denied;
 *
 * `hasValidCronSecret` is exported for functions that are ALSO reachable by an
 * authenticated admin (e.g. a "run now" button), which fall back to requireRole.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-cron-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export function hasValidCronSecret(req: Request): boolean {
  // 1. Service-role key presented as Bearer (what pg_cron already sends).
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const authz = req.headers.get("authorization") ?? "";
  const bearer = authz.startsWith("Bearer ") ? authz.slice(7).trim() : "";
  if (serviceKey && bearer && bearer === serviceKey) return true;

  // 2. Optional explicit shared secret header.
  const cronSecret = Deno.env.get("CRON_SECRET");
  const providedHeader = req.headers.get("x-supabase-cron-secret");
  if (cronSecret && providedHeader === cronSecret) return true;

  return false;
}

export function requireCron(req: Request): Response | null {
  if (hasValidCronSecret(req)) return null;
  return new Response(JSON.stringify({ error: "Forbidden" }), {
    status: 403,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
