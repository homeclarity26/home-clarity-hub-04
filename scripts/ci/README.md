# CI workflow templates

These templates can't live in `.github/workflows/` yet because the PAT
that automated commits use in this repo doesn't have `workflow` scope —
GitHub rejects workflow-file pushes from tokens without it. Adam (or
any maintainer with a PAT that **does** have `workflow` scope, or simply
doing this via the GitHub web UI) needs to copy the file into place
once to activate it.

## `golden-path.yml.template` — the Golden Path CI runner

**What it does:** runs the full Golden Path suite (build + 8 flows) on
every push to main, every PR against main, daily at 12:00 UTC, and
on-demand via the Actions tab. Splits deterministic flows (must always
be green) from AI-dependent flows (retried up to 3× to absorb transient
Gemini/Claude flakes).

**To activate:**

1. `mkdir -p .github/workflows && cp scripts/ci/golden-path.yml.template .github/workflows/golden-path.yml`
2. In repo Settings → Secrets and variables → Actions, add these three
   repository secrets (values from Supabase dashboard → Project Settings → API):
   - `SUPABASE_URL` — `https://vvwojahsianpmwjvkunn.supabase.co`
   - `SUPABASE_ANON_KEY` — the `anon` key
   - `SUPABASE_SERVICE_ROLE_KEY` — the `service_role` key
3. Commit + push from a terminal that has a PAT with `workflow` scope
   (or use the GitHub web UI's "Add file" button, which bypasses the
   PAT-scope check entirely).
4. The Actions tab will show the runner on the next push.

**Verified locally before this was checked in:** 5/5 deterministic flows
pass green against the live DB; ai-writing passes 6/6 Claude functions;
the only failures observed during Pass-4 smoke were transient AI 500s
on the core path — exactly what the 3-attempt retry is designed to
absorb.
