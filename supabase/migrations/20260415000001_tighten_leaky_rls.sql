-- ═══════════════════════════════════════════════════════════════════════════
-- RLS tightening — close cross-tenant data leakage.
--
-- Problem: several tables have `USING (true) WITH CHECK (true)` on the
-- authenticated role — any logged-in user can read/write other properties.
--
-- Fix: scope by the column each table actually uses (client_id or property_id)
-- and the creator role for admin access.
-- ═══════════════════════════════════════════════════════════════════════════

-- Helper: can this user access a given client_id (which IS a property_id)?
CREATE OR REPLACE FUNCTION public.user_can_access_property(p_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id = p_id
      AND (
        p.client_user_id = auth.uid()
        OR public.has_role(auth.uid(), 'creator'::app_role)
      )
  );
$$;

-- ── Tables that use `client_id` as the property/tenant key ──

-- document_extractions
DROP POLICY IF EXISTS "Authenticated users can manage document_extractions" ON public.document_extractions;
DROP POLICY IF EXISTS "Scoped access document_extractions" ON public.document_extractions;
CREATE POLICY "Scoped access document_extractions"
  ON public.document_extractions FOR ALL TO authenticated
  USING (public.user_can_access_property(client_id))
  WITH CHECK (public.user_can_access_property(client_id));

-- home_knowledge_base
DROP POLICY IF EXISTS "Authenticated users can manage home_knowledge_base" ON public.home_knowledge_base;
DROP POLICY IF EXISTS "Scoped access home_knowledge_base" ON public.home_knowledge_base;
CREATE POLICY "Scoped access home_knowledge_base"
  ON public.home_knowledge_base FOR ALL TO authenticated
  USING (public.user_can_access_property(client_id))
  WITH CHECK (public.user_can_access_property(client_id));

-- property_timeline
DROP POLICY IF EXISTS "Authenticated users can manage property_timeline" ON public.property_timeline;
DROP POLICY IF EXISTS "Scoped access property_timeline" ON public.property_timeline;
CREATE POLICY "Scoped access property_timeline"
  ON public.property_timeline FOR ALL TO authenticated
  USING (public.user_can_access_property(client_id))
  WITH CHECK (public.user_can_access_property(client_id));

-- structural_specifications
DROP POLICY IF EXISTS "Authenticated users can manage structural_specifications" ON public.structural_specifications;
DROP POLICY IF EXISTS "Scoped access structural_specifications" ON public.structural_specifications;
CREATE POLICY "Scoped access structural_specifications"
  ON public.structural_specifications FOR ALL TO authenticated
  USING (public.user_can_access_property(client_id))
  WITH CHECK (public.user_can_access_property(client_id));

-- warranty_registry
DROP POLICY IF EXISTS "Authenticated users can manage warranty_registry" ON public.warranty_registry;
DROP POLICY IF EXISTS "Scoped access warranty_registry" ON public.warranty_registry;
CREATE POLICY "Scoped access warranty_registry"
  ON public.warranty_registry FOR ALL TO authenticated
  USING (public.user_can_access_property(client_id))
  WITH CHECK (public.user_can_access_property(client_id));

-- permit_registry
DROP POLICY IF EXISTS "Authenticated users can manage permit_registry" ON public.permit_registry;
DROP POLICY IF EXISTS "Scoped access permit_registry" ON public.permit_registry;
CREATE POLICY "Scoped access permit_registry"
  ON public.permit_registry FOR ALL TO authenticated
  USING (public.user_can_access_property(client_id))
  WITH CHECK (public.user_can_access_property(client_id));

-- service_history
DROP POLICY IF EXISTS "Authenticated users can manage service_history" ON public.service_history;
DROP POLICY IF EXISTS "Scoped access service_history" ON public.service_history;
CREATE POLICY "Scoped access service_history"
  ON public.service_history FOR ALL TO authenticated
  USING (public.user_can_access_property(client_id))
  WITH CHECK (public.user_can_access_property(client_id));

-- ── Tables that use `property_id` ──

-- photo_analyses
DROP POLICY IF EXISTS "Authenticated users can read photo analyses" ON public.photo_analyses;
DROP POLICY IF EXISTS "Scoped read photo_analyses" ON public.photo_analyses;
CREATE POLICY "Scoped read photo_analyses"
  ON public.photo_analyses FOR SELECT TO authenticated
  USING (public.user_can_access_property(property_id));

-- home_value_snapshots — remove anon access, scope to authenticated + property
DROP POLICY IF EXISTS "anon read snapshots" ON public.home_value_snapshots;
DROP POLICY IF EXISTS "public read snapshots" ON public.home_value_snapshots;
DROP POLICY IF EXISTS "Scoped read home_value_snapshots" ON public.home_value_snapshots;
CREATE POLICY "Scoped read home_value_snapshots"
  ON public.home_value_snapshots FOR SELECT TO authenticated
  USING (public.user_can_access_property(property_id));

-- project_scopes — scope via parent project
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
