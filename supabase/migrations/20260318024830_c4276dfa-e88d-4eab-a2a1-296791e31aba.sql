ALTER TABLE public.report_pages 
  ADD COLUMN IF NOT EXISTS last_inspected_date date,
  ADD COLUMN IF NOT EXISTS next_review_date date,
  ADD COLUMN IF NOT EXISTS expected_lifespan_years integer,
  ADD COLUMN IF NOT EXISTS current_age_years integer,
  ADD COLUMN IF NOT EXISTS replacement_cost_today numeric,
  ADD COLUMN IF NOT EXISTS findings jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS is_complete boolean DEFAULT false;