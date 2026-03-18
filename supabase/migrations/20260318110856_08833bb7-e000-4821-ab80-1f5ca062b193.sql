
-- Announcements system
CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  target_audience text NOT NULL DEFAULT 'all',
  target_client_ids uuid[] DEFAULT '{}',
  display_type text NOT NULL DEFAULT 'banner',
  start_date timestamptz NOT NULL DEFAULT now(),
  end_date timestamptz,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators can manage announcements" ON public.announcements FOR ALL TO authenticated USING (has_role(auth.uid(), 'creator'::app_role));
CREATE POLICY "Clients can view active announcements" ON public.announcements FOR SELECT TO authenticated USING (
  start_date <= now() AND (end_date IS NULL OR end_date >= now())
  AND (target_audience = 'all' OR auth.uid() = ANY(target_client_ids))
);

-- Announcement dismissals
CREATE TABLE public.announcement_dismissals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id uuid NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  dismissed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(announcement_id, user_id)
);

ALTER TABLE public.announcement_dismissals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their dismissals" ON public.announcement_dismissals FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Creators can view all dismissals" ON public.announcement_dismissals FOR SELECT TO authenticated USING (has_role(auth.uid(), 'creator'::app_role));

-- Client notification preferences
CREATE TABLE public.client_notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL UNIQUE,
  new_message boolean NOT NULL DEFAULT true,
  invoice_sent boolean NOT NULL DEFAULT true,
  payment_received boolean NOT NULL DEFAULT true,
  report_updated boolean NOT NULL DEFAULT true,
  project_status boolean NOT NULL DEFAULT true,
  maintenance_reminders boolean NOT NULL DEFAULT true,
  announcements boolean NOT NULL DEFAULT true,
  frequency text NOT NULL DEFAULT 'immediately',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.client_notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own prefs" ON public.client_notification_preferences FOR ALL TO authenticated USING (auth.uid() = client_id) WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Creators can view all prefs" ON public.client_notification_preferences FOR SELECT TO authenticated USING (has_role(auth.uid(), 'creator'::app_role));

-- Maintenance reminders
CREATE TABLE public.maintenance_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  equipment_id uuid REFERENCES public.equipment(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  recommended_month integer NOT NULL,
  last_sent_at timestamptz,
  is_dismissed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.maintenance_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators can manage reminders" ON public.maintenance_reminders FOR ALL TO authenticated USING (has_role(auth.uid(), 'creator'::app_role));
CREATE POLICY "Clients can view their reminders" ON public.maintenance_reminders FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM properties WHERE properties.id = maintenance_reminders.property_id AND properties.client_user_id = auth.uid()));
CREATE POLICY "Clients can update their reminders" ON public.maintenance_reminders FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM properties WHERE properties.id = maintenance_reminders.property_id AND properties.client_user_id = auth.uid()));

-- Satisfaction surveys (NPS)
CREATE TABLE public.satisfaction_surveys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  trigger_event text NOT NULL DEFAULT 'general',
  score integer NOT NULL CHECK (score >= 0 AND score <= 10),
  comment text,
  snoozed_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.satisfaction_surveys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators can manage surveys" ON public.satisfaction_surveys FOR ALL TO authenticated USING (has_role(auth.uid(), 'creator'::app_role));
CREATE POLICY "Clients can manage their surveys" ON public.satisfaction_surveys FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Add message_type and metadata to property_messages for video messages
ALTER TABLE public.property_messages ADD COLUMN IF NOT EXISTS message_type text NOT NULL DEFAULT 'text';
ALTER TABLE public.property_messages ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;
