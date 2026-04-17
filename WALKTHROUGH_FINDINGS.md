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
