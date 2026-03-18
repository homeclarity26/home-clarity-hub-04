
-- Feature 1: Onboarding flag
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS has_completed_onboarding boolean DEFAULT false;

-- Feature 6: Home value history
CREATE TABLE public.home_value_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  estimated_value numeric NOT NULL,
  notes text,
  recorded_at date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.home_value_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view their value history" ON public.home_value_history
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM properties WHERE properties.id = home_value_history.property_id AND properties.client_user_id = auth.uid()));

CREATE POLICY "Creators can manage value history" ON public.home_value_history
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'creator'::app_role));

-- Feature 6: Add value contribution to projects
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS value_contribution_estimate numeric;

-- Feature 6: Add neighborhood median to properties
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS neighborhood_median_value numeric;

-- Feature 7: Membership dates on profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS membership_start_date date;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS membership_end_date date;
