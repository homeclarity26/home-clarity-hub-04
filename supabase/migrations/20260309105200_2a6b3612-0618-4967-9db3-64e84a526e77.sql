-- Add new columns to projects table
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS estimated_start_date date,
  ADD COLUMN IF NOT EXISTS estimated_cost numeric,
  ADD COLUMN IF NOT EXISTS contractor_name text,
  ADD COLUMN IF NOT EXISTS contractor_contact text;

-- Create milestones table
CREATE TABLE IF NOT EXISTS public.milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  due_date date,
  completed boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;

-- Creators can do everything
CREATE POLICY "Creators can manage milestones"
  ON public.milestones FOR ALL
  USING (public.has_role(auth.uid(), 'creator'::app_role));

-- Clients can view milestones for their projects
CREATE POLICY "Clients can view their milestones"
  ON public.milestones FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.projects p
    JOIN public.properties pr ON pr.id = p.property_id
    WHERE p.id = milestones.project_id
      AND pr.client_user_id = auth.uid()
  ));

-- Clients can toggle completed on their milestones
CREATE POLICY "Clients can update their milestones"
  ON public.milestones FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.projects p
    JOIN public.properties pr ON pr.id = p.property_id
    WHERE p.id = milestones.project_id
      AND pr.client_user_id = auth.uid()
  ));