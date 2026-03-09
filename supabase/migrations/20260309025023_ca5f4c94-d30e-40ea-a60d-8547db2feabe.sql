
-- Create report_comments table
CREATE TABLE public.report_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_page_id uuid NOT NULL REFERENCES public.report_pages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  comment_text text NOT NULL,
  comment_type text NOT NULL DEFAULT 'note',
  response_text text,
  responded_by uuid,
  resolved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.report_comments ENABLE ROW LEVEL SECURITY;

-- Clients can view comments on their report pages
CREATE POLICY "Clients can view their comments"
ON public.report_comments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM report_pages
    JOIN reports ON reports.id = report_pages.report_id
    JOIN properties ON properties.id = reports.property_id
    WHERE report_pages.id = report_comments.report_page_id
    AND properties.client_user_id = auth.uid()
  )
);

-- Clients can insert comments on their report pages
CREATE POLICY "Clients can add comments"
ON public.report_comments
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM report_pages
    JOIN reports ON reports.id = report_pages.report_id
    JOIN properties ON properties.id = reports.property_id
    WHERE report_pages.id = report_comments.report_page_id
    AND properties.client_user_id = auth.uid()
  )
);

-- Creators can do everything with comments
CREATE POLICY "Creators can manage comments"
ON public.report_comments
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'creator'::app_role));

-- Updated at trigger
CREATE TRIGGER update_report_comments_updated_at
  BEFORE UPDATE ON public.report_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
