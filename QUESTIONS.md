# Product questions for Adam

Open questions for things that need a product decision rather than a code fix.

## Portal Engagement — "Total Logins" vs "Total Page Views"

**Where:** `/admin/clients/:id` → Portal Engagement card.

**What shows up:** For Sarah Johnson on 2026-04-17 E2E run, the card reads
`TOTAL LOGINS 63` / `TOTAL PAGE VIEWS 18`. Post-PR-#40 both numbers now come
from real, uncapped `count: 'exact'` queries — so the data is correct. But
Logins > Page Views is counter-intuitive at a glance and likely to make you
second-guess the metric when a real client is on it.

**Why it happens:** `usePortalTracking` inserts one `client_sessions` row per
page load (every refresh, every return to the tab, every re-auth), but only
inserts a `page_views` row when `activeTab` *changes*. A client who opens the
portal, stays on Home, reloads 10 times, and closes the tab generates
10 sessions and 1 page view.

**Decision needed:** Which feels right?

1. **Relabel the metric.** "Total Logins" → "Portal Opens" or "Sessions".
   Leaves the measurement the same but stops implying Logins ≤ Views.
2. **Change the measurement.** Dedupe `client_sessions` per day per client,
   so "Total Logins" becomes "distinct active days" — which will always be
   ≤ Page Views for any real user.
3. **Log a page_view every time.** Drop the `activeTab !== lastTab.current`
   guard in `usePortalTracking`; a reload on the same tab counts as a view.
   Cheapest fix, matches how the labels read today.

No code change until you pick one. Flag: this isn't a regression — pre-PR-#40
the logins count was capped at 50 and views was capped at 200, so the
inversion was usually hidden by the caps.
