
-- Referral Links
CREATE TABLE public.referral_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  client_id uuid NOT NULL,
  referral_code text UNIQUE NOT NULL,
  referral_url text,
  total_referrals integer NOT NULL DEFAULT 0,
  total_converted integer NOT NULL DEFAULT 0,
  total_credits_earned_cents integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.referral_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients read own referral links"
  ON public.referral_links FOR SELECT TO authenticated
  USING (auth.uid() = client_id);

CREATE POLICY "Authenticated users can insert referral links"
  ON public.referral_links FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Creators can read all referral links"
  ON public.referral_links FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'creator'));

-- Referral Events
CREATE TABLE public.referral_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_code text NOT NULL,
  referrer_property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  referred_email text,
  referred_name text,
  status text NOT NULL DEFAULT 'clicked',
  credit_amount_cents integer,
  credit_applied_at timestamptz,
  referred_property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.referral_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read referral events"
  ON public.referral_events FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Service can insert referral events"
  ON public.referral_events FOR INSERT TO authenticated
  WITH CHECK (true);

-- Referral Credits
CREATE TABLE public.referral_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  amount_cents integer NOT NULL,
  reason text,
  referral_event_id uuid REFERENCES public.referral_events(id) ON DELETE SET NULL,
  expires_at timestamptz,
  applied_to_invoice_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL,
  applied_at timestamptz,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.referral_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read referral credits"
  ON public.referral_credits FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated can insert referral credits"
  ON public.referral_credits FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update referral credits"
  ON public.referral_credits FOR UPDATE TO authenticated
  USING (true);

CREATE INDEX idx_referral_links_client ON public.referral_links(client_id);
CREATE INDEX idx_referral_links_code ON public.referral_links(referral_code);
CREATE INDEX idx_referral_events_code ON public.referral_events(referral_code);
CREATE INDEX idx_referral_credits_property ON public.referral_credits(property_id);
CREATE INDEX idx_referral_credits_status ON public.referral_credits(status);
