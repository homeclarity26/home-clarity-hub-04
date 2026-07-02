# Home Clarity Hub — Master Remediation Plan

**Author:** Audit follow-up (2026-07-01)
**Scope:** Fix every finding from the full-system audit (C1–C2, H1–H3, M1–M5, L1–L3).
**Method:** Small, sequenced PRs that respect the repo rules in `CLAUDE.md`
(≤3 files/ticket where feasible, migrations and type-regen are separate PRs,
Golden Path stays green, no editing migrations that already ran, reuse the
existing `CRON_SECRET` / `x-supabase-cron-secret` pattern).

Each PR lists: **Closes · Files · Change · Verify · Risk/Rollback.**

---

## Phase 0 — Stop the bleeding (drift + the two clearest auth holes)

### PR-1 — Kill the drift landmine + merge the ref guard  *(Closes C1)*
- **Files:** delete `supabase/config.toml.backup`; cherry-pick the guard from
  `origin/chore/supabase-project-ref-guard` (`src/integrations/supabase/project-ref.ts`,
  its test, `scripts/check-supabase-project-ref.ts`, the `supabase-ref-guard` CI job).
- **Change:** Remove the file that still contains `abarpsxwglxuessimrkk`. Land the
  guard that asserts `.env` + `config.toml` + the anon key's embedded `ref` all
  equal `vvwojahsianpmwjvkunn`, blocklists the bad ref, and fails the build/CI.
- **Verify:** `bun run build` fails if you flip any ref to the bad value;
  the new CI job is required on PRs; `grep -rn abarpsxwglxuessimrkk` returns nothing.
- **Risk:** Very low. Pure guardrail; no runtime behavior change. Rollback = revert.
- **Note:** The guard branch is stale vs `main`; re-verify the files apply cleanly,
  don't blind-merge.

### PR-2 — Authenticate `get-smart-context`  *(Closes C2)*
- **Files:** `supabase/functions/get-smart-context/index.ts`.
- **Change:** `const auth = await requireAuth(req); if ("error" in auth) return auth.error;`
  Derive `userId` from `auth.user.id` and `role` from `user_roles` — never from the body.
  Keep service-role client only for the reads that genuinely need it, scoped to the
  authenticated user.
- **Verify:** Anonymous `curl` now returns 401 (today it returns 200); a real
  creator JWT still returns their advisor patterns; add a line to `smoke-test-ai.ts`.
- **Risk:** Low. Callers already send a JWT via `supabase.functions.invoke`.
  Confirm the frontend caller isn't relying on passing an arbitrary `userId`.

---

## Phase 1 — Close the edge-function auth boundary

### PR-3 — Shared cron-auth helper  *(prep for H2 background jobs)*
- **Files:** new `supabase/functions/_shared/cron-auth.ts` (factor the check that
  already lives inline in `daily-brief-cron`).
- **Change:** Export `requireCron(req)` → checks `x-supabase-cron-secret` against
  `Deno.env.get("CRON_SECRET")`, returns 401 otherwise. One source of truth.
- **Verify:** `daily-brief-cron` refactored to use it, behavior identical.
- **Risk:** Low, but touches `_shared/**` → CI redeploys ALL functions. Expected; let CI run.

### PR-4 — Lock the publicly-triggerable background jobs  *(Closes H2, part 1)*
- **Files:** `activity-summary-email`, `maintenance-alerts`, `payment-escalation-check`,
  `learn-from-activity`, `generate-proactive-alerts`, `send-maintenance-reminders`
  (split into 2 PRs of 3 if you want to honor the file-count rule strictly).
- **Change:** Add `requireCron(req)` at the top of each. These are service-role
  scanners that must never be callable by the public.
- **Verify:** Anonymous `curl` → 401 (today `generate-proactive-alerts` returns 200).
- **Risk:** Medium — the pg_cron caller must send the header (see PR-5) or the
  daily jobs silently stop. **Ship PR-5 in the same batch.**

### PR-5 — Migration: make pg_cron send the cron secret  *(pairs with PR-4)*
- **Files:** new `supabase/migrations/<ts>_cron_send_secret_header.sql`
  (do NOT edit `20260504010000`).
- **Change:** Reschedule the cron jobs so `net.http_post` includes
  `'x-supabase-cron-secret', current_setting('app.settings.cron_secret')`.
  Set `CRON_SECRET` in Supabase Function secrets and `app.settings.cron_secret`
  in DB settings to the same value.
- **Verify:** After deploy, the 08:00 UTC run succeeds (check `proactive_alerts`
  gets rows / function logs 200); manual anonymous call still 401.
- **Risk:** Medium. If the secret isn't set in both places, cron breaks. Test by
  triggering the job manually with the header before relying on schedule.

