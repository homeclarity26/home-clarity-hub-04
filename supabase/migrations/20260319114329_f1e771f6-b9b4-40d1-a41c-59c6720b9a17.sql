
-- Create property_photos table
CREATE TABLE public.property_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  report_page_id uuid REFERENCES public.report_pages(id) ON DELETE SET NULL,
  inspection_id uuid,
  category text NOT NULL DEFAULT 'other',
  room_or_area text,
  title text NOT NULL DEFAULT '',
  description text DEFAULT '',
  file_url text NOT NULL,
  thumbnail_url text,
  taken_at timestamptz DEFAULT now(),
  taken_by uuid,
  gps_lat decimal,
  gps_lng decimal,
  is_client_visible boolean DEFAULT true,
  tags text[] DEFAULT '{}',
  width integer,
  height integer,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.property_photos ENABLE ROW LEVEL SECURITY;

-- Creators can manage all photos
CREATE POLICY "Creators manage all photos"
  ON public.property_photos FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'creator'));

-- Clients read visible photos for their property
CREATE POLICY "Clients read visible photos"
  ON public.property_photos FOR SELECT
  TO authenticated
  USING (
    is_client_visible = true
    AND EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_photos.property_id
        AND p.client_user_id = auth.uid()
    )
  );

-- Clients insert photos to their own property
CREATE POLICY "Clients upload photos"
  ON public.property_photos FOR INSERT
  TO authenticated
  WITH CHECK (
    taken_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_photos.property_id
        AND p.client_user_id = auth.uid()
    )
  );

CREATE INDEX idx_property_photos_property ON public.property_photos(property_id);
CREATE INDEX idx_property_photos_project ON public.property_photos(project_id);
CREATE INDEX idx_property_photos_category ON public.property_photos(category);

-- Storage bucket (may already exist)
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-photos', 'property-photos', true)
ON CONFLICT (id) DO NOTHING;
