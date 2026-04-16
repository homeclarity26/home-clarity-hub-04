-- Project updates: social-feed-style timeline entries for projects
CREATE TABLE IF NOT EXISTS public.project_updates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  author_id uuid REFERENCES auth.users(id),
  content text NOT NULL,
  photos text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.project_updates ENABLE ROW LEVEL SECURITY;

-- Creators manage all; clients read updates for their properties
CREATE POLICY "Creators manage project_updates"
  ON public.project_updates FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'creator'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'creator'
    )
  );

CREATE POLICY "Clients read own project_updates"
  ON public.project_updates FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.properties prop ON p.property_id = prop.id
      WHERE p.id = project_id AND prop.client_user_id = auth.uid()
    )
  );

CREATE INDEX idx_project_updates_project ON public.project_updates(project_id);

-- Add phase column to projects if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'phase') THEN
    ALTER TABLE public.projects ADD COLUMN phase text DEFAULT 'scoping';
  END IF;
END $$;
