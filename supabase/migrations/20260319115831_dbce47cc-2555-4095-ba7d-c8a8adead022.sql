
-- Scheduled reports table
CREATE TABLE public.scheduled_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  report_type text NOT NULL,
  frequency text NOT NULL DEFAULT 'weekly',
  recipients text[] DEFAULT '{}',
  next_send_at timestamptz,
  last_sent_at timestamptz,
  config jsonb DEFAULT '{}'::jsonb,
  active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.scheduled_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated manage scheduled_reports"
  ON public.scheduled_reports FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Export jobs table
CREATE TABLE public.export_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  export_type text NOT NULL,
  filter_params jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  file_url text,
  completed_at timestamptz,
  error text
);

ALTER TABLE public.export_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated manage export_jobs"
  ON public.export_jobs FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX idx_export_jobs_status ON public.export_jobs(status);
CREATE INDEX idx_scheduled_reports_active ON public.scheduled_reports(active, next_send_at);
