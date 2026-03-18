
CREATE TABLE public.feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  entity_type text NOT NULL DEFAULT 'report',
  entity_id uuid,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can add feedback for their property"
  ON public.feedback FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM properties WHERE id = feedback.property_id AND client_user_id = auth.uid())
  );

CREATE POLICY "Clients can view their own feedback"
  ON public.feedback FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM properties WHERE id = feedback.property_id AND client_user_id = auth.uid())
  );

CREATE POLICY "Creators can manage feedback"
  ON public.feedback FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'creator'::app_role));
