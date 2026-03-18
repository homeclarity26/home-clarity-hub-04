
-- Feature 5: API Keys & Webhooks
CREATE TABLE public.api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  key_hash text NOT NULL,
  label text NOT NULL DEFAULT 'Default',
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true
);
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators manage api_keys" ON public.api_keys FOR ALL TO authenticated USING (has_role(auth.uid(), 'creator'::app_role));

CREATE TABLE public.webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  endpoint_url text NOT NULL,
  label text NOT NULL,
  events_subscribed_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  secret_token text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_triggered_at timestamptz,
  failure_count integer NOT NULL DEFAULT 0
);
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators manage webhooks" ON public.webhooks FOR ALL TO authenticated USING (has_role(auth.uid(), 'creator'::app_role));

CREATE TABLE public.webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id uuid NOT NULL REFERENCES public.webhooks(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  payload_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  response_status integer,
  response_body text,
  fired_at timestamptz NOT NULL DEFAULT now(),
  success boolean NOT NULL DEFAULT false
);
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators manage webhook_logs" ON public.webhook_logs FOR ALL TO authenticated USING (has_role(auth.uid(), 'creator'::app_role));

-- Feature 7: Audit Log
CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_type text NOT NULL DEFAULT 'system',
  actor_id uuid,
  actor_name text,
  action_type text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  entity_label text,
  old_value_json jsonb,
  new_value_json jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators can read audit_log" ON public.audit_log FOR SELECT TO authenticated USING (has_role(auth.uid(), 'creator'::app_role));
CREATE POLICY "System can insert audit_log" ON public.audit_log FOR INSERT TO authenticated WITH CHECK (true);

-- Feature 8: Report Templates
CREATE TABLE public.report_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  tier_label text NOT NULL DEFAULT 'Standard',
  cover_style text NOT NULL DEFAULT 'standard',
  sections_config_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  scoring_weights_json jsonb NOT NULL DEFAULT '{"exterior":33,"interior":33,"systems":34}'::jsonb,
  color_scheme_json jsonb NOT NULL DEFAULT '{"primary":"#1B2B4D","accent":"#C9A84C","cover_bg":"#1B2B4D"}'::jsonb,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.report_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators manage report_templates" ON public.report_templates FOR ALL TO authenticated USING (has_role(auth.uid(), 'creator'::app_role));

-- Feature 9: E-Signature
CREATE TABLE public.signature_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  admin_id uuid NOT NULL,
  document_title text NOT NULL,
  document_type text NOT NULL DEFAULT 'custom',
  document_content_html text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft',
  sent_at timestamptz,
  signed_at timestamptz,
  declined_at timestamptz,
  expires_at timestamptz,
  signed_document_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.signature_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators manage signature_requests" ON public.signature_requests FOR ALL TO authenticated USING (has_role(auth.uid(), 'creator'::app_role));
CREATE POLICY "Clients view their signature_requests" ON public.signature_requests FOR SELECT TO authenticated USING (auth.uid() = client_id);
CREATE POLICY "Clients update their signature_requests" ON public.signature_requests FOR UPDATE TO authenticated USING (auth.uid() = client_id);

CREATE TABLE public.signature_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.signature_requests(id) ON DELETE CASCADE,
  field_type text NOT NULL DEFAULT 'signature',
  page_number integer NOT NULL DEFAULT 1,
  x_position numeric NOT NULL DEFAULT 0,
  y_position numeric NOT NULL DEFAULT 0,
  is_required boolean NOT NULL DEFAULT true,
  value text,
  signed_at timestamptz
);
ALTER TABLE public.signature_fields ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators manage signature_fields" ON public.signature_fields FOR ALL TO authenticated USING (has_role(auth.uid(), 'creator'::app_role));
CREATE POLICY "Clients manage their signature_fields" ON public.signature_fields FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.signature_requests sr WHERE sr.id = signature_fields.request_id AND sr.client_id = auth.uid())
);

-- Feature 10: SLA Tracking
CREATE TABLE public.sla_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  tier_label text NOT NULL DEFAULT 'Standard',
  message_response_hours integer NOT NULL DEFAULT 24,
  report_delivery_days integer NOT NULL DEFAULT 14,
  first_contact_hours integer NOT NULL DEFAULT 4,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.sla_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators manage sla_configs" ON public.sla_configs FOR ALL TO authenticated USING (has_role(auth.uid(), 'creator'::app_role));

CREATE TABLE public.sla_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  sla_type text NOT NULL,
  triggered_at timestamptz NOT NULL DEFAULT now(),
  target_deadline timestamptz NOT NULL,
  completed_at timestamptz,
  was_met boolean,
  variance_minutes integer,
  related_entity_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.sla_tracking ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators manage sla_tracking" ON public.sla_tracking FOR ALL TO authenticated USING (has_role(auth.uid(), 'creator'::app_role));

