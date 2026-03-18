
-- Enhance existing projects table with PM fields
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS project_type text DEFAULT 'custom',
  ADD COLUMN IF NOT EXISTS priority text DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS budget numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS actual_spent numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS contingency_pct numeric DEFAULT 10,
  ADD COLUMN IF NOT EXISTS project_manager_id uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS estimate_id uuid,
  ADD COLUMN IF NOT EXISTS end_date date,
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS percent_complete numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS show_in_portal boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS allow_client_messages boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_budget_to_client boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS send_milestone_updates boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS address text;

-- Project phases
CREATE TABLE public.project_phases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'not_started',
  sort_order integer NOT NULL DEFAULT 0,
  estimated_start_date date,
  estimated_end_date date,
  actual_start_date date,
  actual_end_date date,
  estimated_cost numeric DEFAULT 0,
  actual_cost numeric DEFAULT 0,
  assigned_vendor_id uuid REFERENCES public.central_vendors(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.project_phases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators manage phases" ON public.project_phases
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'creator'))
  WITH CHECK (public.has_role(auth.uid(), 'creator'));

CREATE POLICY "Clients read own phases" ON public.project_phases
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.properties pr ON pr.id = p.property_id
      WHERE p.id = project_phases.project_id
      AND pr.client_user_id = auth.uid()
    )
  );

-- Project tasks
CREATE TABLE public.project_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id uuid NOT NULL REFERENCES public.project_phases(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  assigned_to uuid REFERENCES auth.users(id),
  assigned_vendor_id uuid REFERENCES public.central_vendors(id),
  due_date date,
  priority text DEFAULT 'normal',
  status text NOT NULL DEFAULT 'todo',
  sort_order integer NOT NULL DEFAULT 0,
  time_logged_hours numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators manage tasks" ON public.project_tasks
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'creator'))
  WITH CHECK (public.has_role(auth.uid(), 'creator'));

CREATE POLICY "Clients read own tasks" ON public.project_tasks
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.properties pr ON pr.id = p.property_id
      WHERE p.id = project_tasks.project_id
      AND pr.client_user_id = auth.uid()
    )
  );

-- Project task comments
CREATE TABLE public.project_task_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.project_tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  comment text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.project_task_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users manage own comments" ON public.project_task_comments
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'creator'));

-- Daily logs
CREATE TABLE public.project_daily_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  weather_conditions text,
  workers_on_site jsonb DEFAULT '[]',
  work_completed text,
  materials_delivered text,
  issues_encountered text,
  next_day_plan text,
  photos text[] DEFAULT '{}',
  submitted_by uuid REFERENCES auth.users(id),
  share_with_client boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.project_daily_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators manage daily logs" ON public.project_daily_logs
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'creator'))
  WITH CHECK (public.has_role(auth.uid(), 'creator'));

CREATE POLICY "Clients read shared logs" ON public.project_daily_logs
  FOR SELECT TO authenticated
  USING (
    share_with_client = true AND
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.properties pr ON pr.id = p.property_id
      WHERE p.id = project_daily_logs.project_id
      AND pr.client_user_id = auth.uid()
    )
  );

-- Change orders
CREATE TABLE public.project_change_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  reason text,
  cost_impact numeric NOT NULL DEFAULT 0,
  timeline_impact_days integer DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  supporting_photos text[] DEFAULT '{}',
  supporting_docs text[] DEFAULT '{}',
  approved_at timestamptz,
  approved_by uuid REFERENCES auth.users(id),
  invoice_id uuid REFERENCES public.invoices(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.project_change_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators manage change orders" ON public.project_change_orders
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'creator'))
  WITH CHECK (public.has_role(auth.uid(), 'creator'));

CREATE POLICY "Clients read own change orders" ON public.project_change_orders
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.properties pr ON pr.id = p.property_id
      WHERE p.id = project_change_orders.project_id
      AND pr.client_user_id = auth.uid()
    )
  );

-- Clients can approve/decline change orders
CREATE POLICY "Clients update own change orders" ON public.project_change_orders
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.properties pr ON pr.id = p.property_id
      WHERE p.id = project_change_orders.project_id
      AND pr.client_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.properties pr ON pr.id = p.property_id
      WHERE p.id = project_change_orders.project_id
      AND pr.client_user_id = auth.uid()
    )
  );

-- Purchase orders
CREATE TABLE public.project_purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  phase_id uuid REFERENCES public.project_phases(id),
  vendor_id uuid REFERENCES public.central_vendors(id),
  po_number text,
  description text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',
  ordered_date date,
  received_date date,
  paid_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.project_purchase_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators manage POs" ON public.project_purchase_orders
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'creator'))
  WITH CHECK (public.has_role(auth.uid(), 'creator'));

-- Decision log
CREATE TABLE public.project_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  decision text NOT NULL,
  decided_by text,
  decided_at timestamptz NOT NULL DEFAULT now(),
  attachments text[] DEFAULT '{}',
  is_client_approved boolean DEFAULT false,
  locked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.project_decisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators manage decisions" ON public.project_decisions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'creator'))
  WITH CHECK (public.has_role(auth.uid(), 'creator'));

