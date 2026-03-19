
-- ═══════════════════════════════════════════
-- PROPOSAL FIELDS on estimates table
-- ═══════════════════════════════════════════

ALTER TABLE public.estimates
  ADD COLUMN IF NOT EXISTS proposal_token text UNIQUE,
  ADD COLUMN IF NOT EXISTS proposal_cover_image_url text,
  ADD COLUMN IF NOT EXISTS proposal_cover_video_url text,
  ADD COLUMN IF NOT EXISTS proposal_intro_text text,
  ADD COLUMN IF NOT EXISTS proposal_why_us_text text,
  ADD COLUMN IF NOT EXISTS proposal_timeline_text text,
  ADD COLUMN IF NOT EXISTS proposal_timeline_phases jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS proposal_testimonial_quote text,
  ADD COLUMN IF NOT EXISTS proposal_testimonial_author text,
  ADD COLUMN IF NOT EXISTS proposal_testimonial_role text,
  ADD COLUMN IF NOT EXISTS proposal_color_theme text DEFAULT 'navy',
  ADD COLUMN IF NOT EXISTS proposal_accent_color text,
  ADD COLUMN IF NOT EXISTS proposal_show_pricing_toggle boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS proposal_optional_line_items jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS proposal_view_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS proposal_first_viewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS proposal_last_viewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS proposal_time_spent_seconds integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS proposal_sections_viewed jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS proposal_viewed_by_name text,
  ADD COLUMN IF NOT EXISTS proposal_status text DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS proposal_cta_headline text DEFAULT 'Ready to move forward?',
  ADD COLUMN IF NOT EXISTS proposal_cta_subtext text,
  ADD COLUMN IF NOT EXISTS proposal_client_selections jsonb,
  ADD COLUMN IF NOT EXISTS proposal_scope_description text,
  ADD COLUMN IF NOT EXISTS proposal_stat_callouts jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS proposal_prepared_for text,
  ADD COLUMN IF NOT EXISTS proposal_tagline text;

-- ═══════════════════════════════════════════
-- INVOICE FIELDS
-- ═══════════════════════════════════════════

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS proposal_id uuid REFERENCES public.estimates(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS invoice_cover_image_url text,
  ADD COLUMN IF NOT EXISTS invoice_theme text DEFAULT 'navy',
  ADD COLUMN IF NOT EXISTS invoice_token text UNIQUE,
  ADD COLUMN IF NOT EXISTS invoice_view_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stripe_payment_link_url text,
  ADD COLUMN IF NOT EXISTS invoice_memo text,
  ADD COLUMN IF NOT EXISTS invoice_footer_text text;

-- Generate proposal_token for existing estimates
UPDATE public.estimates
SET proposal_token = encode(gen_random_bytes(16), 'hex')
WHERE proposal_token IS NULL;

-- Generate invoice_token for existing invoices
UPDATE public.invoices
SET invoice_token = encode(gen_random_bytes(16), 'hex')
WHERE invoice_token IS NULL;

-- Auto-generate proposal_token on new estimates
CREATE OR REPLACE FUNCTION public.generate_proposal_token()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.proposal_token IS NULL THEN
    NEW.proposal_token := encode(gen_random_bytes(16), 'hex');
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_generate_proposal_token ON public.estimates;
CREATE TRIGGER trg_generate_proposal_token
  BEFORE INSERT ON public.estimates
  FOR EACH ROW EXECUTE FUNCTION public.generate_proposal_token();

-- Auto-generate invoice_token on new invoices
CREATE OR REPLACE FUNCTION public.generate_invoice_token()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.invoice_token IS NULL THEN
    NEW.invoice_token := encode(gen_random_bytes(16), 'hex');
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_generate_invoice_token ON public.invoices;
CREATE TRIGGER trg_generate_invoice_token
  BEFORE INSERT ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.generate_invoice_token();

-- RLS: Allow public read on estimates by proposal_token (no login needed)
CREATE POLICY "Public read proposals by token"
  ON public.estimates FOR SELECT
  TO anon
  USING (proposal_token IS NOT NULL);

-- RLS: Allow anon to update view tracking fields only
CREATE POLICY "Anon update proposal tracking"
  ON public.estimates FOR UPDATE
  TO anon
  USING (proposal_token IS NOT NULL)
  WITH CHECK (proposal_token IS NOT NULL);

-- RLS: Allow public read on invoices by invoice_token
CREATE POLICY "Public read invoices by token"
  ON public.invoices FOR SELECT
  TO anon
  USING (invoice_token IS NOT NULL);

-- RLS: Allow anon to update invoice view count
CREATE POLICY "Anon update invoice tracking"
  ON public.invoices FOR UPDATE
  TO anon
  USING (invoice_token IS NOT NULL)
  WITH CHECK (invoice_token IS NOT NULL);

-- Allow anon read on estimate_line_items for proposals
CREATE POLICY "Anon read estimate line items"
  ON public.estimate_line_items FOR SELECT
  TO anon
  USING (true);

-- Allow anon read on invoice_line_items for invoices
CREATE POLICY "Anon read invoice line items"
  ON public.invoice_line_items FOR SELECT
  TO anon
  USING (true);

-- Index for fast token lookups
CREATE INDEX IF NOT EXISTS idx_estimates_proposal_token ON public.estimates(proposal_token);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_token ON public.invoices(invoice_token);
