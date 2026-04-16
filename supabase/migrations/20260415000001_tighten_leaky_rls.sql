-- ═══════════════════════════════════════════════════════════════════════════
-- RLS tightening — close cross-tenant data leakage on 9 tables.
--
-- Problem: seven tables in 20260319023501_* and a few others ship with
-- `USING (true) WITH CHECK (true)` on the authenticated role. That means any
-- logged-in user (including clients of other properties) can read AND write
-- every other property's permits, warranties, service history, etc.
--
-- Fix: replace the blanket policies with property-scoped policies that honor
-- the creator/client role model already used by `properties`, `reports`,
-- `invoices`, etc.
--
-- This migration is idempotent — it drops the old policies and recreates
-- scoped ones. Run-safe on existing environments.
-- ═══════════════════════════════════════════════════════════════════════════

-- Helper function: does this user own a property (as creator, or client)?
-- Note: the existing `has_role(uid, role)` function handles the creator check;
-- we still need per-property scoping for client reads.
CREATE OR REPLACE FUNCTION public.user_can_access_property(p_property_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id = p_property_id
      AND (
        p.client_user_id = auth.uid()
        OR p.creator_user_id = auth.uid()
        OR public.has_role(auth.uid(), 'creator'::app_role)
      )
  );
$$;

COMMENT ON FUNCTION public.user_can_access_property(uuid) IS
  'Returns true if the caller is the property owner, its client, or has the creator role.';

-- ───────────────────────────────────────────────────────────────────────
-- Tables originally created with `USING (true) WITH CHECK (true)`:
--   document_extractions, home_knowledge_base, property_timeline,
--   structural_specifications, warranty_registry, permit_registry,
--   service_history
-- These tables all have a `property_id` column per the creation migration.
-- ───────────────────────────────────────────────────────────────────────

-- Factored macro: drop + recreate scoped policies per table.
-- Postgres doesn't have macros, so we inline. Each block is identical shape.

-- document_extractions
DROP POLICY IF EXISTS "Authenticated users can manage document_extractions" ON public.document_extractions;
DROP POLICY IF EXISTS "Scoped access document_extractions" ON public.document_extractions;
CREATE POLICY "Scoped access document_extractions"
  ON public.document_extractions FOR ALL TO authenticated
  USING (public.user_can_access_property(property_id))
  WITH CHECK (public.user_can_access_property(property_id));

-- home_knowledge_base
DROP POLICY IF EXISTS "Authenticated users can manage home_knowledge_base" ON public.home_knowledge_base;
DROP POLICY IF EXISTS "Scoped access home_knowledge_base" ON public.home_knowledge_base;
CREATE POLICY "Scoped access home_knowledge_base"
  ON public.home_knowledge_base FOR ALL TO authenticated
  USING (public.user_can_access_property(property_id))
  WITH CHECK (public.user_can_access_property(property_id));

-- property_timeline
DROP POLICY IF EXISTS "Authenticated users can manage property_timeline" ON public.property_timeline;
DROP POLICY IF EXISTS "Scoped access property_timeline" ON public.property_timeline;
CREATE POLICY "Scoped access property_timeline"
  ON public.property_timeline FOR ALL TO authenticated
  USING (public.user_can_access_property(property_id))
  WITH CHECK (public.user_can_access_property(property_id));

-- structural_specifications
DROP POLICY IF EXISTS "Authenticated users can manage structural_specifications" ON public.structural_specifications;
DROP POLICY IF EXISTS "Scoped access structural_specifications" ON public.structural_specifications;
CREATE POLICY "Scoped access structural_specifications"
  ON public.structural_specifications FOR ALL TO authenticated
  USING (public.user_can_access_property(property_id))
  WITH CHECK (public.user_can_access_property(property_id));

-- warranty_registry
DROP POLICY IF EXISTS "Authenticated users can manage warranty_registry" ON public.warranty_registry;
DROP POLICY IF EXISTS "Scoped access warranty_registry" ON public.warranty_registry;
CREATE POLICY "Scoped access warranty_registry"
  ON public.warranty_registry FOR ALL TO authenticated
  USING (public.user_can_access_property(property_id))
  WITH CHECK (public.user_can_access_property(property_id));

-- permit_registry
DROP POLICY IF EXISTS "Authenticated users can manage permit_registry" ON public.permit_registry;
DROP POLICY IF EXISTS "Scoped access permit_registry" ON public.permit_registry;
CREATE POLICY "Scoped access permit_registry"
  ON public.permit_registry FOR ALL TO authenticated
  USING (public.user_can_access_property(property_id))
  WITH CHECK (public.user_can_access_property(property_id));

-- service_history
DROP POLICY IF EXISTS "Authenticated users can manage service_history" ON public.service_history;
DROP POLICY IF EXISTS "Scoped access service_history" ON public.service_history;
CREATE POLICY "Scoped access service_history"
  ON public.service_history FOR ALL TO authenticated
  USING (public.user_can_access_property(property_id))
  WITH CHECK (public.user_can_access_property(property_id));

-- ───────────────────────────────────────────────────────────────────────
-- photo_analyses — originally had `USING (true)` SELECT for authenticated.
-- Scope by property_id.
-- ───────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Authenticated users can read photo analyses" ON public.photo_analyses;
DROP POLICY IF EXISTS "Scoped read photo_analyses" ON public.photo_analyses;
CREATE POLICY "Scoped read photo_analyses"
  ON public.photo_analyses FOR SELECT TO authenticated
  USING (public.user_can_access_property(property_id));

-- ───────────────────────────────────────────────────────────────────────
-- project_scopes — had `USING (true)` for SELECT and UPDATE.
-- Scope via parent project → property.
-- ───────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Authenticated users can read scopes" ON public.project_scopes;
DROP POLICY IF EXISTS "Authenticated users can update scopes" ON public.project_scopes;
DROP POLICY IF EXISTS "Scoped read project_scopes" ON public.project_scopes;
DROP POLICY IF EXISTS "Scoped write project_scopes" ON public.project_scopes;
CREATE POLICY "Scoped read project_scopes"
  ON public.project_scopes FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id
        AND public.user_can_access_property(p.property_id)
    )
  );
CREATE POLICY "Scoped write project_scopes"
  ON public.project_scopes FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id
        AND public.user_can_access_property(p.property_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id
        AND public.user_can_access_property(p.property_id)
    )
  );

-- ───────────────────────────────────────────────────────────────────────
-- home_value_snapshots — had anon SELECT with USING (true). That's scrapeable
-- property-value data. Lock to the property owner + creator.
-- ───────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "anon read snapshots" ON public.home_value_snapshots;
DROP POLICY IF EXISTS "public read snapshots" ON public.home_value_snapshots;
DROP POLICY IF EXISTS "Scoped read home_value_snapshots" ON public.home_value_snapshots;
CREATE POLICY "Scoped read home_value_snapshots"
  ON public.home_value_snapshots FOR SELECT TO authenticated
  USING (public.user_can_access_property(property_id));

-- membership_tier_services had `USING (true)` for authenticated SELECT.
-- This one is actually acceptable as a shared catalog — keep it readable
-- by any authenticated user but add a comment for the audit trail.
COMMENT ON TABLE public.membership_tier_services IS
  'Membership tier catalog. Intentionally readable by any authenticated user; '
  'no PII or per-property data lives here.';
