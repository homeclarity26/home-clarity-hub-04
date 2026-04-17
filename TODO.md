# Home Clarity Hub — Master TODO

**Branch:** `main` (up through PR #11)
**Last updated:** 2026-04-16
**Read this file at the start of every session along with `CLAUDE.md`.**

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

## 🤖 Notes for Future Claude Sessions

- **This codebase is huge** (500+ TS files). Don't re-scan it every session. Trust CLAUDE.md + this file.
- **Don't launch parallel review agents unless Adam asks for a review.** They burn significant token budget.
- **For small fixes, patch directly** — don't do a full exploration pass.
- **The live deployed state is authoritative.** If in doubt, check via `npx supabase functions list` or `npx supabase db query --linked "..."`
- Adam is a contractor, not a developer — explain changes in user-impact terms, not code terms.
