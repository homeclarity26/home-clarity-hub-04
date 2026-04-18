-- Fix: reports.status and report_pages.status check constraints forbid
-- `'published'`, but the entire codebase writes / reads that status
-- (see hbc-agent publish_report tool, NewReportWizard.tsx, PublishBar,
-- ReportPageManager, AdminAnalytics, ai-weekly-digest, etc.). This is
-- classic schema drift — code moved forward, constraints didn't.
--
-- Discovered during Golden Path run on 2026-04-18: step 5 ("creator
-- publishes the report") failed with check_constraint violation 23514.
-- Until this migration runs, Adam cannot publish a report in prod —
-- every publish attempt returns 400 from the DB.
--
-- We widen the constraints to include what the code expects. Keeping the
-- old values so existing rows aren't orphaned.

ALTER TABLE public.reports
  DROP CONSTRAINT IF EXISTS reports_status_check,
  ADD CONSTRAINT reports_status_check
    CHECK (status = ANY (ARRAY['draft'::text, 'in_progress'::text, 'complete'::text, 'published'::text, 'archived'::text]));

ALTER TABLE public.report_pages
  DROP CONSTRAINT IF EXISTS report_pages_status_check,
  ADD CONSTRAINT report_pages_status_check
    CHECK (status = ANY (ARRAY['draft'::text, 'complete'::text, 'needs_review'::text, 'published'::text, 'flagged'::text]));
