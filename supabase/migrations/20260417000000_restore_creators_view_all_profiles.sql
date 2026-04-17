-- Restore the "Creators can view all profiles" RLS policy on public.profiles.
--
-- Migration 20260309102325 defined this policy, but the live DB was missing
-- it (drift between migrations and prod state — likely a manual drop via the
-- Supabase SQL editor that never made it back into version control). Without
-- it, admins see "Unknown Client" for every row in the Clients list because
-- the profiles lookup in useAdminData only returns the caller's own row.
--
-- Verified missing against the live DB on 2026-04-17. This migration is
-- idempotent — DROP IF EXISTS first, then recreate.

DROP POLICY IF EXISTS "Creators can view all profiles" ON public.profiles;

CREATE POLICY "Creators can view all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'creator'::app_role));
