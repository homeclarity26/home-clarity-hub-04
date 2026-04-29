-- Wizard Drafts: persistent state for the 5-step new-client wizard.
--
-- Lets a creator resume an in-progress wizard run after a crash, network
-- failure, or browser close. Without this table the wizard held all state
-- in React memory; if the analyzer 500'd or the tab refreshed mid-Step-1,
-- every uploaded file and answered question was lost.
--
-- step_data is the full WizardState envelope (intake / toc / authoring /
-- strategy / publish) as JSON. uploaded_file_paths is the list of storage
-- paths the wizard has uploaded so far so we can restore them on resume
-- and clean up if the draft is abandoned.

CREATE TABLE public.wizard_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  report_id UUID REFERENCES public.reports(id) ON DELETE SET NULL,
  current_step TEXT NOT NULL DEFAULT 'intake',
  step_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  uploaded_file_paths TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  status TEXT NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('in_progress', 'published', 'abandoned')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX wizard_drafts_creator_status_updated_idx
  ON public.wizard_drafts (creator_id, status, updated_at DESC);

ALTER TABLE public.wizard_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "creators read own wizard drafts"
  ON public.wizard_drafts FOR SELECT
  USING (creator_id = auth.uid());

CREATE POLICY "creators insert own wizard drafts"
  ON public.wizard_drafts FOR INSERT
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "creators update own wizard drafts"
  ON public.wizard_drafts FOR UPDATE
  USING (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "creators delete own wizard drafts"
  ON public.wizard_drafts FOR DELETE
  USING (creator_id = auth.uid());

CREATE OR REPLACE FUNCTION public.touch_wizard_drafts_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER wizard_drafts_touch_updated_at
  BEFORE UPDATE ON public.wizard_drafts
  FOR EACH ROW EXECUTE FUNCTION public.touch_wizard_drafts_updated_at();

-- Storage bucket for wizard intake uploads (private; creator-only).
-- 50 MB per file ceiling matches the Supabase project default and gives
-- ample headroom for large iGUIDE PDFs and walkthrough recordings.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('wizard-uploads', 'wizard-uploads', false, 52428800, NULL)
ON CONFLICT (id) DO UPDATE
  SET file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Path convention: {creator_id}/{draft_id}/{card_key}/{filename}.
-- The first path segment must equal auth.uid() so creators can only touch
-- their own files even if they guess a draft id.
CREATE POLICY "creators read own wizard uploads"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'wizard-uploads'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "creators insert own wizard uploads"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'wizard-uploads'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'creator'
    )
  );

CREATE POLICY "creators update own wizard uploads"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'wizard-uploads'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "creators delete own wizard uploads"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'wizard-uploads'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