CREATE POLICY "Clients read own decisions" ON public.project_decisions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.properties pr ON pr.id = p.property_id
      WHERE p.id = project_decisions.project_id
      AND pr.client_user_id = auth.uid()
    )
  );

-- Project permits
CREATE TABLE public.project_permits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  permit_type text NOT NULL,
  permit_number text,
  submitted_date date,
  approved_date date,
  expiration_date date,
  document_url text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.project_permits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators manage permits" ON public.project_permits
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'creator'))
  WITH CHECK (public.has_role(auth.uid(), 'creator'));

CREATE POLICY "Clients read own permits" ON public.project_permits
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.properties pr ON pr.id = p.property_id
      WHERE p.id = project_permits.project_id
      AND pr.client_user_id = auth.uid()
    )
  );

-- Project inspections
CREATE TABLE public.project_inspections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  inspection_type text NOT NULL,
  scheduled_date date,
  inspector_name text,
  result text,
  notes text,
  next_steps text,
  permit_id uuid REFERENCES public.project_permits(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.project_inspections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators manage inspections" ON public.project_inspections
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'creator'))
  WITH CHECK (public.has_role(auth.uid(), 'creator'));

CREATE POLICY "Clients read own inspections" ON public.project_inspections
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.properties pr ON pr.id = p.property_id
      WHERE p.id = project_inspections.project_id
      AND pr.client_user_id = auth.uid()
    )
  );

-- Project templates
CREATE TABLE public.project_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES auth.users(id),
  name text NOT NULL,
  project_type text NOT NULL DEFAULT 'custom',
  phases_json jsonb NOT NULL DEFAULT '[]',
  budget_categories_json jsonb DEFAULT '{}',
  document_checklist jsonb DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.project_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators manage templates" ON public.project_templates
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'creator'))
  WITH CHECK (public.has_role(auth.uid(), 'creator'));

-- Trade partner invites
CREATE TABLE public.trade_partner_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  vendor_id uuid NOT NULL REFERENCES public.central_vendors(id),
  invited_by uuid NOT NULL REFERENCES auth.users(id),
  status text NOT NULL DEFAULT 'pending',
  access_token text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.trade_partner_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators manage invites" ON public.trade_partner_invites
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'creator'))
  WITH CHECK (public.has_role(auth.uid(), 'creator'));

-- Project activity log
CREATE TABLE public.project_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  action_type text NOT NULL,
  description text NOT NULL,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.project_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators read project activity" ON public.project_activity_log
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'creator'))
  WITH CHECK (public.has_role(auth.uid(), 'creator'));

CREATE POLICY "Clients read own project activity" ON public.project_activity_log
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.properties pr ON pr.id = p.property_id
      WHERE p.id = project_activity_log.project_id
      AND pr.client_user_id = auth.uid()
    )
  );

-- Project messages (separate from property messages)
CREATE TABLE public.project_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id),
  message text NOT NULL,
  is_urgent boolean DEFAULT false,
  attachments text[] DEFAULT '{}',
  participant_type text NOT NULL DEFAULT 'admin',
  is_read boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.project_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators manage project messages" ON public.project_messages
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'creator'))
  WITH CHECK (public.has_role(auth.uid(), 'creator'));

CREATE POLICY "Clients read/write own project messages" ON public.project_messages
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.properties pr ON pr.id = p.property_id
      WHERE p.id = project_messages.project_id
      AND pr.client_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.properties pr ON pr.id = p.property_id
      WHERE p.id = project_messages.project_id
      AND pr.client_user_id = auth.uid()
    )
  );

-- Project documents/files
CREATE TABLE public.project_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  phase_id uuid REFERENCES public.project_phases(id),
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size text,
  file_type text,
  category text NOT NULL DEFAULT 'misc',
  photo_tag text,
  share_with_client boolean DEFAULT false,
  uploaded_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators manage project files" ON public.project_files
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'creator'))
  WITH CHECK (public.has_role(auth.uid(), 'creator'));

CREATE POLICY "Clients read shared files" ON public.project_files
  FOR SELECT TO authenticated
  USING (
    share_with_client = true AND
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.properties pr ON pr.id = p.property_id
      WHERE p.id = project_files.project_id
      AND pr.client_user_id = auth.uid()
    )
  );

-- Add trade_partner role
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'trade_partner' AND enumtypid = 'public.app_role'::regtype) THEN
    ALTER TYPE public.app_role ADD VALUE 'trade_partner';
  END IF;
END $$;

-- Indexes
CREATE INDEX idx_project_phases_project ON public.project_phases(project_id);
CREATE INDEX idx_project_tasks_phase ON public.project_tasks(phase_id);
CREATE INDEX idx_project_tasks_project ON public.project_tasks(project_id);
CREATE INDEX idx_project_daily_logs_project ON public.project_daily_logs(project_id);
CREATE INDEX idx_project_change_orders_project ON public.project_change_orders(project_id);
CREATE INDEX idx_project_files_project ON public.project_files(project_id);
CREATE INDEX idx_project_messages_project ON public.project_messages(project_id);
CREATE INDEX idx_project_activity_log_project ON public.project_activity_log(project_id);
