-- H9: Drop legacy numeric Health Score artifacts
--
-- The v2 rebuild eliminates numerical scoring entirely. Word-rating
-- (Excellent / Good / Fair / Poor / Critical) on report_pages.condition_rating
-- is the source of truth.
--
-- This migration assumes the H-batch-2 PR (#97) has shipped and Vercel has
-- deployed clean — i.e. nothing in the live frontend reads or writes
-- health_bar or health_score_history anymore.
--
-- Companion code changes in this PR also remove the residual reads/writes
-- from src/hooks/useReportPage.ts, src/hooks/useClientPortal.ts, and the
-- NewReportWizard insert path. Types are regenerated in H10 (same PR).

-- 1. Drop the per-page numeric health_bar JSONB column
ALTER TABLE public.report_pages
  DROP COLUMN IF EXISTS health_bar;

-- 2. Drop the historical numeric scores table (consumed only by the now-deleted
-- HealthScoreTrend recharts component)
DROP TABLE IF EXISTS public.health_score_history;
