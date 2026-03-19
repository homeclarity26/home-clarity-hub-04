
CREATE TABLE public.home_value_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  snapshot_date date NOT NULL DEFAULT CURRENT_DATE,
  estimated_value integer,
  low_estimate integer,
  high_estimate integer,
  price_per_sqft decimal,
  neighborhood_avg integer,
  data_source text DEFAULT 'rentcast',
  raw_response jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(property_id, snapshot_date)
);

ALTER TABLE public.home_value_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read snapshots"
  ON public.home_value_snapshots FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service insert snapshots"
  ON public.home_value_snapshots FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Anon read snapshots"
  ON public.home_value_snapshots FOR SELECT
  TO anon
  USING (true);

CREATE INDEX idx_snapshots_property_date ON public.home_value_snapshots(property_id, snapshot_date DESC);
