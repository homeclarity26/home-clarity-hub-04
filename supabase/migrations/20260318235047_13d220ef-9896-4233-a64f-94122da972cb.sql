
CREATE TABLE public.agent_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  role text NOT NULL DEFAULT 'creator',
  session_id text,
  user_message text NOT NULL,
  agent_reply text,
  tools_called jsonb DEFAULT '[]'::jsonb,
  error text,
  duration_ms integer,
  tokens_used integer,
  page_context jsonb,
  actions_taken integer DEFAULT 0
);

ALTER TABLE public.agent_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own agent logs"
  ON public.agent_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own agent logs"
  ON public.agent_logs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE INDEX idx_agent_logs_user_id ON public.agent_logs(user_id);
CREATE INDEX idx_agent_logs_session_id ON public.agent_logs(session_id);
CREATE INDEX idx_agent_logs_created_at ON public.agent_logs(created_at DESC);
