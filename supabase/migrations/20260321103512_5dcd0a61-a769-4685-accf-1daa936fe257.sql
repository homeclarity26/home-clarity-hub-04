
-- ============================================
-- Self-Learning Intelligence Layer — 5 tables
-- ============================================

-- 1. learning_events
CREATE TABLE public.learning_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  actor_id uuid,
  actor_role text NOT NULL DEFAULT 'creator',
  entity_type text,
  entity_id text,
  event_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_learning_events_type ON public.learning_events (event_type);
CREATE INDEX idx_learning_events_actor ON public.learning_events (actor_id);
CREATE INDEX idx_learning_events_created ON public.learning_events (created_at DESC);
CREATE INDEX idx_learning_events_entity ON public.learning_events (entity_type, entity_id);
ALTER TABLE public.learning_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators can manage learning events" ON public.learning_events FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'creator') OR actor_id = auth.uid())
  WITH CHECK (public.has_role(auth.uid(), 'creator') OR actor_id = auth.uid());

-- 2. ai_suggestion_outcomes
CREATE TABLE public.ai_suggestion_outcomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  suggestion_type text NOT NULL,
  suggestion_data jsonb DEFAULT '{}'::jsonb,
  outcome text NOT NULL DEFAULT 'pending',
  edited_data jsonb,
  context jsonb DEFAULT '{}'::jsonb,
  admin_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_ai_outcomes_type ON public.ai_suggestion_outcomes (suggestion_type);
CREATE INDEX idx_ai_outcomes_admin ON public.ai_suggestion_outcomes (admin_id);
CREATE INDEX idx_ai_outcomes_outcome ON public.ai_suggestion_outcomes (outcome);
CREATE INDEX idx_ai_outcomes_created ON public.ai_suggestion_outcomes (created_at DESC);
ALTER TABLE public.ai_suggestion_outcomes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators can manage suggestion outcomes" ON public.ai_suggestion_outcomes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'creator') OR admin_id = auth.uid())
  WITH CHECK (public.has_role(auth.uid(), 'creator') OR admin_id = auth.uid());

-- 3. advisor_patterns
CREATE TABLE public.advisor_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  pattern_type text NOT NULL,
  pattern_key text NOT NULL,
  pattern_data jsonb DEFAULT '{}'::jsonb,
  usage_count integer NOT NULL DEFAULT 1,
  last_used_at timestamptz NOT NULL DEFAULT now(),
  confidence_score numeric(3,2) NOT NULL DEFAULT 0.50,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(admin_id, pattern_type, pattern_key)
);
CREATE INDEX idx_advisor_patterns_admin ON public.advisor_patterns (admin_id);
CREATE INDEX idx_advisor_patterns_type ON public.advisor_patterns (pattern_type);
CREATE INDEX idx_advisor_patterns_confidence ON public.advisor_patterns (confidence_score DESC);
ALTER TABLE public.advisor_patterns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators manage their patterns" ON public.advisor_patterns FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'creator') OR admin_id = auth.uid())
  WITH CHECK (public.has_role(auth.uid(), 'creator') OR admin_id = auth.uid());
CREATE TRIGGER update_advisor_patterns_updated_at BEFORE UPDATE ON public.advisor_patterns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. client_behavior_profiles
CREATE TABLE public.client_behavior_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL UNIQUE,
  engagement_level text NOT NULL DEFAULT 'medium',
  communication_preference text NOT NULL DEFAULT 'summary',
  response_speed_avg_hours numeric,
  portal_focus_areas jsonb DEFAULT '[]'::jsonb,
  goals_active integer NOT NULL DEFAULT 0,
  satisfaction_trend text NOT NULL DEFAULT 'stable',
  churn_risk_score integer NOT NULL DEFAULT 0,
  last_computed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_client_profiles_engagement ON public.client_behavior_profiles (engagement_level);
CREATE INDEX idx_client_profiles_churn ON public.client_behavior_profiles (churn_risk_score DESC);
ALTER TABLE public.client_behavior_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators can manage behavior profiles" ON public.client_behavior_profiles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'creator'))
  WITH CHECK (public.has_role(auth.uid(), 'creator'));
CREATE POLICY "Clients can read their own profile" ON public.client_behavior_profiles FOR SELECT TO authenticated
  USING (client_id = auth.uid());
CREATE TRIGGER update_client_behavior_profiles_updated_at BEFORE UPDATE ON public.client_behavior_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. cross_client_insights
CREATE TABLE public.cross_client_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  insight_type text NOT NULL,
  insight_key text NOT NULL,
  insight_data jsonb DEFAULT '{}'::jsonb,
  affected_client_count integer NOT NULL DEFAULT 0,
  confidence numeric(3,2) NOT NULL DEFAULT 0.50,
  last_updated timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(insight_type, insight_key)
);
CREATE INDEX idx_cross_insights_type ON public.cross_client_insights (insight_type);
CREATE INDEX idx_cross_insights_confidence ON public.cross_client_insights (confidence DESC);
ALTER TABLE public.cross_client_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators can manage cross-client insights" ON public.cross_client_insights FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'creator'))
  WITH CHECK (public.has_role(auth.uid(), 'creator'));
CREATE POLICY "Clients can read insights" ON public.cross_client_insights FOR SELECT TO authenticated
  USING (true);
