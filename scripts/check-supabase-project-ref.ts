// Pre-build / CI validator that fails loudly when the checked-in Supabase
// config drifts away from the approved project ref. Runs without needing a
// browser bundle so it can gate builds and CI.
//
// It cross-checks three places where drift has historically happened:
//   1. .env                              (VITE_SUPABASE_URL / _PROJECT_ID / _PUBLISHABLE_KEY)
//   2. supabase/config.toml              (project_id)
//   3. every other file in the tree      (any Supabase URL referencing a
//                                         blocked ref, e.g. the known-wrong
//                                         "abarpsxwglxuessimrkk")
//
// Run with: bun scripts/check-supabase-project-ref.ts
// or:       npx tsx scripts/check-supabase-project-ref.ts

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import {
  APPROVED_PROJECT_REF,
  BLOCKED_PROJECT_REFS,
  validateSupabaseConfig,
} from "../src/integrations/supabase/project-ref";

const REPO_ROOT = process.cwd();

interface Finding {
  file: string;
  message: string;
}

function parseDotEnv(path: string): Record<string, string> {
  const text = readFileSync(path, "utf8");
  const out: Record<string, string> = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

function checkDotEnv(findings: Finding[]): void {
  const path = join(REPO_ROOT, ".env");
  if (!existsSync(path)) {
    findings.push({
      file: ".env",
      message:
        ".env is missing — this repo commits .env because Vite publishable keys are safe to ship. " +
        "Restore it or this check cannot verify project-ref alignment.",
    });
    return;
  }
  const env = parseDotEnv(path);
  const errors = validateSupabaseConfig({
    url: env.VITE_SUPABASE_URL,
    key: env.VITE_SUPABASE_PUBLISHABLE_KEY,
    projectId: env.VITE_SUPABASE_PROJECT_ID,
  });
  for (const e of errors) {
    findings.push({ file: ".env", message: `[${e.code}] ${e.message}` });
  }
}

function checkConfigToml(findings: Finding[]): void {
  const path = join(REPO_ROOT, "supabase/config.toml");
  if (!existsSync(path)) {
    findings.push({
      file: "supabase/config.toml",
      message: "supabase/config.toml is missing",
    });
    return;
  }
  const text = readFileSync(path, "utf8");
  const match = /^\s*project_id\s*=\s*"([^"]+)"/m.exec(text);
  if (!match) {
    findings.push({
      file: "supabase/config.toml",
      message: "project_id line not found",
    });
    return;
  }
  const errors = validateSupabaseConfig({
    // URL+key not in config.toml; only project_id applies here.
    url: `https://${APPROVED_PROJECT_REF}.supabase.co`,
    key: undefined,
    projectId: match[1],
  }).filter((e) => e.code.startsWith("project_id"));
  for (const e of errors) {
    findings.push({ file: "supabase/config.toml", message: `[${e.code}] ${e.message}` });
  }
}

// Scan the whole tree for any reference to a blocked ref. Cheap text match —
// the blocklist is very small, and even a hit in a comment is worth surfacing.
const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  // Agent worktrees are full repo copies; scanning them double-reports the
  // guard's own blocklist files under a path the allowlist doesn't cover.
  ".claude",
  "dist",
  "dist-ssr",
  ".next",
  ".turbo",
  ".vercel",
  ".lovable",
  "bun.lock",
  "package-lock.json",
]);
// Files that are allowed to reference blocked refs by design (this guard
// itself, and the summary docs we produce).
const ALLOWED_REFERENCE_PATHS = new Set<string>([
  "src/integrations/supabase/project-ref.ts",
  "scripts/check-supabase-project-ref.ts",
  "src/integrations/supabase/project-ref.test.ts",
]);

function walk(dir: string, out: string[]): void {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const name of entries) {
    if (SKIP_DIRS.has(name)) continue;
    const full = join(dir, name);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) walk(full, out);
    else if (st.isFile() && st.size < 2 * 1024 * 1024) out.push(full);
  }
}

function checkBlockedRefsInTree(findings: Finding[]): void {
  const files: string[] = [];
  walk(REPO_ROOT, files);
  const blocked = BLOCKED_PROJECT_REFS.map((r) => r.toLowerCase());
  for (const file of files) {
    const rel = relative(REPO_ROOT, file);
    if (ALLOWED_REFERENCE_PATHS.has(rel)) continue;
    // Markdown docs legitimately discuss the drift incident (audit notes,
    // remediation plan, postmortems). Drift that matters lives in code and
    // config, which the .env/config.toml checks and the non-.md scan cover.
    if (rel.toLowerCase().endsWith(".md")) continue;
    let text: string;
    try {
      text = readFileSync(file, "utf8");
    } catch {
      continue;
    }
    const lower = text.toLowerCase();
    for (const ref of blocked) {
      if (lower.includes(ref)) {
        findings.push({
          file: rel,
          message: `contains blocked Supabase project ref "${ref}" — remove or rotate before committing`,
        });
        break;
      }
    }
  }
}

function main(): void {
  const findings: Finding[] = [];
  checkDotEnv(findings);
  checkConfigToml(findings);
  checkBlockedRefsInTree(findings);

  if (findings.length === 0) {
    console.log(
      `✓ Supabase project-ref check passed (approved ref: ${APPROVED_PROJECT_REF}).`,
    );
    return;
  }

  console.error(
    `✗ Supabase project-ref check failed (${findings.length} finding${findings.length === 1 ? "" : "s"}):`,
  );
  for (const f of findings) {
    console.error(`  ${f.file}: ${f.message}`);
  }
  console.error(
    `Approved project ref: "${APPROVED_PROJECT_REF}". ` +
      `If this is an intentional migration, update src/integrations/supabase/project-ref.ts ` +
      `in the same commit.`,
  );
  process.exit(1);
}

main();
