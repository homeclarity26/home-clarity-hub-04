-- HCR rebuild Phase 1 / M6: add v2 columns to properties.
--
-- Per Master Spec 5.2, the v2 wizard and renderers want seven new
-- per-property fields. Two of them (hover_url, iguide_url) already
-- exist on this codebase as nullable text — IF NOT EXISTS makes those
-- additions harmless no-ops. The remaining five are net new.
--
-- Spec divergence — backfill is not applicable on this codebase:
--   The Master Plan M6 ticket says "Backfill of hover_url / iguide_url /
--   floor_plan_url from digital_assets succeeds." That backfill cannot
--   run here because the digital_assets table DOES NOT EXIST on this
--   project (verified against the live schema before writing this
--   migration). The two URL columns that already exist on properties
--   are also empty (0 of 9 rows populated). Net effect: every URL field
--   stays NULL until the new wizard (W1) starts writing them.
--
-- Idempotent (ADD COLUMN IF NOT EXISTS for every column, DO block for
-- the CHECK constraint).

-- ── 1. New columns ───────────────────────────────────────────────────────

ALTER TABLE public.properties
  -- M7 (the next migration) installs the trigger that auto-promotes this
  -- value when count(*) of recurring_services with hbc_managed=true crosses
  -- 3 / 6 / 9. Stored explicitly (not derived in the UI) so the renderer
  -- doesn't recount on every paint. CHECK constraint added below.
  ADD COLUMN IF NOT EXISTS hbc_concierge_tier text DEFAULT 'none',

  -- Step 1 Intake collects three asset URLs ([v2.1]). hover_url and
  -- iguide_url already exist; floor_plan_url is new. The PDF variants
  -- (hover_pdf_url, iguide_pdf_url) are separate fields kept as-is —
  -- this rebuild treats them as belonging to the same Step 1 asset
  -- bundle but doesn't merge or rename them.
  ADD COLUMN IF NOT EXISTS hover_url text,
  ADD COLUMN IF NOT EXISTS iguide_url text,
  ADD COLUMN IF NOT EXISTS floor_plan_url text,

  -- Step 1 catchall textarea ([v2.3]) — "Anything else you want me to
  -- know before I show up?". HTML stored so the renderer can preserve
  -- formatting if Adam pastes a numbered list.
  ADD COLUMN IF NOT EXISTS anything_else_html text,

  -- Audit trail of what Adam acknowledged on the Step 5 Publish quality
  -- gate (Master Spec 5.4.4). Each entry shape:
  --   {"question_id":"...","question":"...","acknowledgment":"...","at":"timestamptz"}
  -- NOT NULL with default '[]' so existing rows have a queryable empty
  -- array (no NULL-juggling at read time).
  ADD COLUMN IF NOT EXISTS qa_acknowledgments jsonb NOT NULL DEFAULT '[]'::jsonb,

  -- Optional Welcome video URL surfaced on Portal Home ([v2.41]). One
  -- video per property; the embed renders below the family-name eyebrow.
  ADD COLUMN IF NOT EXISTS welcome_video_url text;

-- ── 2. CHECK constraint on hbc_concierge_tier ────────────────────────────
-- Locked enum for the M7 trigger to write into. DO block for idempotent
-- ADD CONSTRAINT (Postgres has no IF NOT EXISTS for ADD CONSTRAINT).

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'properties_hbc_concierge_tier_check'
      AND conrelid = 'public.properties'::regclass
  ) THEN
    ALTER TABLE public.properties
      ADD CONSTRAINT properties_hbc_concierge_tier_check
      CHECK (hbc_concierge_tier IN ('none', 'tier_200', 'tier_400', 'tier_600'));
  END IF;
END $$;

-- ── 3. (No backfill) ─────────────────────────────────────────────────────
-- See top-of-file divergence note. digital_assets does not exist on this
-- project; nothing to copy from. Existing rows pick up the column
-- defaults (hbc_concierge_tier='none', qa_acknowledgments='[]') and the
-- nullable text columns stay NULL until the new wizard writes them.
