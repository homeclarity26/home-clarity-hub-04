# Deployment & Environment Guide

This documents how Home Clarity Hub is configured across environments and the
manual steps required to fully activate the security remediation (see
`REMEDIATION_PLAN.md`). Several fixes are code-complete but need a dashboard
action or a migration apply before they take effect.

---

## Supabase project

- **Approved project ref:** `vvwojahsianpmwjvkunn` (the only allowed project).
- **Blocked ref:** `abarpsxwglxuessimrkk` (caused the original drift; now
  blocklisted by the guard).
- The project-ref guard (`src/integrations/supabase/project-ref.ts`) fails the
  build, CI (`supabase-ref-guard` workflow), and an optional pre-commit hook if
  any config points anywhere else.

Enable the local pre-commit guard once per clone:

```bash
git config core.hooksPath .githooks
```

---

## Vercel environment variables (M5)

`VITE_*` vars are embedded into the client bundle at build time, so they must be
set **per Vercel environment**. Both Preview and Production must use the approved
project:

| Variable | Production | Preview |
|---|---|---|
| `VITE_SUPABASE_URL` | `https://vvwojahsianpmwjvkunn.supabase.co` | same |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | anon key for `vvwojahsianpmwjvkunn` | same |
| `VITE_SUPABASE_PROJECT_ID` | `vvwojahsianpmwjvkunn` | same |

> Preview deploys currently share the **production** Supabase project. That means
> a preview build reads and writes real data. Decide deliberately: either keep
> this (previews are effectively prod-connected — treat them as such) or stand up
> a separate Supabase project for previews and set the Preview env vars to it.
> The project-ref guard's approved ref would need to allow both if you split.

The committed `.env` is the fallback/source-of-truth for local dev and is safe to
commit (anon key only). `.env.local` (gitignored) overrides it locally.

---

## Manual steps to activate the remediation

### 1. Cron secret (required for the cron-gated functions)

`daily-brief-cron`, `generate-proactive-alerts`, `activity-summary-email`,
`maintenance-alerts`, `payment-escalation-check`, `learn-from-activity`, and the
scheduled path of `send-maintenance-reminders` now require the
`x-supabase-cron-secret` header. Set the secret in **both** places to the same
value:

```bash
# 1. Function secret (read by the edge functions)
supabase secrets set CRON_SECRET="<long random value>"

# 2. DB setting (read by pg_cron when it calls the function)
#    Run in the SQL editor:
ALTER DATABASE postgres SET app.settings.cron_secret = '<same value>';
```

Migration `20260701000000_cron_send_secret_header.sql` reschedules the
proactive-alerts pg_cron job to send that header. **If `CRON_SECRET` is not set
before this migration is applied, the daily alert job will start returning 403
and alerts will stop** — set the secret first.

If any of the other background functions are scheduled via the Supabase
dashboard cron UI (not in migrations), update those schedules to send the
`x-supabase-cron-secret` header too.

### 2. Apply the new migrations

```bash
export SUPABASE_ACCESS_TOKEN="<token>"
npx supabase db push
```

New migrations:
- `20260701000000_cron_send_secret_header.sql` — cron sends the secret.
- `20260701000001_stripe_webhook_idempotency.sql` — dedupe table for Stripe.
- `20260701000002_restrict_report_images_listing.sql` — blocks anonymous
  enumeration of the `report-images` bucket.
  **Verify after apply:** log in to the portal and confirm report images still
  render, and confirm an anonymous storage `list` on `report-images` returns
  nothing.

### 3. Deploy edge functions

`_shared/` changed (new `cron-auth.ts`, edited `auth.ts` usage), so CI's
`deploy-edge-functions.yml` redeploys **every** function on merge to `main`.
Let it run rather than deploying individually.

### 4. Branch protection (makes CODEOWNERS effective)

On `main`, enable "Require review from Code Owners" so the `.github/CODEOWNERS`
rules actually gate edits to `.env`, `config.toml`, `client.ts`, the workflows,
and the auth helpers. Replace `@homeclarity26` in CODEOWNERS with the exact
owner/team handle if it differs.

---

## Post-deploy verification

Run the Golden Path suite after applying migrations and deploying:

```bash
bun --env-file=.env.local scripts/golden-path-all.ts
```

Spot-check the security fixes:
- Anonymous `POST /functions/v1/get-smart-context` → 401 (was 200).
- Anonymous `POST /functions/v1/generate-proactive-alerts` → 403 (was 200).
- Anonymous `POST /functions/v1/ai-vendor-match` → 401.
- As a client, ask Bobby for another property's report by id → refused.
