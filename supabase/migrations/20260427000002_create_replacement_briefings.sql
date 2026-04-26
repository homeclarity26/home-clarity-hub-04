-- HCR rebuild Phase 1 / M2: create replacement_briefings.
--
-- Stores the full Replacement Briefing payload for a system page (Master
-- Spec Section 5.1.2). One row per report_page that has a briefing.
--
-- WHY a dedicated table instead of report_pages.tiers JSONB:
--   1. Stable structure — tiers/photos/timeline/ctas all have well-defined
--      shapes; keeping them in JSONB on report_pages mixes them with the
--      narrative blob and makes per-field migrations painful.
--   2. Independent regeneration — generate-replacement-briefing (built
--      later in E2) can re-price or re-shoot without touching the page
--      narrative.
--   3. Pricing freshness — re-pricing every briefing for a county-wide
--      cost-of-materials shift becomes a single UPDATE, not a JSONB rewrite.
--
-- This is the killer feature per HCR_PROTOTYPE_BRIEF.md and [v1.13]:
-- when a system fails or hits EOL, the client taps a button and HBC sends
-- the trade partner a complete pre-scoped, pre-priced briefing. Trade
-- partner shows up pre-sold. No site visit needed.
--
-- Initial tiers JSONB stays empty — population happens via the E2 edge
-- function once it ships. The schema just needs to be in place so block
-- type B4 (replacement_briefing renderer) can read against it.
--
-- Idempotent (CREATE IF NOT EXISTS, DROP-IF-EXISTS / CREATE policies).

-- ── 1. Table ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.replacement_briefings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Anchor to the report page that displays this briefing. Unique below
  -- so a page can have at most one briefing — system_record + briefing
  -- is a 1:1 by design (Master Spec 3 / B3+B4 split).
  report_page_id uuid NOT NULL REFERENCES public.report_pages(id) ON DELETE CASCADE,

  -- Denormalized for RLS and EOL-bucket queries (idx_replacement_briefings_eol
  -- below) without a join to report_pages → reports → properties.
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,

  -- WHAT system this is. Free-text (furnace, ac_condenser, water_heater,
  -- panel, sump_pump, etc.); the renderer doesn't need an enum and the
  -- generator emits the canonical name.
  system_type text NOT NULL,

  -- IDENTITY of the unit being replaced. Optional — a briefing can exist
  -- before the field-walk recorded the serial plate.
  unit_make text,
  unit_model text,
  unit_serial text,

  -- LIFECYCLE anchors. install_year drives the urgency calculation
  -- against expected_eol_year. The timeline JSONB below carries the
  -- derived view; these two columns are the source of truth.
  install_year int,
  expected_eol_year int,

  -- ── JSONB payload (all schemas defined in Master Spec 5.1.2) ──
  --
  -- tiers: array of {id, label, price_low, price_high, scope_html,
  --   inclusions[], exclusions[], warranty, recommended}. Three entries
  --   keyed essential / enhanced / signature; middle (enhanced) flagged
  --   recommended:true per [v1.13].
  --
  -- photos: array of {role, url, caption}. role enum:
  --   unit | serial_plate | install_location | failure_signal.
  --   Role drives which slot the renderer fills.
  --
  -- timeline: object {current_age_years, expected_remaining_years,
  --   replacement_window_start, replacement_window_end, urgency}.
  --   urgency enum: well_within_life | approaching_eol | overdue | critical.
  --   Drives lifecycle-bar color in the B4 renderer.
  --
  -- ctas: array of {id, label, style, action, prompt}. Locked from [v1.13]:
  --   {id:"emergency", style:"rust", prompt:"My {system_type} just stopped..."}
  --   {id:"plan",      style:"gold", prompt:"I want to start planning..."}
  --   action is always "open_concierge" for now (the only handler that
  --   exists post-C1).
  tiers jsonb NOT NULL DEFAULT '[]'::jsonb,
  photos jsonb NOT NULL DEFAULT '[]'::jsonb,
  timeline jsonb NOT NULL DEFAULT '{}'::jsonb,
  ctas jsonb NOT NULL DEFAULT '[]'::jsonb,

  -- "How replacement happens" 5-step explainer rendered below the tier
  -- cards per [v2.19]. Pre-rendered HTML; the renderer trusts it.
  how_replacement_happens_html text,

  -- Generation lineage (mirrors daily_briefs.ai_model pattern from M1).
  generated_at timestamptz,
  ai_model text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- 1:1 with report_pages — one briefing per system page max.
  UNIQUE (report_page_id)
);

-- ── 2. Indexes ───────────────────────────────────────────────────────────
-- property_id index for the "list all briefings for this property" query
-- the admin uses when re-pricing across a portfolio. The unique constraint
-- on report_page_id already provides the report-page lookup index.
--
-- expected_eol_year is partial-indexed (NULLs excluded) for the EOL
-- alerting query the cron runs ("any briefings reaching EOL in the next
-- 12 months?"). Most rows will have a value here so a regular index is
-- fine, but partial-on-NOT-NULL keeps the index slim during the early
-- ramp when most rows still have empty lifecycle data.

CREATE INDEX IF NOT EXISTS idx_replacement_briefings_property
  ON public.replacement_briefings (property_id);

CREATE INDEX IF NOT EXISTS idx_replacement_briefings_eol
  ON public.replacement_briefings (expected_eol_year)
  WHERE expected_eol_year IS NOT NULL;

-- ── 3. updated_at trigger ────────────────────────────────────────────────
-- Briefings are re-priced over time. Without this trigger, updated_at
-- would sit at the row's first INSERT forever and "last re-priced"
-- displays in the admin dashboard would lie. Matches the codebase-wide
-- convention — properties, reports, report_pages, projects, etc. all
-- pair their updated_at column with this same trigger function.

DROP TRIGGER IF EXISTS replacement_briefings_set_updated_at ON public.replacement_briefings;
CREATE TRIGGER replacement_briefings_set_updated_at
  BEFORE UPDATE ON public.replacement_briefings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ── 4. RLS ───────────────────────────────────────────────────────────────
-- Three roles touch this table:
--   client       — reads briefings for their own property only
--   creator      — manages all briefings (admin role; codebase-wide pattern
--                  per the M1 RLS adaptation note — see daily_briefs
--                  migration for the full rationale)
--   service_role — generate-replacement-briefing (E2) writes here under
--                  service role
--
-- For clients, the join goes properties.client_user_id (not creator_id —
-- properties has no creator_id column on this codebase).

ALTER TABLE public.replacement_briefings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Clients read briefings on own properties" ON public.replacement_briefings;
CREATE POLICY "Clients read briefings on own properties"
  ON public.replacement_briefings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = replacement_briefings.property_id
        AND p.client_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Creators manage all briefings" ON public.replacement_briefings;
CREATE POLICY "Creators manage all briefings"
  ON public.replacement_briefings
  FOR ALL
  USING (public.has_role(auth.uid(), 'creator'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'creator'::public.app_role));

DROP POLICY IF EXISTS "Service role manages briefings" ON public.replacement_briefings;
CREATE POLICY "Service role manages briefings"
  ON public.replacement_briefings
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');
