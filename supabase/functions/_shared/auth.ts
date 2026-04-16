/**
 * Shared auth helper for Supabase Edge Functions.
 *
 * Every function that touches a user's data — or that burns paid API credit
 * (Gemini, Rentcast, etc.) — MUST call `requireAuth` or `requireRole` before
 * doing any work. Use `create-client-account` as the canonical example.
 *
 * Usage:
 *
 *   import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 *   import { requireRole, corsHeaders } from "../_shared/auth.ts";
 *
 *   serve(async (req) => {
 *     if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
 *     const auth = await requireRole(req, ["creator"]);
 *     if ("error" in auth) return auth.error;
 *     // ...do work with auth.user + auth.supabase (service-role client)
 *   });
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

// Tighten CORS to the known production + preview origins if you want,
// but "*" is acceptable for function calls that require a Bearer token —
// auth happens at the JWT layer, not at origin layer.
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export type AppRole = "creator" | "client" | "trade_partner" | "admin";

interface AuthSuccess {
  user: { id: string; email?: string };
  roles: AppRole[];
  /** Supabase client authenticated AS the caller (respects RLS). */
  userSupabase: ReturnType<typeof createClient>;
  /** Service-role client — USE SPARINGLY, only after you've validated permissions. */
  adminSupabase: ReturnType<typeof createClient>;
}

interface AuthFailure {
  error: Response;
}

export async function requireAuth(req: Request): Promise<AuthSuccess | AuthFailure> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return {
      error: new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      ),
    };
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return {
      error: new Response(
        JSON.stringify({ error: "Edge function misconfigured: missing Supabase env" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      ),
    };
  }

  // User-scoped client — respects RLS, verifies the JWT
  const userSupabase = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userData, error: userErr } = await userSupabase.auth.getUser();
  if (userErr || !userData?.user) {
    return {
      error: new Response(
        JSON.stringify({ error: "Invalid or expired session" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      ),
    };
  }

  const user = userData.user;

  // Admin client — bypasses RLS. Only used after auth above succeeds.
  const adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  // Look up roles
  const { data: roleRows, error: roleErr } = await adminSupabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  if (roleErr) {
    return {
      error: new Response(
        JSON.stringify({ error: "Failed to load roles" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      ),
    };
  }

  const roles = ((roleRows ?? []).map((r: { role: string }) => r.role) as AppRole[]);

  return {
    user: { id: user.id, email: user.email },
    roles,
    userSupabase,
    adminSupabase,
  };
}

export async function requireRole(
  req: Request,
  allowed: AppRole[],
): Promise<AuthSuccess | AuthFailure> {
  const result = await requireAuth(req);
  if ("error" in result) return result;
  const hasAllowedRole = result.roles.some((r) => allowed.includes(r));
  if (!hasAllowedRole) {
    return {
      error: new Response(
        JSON.stringify({ error: "Forbidden: missing required role" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      ),
    };
  }
  return result;
}

/** Property-scoped auth: caller must have access to `propertyId`. */
export async function requirePropertyAccess(
  req: Request,
  propertyId: string,
): Promise<AuthSuccess | AuthFailure> {
  const result = await requireAuth(req);
  if ("error" in result) return result;

  // Creators have global access
  if (result.roles.includes("creator")) return result;

  // Otherwise they must own it as a client
  const { data, error } = await result.adminSupabase
    .from("properties")
    .select("id")
    .eq("id", propertyId)
    .eq("client_user_id", result.user.id)
    .maybeSingle();

  if (error || !data) {
    return {
      error: new Response(
        JSON.stringify({ error: "Forbidden: no access to property" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      ),
    };
  }
  return result;
}

/** Small helper for JSON responses with the correct CORS headers. */
export function json(body: unknown, init?: { status?: number }) {
  return new Response(JSON.stringify(body), {
    status: init?.status ?? 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
