# PHASE 9 — Recurring Care + Notifications

Goal: ship the live-management surface for recurring services, plus the proactive notification engine.

---

## PR #25 — Recurring Care section in Schedule

**Branch:** `phase-9/pr-25-recurring-care`
**Files:** new `RecurringCareSection.tsx`, possibly migration to extend `recurring_services`, `ScheduleTab.tsx`

**Tasks:**

1. If a `recurring_services` table already exists from prior work (migration `20260427000003_create_recurring_services.sql`), extend it with columns needed for live management:
   - `last_visit timestamptz`
   - `next_visit timestamptz`
   - `total_spent_ytd numeric DEFAULT 0`
   - `vendor_id uuid REFERENCES vendors(id)`
   - `frequency_label text`

If table doesn't exist, create it.

2. Create `RecurringCareSection.tsx`:
   - List of recurring services
   - Each row: vendor photo, name, frequency, last visit date, next visit date, cost per visit, total spent YTD, "Rebook" button
   - "Rebook" opens a date picker + confirmation

3. Add `<RecurringCareSection />` as the second section in `ScheduleTab.tsx` (after the calendar view).

**Verify:** build clean, tsc 0. Visit /portal/{id}/schedule — see Recurring Care section.

**Merge:** auto.

---

## PR #26 — Proactive alerts engine + notification bell

**Branch:** `phase-9/pr-26-alerts`
**Files:** new migration, new edge function, new `NotificationBell.tsx`, `Header.tsx`

**Tasks:**

1. Migration `supabase/migrations/{timestamp}_create_proactive_alerts.sql`:

```sql
CREATE TABLE public.proactive_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  severity text NOT NULL CHECK (severity IN ('info', 'recommended', 'urgent')),
  type text NOT NULL CHECK (type IN ('age_based', 'service_overdue', 'warranty', 'recall', 'seasonal', 'project_aware')),
  title text NOT NULL,
  body text NOT NULL,
  action_label text,
  action_url text,
  due_date date,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'shown', 'acknowledged', 'resolved', 'dismissed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_proactive_alerts_property_status ON public.proactive_alerts(property_id, status, created_at DESC);

ALTER TABLE public.proactive_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Homeowners read own alerts" ON public.proactive_alerts
  FOR SELECT USING (
    property_id IN (SELECT id FROM public.properties WHERE owner_id = auth.uid())
  );

CREATE POLICY "Creators read all" ON public.proactive_alerts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'creator')
  );
```

2. Edge function `supabase/functions/generate-proactive-alerts/index.ts` — runs on cron (daily). Scans each property's systems/appliances/projects and emits new alerts based on rules:
   - Systems > 80% lifespan → age_based
   - Last service > 12 months ago → service_overdue
   - Warranty expiring < 60 days → warranty
   - Seasonal trigger by month → seasonal
   - Project budget watermark hit → project_aware

3. Frequency capping in the edge function: max 3 alerts per property per week.

4. Create `NotificationBell.tsx` — bell icon with count badge in header. Tap → dropdown of pending alerts. Each alert has acknowledge/resolve/dismiss actions.

**Verify:** migration applies, types regen, build clean, tsc 0. Run edge function manually for a test property — see alerts populate.

**Merge:** auto.

---

## PR #27 — Today's Brief + What Changed feed on Portal Home

**Branch:** `phase-9/pr-27-portal-feeds`
**Files:** new `TodaysBrief.tsx`, new `WhatChangedFeed.tsx`, update `PortalHome.tsx`

**Tasks:**

1. Port `TodaysBrief` component from `caldwell_prototype_v2.html` lines 2338+. Pulls top 3 actionable proactive alerts from `proactive_alerts` table.

2. Create `WhatChangedFeed.tsx` — lists recent changes to the home (new photos, completed work, AI-suggested updates). Pulls from:
   - `report_pages.updated_at` > 30 days ago
   - `copilot_inbox` rows where status = 'absorbed' < 30 days ago
   - Other recent changes

3. Place both in `PortalHome.tsx` between Bobby input bar and media cards.

**Verify:** build clean, tsc 0. Visit Portal Home — see Today's Brief and What Changed sections.

**Merge:** auto.

---

**End of Phase 9.** Append `- [x] PHASE 9 COMPLETE` to `TODO.md`.

Next: read `docs/rebuild/PHASE_10.md`.
