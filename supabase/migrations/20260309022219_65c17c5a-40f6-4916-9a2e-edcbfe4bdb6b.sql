
-- Reports table: one per property
CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL DEFAULT 'Home Clarity Report',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'complete')),
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Report pages table: individual sections within a report
CREATE TABLE public.report_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid REFERENCES public.reports(id) ON DELETE CASCADE NOT NULL,
  page_key text NOT NULL,
  title text NOT NULL,
  group_name text NOT NULL,
  condition_rating text CHECK (condition_rating IN ('Excellent', 'Good', 'Fair', 'Poor', 'Critical')),
  narrative jsonb NOT NULL DEFAULT '[]'::jsonb,
  health_bar jsonb,
  specs jsonb DEFAULT '[]'::jsonb,
  tiers jsonb,
  timing text,
  recommendations jsonb DEFAULT '[]'::jsonb,
  images jsonb DEFAULT '[]'::jsonb,
  sort_order int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'complete', 'needs_review')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(report_id, page_key)
);

-- Edit history for tracking changes
CREATE TABLE public.report_edit_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_page_id uuid REFERENCES public.report_pages(id) ON DELETE CASCADE NOT NULL,
  edited_by uuid NOT NULL,
  field_name text NOT NULL,
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Updated_at triggers
CREATE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_report_pages_updated_at
  BEFORE UPDATE ON public.report_pages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_edit_history ENABLE ROW LEVEL SECURITY;

-- RLS for reports
CREATE POLICY "Creators can manage reports" ON public.reports
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'creator'));

CREATE POLICY "Clients can view reports for their properties" ON public.reports
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE properties.id = reports.property_id
      AND properties.client_user_id = auth.uid()
    )
  );

-- RLS for report_pages
CREATE POLICY "Creators can manage report pages" ON public.report_pages
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.reports
      WHERE reports.id = report_pages.report_id
      AND public.has_role(auth.uid(), 'creator')
    )
  );

CREATE POLICY "Clients can view their report pages" ON public.report_pages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.reports
      JOIN public.properties ON properties.id = reports.property_id
      WHERE reports.id = report_pages.report_id
      AND properties.client_user_id = auth.uid()
    )
  );

-- RLS for edit history
CREATE POLICY "Creators can manage edit history" ON public.report_edit_history
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'creator'));

CREATE POLICY "Clients can view edit history" ON public.report_edit_history
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.report_pages
      JOIN public.reports ON reports.id = report_pages.report_id
      JOIN public.properties ON properties.id = reports.property_id
      WHERE report_pages.id = report_edit_history.report_page_id
      AND properties.client_user_id = auth.uid()
    )
  );

-- Enable realtime for report_pages (for auto-save indicator)
ALTER PUBLICATION supabase_realtime ADD TABLE public.report_pages;
