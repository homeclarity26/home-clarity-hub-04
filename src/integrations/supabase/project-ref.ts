// Supabase project-ref guard.
//
// This file is the single source of truth for which Supabase project this app
// is allowed to talk to. It exists because a previous bot commit silently
// repointed the client at a different project (see commit 1ffa73d,
// "fix: recover correct Supabase project"). To keep that from reoccurring,
// every place that wires up a Supabase client — the browser client, the
// Golden Path CI scripts, and the pre-build validator — imports from here
// and fails loudly on mismatch.
//
// If you are legitimately migrating projects: update APPROVED_PROJECT_REF,
// add the old ref to BLOCKED_PROJECT_REFS, rotate keys, and land it in a
// single reviewed commit.

export const APPROVED_PROJECT_REF = "vvwojahsianpmwjvkunn";

// Refs that previously caused drift. Anything in this list fails hard even
// if someone later tries to promote it to "approved" without updating the
// constant above.
export const BLOCKED_PROJECT_REFS: readonly string[] = [
  "abarpsxwglxuessimrkk",
];

export const APPROVED_SUPABASE_URL = `https://${APPROVED_PROJECT_REF}.supabase.co`;

export interface SupabaseConfigInput {
  url?: string | null;
  // Publishable / anon key. Service-role keys also embed the ref, so the
  // same validator works for server-side scripts.
  key?: string | null;
  // Optional explicit project id (e.g. from supabase/config.toml).
  projectId?: string | null;
}

export interface SupabaseConfigValidationError {
  code:
    | "missing_url"
    | "missing_key"
    | "url_not_supabase"
    | "url_ref_mismatch"
    | "url_ref_blocked"
    | "key_ref_mismatch"
    | "key_ref_blocked"
    | "key_malformed"
    | "project_id_mismatch"
    | "project_id_blocked";
  message: string;
}

const SUPABASE_URL_RE = /^https:\/\/([a-z0-9]+)\.supabase\.co\/?$/i;

export function extractRefFromUrl(url: string): string | null {
  const match = SUPABASE_URL_RE.exec(url.trim());
  return match ? match[1].toLowerCase() : null;
}

// Supabase anon / service-role keys are JWTs whose payload contains the
// project ref as `ref`. We only need the payload, so we decode without
// verifying the signature — drift detection, not auth.
export function extractRefFromKey(key: string): string | null {
  const parts = key.split(".");
  if (parts.length !== 3) return null;
  try {
    // atob is available in both browsers and modern Node (>=16).
    const payloadJson =
      typeof atob === "function"
        ? atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))
        : Buffer.from(parts[1], "base64").toString("utf8");
    const payload = JSON.parse(payloadJson) as { ref?: unknown };
    return typeof payload.ref === "string" ? payload.ref.toLowerCase() : null;
  } catch {
    return null;
  }
}

export function validateSupabaseConfig(
  input: SupabaseConfigInput,
): SupabaseConfigValidationError[] {
  const errors: SupabaseConfigValidationError[] = [];
  const approved = APPROVED_PROJECT_REF.toLowerCase();
  const blocked = new Set(BLOCKED_PROJECT_REFS.map((r) => r.toLowerCase()));

  if (!input.url) {
    errors.push({ code: "missing_url", message: "Supabase URL is not set" });
  } else {
    const urlRef = extractRefFromUrl(input.url);
    if (!urlRef) {
      errors.push({
        code: "url_not_supabase",
        message: `Supabase URL does not look like a Supabase project URL: ${input.url}`,
      });
    } else if (blocked.has(urlRef)) {
      errors.push({
        code: "url_ref_blocked",
        message: `Supabase URL points at a blocked project ref "${urlRef}" (expected "${approved}")`,
      });
    } else if (urlRef !== approved) {
      errors.push({
        code: "url_ref_mismatch",
        message: `Supabase URL project ref "${urlRef}" does not match approved "${approved}"`,
      });
    }
  }

  if (!input.key) {
    errors.push({ code: "missing_key", message: "Supabase key is not set" });
  } else {
    const keyRef = extractRefFromKey(input.key);
    if (!keyRef) {
      errors.push({
        code: "key_malformed",
        message: "Supabase key is not a decodable JWT — cannot verify project ref",
      });
    } else if (blocked.has(keyRef)) {
      errors.push({
        code: "key_ref_blocked",
        message: `Supabase key is issued for blocked project ref "${keyRef}" (expected "${approved}")`,
      });
    } else if (keyRef !== approved) {
      errors.push({
        code: "key_ref_mismatch",
        message: `Supabase key is issued for project ref "${keyRef}", not approved "${approved}"`,
      });
    }
  }

  if (input.projectId) {
    const pid = input.projectId.toLowerCase();
    if (blocked.has(pid)) {
      errors.push({
        code: "project_id_blocked",
        message: `supabase/config.toml project_id is a blocked ref "${pid}"`,
      });
    } else if (pid !== approved) {
      errors.push({
        code: "project_id_mismatch",
        message: `supabase/config.toml project_id "${pid}" does not match approved "${approved}"`,
      });
    }
  }

  return errors;
}

export function assertSupabaseConfig(input: SupabaseConfigInput): void {
  const errors = validateSupabaseConfig(input);
  if (errors.length === 0) return;
  const lines = errors.map((e) => `  - [${e.code}] ${e.message}`).join("\n");
  throw new Error(
    `Supabase project-ref guard failed. ` +
      `Expected project ref "${APPROVED_PROJECT_REF}".\n${lines}\n` +
      `If this is an intentional migration, update ` +
      `src/integrations/supabase/project-ref.ts in the same commit.`,
  );
}
