-- Fix: client-side "Approve Tier" button silently failed in prod.
--
-- Surfaced by the proposal Golden Path on 2026-04-18. PricingTiers.tsx
-- inserts a project + invoice *from the client browser* when a homeowner
-- clicks "Approve Essential/Enhanced/Signature" on a published report
-- page. But RLS on public.projects only allowed creators to INSERT, so
-- every approval silently returned 42501 row-level security violation.
-- Clients got a toast error at best, a silent void at worst, and no
-- project was created. Literally every revenue-path click was broken.
--
-- Fix: grant INSERT to clients but scope it to their own property.
-- A client can only create a project on a property where
-- `properties.client_user_id = auth.uid()`. Same for invoices.
--
-- Security note: this does NOT validate that the tier price matches
-- what's stored on report_pages.tiers — a sufficiently motivated
-- client could approve a tier with an arbitrary low amount. That's a
-- design gap worth addressing later by routing approvals through an
-- edge function that reads the price server-side from the page. For
-- now, the admin sees every project + invoice before any money moves,
-- so this is operationally acceptable.

CREATE POLICY "Clients can approve tiers on their property (projects)"
  ON public.projects FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE properties.id = projects.property_id
        AND properties.client_user_id = auth.uid()
    )
  );

CREATE POLICY "Clients can approve tiers on their property (invoices)"
  ON public.invoices FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE properties.id = invoices.property_id
        AND properties.client_user_id = auth.uid()
    )
  );

-- Also: clients need SELECT on their own invoices for the PaymentsTab to
-- show them. Check if a policy already exists for that case; we'll add a
-- defensive one if not.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'invoices'
      AND cmd = 'SELECT'
      AND policyname LIKE '%lient%'
  ) THEN
    CREATE POLICY "Clients can view invoices on their property"
      ON public.invoices FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.properties
          WHERE properties.id = invoices.property_id
            AND properties.client_user_id = auth.uid()
        )
      );
  END IF;
END$$;
