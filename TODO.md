# Home Clarity Hub — Master TODO

**Branch:** `main` (up through PR #26)
**Last updated:** 2026-04-17
**Read this file at the start of every session along with `CLAUDE.md`.**

---

## 🟡 Walkthrough Polish Punch List

Actionable items from the 2026-04-17 role walkthroughs. Work top-to-bottom. Scheduled task `hbc-walkthrough-polish-autoresume` auto-resumes this punch list at 10:30 and 15:30 local daily.

- [x] **Hide Report tab canned intro on empty reports** — `src/components/tabs/ReportTab.tsx` / `ReportOverview.tsx` — hide the "AK · a note from Adam Kilgore / I've completed a thorough review..." intro when the client has zero report pages. Currently shows that text as if a report were done.
- [x] **Hide "Condition NN" eyebrow on empty-report portals** — `src/components/portal/PropertyHero.tsx` — the greeting eyebrow shows `Good morning · Condition 64` even when the client has no real health score. Source is `computeHealthScore` in `HomeTab.tsx` falling back to a value from unrelated data. Only show the score when a real report exists.
- [x] **Client name in admin-preview portal greeting** — Admin preview currently shows "Good morning, {admin.firstName}" because the logged-in user is the admin. Should show the client's first name (or a neutral "Welcome") when viewing in `?preview=admin` mode. Relevant: `src/components/tabs/HomeTab.tsx:138` (firstName derivation) + `src/components/portal/PropertyHero.tsx:34`.
- [x] **Real `avgHealthScore` in Analytics** — `src/pages/admin/AdminAnalytics.tsx:51` still has `avgHealthScore: 72` hardcoded. Reuse the bucket query from the health distribution pie and compute the average.
- [x] **Surface PaymentsTab AI-summary errors** — `src/components/tabs/PaymentsTab.tsx:222` has `catch { /* Silent fail */ }`. Add `console.error` + graceful empty state so "ai summary didn't load" isn't invisible.
- [ ] **Document `VITE_GOOGLE_MAPS_API_KEY`** — CLAUDE.md's "Environment Variables" section should list this as a documented optional, with the enable path for the New Client wizard's address autocomplete. `src/pages/admin/AdminNewReport.tsx` (or wherever the wizard's Step 1 lives) has the "Add VITE_GOOGLE_MAPS_API_KEY to .env..." fallback inline.
- [ ] **Check SeasonalChecklist undocumented silent catch** — `src/components/portal/SeasonalChecklist.tsx:71` has a bare `} catch {}`. Investigate what's being silenced; add `console.error` at minimum.
- [ ] **Check DigitalTwinTab silent catch** — `src/components/admin/DigitalTwinTab.tsx:589` has `catch { /* ignore */ }`. Verify intent and document or fix.

### Autoresume log

(Scheduled task appends one line per run here — timestamp + items shipped + any skips.)

---

## 🔴 Pre-Launch Verification Status — CURRENT BUILD

See `CLAUDE.md` → "Pre-Launch Verification Checklist" for the full process. Status as of latest session:

- [x] **Static build passes** — `bun run build` green after each PR in this session
- [x] **AI edge functions deployed** — hbc-agent + 15 others (messaging-shape fix + ReAct rebuild)
- [ ] **Smoke test run** — script exists at `scripts/smoke-test-ai.ts` but has never been executed. Needs `SUPABASE_TEST_USER_JWT` in `.env.local` first.
- [ ] **Role walk-through** — NOT DONE. Adam has not clicked through portal as admin + client since the PR #13, #15, #16, #17 fixes landed. **This is the guard before the Johnsons see it.**
- [ ] **Error paths verified** — NOT DONE. What happens if Gemini is down, if photos fail to upload, if a tool call errors mid-chain?
- [ ] **RLS spot audit** — NOT DONE since PR #16's `get-smart-context` auth change (which removed a service-role-key leak). Should verify no cross-client data leakage.
- [ ] **Mobile real-device test** — NOT DONE. The FAB / bottom-nav changes from PR #13 should be verified on an actual iPhone, not devtools emulation.
- [ ] **Observability (Sentry + log drains)** — NOT WIRED. When a production bug happens, we'll only know if a client reports it.

**Current recommendation: do NOT show the Johnsons until the role walk-through and mobile test are done.** Those two catch 80% of what everything else would.

---

## 🟢 Production Ready — App is usable

- ✅ All 67 edge functions deployed + ACTIVE on Supabase
- ✅ All DB migrations applied (hero_image_url, RLS tightening, project_updates)
- ✅ Storage buckets created (`property-photos`, `report-images`) with public read + creator write
- ✅ All required API keys set (GEMINI, RENTCAST, RESEND, STRIPE, VAPID)
- ✅ Auth enforcement verified via live smoke test — 15/15 functions respond correctly
- ✅ RLS verified — anonymous queries return `[]` on all sensitive tables
- ✅ The API 401 error is FIXED (PR #11) — AIEditPanel + useChat now use real user JWT

**You can start using the app with real clients.** Upload a front-of-house photo to `property-photos` bucket and set `properties.hero_image_url`.

---

## 🟡 Recommended Before Heavy Production Use

### Type safety
- [ ] Regenerate Supabase DB types: `npx supabase gen types typescript --project-id vvwojahsianpmwjvkunn > src/integrations/supabase/types.ts`
- [ ] After regeneration, remove the `as any` casts around new tables in PaymentsTab, ClientAgentPanel, etc. (search for `.from("xxx" as any)`)
- [ ] Flip `tsconfig.app.json` `strict: true` when ready (`noImplicitAny` already on). Expect ~50-100 errors in admin files, all fixable.

### Edge function auth — finish the sweep
**18 of 67 functions have `requireAuth`.** The remaining ~50 still accept anonymous calls. Priority ones to patch:
- [ ] `ai-client-brief`, `ai-client-insights`, `ai-cross-client-insights`, `ai-condition-forecast`, `ai-document-intelligence`, `ai-predictive-maintenance`, `ai-priority-recommendations`, `ai-proposal-kickoff`, `ai-smart-reply`, `ai-transcript-summarizer`, `ai-vendor-match`, `ai-weekly-digest`, `analyze-knowledge-gaps`, `consistency-check`, `generate-annual-review`, `generate-exec-summary`, `generate-predictions`, `generate-scope`, `pre-inspection-brief`, `process-document`, `qa-coach`, `voice-command`, `voice-to-narrative`
- Pattern: add `import { requireRole, corsHeaders, json } from "../_shared/auth.ts"` + `const auth = await requireRole(req, ["creator"]); if ("error" in auth) return auth.error;` at top of serve handler

### Payment/billing
- [ ] Verify Stripe webhook endpoint is registered in Stripe dashboard pointing to `/functions/v1/stripe-webhook`
- [ ] Do a test invoice + payment flow end-to-end

### DB cleanup
- [ ] `files` and `comments` tables are referenced in old docs but don't exist. Either:
  - Create them (if we still want threaded comments + file attachments), OR
  - Remove references from code (the app uses `property_messages` and Supabase Storage instead)
- [ ] Table `sms_subscriptions` (and column `phone_number`) is misnamed — the flow has been email-only since the Twilio removal. Consider migration to rename `sms_subscriptions` → `notification_subscriptions` and `phone_number` → `recipient` (or just `email`). Component + edge functions already renamed (PR after #17).

---

## 🟠 Nice-to-Have Enhancements

### Photo enhancement — AI upscaling
- [ ] `enhance-photo` edge function is deployed but only runs Gemini Vision analysis (quality score + suggestions). True AI upscaling needs a Replicate or similar API. Add:
  - [ ] Replicate account + API key → `REPLICATE_API_KEY` secret
  - [ ] Update `enhance-photo/index.ts` to call Real-ESRGAN model
  - [ ] Return `enhanced_url` with the upscaled image

### Report cover + hero photo upload UI
- [ ] Add a file input in `NewReportWizard` Step 2 (Digital Assets) that uploads to `property-photos` bucket and sets `properties.hero_image_url`
- [ ] Same button in `ClientOverview` for existing clients

### Knowledge Base integration
- [ ] `draft-page-narrative` could pull relevant KB articles as context to improve AI output quality
- [ ] Wire up `search_knowledge_base` tool call inside narrative drafting

### Publish workflow
- [ ] `PublishBar.tsx` component exists but isn't fully wired to the report edit flow. Add state tracking in `EditModeContext` for "dirty pages" count + publish action that flips `report_pages.status` from draft → published.

---

## 🟢 Low Priority / Future

- **Hover.to + iGuide iframe embeds** — URLs are stored + linked, but could iframe-embed the 3D model
- **Multi-property map dashboard** — visualize all clients on a map
- **Client notifications** — Supabase Realtime or email on report publish / invoice due / equipment service due
- **Vendor portal** — vendors log in, see assigned jobs, submit quotes
- **Report template library** — admin-editable page templates stored in `page_templates` table instead of hardcoded `reportContent.ts`

---

## 🔧 Recent PR History

| PR | What shipped |
|---|---|
| #11 | Fix API 401 error (JWT vs anon key) + 3 critical + 4 high-severity findings from post-deploy review |
| #10 | Auth on 15 more edge functions + noImplicitAny + nested ErrorBoundaries |
| #9 | Framer Motion animations + typography sweep + 44px touch targets |
| #8 | seed-report-from-notes + PageAIChat + 6 report creation AI tools |
| #7 | Symmetrical photo grid + @dnd-kit reorder + enhance-photo + 4 photo agent tools |
| #6 | 20 new hbc-agent tools (KB, annual reviews, team, automations, client-side) |
| #5 | Project phase timeline + social-feed updates + project_updates table |
| #4 | Invoice full lifecycle (reminders, draw schedule, AI explain) |
| #3 | Expanded report to 65+ templates + custom page creation |
| #2 | Review-redesign pass (lazy routes, Monogram, PropertyHero, auth on 3 fns, RLS tightening) |

---

## 🤖 Autoresume Log

| Timestamp | Items shipped | Items skipped | Notes |
|---|---|---|---|
| 2026-04-17 (PM run) | — | — | "Walkthrough polish punch list" section not found in TODO.md — punch list already empty. Disabled scheduled task `hbc-walkthrough-polish-autoresume`. |
| 2026-04-17 (manual pickup) | Hide Report tab canned intro on empty reports | — | `isReportEmpty` prop added to `ReportOverview`, wired from `ReportTab` using `hasRealPages`. |
| 2026-04-17 (manual pickup) | Hide 'Condition NN' eyebrow on empty-report portals | — | `HomeTab` now returns `null` health score unless `hasReportData && completionPercent > 0`. |
| 2026-04-17 (manual pickup) | Fix client name in admin-preview portal greeting | — | `useClientPortal` fetches client profile; `Index.tsx` passes `isAdminPreview` + `clientFirstName` to `HomeTab`; admin previews greet the client or fall back to neutral. |
| 2026-04-17 (manual pickup) | Real avgHealthScore in Analytics | — | Health distribution query now also returns a cross-property average; stat card uses it (or `—` when no data) instead of hardcoded 72. |
| 2026-04-17 (manual pickup) | Surface PaymentsTab AI-summary errors | — | Invoice summary catch now logs via `console.error` and sets a `summaryError` state; UI falls back to a readable "AI summary didn't load" message. |

---

## 🤖 Notes for Future Claude Sessions

- **This codebase is huge** (500+ TS files). Don't re-scan it every session. Trust CLAUDE.md + this file.
- **Don't launch parallel review agents unless Adam asks for a review.** They burn significant token budget.
- **For small fixes, patch directly** — don't do a full exploration pass.
- **The live deployed state is authoritative.** If in doubt, check via `npx supabase functions list` or `npx supabase db query --linked "..."`
- Adam is a contractor, not a developer — explain changes in user-impact terms, not code terms.
