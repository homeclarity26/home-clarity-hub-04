
CREATE TABLE public.photo_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_url text NOT NULL,
  report_id uuid REFERENCES public.reports(id) ON DELETE CASCADE,
  report_page_id uuid REFERENCES public.report_pages(id) ON DELETE CASCADE,
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  section_type text,
  condition_rating text,
  confidence_score integer,
  identified_defects jsonb DEFAULT '[]'::jsonb,
  estimated_age_years integer,
  recommended_actions jsonb DEFAULT '[]'::jsonb,
  narrative_paragraph text,
  raw_observations jsonb DEFAULT '[]'::jsonb,
  analyzed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.photo_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read photo analyses"
  ON public.photo_analyses FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert photo analyses"
  ON public.photo_analyses FOR INSERT TO authenticated WITH CHECK (true);

CREATE INDEX idx_photo_analyses_photo_url ON public.photo_analyses(photo_url);
CREATE INDEX idx_photo_analyses_report_page ON public.photo_analyses(report_page_id);
CREATE INDEX idx_photo_analyses_property ON public.photo_analyses(property_id);
