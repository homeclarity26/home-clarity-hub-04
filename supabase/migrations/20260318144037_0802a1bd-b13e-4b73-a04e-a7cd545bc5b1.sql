
-- Tutorial progress tracking for both client and admin users
CREATE TABLE public.tutorial_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  checklist_items_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  onboarding_complete boolean NOT NULL DEFAULT false,
  completed_tours jsonb NOT NULL DEFAULT '[]'::jsonb,
  admin_setup_dismissed boolean NOT NULL DEFAULT false,
  admin_setup_items_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Unique constraint on user_id
ALTER TABLE public.tutorial_progress ADD CONSTRAINT tutorial_progress_user_id_unique UNIQUE (user_id);

-- Enable RLS
ALTER TABLE public.tutorial_progress ENABLE ROW LEVEL SECURITY;

-- Users can manage their own tutorial progress
CREATE POLICY "Users can manage their own tutorial progress"
  ON public.tutorial_progress
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Creators can view all tutorial progress
CREATE POLICY "Creators can view all tutorial progress"
  ON public.tutorial_progress
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'creator'::app_role));
