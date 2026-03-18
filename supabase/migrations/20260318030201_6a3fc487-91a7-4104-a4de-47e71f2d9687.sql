
CREATE TABLE public.property_valuations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  address text NOT NULL,
  price numeric,
  price_range_low numeric,
  price_range_high numeric,
  subject_property jsonb DEFAULT '{}'::jsonb,
  comparables jsonb DEFAULT '[]'::jsonb,
  fetched_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.property_valuations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view their valuations" ON public.property_valuations
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM properties WHERE properties.id = property_valuations.property_id AND properties.client_user_id = auth.uid()
  ));

CREATE POLICY "Creators can manage valuations" ON public.property_valuations
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'creator'::app_role));

CREATE INDEX idx_property_valuations_property_id ON public.property_valuations(property_id);
CREATE INDEX idx_property_valuations_fetched_at ON public.property_valuations(fetched_at DESC);
