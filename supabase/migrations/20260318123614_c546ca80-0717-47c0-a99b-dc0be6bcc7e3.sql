
-- Feature 1: AI Draft History
CREATE TABLE public.ai_draft_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  section_type text NOT NULL,
  input_notes text NOT NULL,
  generated_text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  admin_id uuid NOT NULL
);
ALTER TABLE public.ai_draft_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators can manage ai_draft_history" ON public.ai_draft_history FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'creator'));

-- Feature 2: AI Message Suggestions
CREATE TABLE public.ai_message_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  thread_context_hash text,
  suggestions_json jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_message_suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators can manage ai_message_suggestions" ON public.ai_message_suggestions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'creator'));

-- Feature 3: AI Score Explanations
CREATE TABLE public.ai_score_explanations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  section text NOT NULL,
  score_value numeric,
  explanation_text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_score_explanations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators can manage ai_score_explanations" ON public.ai_score_explanations FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'creator'));

-- Feature 4: AI Cost Estimates
CREATE TABLE public.ai_cost_estimates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  project_type text NOT NULL,
  inputs_json jsonb NOT NULL DEFAULT '{}',
  estimates_json jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_cost_estimates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators can manage ai_cost_estimates" ON public.ai_cost_estimates FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'creator'));

-- Feature 5: AI Client Insights
CREATE TABLE public.ai_client_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  insights_json jsonb NOT NULL DEFAULT '[]',
  generated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_client_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators can manage ai_client_insights" ON public.ai_client_insights FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'creator'));

-- Feature 6: AI Maintenance Schedules
CREATE TABLE public.ai_maintenance_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  schedule_json jsonb NOT NULL DEFAULT '[]',
  generated_at timestamptz NOT NULL DEFAULT now(),
  applied_at timestamptz
);
ALTER TABLE public.ai_maintenance_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators can manage ai_maintenance_schedules" ON public.ai_maintenance_schedules FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'creator'));

-- Feature 7: AI Transcript Summaries
CREATE TABLE public.ai_transcript_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  transcript_text text,
  summary_json jsonb NOT NULL DEFAULT '{}',
  audio_file_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_transcript_summaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators can manage ai_transcript_summaries" ON public.ai_transcript_summaries FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'creator'));

-- Feature 8: AI Vendor Matches
CREATE TABLE public.ai_vendor_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  client_id uuid NOT NULL,
  vendor_recommendations_json jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_vendor_matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators can manage ai_vendor_matches" ON public.ai_vendor_matches FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'creator'));

-- Feature 10: Announcement Views
CREATE TABLE public.announcement_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id uuid NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  client_id uuid NOT NULL,
  viewed_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.announcement_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators can view announcement_views" ON public.announcement_views FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'creator'));
CREATE POLICY "Users can insert their own views" ON public.announcement_views FOR INSERT TO authenticated WITH CHECK (auth.uid() = client_id);

-- Feature 11: Client Timeline Events
CREATE TABLE public.client_timeline_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  event_type text NOT NULL,
  event_description text NOT NULL,
  actor text NOT NULL DEFAULT 'system',
  metadata_json jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  is_admin_note boolean NOT NULL DEFAULT false,
  note_text text
);
ALTER TABLE public.client_timeline_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators can manage client_timeline_events" ON public.client_timeline_events FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'creator'));

-- Feature 14: Central Vendors table
CREATE TABLE public.central_vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  contact_name text,
  phone text,
  email text,
  specialties text[] DEFAULT '{}',
  service_area text,
  lead_time text DEFAULT '1-3 Days',
  cost_tier text DEFAULT 'Mid-Range',
  rating integer DEFAULT 0,
  notes text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  admin_id uuid NOT NULL
);
ALTER TABLE public.central_vendors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators can manage central_vendors" ON public.central_vendors FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'creator'));

-- Feature 16: Report Versions
CREATE TABLE public.report_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  version_number integer NOT NULL DEFAULT 1,
  report_snapshot_json jsonb NOT NULL DEFAULT '{}',
  saved_at timestamptz NOT NULL DEFAULT now(),
  saved_by_admin_id uuid NOT NULL,
  change_notes text,
  is_published boolean NOT NULL DEFAULT false
);
ALTER TABLE public.report_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators can manage report_versions" ON public.report_versions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'creator'));

-- Feature 17: Automation Rules
CREATE TABLE public.automation_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_type text NOT NULL,
  rule_name text NOT NULL,
  rule_description text,
  config_json jsonb NOT NULL DEFAULT '{}',
  is_enabled boolean NOT NULL DEFAULT false,
  last_triggered_at timestamptz,
  trigger_count integer NOT NULL DEFAULT 0,
  admin_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators can manage automation_rules" ON public.automation_rules FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'creator'));

-- Feature 17: Automation Logs
CREATE TABLE public.automation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id uuid NOT NULL REFERENCES public.automation_rules(id) ON DELETE CASCADE,
  client_id uuid,
  triggered_at timestamptz NOT NULL DEFAULT now(),
  action_taken_description text NOT NULL
);
ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators can manage automation_logs" ON public.automation_logs FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'creator'));

-- Feature 20: Referrals
CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referring_client_id uuid NOT NULL,
  referred_name text NOT NULL,
  referred_email text,
  referred_phone text,
  referral_date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'lead',
  reward_status text NOT NULL DEFAULT 'pending',
  reward_amount numeric DEFAULT 250,
  notes text,
  converted_client_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  admin_id uuid NOT NULL
);
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators can manage referrals" ON public.referrals FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'creator'));
CREATE POLICY "Clients can view their own referrals" ON public.referrals FOR SELECT TO authenticated USING (auth.uid() = referring_client_id);

-- Add category to tasks table (if column doesn't exist)
DO $$ BEGIN
  ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS category text DEFAULT 'other';
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- Enable realtime for property_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.property_messages;
