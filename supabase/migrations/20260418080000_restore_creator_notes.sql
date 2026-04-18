-- Pass 1 floor rebuild round-2: restore `report_pages.creator_notes`.
--
-- The column is referenced by 17 places across 8 files — useReportPage,
-- useClientPortal, AdminClientDetail, ReportCloneDialog, templateUtils,
-- ReportPage renderer, BlockRenderer (including the inline editor that
-- CALLS onUpdate({ creator_notes: notes })). In other words: every time
-- a creator tried to save private notes on a page, the write silently
-- failed and every read came back undefined.
--
-- This is the same pattern as the Pass-1 migration that restored
-- template_id / block_config / key_observations / risks / dependencies /
-- maintenance on report_pages — a column the app has always expected
-- but was never actually migrated.

ALTER TABLE public.report_pages
  ADD COLUMN IF NOT EXISTS creator_notes text;

NOTIFY pgrst, 'reload schema';
