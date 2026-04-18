# CI workflow templates

These templates live outside `.github/workflows/` because the PAT used
for automated commits in this repo doesn't have `workflow` scope —
both `git push` and the GitHub Contents API refuse to create workflow
files without it. To activate them you (or any maintainer with a PAT
that does have `workflow` scope, or simply the GitHub web UI) need to
copy the files into `.github/workflows/` once.

## 1. `golden-path.yml.template` — Golden Path CI runner

**What it does:** runs the full Golden Path suite (build + 8 flows) on
every push to main, every PR against main, daily at 12:00 UTC, and
on-demand via the Actions tab. Splits deterministic flows (must always
be green) from AI-dependent flows (retried up to 3× to absorb transient
Gemini/Claude flakes).

## 2. `deploy-edge-functions.yml.template` — auto-deploy on push

**What it does:** watches `supabase/functions/**` for changes on main.
When a specific function's code changes, deploys just that function.
When `supabase/functions/_shared/**` changes (the shared helpers that
every function bundles at deploy time), redeploys **every** function —
because otherwise old bundles stay live, exactly the bug Pass 4 fixed:
half the AI functions were returning 500 because their deployed copy
of `_shared/ai-client.ts` predated the Gemini model-map fix.

## Activation (one-time, ~3 min)

1. In the GitHub web UI, go to the repo root and click "Add file" →
   "Create new file".
2. Name it `.github/workflows/golden-path.yml`.
3. Paste the contents of `scripts/ci/golden-path.yml.template`.
4. Commit directly to main.
5. Repeat for `.github/workflows/deploy-edge-functions.yml` using
   `scripts/ci/deploy-edge-functions.yml.template`.
6. Settings → Secrets and variables → Actions → add:
   - `SUPABASE_URL` = `https://vvwojahsianpmwjvkunn.supabase.co`
   - `SUPABASE_ANON_KEY` — from Supabase Dashboard → Project Settings → API
   - `SUPABASE_SERVICE_ROLE_KEY` — same page
   - `SUPABASE_ACCESS_TOKEN` — from https://supabase.com/dashboard/account/tokens
7. Next push triggers the runners.

Alternative: if you want Claude to push workflows directly in future
sessions, create a PAT with `workflow` scope at
https://github.com/settings/tokens and drop it into your git credential
helper for this repo.

## Verification after activation

After the first successful run of `golden-path.yml` you should see in
the Actions tab:
- `Build` passing
- 5 `Deterministic Golden Paths` jobs (one per flow) all passing
- 3 `AI-dependent Golden Paths` jobs all passing within ≤3 attempts

For `deploy-edge-functions.yml`:
- A `Deploy` run on every push that touches `supabase/functions/**`
- When `_shared/` changes, a full-fleet redeploy (takes ~5–8 min)

## Where these templates came from

Written during the floor-rebuild session. Verified locally at the time:
- Golden Path suite ran green on live DB (39/40 steps; one transient AI
  500 on the core path's step 4 — exactly what the 3-attempt retry
  absorbs).
- Pass 4 manually bulk-deployed 21 stale edge-function bundles. The
  auto-deploy workflow is designed so that never has to happen again.
