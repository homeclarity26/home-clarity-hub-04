// Shared utilities for the WebKit-first deep E2E scripts.
//
// Every script is plain .mjs (ESM) so you can run with `node scripts/x.mjs`
// without bun. Deliberately no TS, no bundler — keep the test harness
// self-contained and reproducible on CI.

import fs from "node:fs";
import path from "node:path";
import { webkit } from "playwright";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.dirname(HERE);

export const APP_URL = "https://home-clarity-hub.vercel.app";
export const SUPABASE_REF = "vvwojahsianpmwjvkunn";
export const SUPABASE_URL = `https://${SUPABASE_REF}.supabase.co`;

// Test account prefix — every seeded user uses this so cleanup is one DELETE.
export const TEST_EMAIL_DOMAIN = "homeclarityhub.test";
export const TEST_EMAIL = {
  creator: `test.creator.e2e@${TEST_EMAIL_DOMAIN}`,
  client: `test.client.e2e@${TEST_EMAIL_DOMAIN}`,
  trade: `test.trade.e2e@${TEST_EMAIL_DOMAIN}`,
};
export const TEST_PROPERTY_ADDRESS_PREFIX = "e2e-webkit-";

// iPhone 12/13/14 viewport + UA — match what an iOS Safari PWA install hits.
export const WEBKIT_CONTEXT = {
  viewport: { width: 414, height: 896 },
  userAgent:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
};

function parseEnvFile(content) {
  const out = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

export function loadEnv() {
  const envPath = path.join(ROOT, ".env.local");
  if (!fs.existsSync(envPath)) throw new Error(`.env.local not found at ${envPath}`);
  const env = parseEnvFile(fs.readFileSync(envPath, "utf-8"));
  const want = ["SUPABASE_ACCESS_TOKEN", "SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"];
  for (const k of want) {
    if (!env[k]) throw new Error(`missing ${k} in .env.local`);
  }
  return {
    pat: env.SUPABASE_ACCESS_TOKEN,
    url: env.SUPABASE_URL,
    anon: env.SUPABASE_ANON_KEY,
    serviceRole: env.SUPABASE_SERVICE_ROLE_KEY,
  };
}

// Management API query — runs arbitrary SQL against prod via the PAT.
// Cloudflare blocks requests without a browser UA → always send one.
export async function mgmtQuery(pat, sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${SUPABASE_REF}/database/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${pat}`,
      "Content-Type": "application/json",
      "User-Agent": "Mozilla/5.0",
    },
    body: JSON.stringify({ query: sql }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`mgmt query ${res.status}: ${text.slice(0, 500)}`);
  return JSON.parse(text);
}

// Generate a one-time magic link for `email`. Service role only.
// `redirect_to` overrides the Supabase project's default (which is localhost
// in dev configs and would leave WebKit trying to reach your laptop).
export async function generateMagicLink(serviceRole, email, redirectTo = APP_URL) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/generate_link`, {
    method: "POST",
    headers: {
      apikey: serviceRole,
      Authorization: `Bearer ${serviceRole}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ type: "magiclink", email, redirect_to: redirectTo }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`generate_link for ${email}: ${res.status} ${text.slice(0, 200)}`);
  const body = JSON.parse(text);
  const link = body.action_link || body?.properties?.action_link;
  if (!link) throw new Error(`no action_link in response for ${email}: ${text.slice(0, 200)}`);
  return link;
}

// Follow the magic-link redirect server-side and rewrite the final host to
// our production app. Supabase's `site_url` is configured as localhost for
// dev, and an empty `uri_allow_list` means `redirect_to` overrides are
// ignored — so the Location header comes back pointing at localhost. We
// keep the `#access_token=...` hash intact and swap the origin.
async function resolveMagicLinkToAppUrl(link) {
  const res = await fetch(link, { redirect: "manual" });
  const loc = res.headers.get("location");
  if (!loc) {
    throw new Error(`magic link didn't redirect — status ${res.status}. Token may be consumed or expired.`);
  }
  const u = new URL(loc);
  const appOrigin = new URL(APP_URL);
  u.protocol = appOrigin.protocol;
  u.host = appOrigin.host;
  u.port = appOrigin.port;
  return u.toString();
}

// Log `page` in as `email`. Consumes a single magic link each call.
// Works for session swaps on the same page too — the link redirect replaces
// the stored session in place.
export async function loginAs(page, serviceRole, email, { timeoutMs = 25_000, settleMs = 4500 } = {}) {
  const link = await generateMagicLink(serviceRole, email);
  const appUrl = await resolveMagicLinkToAppUrl(link);
  const start = Date.now();
  await page.goto(appUrl, { waitUntil: "domcontentloaded", timeout: timeoutMs });
  await page.waitForTimeout(settleMs);
  if (/\/login/.test(page.url())) {
    throw new Error(`login failed for ${email} — still on /login after ${Date.now() - start}ms (url=${page.url()})`);
  }
}

// Pull the access_token out of localStorage so we can hit PostgREST / edge
// functions as the signed-in user (real JWT, not anon/service-role).
export async function extractUserJwt(page) {
  return await page.evaluate(() => {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("sb-") && k.endsWith("-auth-token")) {
        try {
          const v = JSON.parse(localStorage.getItem(k));
          return v?.access_token ?? null;
        } catch {}
      }
    }
    return null;
  });
}

// Single "is this route healthy?" assertion.
// Fails on: "Something went wrong" heading (ErrorBoundary), stuck Loading,
// CSP console violation (guardrail — this app currently has no CSP).
export async function assertRouteHealthy(page, url, { timeoutMs = 12_000 } = {}) {
  const consoleErrors = [];
  const pageErrors = [];
  const onConsole = (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  };
  const onPageError = (err) => pageErrors.push(err?.message || String(err));
  page.on("console", onConsole);
  page.on("pageerror", onPageError);
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: timeoutMs });
    await page.waitForTimeout(2500);
    const body = await page.evaluate(() => ({
      text: document.body?.innerText || "",
      hasErrorBoundary: Array.from(document.querySelectorAll("h1, h2"))
        .some((el) => /Something went wrong/i.test(el.textContent || "")),
      chars: (document.body?.innerText || "").length,
    }));
    const cspErrors = consoleErrors.filter((e) => /WebSocket not available: The operation is insecure|Refused to (connect|load)|Content Security Policy/i.test(e));
    const stuckLoading = body.chars < 400 && /loading/i.test(body.text);
    const issues = [];
    if (body.hasErrorBoundary) issues.push("ErrorBoundary rendered");
    if (cspErrors.length) issues.push(`CSP violations: ${cspErrors[0].slice(0, 120)}`);
    if (stuckLoading) issues.push(`stuck on Loading (${body.chars} chars)`);
    if (pageErrors.length) issues.push(`page error: ${pageErrors[0].slice(0, 120)}`);
    return {
      ok: issues.length === 0,
      finalUrl: page.url(),
      chars: body.chars,
      issues,
      consoleErrors: consoleErrors.slice(0, 3),
    };
  } finally {
    page.off("console", onConsole);
    page.off("pageerror", onPageError);
  }
}

