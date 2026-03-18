
-- CRM Contact types
CREATE TYPE public.crm_contact_type AS ENUM ('client', 'trade_partner');
CREATE TYPE public.crm_client_stage AS ENUM ('lead', 'onboarding', 'active', 'proposal_out', 'project_running', 'completed', 'at_risk', 'churned');
CREATE TYPE public.crm_partner_stage AS ENUM ('prospecting', 'vetting', 'approved', 'active', 'preferred', 'inactive');

-- 1. crm_contacts — unified contact metadata
CREATE TABLE public.crm_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_type crm_contact_type NOT NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  vendor_id UUID REFERENCES public.central_vendors(id) ON DELETE SET NULL,
  client_stage crm_client_stage DEFAULT 'lead',
  partner_stage crm_partner_stage DEFAULT 'prospecting',
  tags TEXT[] DEFAULT '{}',
  last_contact_date TIMESTAMPTZ,
  lifetime_value NUMERIC DEFAULT 0,
  referral_source TEXT,
  since_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.crm_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators manage crm_contacts" ON public.crm_contacts FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'creator')) WITH CHECK (public.has_role(auth.uid(), 'creator'));
CREATE INDEX idx_crm_contacts_type ON public.crm_contacts(contact_type);
CREATE INDEX idx_crm_contacts_property ON public.crm_contacts(property_id);
CREATE INDEX idx_crm_contacts_vendor ON public.crm_contacts(vendor_id);

-- 2. crm_pipeline_history — stage change log
CREATE TABLE public.crm_pipeline_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID NOT NULL REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  from_stage TEXT,
  to_stage TEXT NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT
);
ALTER TABLE public.crm_pipeline_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators manage pipeline_history" ON public.crm_pipeline_history FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'creator')) WITH CHECK (public.has_role(auth.uid(), 'creator'));
CREATE INDEX idx_pipeline_history_contact ON public.crm_pipeline_history(contact_id);

-- 3. crm_activity_log — CRM-specific activity feed
CREATE TABLE public.crm_activity_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID NOT NULL REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  channel TEXT,
  content_preview TEXT,
  metadata JSONB DEFAULT '{}',
  logged_by UUID REFERENCES auth.users(id),
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.crm_activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators manage crm_activity_log" ON public.crm_activity_log FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'creator')) WITH CHECK (public.has_role(auth.uid(), 'creator'));
CREATE INDEX idx_crm_activity_contact ON public.crm_activity_log(contact_id);
CREATE INDEX idx_crm_activity_type ON public.crm_activity_log(activity_type);

-- 4. crm_contacts_people — associated people per account
CREATE TABLE public.crm_contacts_people (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID NOT NULL REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  relationship TEXT,
  phone TEXT,
  email TEXT,
  preferred_method TEXT DEFAULT 'email',
  birthday DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.crm_contacts_people ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators manage crm_contacts_people" ON public.crm_contacts_people FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'creator')) WITH CHECK (public.has_role(auth.uid(), 'creator'));

-- 5. crm_saved_filters
CREATE TABLE public.crm_saved_filters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  filter_json JSONB NOT NULL DEFAULT '{}',
  contact_type crm_contact_type,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.crm_saved_filters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators manage crm_saved_filters" ON public.crm_saved_filters FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'creator')) WITH CHECK (public.has_role(auth.uid(), 'creator'));

-- 6. Add columns to central_vendors
ALTER TABLE public.central_vendors
  ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS license_number TEXT,
  ADD COLUMN IF NOT EXISTS insurance_expiry DATE,
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS vetting_checklist JSONB DEFAULT '{"license_verified":false,"insurance_verified":false,"w9_on_file":false,"background_check":false,"reference_check":false}',
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Updated at trigger for crm_contacts
CREATE TRIGGER update_crm_contacts_updated_at BEFORE UPDATE ON public.crm_contacts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
