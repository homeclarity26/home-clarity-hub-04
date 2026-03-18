
-- Home Goals table
CREATE TABLE public.home_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  target_year integer,
  estimated_budget numeric,
  status text NOT NULL DEFAULT 'dreaming',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.home_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can manage their goals" ON public.home_goals
  FOR ALL TO authenticated
  USING (auth.uid() = client_id)
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Creators can manage goals" ON public.home_goals
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'creator'::app_role));

-- Portal customizations table (white-label branding)
CREATE TABLE public.portal_customizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  welcome_message text,
  tagline text,
  hero_photo_url text,
  advisor_signature text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(property_id)
);

ALTER TABLE public.portal_customizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view their customizations" ON public.portal_customizations
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM properties WHERE properties.id = portal_customizations.property_id AND properties.client_user_id = auth.uid()));

CREATE POLICY "Creators can manage customizations" ON public.portal_customizations
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'creator'::app_role));

-- Project photos table (photo timeline + before/after)
CREATE TABLE public.project_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL,
  uploader_type text NOT NULL DEFAULT 'admin',
  photo_url text NOT NULL,
  caption text,
  taken_date date NOT NULL DEFAULT CURRENT_DATE,
  photo_stage text DEFAULT 'progress',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.project_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view their project photos" ON public.project_photos
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM projects p JOIN properties pr ON pr.id = p.property_id WHERE p.id = project_photos.project_id AND pr.client_user_id = auth.uid()));

CREATE POLICY "Clients can upload photos" ON public.project_photos
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = uploaded_by AND EXISTS (SELECT 1 FROM projects p JOIN properties pr ON pr.id = p.property_id WHERE p.id = project_photos.project_id AND pr.client_user_id = auth.uid()));

CREATE POLICY "Creators can manage project photos" ON public.project_photos
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'creator'::app_role));

-- Client sessions table (login tracking)
CREATE TABLE public.client_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  login_at timestamptz NOT NULL DEFAULT now(),
  last_active_at timestamptz NOT NULL DEFAULT now(),
  pages_visited jsonb DEFAULT '[]'::jsonb,
  session_duration_minutes integer DEFAULT 0
);

ALTER TABLE public.client_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their sessions" ON public.client_sessions
  FOR ALL TO authenticated
  USING (auth.uid() = client_id)
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Creators can view sessions" ON public.client_sessions
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'creator'::app_role));

-- Page views table
CREATE TABLE public.page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  page_name text NOT NULL,
  viewed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their views" ON public.page_views
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Creators can view all page views" ON public.page_views
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'creator'::app_role));

-- Annual report cards table
CREATE TABLE public.annual_report_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  report_year integer NOT NULL,
  health_score_start integer,
  health_score_end integer,
  completed_projects_count integer DEFAULT 0,
  total_invested numeric DEFAULT 0,
  total_payments numeric DEFAULT 0,
  condition_changes jsonb DEFAULT '[]'::jsonb,
  advisor_message text,
  value_start numeric,
  value_end numeric,
  generated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(property_id, report_year)
);

ALTER TABLE public.annual_report_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view their report cards" ON public.annual_report_cards
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM properties WHERE properties.id = annual_report_cards.property_id AND properties.client_user_id = auth.uid()));

CREATE POLICY "Creators can manage report cards" ON public.annual_report_cards
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'creator'::app_role));

-- Project photos storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('project-photos', 'project-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for project-photos bucket
CREATE POLICY "Anyone can view project photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'project-photos');

CREATE POLICY "Authenticated users can upload project photos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'project-photos');

CREATE POLICY "Creators can delete project photos" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'project-photos' AND has_role(auth.uid(), 'creator'::app_role));
