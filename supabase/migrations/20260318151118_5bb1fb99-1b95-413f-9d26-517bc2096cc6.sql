
-- Recurring Invoice Schedules
CREATE TABLE public.recurring_invoice_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  admin_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  amount numeric NOT NULL DEFAULT 0,
  frequency text NOT NULL DEFAULT 'monthly',
  next_run_date date NOT NULL,
  last_run_date date,
  is_active boolean NOT NULL DEFAULT true,
  line_items_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.recurring_invoice_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators manage recurring_invoice_schedules" ON public.recurring_invoice_schedules FOR ALL TO authenticated USING (has_role(auth.uid(), 'creator'::app_role));

-- Dashboard Widget Configs
CREATE TABLE public.dashboard_widget_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  widget_key text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  size text NOT NULL DEFAULT 'medium',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.dashboard_widget_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their widget configs" ON public.dashboard_widget_configs FOR ALL TO authenticated USING (auth.uid() = admin_id) WITH CHECK (auth.uid() = admin_id);

-- Internal Report Comments (admin-only collaboration)
CREATE TABLE public.internal_report_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_page_id uuid NOT NULL REFERENCES public.report_pages(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  comment_text text NOT NULL,
  is_resolved boolean NOT NULL DEFAULT false,
  resolved_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.internal_report_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators manage internal_report_comments" ON public.internal_report_comments FOR ALL TO authenticated USING (has_role(auth.uid(), 'creator'::app_role));

-- Vendor Performance Reviews
CREATE TABLE public.vendor_performance_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  admin_id uuid NOT NULL,
  quality_rating integer NOT NULL DEFAULT 3,
  timeliness_rating integer NOT NULL DEFAULT 3,
  communication_rating integer NOT NULL DEFAULT 3,
  cost_accuracy_rating integer NOT NULL DEFAULT 3,
  notes text,
  review_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.vendor_performance_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators manage vendor_performance_reviews" ON public.vendor_performance_reviews FOR ALL TO authenticated USING (has_role(auth.uid(), 'creator'::app_role));
