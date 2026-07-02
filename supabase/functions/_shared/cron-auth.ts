/**
 * Guard for cron-only edge functions.
 *
 * These functions have `verify_jwt = false` in config.toml and use a
 * service-role client to scan across all tenants, so the cron-secret header
 * is the ONLY thing standing between them and an anonymous caller dumping or
 * mutating every property's data. The pg_cron scheduler (see the
 * schedule_*_cron migrations) sends `x-supabase-cron-secret`; anything else
 * gets 403.
 *
 * Usage:
 *   const denied = requireCron(req);
 *   if (denied) return denied;
 *
 * Returns a 403 Response to short-circuit on failure, or null to proceed.
 * `hasValidCronSecret` is exported for functions that are ALSO reachable by
 * an authenticated admin (e.g. a "run now" button).
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-cron-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export function hasValidCronSecret(req: Request): boolean {
  const cronSecret = Deno.env.get("CRON_SECRET");
  const provided = req.headers.get("x-supabase-cron-secret");
  return Boolean(cronSecret) && provided === cronSecret;
}

export function requireCron(req: Request): Response | null {
  if (hasValidCronSecret(req)) return null;
  return new Response(JSON.stringify({ error: "Forbidden" }), {
    status: 403,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
