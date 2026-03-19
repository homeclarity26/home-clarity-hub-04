
-- project_scopes table for scope versioning
CREATE TABLE public.project_scopes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  version_number integer NOT NULL DEFAULT 1,
  scope_content jsonb NOT NULL DEFAULT '{}'::jsonb,
  formatted_markdown text NOT NULL DEFAULT '',
  detail_level text NOT NULL DEFAULT 'standard',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  is_current boolean NOT NULL DEFAULT true,
  storage_pdf_path text
);

ALTER TABLE public.project_scopes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read scopes" ON public.project_scopes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert scopes" ON public.project_scopes
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update scopes" ON public.project_scopes
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX idx_project_scopes_project ON public.project_scopes(project_id);
CREATE INDEX idx_project_scopes_current ON public.project_scopes(project_id, is_current) WHERE is_current = true;
