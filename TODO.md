# Home Clarity Hub — Master TODO

**Branch:** `main` (through PR #122)
**Last updated:** 2026-04-27
**Read this file at the start of every session along with `CLAUDE.md`.**

---

## 🚦 HCR Rebuild Status — 2026-04-27

The v2 rebuild (PRs #101–#122) is functionally complete. All Phase 1–9 tickets have shipped.

### What shipped (this session)
- **#119** — d5a: fix eslint-disable scope for condition-rating palette objects
- **#120** — d5b: fix eslint-disable scope for brand-config objects + #fff → white
- **#121** — r1-r5: retire old wizard (BuildMyReport, ReportPageManager, NewReportWizard, 10 files, 3,081 lines deleted)
- **#122** — z3-fix: move content-ops + static-integrity to ai-dependent CI matrix (fix tests 51+57 flakes)

### What remains for Adam
- **W8** — Manual walk-through of the new 5-step wizard at `/admin/clients/new`. Adam creates a real HCR report from scratch. Gate for confirming the wizard is production-ready.
- **Z5** — Final sign-off session. Adam confirms the full portal, verifies mobile on a real device, and marks the rebuild done.

### Nothing else is blocking. The only two remaining items are Adam's actions.

---

## 🔴 CI / Build Health

- CI: 11 jobs (build + 5 deterministic + 6 AI-dependent). All green on `main` as of PR #120.
- PR #121 and PR #122 are in CI — expected green (pure deletions + YAML change).
- After #121 and #122 merge, trigger a final full run via the Actions tab "Run workflow" button.
- Golden Path baseline: 62/62. Must stay 62/62.

---

## 🟡 Open Items (non-blocking, post-rebuild)

### Edge function auth sweep (still incomplete)
The original auth sweep reached 18/70 functions. ~52 still accept anonymous calls.
Priority ones to lock down when time permits:
- `ai-client-brief`, `ai-client-insights`, `ai-cross-client-insights`, `ai-condition-forecast`
- `ai-document-intelligence`, `ai-predictive-maintenance`, `ai-priority-recommendations`
- `ai-proposal-kickoff`, `ai-smart-reply`, `ai-transcript-summarizer`, `ai-vendor-match`
- `ai-weekly-digest`, `analyze-knowledge-gaps`, `consistency-check`
- `generate-annual-review`, `generate-exec-summary`, `generate-predictions`
- `generate-scope`, `pre-inspection-brief`, `process-document`, `qa-coach`
- `voice-command`, `voice-to-narrative`
Pattern: add `import { requireRole, corsHeaders, json } from "../_shared/auth.ts"` + role check at top of serve handler.

### Type safety
- `tsconfig.app.json` has `strict: false`. `noImplicitAny` is on. When ready, flip `strictNullChecks: true` — expect ~50–100 errors, all fixable.
- After any migration, regenerate types: `SUPABASE_ACCESS_TOKEN=$PAT npx --yes supabase gen types typescript --project-id vvwojahsianpmwjvkunn > src/integrations/supabase/types.ts`

### Payment/billing
- Verify Stripe webhook endpoint is registered in Stripe dashboard pointing to `/functions/v1/stripe-webhook`
- Do a test invoice + payment flow end-to-end

### Photo enhancement
- `enhance-photo` runs Gemini Vision analysis but no true AI upscaling. Replicate/Real-ESRGAN would be needed for upscaling. Low priority.

### Observability
- Sentry not wired to frontend. Supabase log drains not configured. When a prod bug happens, Adam only knows if a client reports it.

---

## 🟢 Production Ready

- ✅ 66 edge functions deployed + ACTIVE
- ✅ All DB migrations applied through 2026-04-27
- ✅ Storage buckets: `property-photos` + `report-images` (public read, creator write)
- ✅ All required API keys set (GEMINI, ANTHROPIC, RENTCAST, RESEND, STRIPE, VAPID)
- ✅ Auth enforcement: 18/66 functions explicitly auth-gated; RLS guards all tenant data
- ✅ Photo functions switched to `gemini-flash-latest` + 90s timeout (hotfix PR #117)
- ✅ 5-step wizard at `/admin/clients/new` is the sole entry point for new HCR reports
- ✅ Old wizard (BuildMyReport, ReportPageManager, NewReportWizard) fully retired (PR #121)
- ✅ IBM Plex Mono loaded (PR #108)
- ✅ Em-dash ESLint rule active (PR #116)
- ✅ Health Score UI removed system-wide (PRs #101, test 58 in golden-path-static-integrity)
- ✅ HCR brand colors locked system-wide

---

## 🤖 Notes for Future Claude Sessions

- **This codebase is large** (500+ TS files). Don't re-scan it every session. Trust CLAUDE.md + this file.
- **Don't launch parallel review agents unless Adam asks.** They burn significant token budget.
- **For small fixes, patch directly** — no full exploration pass.
- **The live deployed state is authoritative.** If in doubt: `SUPABASE_ACCESS_TOKEN=$PAT npx --yes supabase functions list`
- **Old wizard is gone.** Do not reference BuildMyReport, ReportPageManager, or NewReportWizard. The entry point is `/admin/clients/new` → `AdminNewReportV2` → 5-step wizard in `src/components/admin/wizard/`.
- **Photos use gemini-flash-latest** (not gemini-pro-latest) per hotfix PR #117.
- **CI matrix**: 5 deterministic flows + 6 AI-dependent flows (content-ops and static-integrity moved to AI-dependent in PR #122).
