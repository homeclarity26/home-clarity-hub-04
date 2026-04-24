import { describe, it, expect } from "vitest";
import {
  APPROVED_PROJECT_REF,
  APPROVED_SUPABASE_URL,
  extractRefFromKey,
  extractRefFromUrl,
  validateSupabaseConfig,
  assertSupabaseConfig,
} from "./project-ref";

// Minimal helper: build a JWT-shaped string whose payload declares a given ref.
// Signature is intentionally bogus — the guard only needs to parse the ref.
function makeFakeKey(ref: string): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ iss: "supabase", ref, role: "anon" })).toString("base64url");
  return `${header}.${payload}.signature`;
}

const APPROVED_KEY = makeFakeKey(APPROVED_PROJECT_REF);
const BLOCKED_KEY = makeFakeKey("abarpsxwglxuessimrkk");
const FOREIGN_KEY = makeFakeKey("someotherref123456");

describe("extractRefFromUrl", () => {
  it("pulls the ref out of a Supabase URL", () => {
    expect(extractRefFromUrl(APPROVED_SUPABASE_URL)).toBe(APPROVED_PROJECT_REF);
  });
  it("returns null for non-Supabase URLs", () => {
    expect(extractRefFromUrl("https://example.com")).toBeNull();
    expect(extractRefFromUrl("not-a-url")).toBeNull();
  });
});

describe("extractRefFromKey", () => {
  it("decodes ref from a JWT-shaped key", () => {
    expect(extractRefFromKey(APPROVED_KEY)).toBe(APPROVED_PROJECT_REF);
  });
  it("returns null for malformed keys", () => {
    expect(extractRefFromKey("not.a.jwt.but.close")).toBeNull();
    expect(extractRefFromKey("")).toBeNull();
  });
});

describe("validateSupabaseConfig", () => {
  it("accepts the approved URL + key", () => {
    expect(
      validateSupabaseConfig({ url: APPROVED_SUPABASE_URL, key: APPROVED_KEY }),
    ).toEqual([]);
  });

  it("flags a missing URL", () => {
    const errors = validateSupabaseConfig({ url: "", key: APPROVED_KEY });
    expect(errors.some((e) => e.code === "missing_url")).toBe(true);
  });

  it("flags a missing key", () => {
    const errors = validateSupabaseConfig({ url: APPROVED_SUPABASE_URL, key: "" });
    expect(errors.some((e) => e.code === "missing_key")).toBe(true);
  });

  it("flags the known-wrong ref in the URL as blocked, not just mismatched", () => {
    const errors = validateSupabaseConfig({
      url: "https://abarpsxwglxuessimrkk.supabase.co",
      key: APPROVED_KEY,
    });
    expect(errors.some((e) => e.code === "url_ref_blocked")).toBe(true);
  });

  it("flags the known-wrong ref in the key as blocked", () => {
    const errors = validateSupabaseConfig({
      url: APPROVED_SUPABASE_URL,
      key: BLOCKED_KEY,
    });
    expect(errors.some((e) => e.code === "key_ref_blocked")).toBe(true);
  });

  it("flags any foreign ref mismatch, even if not on the blocklist", () => {
    const errors = validateSupabaseConfig({
      url: "https://someotherref123456.supabase.co",
      key: FOREIGN_KEY,
    });
    expect(errors.some((e) => e.code === "url_ref_mismatch")).toBe(true);
    expect(errors.some((e) => e.code === "key_ref_mismatch")).toBe(true);
  });

  it("catches URL/key ref mismatch even when each alone is approved-looking", () => {
    const errors = validateSupabaseConfig({
      url: APPROVED_SUPABASE_URL,
      key: FOREIGN_KEY,
    });
    expect(errors.some((e) => e.code === "key_ref_mismatch")).toBe(true);
  });

  it("validates supabase/config.toml project_id", () => {
    expect(
      validateSupabaseConfig({
        url: APPROVED_SUPABASE_URL,
        key: APPROVED_KEY,
        projectId: "abarpsxwglxuessimrkk",
      }).some((e) => e.code === "project_id_blocked"),
    ).toBe(true);
    expect(
      validateSupabaseConfig({
        url: APPROVED_SUPABASE_URL,
        key: APPROVED_KEY,
        projectId: APPROVED_PROJECT_REF,
      }),
    ).toEqual([]);
  });
});

describe("assertSupabaseConfig", () => {
  it("returns silently for approved config", () => {
    expect(() =>
      assertSupabaseConfig({ url: APPROVED_SUPABASE_URL, key: APPROVED_KEY }),
    ).not.toThrow();
  });

  it("throws with a descriptive error for blocked ref", () => {
    expect(() =>
      assertSupabaseConfig({
        url: "https://abarpsxwglxuessimrkk.supabase.co",
        key: BLOCKED_KEY,
      }),
    ).toThrowError(/Supabase project-ref guard failed/);
  });
});
