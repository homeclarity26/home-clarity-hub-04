
-- Projects table
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  report_page_id uuid REFERENCES public.report_pages(id) ON DELETE SET NULL,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'planned',
  approved_tier text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view their projects"
  ON public.projects FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.properties
    WHERE properties.id = projects.property_id
      AND properties.client_user_id = auth.uid()
  ));

CREATE POLICY "Clients can insert their projects"
  ON public.projects FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.properties
    WHERE properties.id = projects.property_id
      AND properties.client_user_id = auth.uid()
  ));

CREATE POLICY "Clients can update their projects"
  ON public.projects FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.properties
    WHERE properties.id = projects.property_id
      AND properties.client_user_id = auth.uid()
  ));

CREATE POLICY "Creators can manage projects"
  ON public.projects FOR ALL
  USING (public.has_role(auth.uid(), 'creator'));

-- Schedule events table
CREATE TABLE public.schedule_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  event_date timestamptz NOT NULL,
  event_type text NOT NULL DEFAULT 'appointment',
  status text NOT NULL DEFAULT 'scheduled',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.schedule_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view their events"
  ON public.schedule_events FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.properties
    WHERE properties.id = schedule_events.property_id
      AND properties.client_user_id = auth.uid()
  ));

CREATE POLICY "Creators can manage events"
  ON public.schedule_events FOR ALL
  USING (public.has_role(auth.uid(), 'creator'));

-- Invoices table
CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  description text NOT NULL,
  amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  due_date date,
  paid_date date,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view their invoices"
  ON public.invoices FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.properties
    WHERE properties.id = invoices.property_id
      AND properties.client_user_id = auth.uid()
  ));

CREATE POLICY "Creators can manage invoices"
  ON public.invoices FOR ALL
  USING (public.has_role(auth.uid(), 'creator'));

-- Updated_at triggers
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
