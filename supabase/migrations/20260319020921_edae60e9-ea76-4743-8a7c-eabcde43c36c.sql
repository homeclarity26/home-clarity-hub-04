
-- maintenance_predictions table
CREATE TABLE public.maintenance_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  equipment_id uuid REFERENCES public.equipment(id) ON DELETE SET NULL,
  system_type text NOT NULL,
  prediction_type text NOT NULL DEFAULT 'service',
  probability_score integer NOT NULL DEFAULT 50,
  predicted_timeframe text NOT NULL DEFAULT '1_year',
  confidence_level text NOT NULL DEFAULT 'medium',
  reasoning jsonb DEFAULT '[]'::jsonb,
  estimated_cost_low numeric DEFAULT 0,
  estimated_cost_high numeric DEFAULT 0,
  generated_at timestamptz NOT NULL DEFAULT now(),
  last_updated_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'active',
  CONSTRAINT chk_prediction_type CHECK (prediction_type IN ('service','replacement','inspection')),
  CONSTRAINT chk_timeframe CHECK (predicted_timeframe IN ('immediate','3_months','6_months','1_year','2_years','3_years','5_years')),
  CONSTRAINT chk_confidence CHECK (confidence_level IN ('low','medium','high')),
  CONSTRAINT chk_status CHECK (status IN ('active','dismissed','completed'))
);

ALTER TABLE public.maintenance_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators can manage all predictions"
  ON public.maintenance_predictions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'creator'))
  WITH CHECK (public.has_role(auth.uid(), 'creator'));

CREATE POLICY "Clients can read own predictions"
  ON public.maintenance_predictions FOR SELECT TO authenticated
  USING (client_id = auth.uid());

-- prediction_factors table
CREATE TABLE public.prediction_factors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id uuid NOT NULL REFERENCES public.maintenance_predictions(id) ON DELETE CASCADE,
  factor_name text NOT NULL,
  factor_value text NOT NULL,
  weight numeric NOT NULL DEFAULT 1,
  description text
);

ALTER TABLE public.prediction_factors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators can manage all factors"
  ON public.prediction_factors FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'creator'))
  WITH CHECK (public.has_role(auth.uid(), 'creator'));

CREATE POLICY "Clients can read own factors"
  ON public.prediction_factors FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.maintenance_predictions mp
    WHERE mp.id = prediction_id AND mp.client_id = auth.uid()
  ));

-- maintenance_outcomes table
CREATE TABLE public.maintenance_outcomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  equipment_id uuid REFERENCES public.equipment(id) ON DELETE SET NULL,
  prediction_id uuid REFERENCES public.maintenance_predictions(id) ON DELETE SET NULL,
  actual_service_date date NOT NULL,
  actual_cost numeric DEFAULT 0,
  outcome_notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.maintenance_outcomes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators can manage all outcomes"
  ON public.maintenance_outcomes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'creator'))
  WITH CHECK (public.has_role(auth.uid(), 'creator'));

CREATE POLICY "Clients can read own outcomes"
  ON public.maintenance_outcomes FOR SELECT TO authenticated
  USING (client_id = auth.uid());

-- Indexes
CREATE INDEX idx_predictions_client ON public.maintenance_predictions(client_id);
CREATE INDEX idx_predictions_status ON public.maintenance_predictions(status);
CREATE INDEX idx_prediction_factors_pred ON public.prediction_factors(prediction_id);
CREATE INDEX idx_outcomes_client ON public.maintenance_outcomes(client_id);
CREATE INDEX idx_outcomes_prediction ON public.maintenance_outcomes(prediction_id);
