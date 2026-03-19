
CREATE TABLE public.voice_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  transcript text NOT NULL,
  command_type text,
  response_text text,
  destination text,
  was_successful boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.voice_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage voice_interactions"
  ON public.voice_interactions FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE INDEX idx_voice_interactions_client ON public.voice_interactions(client_id);
CREATE INDEX idx_voice_interactions_created ON public.voice_interactions(created_at DESC);