### PR-6 — Auth the client/creator-facing public functions  *(Closes H2, part 2)*
- **Files (batch in 3s):**
  - AI-only cost-abuse: `ai-client-brief`, `ai-document-intelligence`,
    `ai-predictive-maintenance`, `ai-vendor-match` → `requireAuth` (or
    `requireRole(["creator"])` — confirm each caller's role).
  - Paid-API + writes: `lookup-property-data`, `fetch-home-value`, `get-property-value`
    → `requireRole(["creator"])` and validate `property_id` ownership before writing.
  - Referral writes: `convert-referral`, `track-referral` → `requireAuth`; keep
    `track-referral` public only if it must be a click-tracking redirect, in which
    case rate-limit it hard (see PR-8) and never let it accept a `userId`.
- **Verify:** Anonymous `curl` → 401 for each; smoke test with a real JWT.
- **Risk:** Low–medium. `track-referral` may be intentionally public (email link);
  decide per-function. Everything else is called from the authed app.

### PR-7 — Fix `send-email-verification` identity handling  *(Closes H2, part 3)*
- **Files:** `send-email-verification/index.ts` (+ `verify-email-code/index.ts` if
  it shares the flaw).
- **Change:** `requireAuth`; take `userId` from the JWT, not the body, so a caller
  can't write a verification code against someone else's account or trigger mail to
  arbitrary addresses.
- **Verify:** Can only send/verify for the authenticated user; anonymous → 401.
- **Risk:** Medium — this is in the account-integrity path; test signup/verify e2e.

### PR-8 — Turn on rate limiting  *(Closes H3)*
- **Files:** the public/high-cost functions from PR-6/PR-7 (+ any still-open ones).
- **Change:** Import `rateLimit`/`getClientIP`/`rateLimitResponse` from the existing
  `_shared/rate-limit.ts`; apply per-IP (public) and per-user (authed) limits.
  For creators, add a daily AI-call cap.
- **Verify:** Rapid repeat calls get 429; normal use unaffected.
- **Risk:** Low. Tune thresholds so the wizard's burst AI calls don't trip it.

---

## Phase 2 — Fix the agent's authorization model (the highest-leverage structural fix)

### PR-9 — Ownership enforcement in `hbc-agent` client tools  *(Closes H1)*
- **Files:** `supabase/functions/hbc-agent/index.ts` (+ a helper if needed).
- **Change:** Before any client-role tool touches a `property_id`/`invoice_id`/
  `project_id`, verify the authenticated `userId` owns it (call
  `user_can_access_property` or run those tools through a **user-JWT** client so RLS
  applies). Add a defensive re-check of `allowedRoles` inside `executeTool` as a
  backstop even though the model only sees filtered tools.
- **Verify:** New `golden-path-rls` case — a client asks Bobby for **another**
  tenant's report/invoices/equipment by id and gets denied.
- **Risk:** Medium. Central function; regressions hit all of Bobby. Ship behind the
  Golden Path and test creator + client flows.

### PR-10 — Strategic: default edge functions to user-JWT clients  *(Closes L-class root cause of H1/H2)*
- **Files:** rolling, function-by-function (a tracked checklist, not one PR).
- **Change:** Make RLS-respecting `auth.userSupabase` the default; reserve
  `auth.adminSupabase` (service-role) for explicitly admin operations behind a role
  check, each with a one-line comment justifying it.
- **Verify:** `golden-path-rls` stays green as each function is converted.
- **Risk:** Medium, spread thin over time. This is the durable fix that prevents the
  whole IDOR/over-privilege class from recurring.

---

## Phase 3 — Web + data-integrity hardening

### PR-11 — Sanitize all prose HTML blocks  *(Closes M1)*
- **Files (batch in 3s):** `RoomRecordBlock`, `RecurringServicesRegisterBlock`,
  `ReplacementBriefingBlock`, `TodaysBriefBlock`, `VisionProjectBlock`.
- **Change:** Route every `*Html` field through `<SanitizedHtml>`; then add an
  ESLint rule banning raw `dangerouslySetInnerHTML` outside `SanitizedHtml`/`chart.tsx`.
- **Verify:** Lint catches a raw usage; a `<img onerror>` payload in a block is
  neutralized in the rendered portal.
- **Risk:** Low. Visual diff each block (respects the one-UI-approval rule — bundle
  these into a single approval).

### PR-12 — Stripe webhook idempotency  *(Closes M2)*
- **Files:** `stripe-webhook/index.ts` (+ a small migration for a
  `processed_stripe_events` table or a unique `stripe_event_id` column — separate PR).
- **Change:** Skip events whose `event.id` was already processed.
- **Verify:** Replaying the same event creates no duplicate rows.
- **Risk:** Low.

### PR-13 — Tighten CORS + storage listing  *(Closes M3, M4)*
- **Files:** `_shared/auth.ts` (CORS allowlist) + a storage policy migration.
- **Change:** Replace `Access-Control-Allow-Origin: *` with a production-origin
  allowlist; restrict anonymous `list` on `report-images` (keep object read public).
- **Verify:** Portal still loads images; cross-origin junk requests rejected;
  anon bucket `list` no longer enumerates folders.
- **Risk:** Medium — a wrong origin allowlist breaks the app. Include the Vercel
  prod + preview domains.

---

## Phase 4 — Environment, config, and test durability

### PR-14 — Env validation + fail-fast in the client  *(Closes L3)*
- **Files:** `src/integrations/supabase/client.ts`.
- **Change:** Throw a clear error at startup if `VITE_SUPABASE_URL`/anon key are
  missing or if the URL ref ≠ the anon key's embedded ref (complements the PR-1 guard).
- **Verify:** Removing a var yields a readable error, not a cryptic crash.
- **Risk:** Low.

### PR-15 — Document + enforce Vercel preview-vs-prod separation  *(Closes M5)*
- **Files:** `docs/deployment.md` (new) + optionally a preview-env check.
- **Change:** Document that Vercel must set `VITE_SUPABASE_*` per environment;
  decide whether previews get their own Supabase project (recommended) or share prod
  with a clearly-labeled banner. Add a build-time note if running a preview against prod.
- **Verify:** A preview deploy shows the intended project; doc reviewed.
- **Risk:** Low (doc + config), but the decision (separate preview DB) has cost.

### PR-16 — First real unit/integration tests  *(Closes L1)*
- **Files:** `src/**/__tests__` for `_shared/auth.ts` logic, `project-ref.ts`,
  and agent tool-dispatch/role-gating; wire into `vitest` + CI.
- **Change:** Replace the placeholder test with targeted coverage of the auth/RLS
  helpers and the agent's role filter — the exact paths e2e can miss.
- **Verify:** `bun run test` runs real assertions in CI.
- **Risk:** Low.

### PR-17 — Surface AI model fallback  *(Closes L2)*
- **Files:** `_shared/ai-client.ts` (+ callers that want to display it).
- **Change:** Return `model_used` so a silent Claude→Gemini fallback is observable
  in responses/logs.
- **Verify:** Force an Anthropic error; response reports the Gemini fallback.
- **Risk:** Low (touches `_shared` → full redeploy; expected).

### PR-18 — AI-agent-edit guardrails on config-truth files  *(Closes C1 root cause / strategic)*
- **Files:** `.github/CODEOWNERS`, a pre-commit hook (husky or a git hook script),
  branch-protection notes.
- **Change:** Require human review for edits to `.env`, `supabase/config.toml`,
  `src/integrations/supabase/client.ts`, and `.github/workflows/**`; pre-commit runs
  `scripts/check-supabase-project-ref.ts`. This closes the loop the original drift
  slipped through (an automated edit repointing the project).
- **Verify:** A commit touching `.env` triggers the guard/owner review.
- **Risk:** Low; process change.

---

## Sequencing & dependencies

```
PR-1  ─┐ (drift)                      Phase 0: do first, independently
PR-2  ─┘ (get-smart-context)

PR-3 → PR-4 + PR-5 (ship together)    Phase 1: cron helper before jobs
PR-6, PR-7 → PR-8 (rate limit last)

PR-9  → PR-10 (rolling)               Phase 2: agent auth, then structural

PR-11, PR-12(+mig), PR-13             Phase 3: web/data hardening

PR-14, PR-15, PR-16, PR-17, PR-18     Phase 4: env/test/process durability
```

**Hard gates for every PR:** `bun run build` clean · `tsc --noEmit` 0 errors ·
Golden Path green (run the flow you touched) · no `as any` except realtime subs ·
migration and type-regen are separate PRs.

**Suggested order of execution:** PR-1, PR-2 (today) → PR-3/4/5 batch → PR-9 →
PR-6/7/8 → PR-11/12/13 → PR-14–18. This front-loads the highest severity
(drift + the two confirmed auth holes + the agent IDOR) and leaves process/test
work for last.

---

## Finding → PR coverage map

| Finding | Severity | PR(s) |
|---|---|---|
| C1 project-ref drift landmine + unmerged guard | Critical | PR-1, PR-14, PR-18 |
| C2 get-smart-context unauthenticated | Critical | PR-2 |
| H1 hbc-agent service-role IDOR (no ownership check) | High | PR-9, PR-10 |
| H2 ~13 public edge functions | High | PR-3,4,5,6,7 |
| H3 rate-limit module unused | High | PR-8 |
| M1 unsanitized prose HTML blocks | Medium | PR-11 |
| M2 stripe-webhook no idempotency | Medium | PR-12 |
| M3 report-images anon listing | Medium | PR-13 |
| M4 wildcard CORS | Medium | PR-13 |
| M5 Vercel preview-vs-prod undocumented | Medium | PR-15 |
| L1 no real unit tests | Low | PR-16 |
| L2 silent AI fallback | Low | PR-17 |
| L3 client.ts no env validation | Low | PR-14 |

*After this plan is executed, the next workstream is UI/UX improvements and making
report creation easier for the creator — tracked separately.*
