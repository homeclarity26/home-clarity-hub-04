
CREATE TABLE public.client_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  category text NOT NULL DEFAULT 'General',
  storage_path text NOT NULL,
  file_type text,
  file_size text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.client_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators can manage files"
  ON public.client_files FOR ALL
  USING (public.has_role(auth.uid(), 'creator'));

CREATE POLICY "Clients can view their files"
  ON public.client_files FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM properties
    WHERE properties.id = client_files.property_id
    AND properties.client_user_id = auth.uid()
  ));
