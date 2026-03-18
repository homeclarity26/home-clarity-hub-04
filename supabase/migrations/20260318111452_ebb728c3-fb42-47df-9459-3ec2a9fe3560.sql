
-- Contractor bids table for project bid comparison
CREATE TABLE public.contractor_bids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  contractor_name text NOT NULL,
  contact_name text,
  phone text,
  email text,
  scope_of_work text,
  bid_amount numeric NOT NULL DEFAULT 0,
  estimated_timeline text,
  warranty_offered text,
  bid_date date DEFAULT CURRENT_DATE,
  notes text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contractor_bids ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators can manage bids" ON public.contractor_bids
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'creator'::app_role));

CREATE POLICY "Clients can view their project bids" ON public.contractor_bids
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM projects p
    JOIN properties pr ON pr.id = p.property_id
    WHERE p.id = contractor_bids.project_id
    AND pr.client_user_id = auth.uid()
  ));

-- Payment escalation rules stored in profiles metadata (no new table needed)
-- Referral tracking - add referred_by to properties metadata (lightweight approach)
