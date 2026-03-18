
-- Services Library table
CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  name text NOT NULL,
  description text DEFAULT '',
  category text NOT NULL DEFAULT 'inspection',
  price numeric NOT NULL DEFAULT 0,
  price_type text NOT NULL DEFAULT 'flat',
  duration_hours numeric DEFAULT NULL,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators manage services" ON public.services FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'creator'::app_role));

CREATE POLICY "Clients can view active services" ON public.services FOR SELECT TO authenticated
  USING (is_active = true);

-- Junction table: membership tier <-> services
CREATE TABLE public.membership_tier_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_id uuid NOT NULL REFERENCES public.membership_tiers(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tier_id, service_id)
);

ALTER TABLE public.membership_tier_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators manage tier_services" ON public.membership_tier_services FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'creator'::app_role));

CREATE POLICY "Clients view tier_services" ON public.membership_tier_services FOR SELECT TO authenticated
  USING (true);

-- Add featured flag and price_type to membership_tiers
ALTER TABLE public.membership_tiers ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;
ALTER TABLE public.membership_tiers ADD COLUMN IF NOT EXISTS price_type text NOT NULL DEFAULT 'annual';
ALTER TABLE public.membership_tiers ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

-- Estimates table  
CREATE TABLE public.estimates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  admin_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'Estimate',
  status text NOT NULL DEFAULT 'draft',
  subtotal numeric NOT NULL DEFAULT 0,
  discount_amount numeric NOT NULL DEFAULT 0,
  discount_type text NOT NULL DEFAULT 'dollar',
  tax numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  notes text DEFAULT '',
  valid_until date DEFAULT NULL,
  sent_at timestamptz DEFAULT NULL,
  responded_at timestamptz DEFAULT NULL,
  converted_invoice_id uuid DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.estimates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators manage estimates" ON public.estimates FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'creator'::app_role));

CREATE POLICY "Clients view their estimates" ON public.estimates FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM properties WHERE properties.id = estimates.property_id AND properties.client_user_id = auth.uid()
  ));

CREATE POLICY "Clients can update estimate status" ON public.estimates FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM properties WHERE properties.id = estimates.property_id AND properties.client_user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM properties WHERE properties.id = estimates.property_id AND properties.client_user_id = auth.uid()
  ));

-- Estimate line items
CREATE TABLE public.estimate_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id uuid NOT NULL REFERENCES public.estimates(id) ON DELETE CASCADE,
  service_id uuid REFERENCES public.services(id) ON DELETE SET NULL,
  description text NOT NULL DEFAULT '',
  quantity numeric NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.estimate_line_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators manage estimate_line_items" ON public.estimate_line_items FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'creator'::app_role));

CREATE POLICY "Clients view their estimate_line_items" ON public.estimate_line_items FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM estimates e JOIN properties p ON p.id = e.property_id
    WHERE e.id = estimate_line_items.estimate_id AND p.client_user_id = auth.uid()
  ));

-- Add service_id to invoice_line_items for service library linking
ALTER TABLE public.invoice_line_items ADD COLUMN IF NOT EXISTS service_id uuid REFERENCES public.services(id) ON DELETE SET NULL;

-- À la carte service requests
CREATE TABLE public.service_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  notes text DEFAULT '',
  estimate_id uuid REFERENCES public.estimates(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators manage service_requests" ON public.service_requests FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'creator'::app_role));

CREATE POLICY "Clients manage their service_requests" ON public.service_requests FOR ALL TO authenticated
  USING (auth.uid() = client_id)
  WITH CHECK (auth.uid() = client_id);

-- Service request line items (which services were requested)
CREATE TABLE public.service_request_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.service_request_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators manage service_request_items" ON public.service_request_items FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'creator'::app_role));

CREATE POLICY "Clients manage their request_items" ON public.service_request_items FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM service_requests sr WHERE sr.id = service_request_items.request_id AND sr.client_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM service_requests sr WHERE sr.id = service_request_items.request_id AND sr.client_id = auth.uid()
  ));
