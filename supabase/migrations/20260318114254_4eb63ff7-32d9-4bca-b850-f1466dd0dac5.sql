
-- Snippet Library table for reusable narrative paragraphs
CREATE TABLE public.narrative_snippets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  tags text[] DEFAULT '{}',
  usage_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.narrative_snippets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators can manage snippets"
  ON public.narrative_snippets FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'creator'::app_role));

-- Page assignments table for team collaboration
CREATE TABLE public.page_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_page_id uuid REFERENCES public.report_pages(id) ON DELETE CASCADE NOT NULL,
  assigned_to text NOT NULL,
  due_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.page_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators can manage page assignments"
  ON public.page_assignments FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'creator'::app_role));

-- Inspection checklists table
CREATE TABLE public.inspection_checklists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_page_id uuid REFERENCES public.report_pages(id) ON DELETE CASCADE NOT NULL,
  items jsonb NOT NULL DEFAULT '[]',
  completed_count integer NOT NULL DEFAULT 0,
  total_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.inspection_checklists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators can manage checklists"
  ON public.inspection_checklists FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'creator'::app_role));
