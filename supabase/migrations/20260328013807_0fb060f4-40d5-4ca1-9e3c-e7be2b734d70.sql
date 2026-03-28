
ALTER TABLE public.estimates
  ADD COLUMN IF NOT EXISTS proposal_scope_sections jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS proposal_client_selections jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS proposal_terms jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS proposal_multi_option boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS proposal_option_prices jsonb DEFAULT '[]'::jsonb;
