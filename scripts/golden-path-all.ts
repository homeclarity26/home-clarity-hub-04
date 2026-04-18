#!/usr/bin/env bun
/**
 * Run every Golden Path in sequence. Any red = overall red.
 * Exits 0 on full green, 1 on any red.
 *
 * Use this as the deploy gate. Add it to a GitHub Action or Vercel
 * post-deploy hook to get a one-shot green/red signal.
 *
 * Run:
 *   bun --env-file=.env.local scripts/golden-path-all.ts
 *
 * Implementation: each script exports `run()` and we dynamic-import
 * them in-process. This avoids brittle subprocess spawning and keeps
 * output cleanly interleaved.
 */

import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const SCRIPTS_DIR = dirname(fileURLToPath(import.meta.url));

const scripts = [
  { name: "core",       path: resolve(SCRIPTS_DIR, "golden-path.ts") },
  { name: "messaging",  path: resolve(SCRIPTS_DIR, "golden-path-messaging.ts") },
  { name: "proposal",   path: resolve(SCRIPTS_DIR, "golden-path-proposal.ts") },
  { name: "rls",        path: resolve(SCRIPTS_DIR, "golden-path-rls.ts") },
];

interface Run {
  name: string;
  status: "PASS" | "FAIL";
  elapsed: number;
}

async function runOne(name: string, scriptPath: string): Promise<Run> {
  const start = Date.now();
  // Use Bun.spawn — works inside sandboxed bun runs where node:child_process
  // spawn() of the current bun binary was failing with ENOENT.
  const proc = Bun.spawn([process.execPath, scriptPath], {
    env: { ...process.env } as Record<string, string>,
    stdout: "inherit",
    stderr: "inherit",
  });
  const code = await proc.exited;
  return { name, status: code === 0 ? "PASS" : "FAIL", elapsed: (Date.now() - start) / 1000 };
}

async function main(): Promise<void> {
  const overallStart = Date.now();
  const runs: Run[] = [];
  for (const s of scripts) {
    console.log(`\n\n▶ Running Golden Path: ${s.name.toUpperCase()}`);
    console.log("─".repeat(60));
    const r = await runOne(s.name, s.path);
    runs.push(r);
  }

  console.log("\n\n═══════════════════════════════════════════════════");
  console.log("GOLDEN PATH SUITE SUMMARY");
  console.log("═══════════════════════════════════════════════════");
  for (const r of runs) {
    const icon = r.status === "PASS" ? "✓" : "✗";
    console.log(`${icon} ${r.name.padEnd(12)} ${r.status}  (${r.elapsed.toFixed(1)}s)`);
  }
  const totalElapsed = ((Date.now() - overallStart) / 1000).toFixed(1);
  const anyFail = runs.some((r) => r.status === "FAIL");
  console.log("");
  if (anyFail) {
    const failed = runs.filter((r) => r.status === "FAIL").map((r) => r.name).join(", ");
    console.log(`SUITE FAIL — red: ${failed}. (${totalElapsed}s total)`);
    process.exit(1);
  } else {
    console.log(`SUITE PASS — all ${runs.length} Golden Paths green. (${totalElapsed}s total)`);
    process.exit(0);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
