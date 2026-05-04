-- Phase 5: Bobby threads
CREATE TABLE public.bobby_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  client_user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_message_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(property_id)
);

CREATE TABLE public.bobby_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid REFERENCES public.bobby_threads(id) ON DELETE CASCADE NOT NULL,
  sender text NOT NULL CHECK (sender IN ('user', 'bobby', 'adam')),
  content text NOT NULL,
  status text NOT NULL DEFAULT 'sent' CHECK (status IN ('pending', 'sent', 'escalated', 'resolved')),
  action_taken jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.escalation_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid REFERENCES public.bobby_messages(id) ON DELETE CASCADE NOT NULL,
  thread_id uuid REFERENCES public.bobby_threads(id) ON DELETE CASCADE NOT NULL,
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'dismissed')),
  context_summary text,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

CREATE INDEX idx_bobby_messages_thread_created ON public.bobby_messages(thread_id, created_at DESC);
CREATE INDEX idx_escalation_queue_status_created ON public.escalation_queue(status, created_at DESC);

ALTER TABLE public.bobby_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bobby_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escalation_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Homeowners read own thread" ON public.bobby_threads
  FOR SELECT USING (client_user_id = auth.uid());

CREATE POLICY "Homeowners read own messages" ON public.bobby_messages
  FOR SELECT USING (
    thread_id IN (SELECT id FROM public.bobby_threads WHERE client_user_id = auth.uid())
  );

CREATE POLICY "Homeowners write own messages" ON public.bobby_messages
  FOR INSERT WITH CHECK (
    sender = 'user' AND
    thread_id IN (SELECT id FROM public.bobby_threads WHERE client_user_id = auth.uid())
  );

CREATE POLICY "Creators read all threads" ON public.bobby_threads
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'creator')
  );

CREATE POLICY "Creators read all messages" ON public.bobby_messages
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'creator')
  );

CREATE POLICY "Creators manage escalations" ON public.escalation_queue
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'creator')
  );

-- Phase 7: Co-Pilot inbox
CREATE TABLE public.copilot_inbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  source text NOT NULL CHECK (source IN ('client', 'admin')),
  kind text NOT NULL CHECK (kind IN ('photo', 'note', 'document', 'request')),
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'absorbed', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  absorbed_at timestamptz
);

ALTER TABLE public.copilot_inbox ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators full access" ON public.copilot_inbox
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'creator')
  );

CREATE POLICY "Clients write own property" ON public.copilot_inbox
  FOR INSERT WITH CHECK (
    source = 'client' AND
    property_id IN (SELECT id FROM public.properties WHERE client_user_id = auth.uid())
  );

CREATE POLICY "Clients read own property" ON public.copilot_inbox
  FOR SELECT USING (
    property_id IN (SELECT id FROM public.properties WHERE client_user_id = auth.uid())
  );

ALTER TABLE public.report_pages ADD COLUMN IF NOT EXISTS proposed_by_ai boolean DEFAULT false;

-- Phase 9: Proactive alerts
CREATE TABLE public.proactive_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  severity text NOT NULL CHECK (severity IN ('info', 'recommended', 'urgent')),
  type text NOT NULL CHECK (type IN ('age_based', 'service_overdue', 'warranty', 'recall', 'seasonal', 'project_aware')),
  title text NOT NULL,
  body text NOT NULL,
  action_label text,
  action_url text,
  due_date date,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'shown', 'acknowledged', 'resolved', 'dismissed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_proactive_alerts_property_status ON public.proactive_alerts(property_id, status, created_at DESC);

ALTER TABLE public.proactive_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Homeowners read own alerts" ON public.proactive_alerts
  FOR SELECT USING (
    property_id IN (SELECT id FROM public.properties WHERE client_user_id = auth.uid())
  );

CREATE POLICY "Homeowners dismiss own alerts" ON public.proactive_alerts
  FOR UPDATE USING (
    property_id IN (SELECT id FROM public.properties WHERE client_user_id = auth.uid())
  ) WITH CHECK (
    property_id IN (SELECT id FROM public.properties WHERE client_user_id = auth.uid())
  );

CREATE POLICY "Creators manage all alerts" ON public.proactive_alerts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'creator')
  );
