-- Pass 1 floor rebuild: restore columns the app code was always expecting.
-- The UI writes these fields via `.insert()` / `.update()` with an `as any`
-- cast that hides the TypeScript mismatch; without these columns, every
-- "Create new client" flow and every report-page completion rollup fails
-- silently at runtime (PostgREST rejects the unknown columns).

ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS completion_percent numeric NOT NULL DEFAULT 0;

ALTER TABLE public.report_pages
  ADD COLUMN IF NOT EXISTS template_id uuid,
  ADD COLUMN IF NOT EXISTS block_config jsonb,
  ADD COLUMN IF NOT EXISTS key_observations jsonb,
  ADD COLUMN IF NOT EXISTS risks jsonb,
  ADD COLUMN IF NOT EXISTS dependencies jsonb,
  ADD COLUMN IF NOT EXISTS maintenance jsonb;

-- Keep PostgREST in sync so the API picks up the new columns immediately
-- without waiting for its next schema reload cycle.
NOTIFY pgrst, 'reload schema';
