
-- Feature 24: AI Priority Cards
CREATE TABLE public.ai_priority_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  priorities_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  generated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_priority_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients view their priorities" ON public.ai_priority_cards FOR SELECT TO authenticated USING (auth.uid() = client_id);
CREATE POLICY "Creators manage priorities" ON public.ai_priority_cards FOR ALL TO authenticated USING (has_role(auth.uid(), 'creator'::app_role));

-- Feature 25: Appointment Requests
CREATE TABLE public.appointment_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  preferred_slots_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  topic text NOT NULL,
  notes text,
  status text NOT NULL DEFAULT 'pending',
  confirmed_slot timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.appointment_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients manage their appointments" ON public.appointment_requests FOR ALL TO authenticated USING (auth.uid() = client_id) WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Creators manage appointments" ON public.appointment_requests FOR ALL TO authenticated USING (has_role(auth.uid(), 'creator'::app_role));

-- Feature 27: Client Satisfaction Scores
CREATE TABLE public.client_satisfaction_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  report_id uuid,
  score integer NOT NULL CHECK (score >= 1 AND score <= 5),
  comment text,
  submitted_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.client_satisfaction_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients manage their scores" ON public.client_satisfaction_scores FOR ALL TO authenticated USING (auth.uid() = client_id) WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Creators view scores" ON public.client_satisfaction_scores FOR SELECT TO authenticated USING (has_role(auth.uid(), 'creator'::app_role));

-- Feature 28: Glossary Terms
CREATE TABLE public.glossary_terms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  term text NOT NULL,
  definition text NOT NULL,
  related_terms text[] DEFAULT '{}'::text[],
  category text NOT NULL DEFAULT 'general',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.glossary_terms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view glossary" ON public.glossary_terms FOR SELECT TO authenticated USING (true);
CREATE POLICY "Creators manage glossary" ON public.glossary_terms FOR ALL TO authenticated USING (has_role(auth.uid(), 'creator'::app_role));

-- Feature 30: SMS Subscriptions
CREATE TABLE public.sms_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  user_type text NOT NULL DEFAULT 'client',
  phone_number text NOT NULL,
  is_verified boolean NOT NULL DEFAULT false,
  verification_code text,
  opted_in_events_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.sms_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their sms subs" ON public.sms_subscriptions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Creators view all sms subs" ON public.sms_subscriptions FOR SELECT TO authenticated USING (has_role(auth.uid(), 'creator'::app_role));
