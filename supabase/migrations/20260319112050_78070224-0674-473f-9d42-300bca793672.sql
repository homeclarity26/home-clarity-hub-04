-- Add Stripe fields to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
  ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS subscription_current_period_end timestamptz,
  ADD COLUMN IF NOT EXISTS subscription_plan_id text,
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz;

-- Add Stripe price IDs to membership_tiers
ALTER TABLE public.membership_tiers
  ADD COLUMN IF NOT EXISTS stripe_price_monthly text,
  ADD COLUMN IF NOT EXISTS stripe_price_annual text;

-- Create subscription_events table
CREATE TABLE IF NOT EXISTS public.subscription_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  event_type text NOT NULL,
  stripe_event_id text,
  amount_cents integer DEFAULT 0,
  currency text DEFAULT 'usd',
  period_start timestamptz,
  period_end timestamptz,
  invoice_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators can manage subscription events"
  ON public.subscription_events FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'creator'));

CREATE POLICY "Clients can read own subscription events"
  ON public.subscription_events FOR SELECT TO authenticated
  USING (client_id = auth.uid());

CREATE INDEX idx_subscription_events_client ON public.subscription_events(client_id);
CREATE INDEX idx_profiles_stripe_customer ON public.profiles(stripe_customer_id);