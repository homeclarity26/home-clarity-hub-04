-- HCR rebuild Phase 1 / M4: create capital_plan_items.
--
-- Powers the 10-Year Capital Plan with drag-and-drop ([v2.11]). One row
-- per project per report. Stores year span, cost range, phase, and
-- display order. The block renderer (B7) lets the user drag a project
-- to a different year and the persistence step writes year_start /
-- year_end / display_order back to this table.
--
-- WHY clients can write here:
--   The Capital Plan is one of the few admin-built artifacts that the
--   client is supposed to MANIPULATE in their own portal — they reorder
--   projects across years to model "what if we did the bath in 2027 not
--   2028." Per [v2.11] this happens directly on their own data, not as
--   a fork-and-edit pattern. Master Spec 5.1.4 calls this out
--   explicitly: "Both creator and client can write (clients re-arrange
--   in their own scenarios)." Codebase-wide precedent: client_goals,
--   appointment_requests, and client_satisfaction_scores all use the
--   same "Clients manage own X" FOR ALL pattern.
--
-- Idempotent (CREATE IF NOT EXISTS, DROP-IF-EXISTS / CREATE policies,
-- DO blocks for ADD CONSTRAINT).

-- ── 1. Table ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.capital_plan_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Anchor to the report this plan item belongs to. Cascade because if
  -- the parent report is deleted the line items have no meaning.
  report_id uuid NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,

  -- Denormalized for the client-side RLS policy below — joining
  -- capital_plan_items → reports → properties on every row check is
  -- expensive. property_id makes it a single-table check.
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,

  -- OPTIONAL backlink to the source page that produced this line item
  -- (a Vision page or a Replacement Briefing). Null means the item
  -- was added directly from Step 4 of the wizard. SET NULL on delete
  -- so editing the source page doesn't blow away the plan entry.
  source_page_id uuid REFERENCES public.report_pages(id) ON DELETE SET NULL,

  project_name text NOT NULL,

  -- Phase per Defense → Offense → Expansion sequencing ([v1.16]).
  -- CHECK-enforced below.
  phase text NOT NULL,

  -- Year span. CHECK below enforces year_end >= year_start so a single
  -- bad drag-drop call can't put a multi-year project in inverted
  -- order. Renderer treats year_start == year_end as a one-year project.
  year_start int NOT NULL,
  year_end int NOT NULL,

  -- Cost range tracked low/high for the "Investment range" display in
  -- the renderer. Null when the source is a Vision page that hasn't
  -- entered design phase yet.
  cost_low numeric(12,2),
  cost_high numeric(12,2),

  -- When the source is a Replacement Briefing or Vision project with
  -- tiers, the user (admin OR client) can pick a different tier and
  -- the cost columns update from the source's tier pricing. NULL when
  -- the item has no tiered source (direct admin add).
  -- Values: 'essential' | 'enhanced' | 'signature' | NULL.
  -- (No CHECK constraint — the source's own tier system is the
  -- source of truth and we don't want to require a migration if the
  -- spec ever introduces a fourth tier.)
  selected_tier text,

  notes_html text,

  -- Drag-drop order WITHIN a year. The renderer sorts by
  -- (year_start, display_order). When the client drags an item, the
  -- write updates either (a) year_start + year_end if they crossed a
  -- year boundary, or (b) display_order if they reordered within a year.
  display_order int NOT NULL DEFAULT 0,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ── 2. CHECK constraints ─────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'capital_plan_items_year_check'
      AND conrelid = 'public.capital_plan_items'::regclass
  ) THEN
    ALTER TABLE public.capital_plan_items
      ADD CONSTRAINT capital_plan_items_year_check
      CHECK (year_end >= year_start);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'capital_plan_items_phase_check'
      AND conrelid = 'public.capital_plan_items'::regclass
  ) THEN
    ALTER TABLE public.capital_plan_items
      ADD CONSTRAINT capital_plan_items_phase_check
      CHECK (phase IN ('defense', 'offense', 'expansion'));
  END IF;
END $$;

-- ── 3. Indexes ───────────────────────────────────────────────────────────
-- Per Master Spec 5.1.4:
--   (report_id, year_start) — the primary read; renderer queries one
--                             report and orders by year for the timeline
--   (property_id)           — supports the client-side RLS check and
--                             cross-report property views

CREATE INDEX IF NOT EXISTS idx_capital_plan_items_report
  ON public.capital_plan_items (report_id, year_start);

CREATE INDEX IF NOT EXISTS idx_capital_plan_items_property
  ON public.capital_plan_items (property_id);

-- ── 4. updated_at trigger ────────────────────────────────────────────────

DROP TRIGGER IF EXISTS capital_plan_items_set_updated_at ON public.capital_plan_items;
CREATE TRIGGER capital_plan_items_set_updated_at
  BEFORE UPDATE ON public.capital_plan_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ── 5. RLS ───────────────────────────────────────────────────────────────
-- Three roles, three policies — clients here get FOR ALL on their own
-- property's items (not just SELECT) per [v2.11] drag-drop requirement.
--
-- Spec adaptation: Master Spec 5.1.4's RLS sketch joins via
-- reports.creator_id, but reports has no creator_id column on this
-- codebase (uses created_by, but creator-vs-creator scoping isn't
-- meaningful here — this is a single-creator workspace and the
-- has_role() pattern is what every other tenant table uses).

ALTER TABLE public.capital_plan_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Clients manage capital plan on own properties" ON public.capital_plan_items;
CREATE POLICY "Clients manage capital plan on own properties"
  ON public.capital_plan_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = capital_plan_items.property_id
        AND p.client_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = capital_plan_items.property_id
        AND p.client_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Creators manage all capital plan items" ON public.capital_plan_items;
CREATE POLICY "Creators manage all capital plan items"
  ON public.capital_plan_items
  FOR ALL
  USING (public.has_role(auth.uid(), 'creator'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'creator'::public.app_role));

DROP POLICY IF EXISTS "Service role manages capital plan items" ON public.capital_plan_items;
CREATE POLICY "Service role manages capital plan items"
  ON public.capital_plan_items
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');
