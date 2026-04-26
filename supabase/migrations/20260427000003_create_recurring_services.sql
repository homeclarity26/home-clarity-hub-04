-- HCR rebuild Phase 1 / M3: create recurring_services.
--
-- Powers the Recurring Services Register (Master Spec Section 3, ticket B6
-- and Section 4, ticket SP). One row per service per property. Replaces
-- the partial concept that lived only in service_history (which is a log
-- of past EVENTS, not a register of standing services).
--
-- WHY a register is needed alongside service_history:
--   - service_history answers "what happened?" — useful for receipts and
--     warranty claims
--   - recurring_services answers "what is supposed to happen, and when's
--     the next one?" — drives the table renderer ([v2.35]), the
--     "If HBC managed" column, and the M7 trigger that auto-promotes
--     properties.hbc_concierge_tier when a creator flags 6+ services as
--     hbc_managed = true
--
-- Category, frequency, and status are CHECK-enforced text rather than
-- Postgres ENUMs — Master Spec 5.1.3 explicitly chose this to keep
-- migrations simple. New categories cost a single migration, no enum
-- ALTER dance.
--
-- Idempotent (CREATE IF NOT EXISTS, DROP-IF-EXISTS / CREATE policies,
-- ALTER … ADD CONSTRAINT IF NOT EXISTS for the CHECKs).

-- ── 1. Table ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.recurring_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,

  -- WHAT category. CHECK-enforced below; drives collapsible section
  -- grouping in the renderer ([v2.35]).
  category text NOT NULL,

  -- Plain-language service name (e.g. "Quarterly pest control",
  -- "Spring HVAC tune-up"). The renderer uses this in the row label.
  service_name text NOT NULL,

  -- Vendor identity. vendor_id links to the vendors table when the
  -- vendor is in the registry; vendor_name is freeform fallback for
  -- one-off vendors that haven't been added yet. Either or both can
  -- be set.
  vendor_name text,
  vendor_id uuid REFERENCES public.vendors(id) ON DELETE SET NULL,

  -- WHEN. frequency is the human-readable cadence (CHECK-enforced
  -- below). frequency_months is the numeric equivalent for due-date
  -- math; nullable because as_needed services have no fixed cadence.
  frequency text NOT NULL,
  frequency_months int,

  -- COST. cost_per_visit is what the vendor charges each time;
  -- annual_cost is the rolled-up year total (precomputed so the
  -- renderer doesn't have to do frequency arithmetic on every render).
  -- numeric(10,2) caps at $99,999,999.99 — well past any home service.
  cost_per_visit numeric(10,2),
  annual_cost numeric(10,2),

  -- DUE-DATE timeline. last_service_date and next_due_date drive the
  -- urgency badges in the renderer (overdue / due-soon / current).
  last_service_date date,
  next_due_date date,

  -- Status snapshot. CHECK-enforced below. Defaults to 'current' for
  -- a freshly added row; the daily-brief cron (E1) and any maintenance
  -- triggers transition this when next_due_date passes.
  status text NOT NULL DEFAULT 'current',

  -- THE MONEY VALVE. When this is true, HBC owns the relationship and
  -- the row counts toward the M7 trigger's tier promotion (3 services
  -- = tier_200, 6 = tier_400, 9 = tier_600 per Master Spec 5.5).
  hbc_managed boolean NOT NULL DEFAULT false,

  notes_html text,
  display_order int NOT NULL DEFAULT 0,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ── 2. CHECK constraints ─────────────────────────────────────────────────
-- Postgres has no IF NOT EXISTS for ADD CONSTRAINT, so we wrap each in a
-- DO block that no-ops when the constraint already exists. Keeps the
-- migration idempotent without resorting to DROP CONSTRAINT (which would
-- briefly violate invariants on a populated table).

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'recurring_services_category_check'
      AND conrelid = 'public.recurring_services'::regclass
  ) THEN
    ALTER TABLE public.recurring_services
      ADD CONSTRAINT recurring_services_category_check
      CHECK (category IN (
        'lawn_landscaping',
        'pest_control',
        'hvac',
        'plumbing',
        'electrical',
        'roof_gutters',
        'pool_spa',
        'cleaning',
        'security',
        'pool_chemicals',
        'tree_care',
        'snow_removal',
        'septic',
        'well_water',
        'other'
      ));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'recurring_services_frequency_check'
      AND conrelid = 'public.recurring_services'::regclass
  ) THEN
    ALTER TABLE public.recurring_services
      ADD CONSTRAINT recurring_services_frequency_check
      CHECK (frequency IN (
        'weekly',
        'biweekly',
        'monthly',
        'quarterly',
        'biannual',
        'annual',
        'as_needed'
      ));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'recurring_services_status_check'
      AND conrelid = 'public.recurring_services'::regclass
  ) THEN
    ALTER TABLE public.recurring_services
      ADD CONSTRAINT recurring_services_status_check
      CHECK (status IN ('current', 'overdue', 'lapsed', 'paused'));
  END IF;
END $$;

-- ── 3. Indexes ───────────────────────────────────────────────────────────
-- Three indexes per Master Spec 5.1.3:
--   property_id    — list-services-for-property (the primary read)
--   category combo — collapsible-section grouping in the renderer
--   due-date partial — "what's coming up?" cron query, scoped to current
--                      services only (overdue/lapsed/paused excluded)

CREATE INDEX IF NOT EXISTS idx_recurring_services_property
  ON public.recurring_services (property_id);

CREATE INDEX IF NOT EXISTS idx_recurring_services_category
  ON public.recurring_services (property_id, category);

CREATE INDEX IF NOT EXISTS idx_recurring_services_due
  ON public.recurring_services (property_id, next_due_date)
  WHERE status = 'current';

-- ── 4. updated_at trigger ────────────────────────────────────────────────
-- Same codebase convention as M2 — properties / reports / report_pages
-- and the rest all pair updated_at with this trigger function.

DROP TRIGGER IF EXISTS recurring_services_set_updated_at ON public.recurring_services;
CREATE TRIGGER recurring_services_set_updated_at
  BEFORE UPDATE ON public.recurring_services
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ── 5. RLS ───────────────────────────────────────────────────────────────
-- Mirrors replacement_briefings (M2):
--   client       — reads services for their own property only
--   creator      — manages all services (role-based; same M1/M2 pattern)
--   service_role — generate-recurring-services-register (E4) writes here
--                  on behalf of the creator from intake parsing

ALTER TABLE public.recurring_services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Clients read services on own properties" ON public.recurring_services;
CREATE POLICY "Clients read services on own properties"
  ON public.recurring_services
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = recurring_services.property_id
        AND p.client_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Creators manage all services" ON public.recurring_services;
CREATE POLICY "Creators manage all services"
  ON public.recurring_services
  FOR ALL
  USING (public.has_role(auth.uid(), 'creator'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'creator'::public.app_role));

DROP POLICY IF EXISTS "Service role manages services" ON public.recurring_services;
CREATE POLICY "Service role manages services"
  ON public.recurring_services
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');