// Launch a fresh WebKit context tuned for iPhone Safari.
export async function launchWebKit({ headless = true } = {}) {
  const browser = await webkit.launch({ headless });
  const context = await browser.newContext(WEBKIT_CONTEXT);
  const page = await context.newPage();
  return { browser, context, page };
}

// REST POST using a user's JWT — same auth path the UI uses, so this hits
// the real RLS. Returns { status, body }.
export async function postAsUser(page, jwt, anonKey, pathSuffix, body) {
  return await page.evaluate(async ({ url, jwt, anonKey, pathSuffix, body }) => {
    const res = await fetch(`${url}${pathSuffix}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwt}`,
        apikey: anonKey,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(body),
    });
    return { status: res.status, body: (await res.text()).slice(0, 500) };
  }, { url: SUPABASE_URL, jwt, anonKey, pathSuffix, body });
}

// REST GET using a user's JWT — returns parsed JSON array or { status, body }.
export async function getAsUser(page, jwt, anonKey, pathSuffix) {
  return await page.evaluate(async ({ url, jwt, anonKey, pathSuffix }) => {
    const res = await fetch(`${url}${pathSuffix}`, {
      headers: {
        Authorization: `Bearer ${jwt}`,
        apikey: anonKey,
      },
    });
    const text = await res.text();
    return { status: res.status, body: text.slice(0, 1500) };
  }, { url: SUPABASE_URL, jwt, anonKey, pathSuffix });
}

export function fmtRow(r) {
  const s = r.ok ? "✓ PASS" : "✗ FAIL";
  const tail = r.issues?.length ? ` [${r.issues.join("; ")}]` : "";
  return `${s.padEnd(8)} ${(r.url || "").padEnd(56)} ${String(r.chars || "").padStart(5)}c${tail}`;
}

export function header(title) {
  const bar = "═".repeat(Math.max(10, title.length + 4));
  console.log(`\n${bar}\n  ${title}\n${bar}`);
}