-- Feature 11: Membership Tiers
CREATE TABLE public.membership_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price_monthly numeric NOT NULL DEFAULT 0,
  price_annually numeric NOT NULL DEFAULT 0,
  features_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  report_frequency text NOT NULL DEFAULT 'Annual',
  response_time_sla_hours integer NOT NULL DEFAULT 24,
  max_properties integer NOT NULL DEFAULT 1,
  color_hex text NOT NULL DEFAULT '#C9A84C',
  is_active boolean NOT NULL DEFAULT true,
  stripe_price_id_monthly text,
  stripe_price_id_annually text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.membership_tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators manage membership_tiers" ON public.membership_tiers FOR ALL TO authenticated USING (has_role(auth.uid(), 'creator'::app_role));
CREATE POLICY "Anyone can view active tiers" ON public.membership_tiers FOR SELECT TO authenticated USING (is_active = true);

CREATE TABLE public.client_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  tier_id uuid NOT NULL REFERENCES public.membership_tiers(id),
  billing_cycle text NOT NULL DEFAULT 'annual',
  status text NOT NULL DEFAULT 'active',
  stripe_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  trial_ends_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.client_memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators manage client_memberships" ON public.client_memberships FOR ALL TO authenticated USING (has_role(auth.uid(), 'creator'::app_role));
CREATE POLICY "Clients view their membership" ON public.client_memberships FOR SELECT TO authenticated USING (auth.uid() = client_id);

-- Feature 12: Onboarding Workflows
CREATE TABLE public.onboarding_workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT false,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.onboarding_workflows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators manage onboarding_workflows" ON public.onboarding_workflows FOR ALL TO authenticated USING (has_role(auth.uid(), 'creator'::app_role));

CREATE TABLE public.onboarding_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid NOT NULL REFERENCES public.onboarding_workflows(id) ON DELETE CASCADE,
  step_order integer NOT NULL DEFAULT 0,
  delay_days integer NOT NULL DEFAULT 0,
  delay_hours integer NOT NULL DEFAULT 0,
  action_type text NOT NULL DEFAULT 'send_message',
  action_config_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.onboarding_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators manage onboarding_steps" ON public.onboarding_steps FOR ALL TO authenticated USING (has_role(auth.uid(), 'creator'::app_role));

CREATE TABLE public.onboarding_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid NOT NULL REFERENCES public.onboarding_workflows(id),
  client_id uuid NOT NULL,
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  current_step integer NOT NULL DEFAULT 0,
  completed_at timestamptz,
  is_paused boolean NOT NULL DEFAULT false
);
ALTER TABLE public.onboarding_enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators manage onboarding_enrollments" ON public.onboarding_enrollments FOR ALL TO authenticated USING (has_role(auth.uid(), 'creator'::app_role));

-- Feature 19: Health Score History
CREATE TABLE public.health_score_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  report_id uuid,
  overall_score integer,
  exterior_score integer,
  interior_score integer,
  systems_score integer,
  recorded_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.health_score_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators manage health_score_history" ON public.health_score_history FOR ALL TO authenticated USING (has_role(auth.uid(), 'creator'::app_role));
CREATE POLICY "Clients view their score history" ON public.health_score_history FOR SELECT TO authenticated USING (auth.uid() = client_id);

-- Feature 20: Message Templates
CREATE TABLE public.message_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  title text NOT NULL,
  category text NOT NULL DEFAULT 'General',
  body_text text NOT NULL,
  merge_tags_used_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  use_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators manage message_templates" ON public.message_templates FOR ALL TO authenticated USING (has_role(auth.uid(), 'creator'::app_role));

-- Feature 13: Push Subscriptions
CREATE TABLE public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid,
  client_id uuid,
  endpoint text NOT NULL,
  p256dh_key text NOT NULL,
  auth_key text NOT NULL,
  device_label text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their push_subscriptions" ON public.push_subscriptions FOR ALL TO authenticated USING (auth.uid() = admin_id OR auth.uid() = client_id);

-- Feature 15: Report pre-fill
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS based_on_report_id uuid;

-- Feature 22: Photo submissions
CREATE TABLE public.photo_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  property_id uuid NOT NULL,
  tag text NOT NULL DEFAULT 'Other',
  notes text,
  is_concern boolean NOT NULL DEFAULT false,
  storage_path text NOT NULL,
  review_status text NOT NULL DEFAULT 'pending',
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.photo_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators manage photo_submissions" ON public.photo_submissions FOR ALL TO authenticated USING (has_role(auth.uid(), 'creator'::app_role));
CREATE POLICY "Clients manage their photo_submissions" ON public.photo_submissions FOR ALL TO authenticated USING (auth.uid() = client_id);
