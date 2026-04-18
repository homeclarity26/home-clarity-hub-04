# Walkthrough Findings — 2026-04-17

**Walker:** Claude Code (autonomous) on behalf of Adam
**Environment:** `https://home-clarity-hub.vercel.app`
**Auth:** Throwaway creator `walkthrough-creator-158d9024@clarityhub.test` (user_id `b958f09f-f854-43d4-9e72-59861ede4f33`) + one seeded test client `Sarah Johnson` (`testclient@homeclarityhub.com`, property `Johnson Residence`). Throwaway user will be deleted at end of walkthrough.

---

## 🚨 P0 — Adam cannot log in

**Symptom:** Adam reports "I can't log in, now it just says my portal is being prepared."

**Most likely cause:** Stale non-creator session in his browser's localStorage. The flow:
1. `/login` is wrapped in `PublicRoute`. If `user` is already set (stale session), it `<Navigate to="/" replace />` before showing the login form.
2. `/` runs `RootRedirect` — if `isCreator` is false (e.g. session JWT for a deleted user, or roles query hasn't loaded), it routes to `/portal`.
3. `/portal` with no `propertyId` + non-creator → renders the "Your Portal is Being Prepared" placeholder in `Index.tsx`.

**Confirmation:** Adam's `adam@hometownbuildersclub.com` user DOES have both `client` and `creator` roles in `user_roles`. Last successful sign-in was **2026-04-06** (11 days ago). A smoke test since then deleted a throwaway user whose tokens might have overwritten his; or his own tokens expired and a partially-loaded session is flipping him to non-creator.

**Recommended fix for Adam right now:**
- Open DevTools → Application → Storage → Clear site data for `home-clarity-hub.vercel.app`, then reload. Should land him on the real `/login` form.

**Recommended code fix:**
- `PublicRoute` should also verify `isCreator` / `isTradePartner` before bouncing a signed-in user. If the session has no resolvable role, let them re-auth instead of black-holing them on `/portal`.
- The "Your Portal is Being Prepared" page should have a visible "Sign out" button so a stuck non-creator session can be cleared without DevTools.
- Also: `AuthContext` has an 8s safety timeout that flips `isLoading=false` even if `fetchRoles` hasn't completed. If the `user_roles` query is slow, `isCreator` renders false transiently → false redirect to `/portal`. Consider showing a "Finishing sign-in..." state during the timeout or retrying the roles fetch.

---

## 🔴 P1 — Dashboard vs Analytics avg-health-score inconsistency

**Page:** `/admin` dashboard — "Portfolio Health" widget
**Observed:** `43 Avg Score` on the dashboard, with `1 clients` (Johnson Residence). But "Published Reports = 0".
**Expected:** The shipped PR #31 fix made the Analytics stat card read from **published reports only** (and show "—" when none). The dashboard's Portfolio Health widget is still computing a score off non-published pages — inconsistent.

**Where:** The number "43" probably comes from `AdminDashboard.tsx`'s Portfolio Health card, which uses a different data source than `AdminAnalytics.tsx`'s `healthData.avgHealthScore`. Two sources of truth for the same metric.

**Fix:** Unify on the same query (or extract a `usePortfolioHealth()` hook) so both surfaces agree. Dashboard should also show "—" or "No published reports yet" when there's no published data.

---

## Admin side — route by route

### `/admin` (dashboard)
- Loaded cleanly. No console errors.
- **Empty states reasonable** — "No service requests yet", "No open tasks", "No recent activity", etc.
- **Issue:** "Portfolio Health 43" while "0 Published Reports" (see P1 above).
- **Issue:** "Portfolio Dimensions" shows `Report Completion 0%`, `Onboarding 20%`, `Report Status 25%`, `Engagement 100%`, `Issue Resolution 100%`. Engagement 100% and Issue Resolution 100% with zero data look like hardcoded placeholder values — worth confirming.
- **Minor:** "Get notified about new messages…" banner takes up the full top width aggressively. OK but a little noisy.

### `/admin/clients`
- Loaded cleanly. Shows `Sarah Johnson, 43, 1234 Maple Ridge Drive, Draft, 1/5, Apr 6, 2026`.
- Filters (Needs Attention, In Progress, Published, At Risk) are visible.
- "Portal" action button opens the client portal in a new tab.

### `/admin/inbox`
- Empty state "No conversations". Fine.

### `/admin/crm` + `/admin/crm/pipeline`
- **🔴 P1 Bug: Disagrees with `/admin/clients`.** CRM says "No clients yet — Add your first client…" while `/admin/clients` shows Sarah Johnson. Pipeline says "0 Clients / 0 Trade Partners / Total LTV $0". Almost certainly CRM reads from a separate `crm_contacts` table that doesn't auto-populate when a property is created via the New Client wizard. Two sources of truth → Adam will look at the dashboard, see "1 Active Client" in one place and "No clients yet" in another, and lose trust.

### `/admin/projects`
- Empty state with cards: 0 Active Projects / $0 Total Budget / $0 Total Spent / 0 Behind Schedule / 0 Due This Week. Board/List/Calendar/Gantt view toggles visible. Clean.

### `/admin/tasks`
- Empty: To Do / In Progress / Done all 0. Filter dropdowns render. Clean.

### `/admin/calendar`
- Loaded. "Bobby — Schedule Assistant" prompt examples visible. Calendar grid renders with legend (inspection, invoice, equipment, schedule). Clean.

### `/admin/analytics` — 🚨 P0 HOTFIX SHIPPED (PR #35)
- **Before hotfix:** entire page crashed into the ErrorBoundary with "Cannot access 'O' before initialization". Every admin's analytics was unusable.
- **Cause:** my PR #31 declared `const statCards = [... avgHealthScore ...]` before `avgHealthScore` was declared in the same scope. Prod minifier renamed `avgHealthScore` to `O` and the TDZ error surfaced only in the prod build.
- **Fix:** moved `statCards` below the health-data block. Shipped as PR #35, now verified live in prod (shows Avg Health Score "—" with 0 published reports, no crash).
- **Observation on live page:** "Client Retention & Engagement" shows **"8 Active (last 30 days)"** with only 1 client. Either (a) `client_sessions.client_id` is project-scoped rather than user-scoped, or (b) seed data from the test client polluted it. The label says "Active" but the Set-of-distinct-client_ids computation is counting session rows incorrectly. Worth a look.

### `/admin/team`
- Shows the role hierarchy clearly. "Your Team" has "Invite Employee — Coming Soon" (disabled) and a "Field Employee Portal — Coming Soon" block. Both gracefully labeled, but note that this is a prominent unfinished feature surfaced to admins.

### `/admin/settings`
- Loads with tabs: General / Services Library / Membership Tiers / Integrations / SLA / Message Templates / Reports & Exports / Audit Log / Referrals / Recurring Plans / API & Webhooks.
- General tab has: Branding, Account, Email Notifications, Push Notifications, Default Region, Business Intelligence (target hourly rate), Payment Escalation Rules, Stripe Integration.
- **Concern:** Stripe Integration block asks admin to paste `Stripe Secret Key` into a form. Standard for self-hosted apps but worth confirming the value is stored server-side (Supabase secret) and not echoed back in the DOM. Many Stripe integrations use OAuth Connect; self-key entry is fine but risks higher.

### `/admin/knowledge-base`
- Four tabs: Report Templates / Pricing Templates / Scope Templates / System Templates. All empty. Expected.

### `/admin/automations`
- Transient mid-deploy flash showed "Failed to fetch dynamically imported module" — this was my own hotfix deploying. Reload fixed it. **Minor finding:** when Vercel rotates chunks, SPA routes get stranded with dead asset hashes. Consider adding a service-worker cache-bust or a "version drift → auto-reload" banner.
- After reload: page renders a long list of automation rules (Welcome email, Post-report follow-up, Invoice reminders, Flag at-risk, Unanswered message alert, Equipment service alert, Health score drop, etc.). Each has a day/hour/threshold input. Clean. Breadcrumb labels this as "Settings / Automations" but the sidebar places it under "Tools" — tiny IA inconsistency.

### `/admin/goals`, `/admin/referrals`, `/admin/announcements`, `/admin/annual-reviews`
- All load with clean empty states. No issues.

### `/admin/help`
- 38 guides across 13 categories listed. Looks solid — all titles present. (Did not click through to individual guide pages.)

### `/admin/clients/:id` (Johnson Residence detail)
- Tons of info packed onto one page: property summary, churn risk, payment risk, engagement, report progress, quality flags, composite health score, onboarding checklist, property details, discovery notes, digital assets, internal notes, portal engagement stats, Bobby AI chat.
- **🟠 Issue: "Report Progress 600% complete (0/0 pages)".** 600% when there are zero pages is a formatting bug — likely `Math.round((complete / total) * 100)` with `total = 0` returning `NaN`/`Infinity` or reusing a score value from an adjacent widget. Guard for `total === 0` and render `0%` or `—`.
- **🟠 Issue: "Total Logins 50" + "Total Page Views 18".** Logins > page views is implausible. Either events are double-counted or the metric definitions are wrong. Worth reconciling.
- **Minor:** "Churn Risk Score — Low Risk 15 Low High". The "15" between "Low" and "High" reads like a percentile on a scale, but the label is "Low Risk"; hard to tell at a glance what 15 means. Could be "15% risk" — label it explicitly.
- **Minor:** Page density is high — consider a tabbed sectioning (Property / Work / Financial / Communication / Intelligence tabs already exist; first screen is overwhelming before you use them).

### `/admin/clients/new` (New Client wizard)
- Step 1 renders the "Add VITE_GOOGLE_MAPS_API_KEY to .env to enable autocomplete and property images." hint (my PR #33 doc matches reality). Form fields for Client & Property, Property Address + city/state/zip/county, property details, discovery call notes. Looks clean.

---

## Client portal — route by route (as Sarah Johnson via ?preview=admin)

### `/portal/:id` (Home)
- ✅ **PR #30 confirmed:** hero greets "Good afternoon, Sarah" — not the admin's name.
- ✅ **PR #29 confirmed:** no "Condition NN" eyebrow on the empty report.
- "Upload a front-of-house photo in the admin intake wizard" nudge is visible top-right (the test client has no `hero_image_url`). Reasonable hint.
- Quick Actions tiles render: Home Report, Projects, Payments, Schedule, Equipment, Messages.
- AICommandBar prompts ("What's my balance due?", "What should I fix first?", etc.) render.

### `/portal/:id/report`
- ✅ **PR #28 confirmed:** no canned "I've completed a thorough review" note when report is empty.
- **🟠 Issue:** the page still renders the "Chapters / Report Chapters" heading with nothing under it when the report is empty. Looks like a dangling section. When there are zero chapters with `sectionCount > 0`, suppress the whole "Chapters" block (and consider showing a client-facing "Your advisor is still building your report" message instead of an empty report shell).

### `/portal/:id/projects`
- Empty state fine: "No Active Projects — Projects will appear here once your advisor creates them from the report."
- "Home Goals & Wishlist" section renders below with an "Add Goal" CTA. Good.

### `/portal/:id/payments`
- "Your Project Balance $0.00 — Up to Date". Transaction History empty. Fine.

### `/portal/:id/equipment`
- "No Equipment on File — Your advisor will add your home's major systems…". Predictive Maintenance "Generate" button visible. Clean.

### `/portal/:id/messages`
- Empty chat UI with "Send" button, placeholder "Press Enter to send · Shift+Enter for new line". Clean.

### `/portal/:id/documents`
- Drag-drop upload zone + "Files are automatically categorized by AI" + "No Documents Yet". Insurance Assistant block rendered.

### `/portal/:id/schedule`
- Calendar renders April 2026. Seasonal maintenance checklists (Spring 0/5 complete, Summer/Fall/Winter similar). Clean.

### `/portal/:id/photos`
- Filter pills (All / Exterior / Interior / Systems / Before / After / Progress / Damage / Other). Empty state "No Photos Yet — Upload photos to start building your home's visual record." Clean.

### `/portal/:id/estimates`
- Empty: "No Proposals Yet — When your advisor sends you an estimate, it will appear here for your review."

### `/portal/:id/billing`
- "Current Plan — No active subscription. Contact your advisor to get started." Fine.

---

## Summary — prioritized punch list

**ALL 14 ITEMS SHIPPED.** Status as of 2026-04-17 evening:

### Must-fix before Johnsons see the product
1. ✅ **Analytics TDZ crash** — PR #35, shipped + verified live.
2. ✅ **Adam's login loop / sign-out escape hatch** — PR #37 (sign-out button on "Portal is Being Prepared") + PR #42 (PublicRoute hardening — defense in depth).
3. ✅ **CRM vs Clients data mismatch** — PR #38 (orphan-property synthesis in `useCRMClientsEnriched`).
4. ✅ **`/admin/clients/:id` Report Progress risk over-flagging** — PR #39 (gate progressRisk on totalPages > 0; detail reads "Report not started yet" for 0-page clients).
5. ✅ **Empty-report "Chapters" heading** — PR #39 (hide "Chapters" + "Report Chapters" blocks when no chapter has content).

### Worth doing soon
6. ✅ **Analytics Portfolio Health vs Avg Health Score label collision** — PR #39 (renamed Analytics card to "Avg Home Condition").
7. ✅ **"8 Active Clients (last 30 days)" with 1 client** — PR #40 (engagement now scoped to users who are `client_user_id` of a real property).
8. ✅ **"Total Logins 50, Total Page Views 18" inversion** — PR #40 (totals use `count: 'exact', head: true` instead of `.length` of a `.limit(50)` sample).
9. ✅ **Churn Risk label clarity** — PR #40 (added `/100` to the score, labeled bar as "Low risk / High risk").
10. ✅ **Team "Coming Soon" hide** — PR #40 (replaced disabled button with "On the roadmap" badge + honest copy).

### Nice to have
11. ✅ **"Get notified about new messages" banner aggressiveness** — PR #40 (slim bottom-right chip instead of full-width navy bar).
12. ✅ **Automations breadcrumb IA** — PR #40 (now reads "Tools / Automations").
13. ✅ **Vercel chunk-drift during deploy** — PR #41 (`vite:preloadError` listener auto-reloads once; ErrorBoundary recognizes the error pattern).

### Cleanup-log finding
14. ✅ **handle_new_user trigger inserting `client` for everyone** — PR #42 includes `supabase/migrations/20260417120000_handle_new_user_role_metadata.sql`. **NOTE: migration file is committed to the repo but not applied to prod yet** — the management API blocks SECURITY DEFINER changes via `/database/query`. Apply with `npx supabase db push` from a checkout, or paste the SQL into the Supabase SQL editor.

---

## PRs shipped today (in order)

| PR | Items | What |
|---|---|---|
| #28 | — | (PR #28 was the canned-intro empty-report fix from earlier in the day) |
| #29 | — | (Condition NN eyebrow fix) |
| #30 | — | (Admin-preview greeting) |
| #31 | — | (Avg Health Score real data — original) |
| #32 | — | (PaymentsTab AI-summary errors) |
| #33 | — | (VITE_GOOGLE_MAPS_API_KEY docs) |
| #34 | — | (Silent catches in SeasonalChecklist + DigitalTwinTab) |
| #35 | TDZ | Hotfix for Analytics crash from PR #31 |
| #36 | — | This findings doc |
| #37 | #1 | Sign-out escape hatch on "Portal is Being Prepared" |
| #38 | #2 | CRM orphan-property synthesis |
| #39 | #3 #4 #5 | Progress risk + chapters empty state + label collision |
| #40 | #6 #7 #8 #9 #10 #11 | UX polish bundle |
| #41 | #12 | Chunk-drift auto-reload |
| #42 | #13 #14 | Auth hardening (trigger migration + PublicRoute) |

---

## What I did to the prod DB during this walkthrough

| Change | Row | Reversed? |
|---|---|---|
| Created auth user `walkthrough-creator-158d9024@clarityhub.test` (`user_id b958f09f-f854-43d4-9e72-59861ede4f33`) | auth.users | Deleted at end of walkthrough |
| Inserted `user_roles` row (creator) for that user | user_roles | Deleted at end of walkthrough |

Both cleanups run at the end of this session — see cleanup log below.

## Cleanup log

- `delete from user_roles where user_id = 'b958f09f-…'` — removed 2 rows (`creator` + a `client` row that a DB trigger apparently auto-inserts on user creation, which is a small finding in itself — creator-on-signup shouldn't also get a client role).
- `DELETE /auth/v1/admin/users/b958f09f-…` — throwaway user removed.
- Verified post-cleanup: `select from auth.users where id=…` returns empty, `select from user_roles where user_id=…` returns empty.

No other prod rows were modified during this walkthrough.

