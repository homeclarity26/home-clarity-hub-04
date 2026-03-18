
CREATE TABLE public.field_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_progress',
  checked_in_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  checked_out_at TIMESTAMPTZ,
  gps_lat DOUBLE PRECISION,
  gps_lng DOUBLE PRECISION,
  gps_verified BOOLEAN DEFAULT false,
  distance_meters DOUBLE PRECISION,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.inspection_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID NOT NULL REFERENCES public.field_inspections(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  caption TEXT,
  report_page_id UUID REFERENCES public.report_pages(id),
  gps_lat DOUBLE PRECISION,
  gps_lng DOUBLE PRECISION,
  category TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.inspection_voice_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID NOT NULL REFERENCES public.field_inspections(id) ON DELETE CASCADE,
  audio_url TEXT,
  transcription TEXT,
  ai_narrative TEXT,
  report_page_id UUID REFERENCES public.report_pages(id),
  condition_suggestion TEXT,
  key_observations JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.field_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_voice_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators manage inspections" ON public.field_inspections
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'creator'))
  WITH CHECK (public.has_role(auth.uid(), 'creator'));

CREATE POLICY "Creators manage inspection photos" ON public.inspection_photos
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'creator'))
  WITH CHECK (public.has_role(auth.uid(), 'creator'));

CREATE POLICY "Creators manage inspection voice notes" ON public.inspection_voice_notes
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'creator'))
  WITH CHECK (public.has_role(auth.uid(), 'creator'));

CREATE INDEX idx_field_inspections_property ON public.field_inspections(property_id);
CREATE INDEX idx_inspection_photos_inspection ON public.inspection_photos(inspection_id);
CREATE INDEX idx_inspection_voice_notes_inspection ON public.inspection_voice_notes(inspection_id);
