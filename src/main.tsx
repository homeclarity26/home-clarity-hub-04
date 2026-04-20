import React from "react";
import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";
import App from "./App.tsx";
import "./index.css";

// ── Password-recovery redirect (must run before React mounts) ──────────
// Supabase appends `#type=recovery&access_token=…` to whatever URL the
// recovery email redirects to. If the email's redirect_to is the app
// root (the Supabase default when no explicit override is set on the
// server side), we'd otherwise bounce straight into the role-based
// dashboard, skipping the set-new-password form. Detect the recovery
// fragment and rewrite the URL to `/reset-password` before Router runs,
// preserving the fragment so supabase-js can still pick up the session.
if (
  typeof window !== "undefined" &&
  window.location.hash.includes("type=recovery") &&
  window.location.pathname !== "/reset-password"
) {
  window.history.replaceState(
    null,
    "",
    "/reset-password" + window.location.search + window.location.hash,
  );
}

// ── Sentry error monitoring ───────────────────────────────────────────
// Initializes only when VITE_SENTRY_DSN is set (production). In local dev
// without a DSN, Sentry is a no-op — nothing is sent, nothing breaks.
//
// Captures:
//   - Uncaught exceptions + unhandled promise rejections (via browser hooks)
//   - React render errors (via ErrorBoundary wrapping App)
//   - Any explicit Sentry.captureException() calls from feature code
//
// Privacy:
//   - sendDefaultPii is false — no user IPs / cookies sent.
//   - maskAllText in Replay (if enabled later) is the default.
const sentryDsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_APP_VERSION as string | undefined,
    // Keep it lean — no auto-instrumentation we don't need yet.
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.globalHandlersIntegration(),
    ],
    // 10% transactions sampled in prod; everything in other envs.
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    sendDefaultPii: false,
    beforeSend(event) {
      // Drop noisy errors we don't want paging us:
      //   - "ResizeObserver loop limit exceeded" (benign browser warning)
      //   - Aborted fetches when the user navigates away mid-request
      const msg = event.exception?.values?.[0]?.value ?? "";
      if (/ResizeObserver loop/i.test(msg)) return null;
      if (/AbortError|The user aborted a request/i.test(msg)) return null;
      return event;
    },
  });
}

const container = document.getElementById("root")!;
const AppWithSentry = sentryDsn
  ? Sentry.withErrorBoundary(App, {
      fallback: (
        <div style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
          <h1 style={{ fontSize: 20, marginBottom: 8 }}>Something went wrong.</h1>
          <p style={{ color: "#666", marginBottom: 16 }}>
            The error has been reported to our team. Try refreshing.
          </p>
          <button
            onClick={() => location.reload()}
            style={{
              padding: "8px 16px",
              border: "1px solid #ccc",
              borderRadius: 6,
              background: "white",
              cursor: "pointer",
            }}
          >
            Refresh
          </button>
        </div>
      ),
    })
  : App;

createRoot(container).render(
  <React.StrictMode>
    <AppWithSentry />
  </React.StrictMode>,
);

// ── Fallback global error monitoring ──────────────────────────────────
// Also logs to console for dev visibility. Sentry captures these via its
// globalHandlersIntegration, so this is just for local debugging.
window.addEventListener("error", (event) => {
  console.error("[HBC Error]", event.error?.message || event.message, {
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    stack: event.error?.stack,
  });
});

window.addEventListener("unhandledrejection", (event) => {
  console.error("[HBC Unhandled Rejection]", event.reason?.message || event.reason, {
    stack: event.reason?.stack,
  });
});

// ── Register service worker for offline + push ─────────────────────────
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

// ── Vercel / Vite chunk-drift auto-reload ──────────────────────────────
// After a new deploy, the browser often still has the old index.html cached
// which references asset hashes (e.g. AdminAutomations-xxx.js) that no
// longer exist. Vite fires `vite:preloadError` in that case — we hard-reload
// once to pick up the fresh index.html. Guard against a reload loop with a
// session-scoped flag (same sentinel used in ErrorBoundary).
window.addEventListener("vite:preloadError", (event) => {
  event.preventDefault();
  if (sessionStorage.getItem("hbc:chunk-reload") === "1") return;
  sessionStorage.setItem("hbc:chunk-reload", "1");
  window.location.reload();
});

// If the app stayed alive for 5s, assume chunks loaded fine and clear
// the sentinel so the next deploy's drift can auto-reload once again.
setTimeout(() => {
  sessionStorage.removeItem("hbc:chunk-reload");
}, 5000);
