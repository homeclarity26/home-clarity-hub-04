
CREATE TABLE public.annual_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  review_year integer NOT NULL,
  status text NOT NULL DEFAULT 'not_started',
  briefing_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  admin_notes jsonb DEFAULT '[]'::jsonb,
  outcome_notes text,
  review_call_date timestamptz,
  generated_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(property_id, review_year)
);

ALTER TABLE public.annual_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read annual_reviews" ON public.annual_reviews
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert annual_reviews" ON public.annual_reviews
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update annual_reviews" ON public.annual_reviews
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX idx_annual_reviews_property ON public.annual_reviews(property_id);
CREATE INDEX idx_annual_reviews_status ON public.annual_reviews(status);

CREATE TRIGGER update_annual_reviews_updated_at
  BEFORE UPDATE ON public.annual_reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
