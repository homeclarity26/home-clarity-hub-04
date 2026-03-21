
-- ═══ AI Notification Nudges ═══
CREATE TABLE IF NOT EXISTS public.ai_notification_nudges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  client_id uuid NOT NULL,
  nudge_type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  action_url text,
  is_read boolean DEFAULT false,
  is_dismissed boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_nudges_client ON public.ai_notification_nudges(client_id, is_dismissed, created_at DESC);
ALTER TABLE public.ai_notification_nudges ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Clients can view own nudges" ON public.ai_notification_nudges FOR SELECT TO authenticated USING (client_id = auth.uid() OR public.has_role(auth.uid(), 'creator'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "System can create nudges" ON public.ai_notification_nudges FOR INSERT TO authenticated WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Clients can update own nudges" ON public.ai_notification_nudges FOR UPDATE TO authenticated USING (client_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ═══ Portfolio Snapshots (cross-client analytics) ═══
CREATE TABLE IF NOT EXISTS public.portfolio_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  snapshot_date date NOT NULL DEFAULT CURRENT_DATE,
  total_clients integer DEFAULT 0,
  avg_health_score numeric DEFAULT 0,
  total_revenue numeric DEFAULT 0,
  total_projects integer DEFAULT 0,
  metrics_json jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(admin_id, snapshot_date)
);
ALTER TABLE public.portfolio_snapshots ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Creators can manage own snapshots" ON public.portfolio_snapshots FOR ALL TO authenticated USING (admin_id = auth.uid()) WITH CHECK (admin_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ═══ Client Goals (homeowner goals tracking) ═══
CREATE TABLE IF NOT EXISTS public.client_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  client_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  category text DEFAULT 'general',
  target_date date,
  status text NOT NULL DEFAULT 'active',
  progress integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.client_goals ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Clients can manage own goals" ON public.client_goals FOR ALL TO authenticated USING (client_id = auth.uid()) WITH CHECK (client_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Creators can view all goals" ON public.client_goals FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'creator'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ═══ Seasonal Maintenance Checklists ═══
CREATE TABLE IF NOT EXISTS public.seasonal_checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  client_id uuid NOT NULL,
  season text NOT NULL,
  year integer NOT NULL,
  task_title text NOT NULL,
  task_description text,
  is_completed boolean DEFAULT false,
  completed_at timestamptz,
  category text DEFAULT 'general',
  sort_order integer DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_seasonal_checklist ON public.seasonal_checklist_items(property_id, season, year);
ALTER TABLE public.seasonal_checklist_items ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Clients can manage own checklist" ON public.seasonal_checklist_items FOR ALL TO authenticated USING (client_id = auth.uid()) WITH CHECK (client_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Creators can manage all checklists" ON public.seasonal_checklist_items FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'creator')) WITH CHECK (public.has_role(auth.uid(), 'creator'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ═══ Add RLS policies to existing service_requests if missing ═══
DO $$ BEGIN
  CREATE POLICY "Clients can view own service requests v2" ON public.service_requests FOR SELECT TO authenticated USING (client_id = auth.uid() OR public.has_role(auth.uid(), 'creator'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Clients can create service requests v2" ON public.service_requests FOR INSERT TO authenticated WITH CHECK (client_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Creators can update service requests" ON public.service_requests FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'creator'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ═══ Enable realtime ═══
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_notification_nudges;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.service_requests;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
