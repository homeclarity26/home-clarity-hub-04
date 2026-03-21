import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// ── Global error monitoring ────────────────────────────────────────────
// Catches uncaught exceptions and unhandled promise rejections.
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
