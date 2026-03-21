
-- ============================================================
-- PRE-LAUNCH SECURITY HARDENING
-- ============================================================

-- Helper functions
CREATE OR REPLACE FUNCTION public.owns_property(_property_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.properties WHERE id = _property_id AND client_user_id = auth.uid()) $$;

CREATE OR REPLACE FUNCTION public.is_creator()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT public.has_role(auth.uid(), 'creator') $$;

-- 1. ANNUAL_REVIEWS
DROP POLICY IF EXISTS "Authenticated users can read annual_reviews" ON public.annual_reviews;
DROP POLICY IF EXISTS "Authenticated users can insert annual_reviews" ON public.annual_reviews;
DROP POLICY IF EXISTS "Authenticated users can update annual_reviews" ON public.annual_reviews;
CREATE POLICY "Creators manage annual_reviews" ON public.annual_reviews FOR ALL TO authenticated USING (public.is_creator()) WITH CHECK (public.is_creator());
CREATE POLICY "Clients read own annual_reviews" ON public.annual_reviews FOR SELECT TO authenticated USING (public.owns_property(property_id));

-- 2. PROJECT_SCOPES
DROP POLICY IF EXISTS "Authenticated users can read scopes" ON public.project_scopes;
DROP POLICY IF EXISTS "Authenticated users can insert scopes" ON public.project_scopes;
DROP POLICY IF EXISTS "Authenticated users can update scopes" ON public.project_scopes;
CREATE POLICY "Creators manage project_scopes" ON public.project_scopes FOR ALL TO authenticated USING (public.is_creator()) WITH CHECK (public.is_creator());
CREATE POLICY "Clients read own project_scopes" ON public.project_scopes FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.projects p JOIN public.properties pr ON pr.id = p.property_id WHERE p.id = project_scopes.project_id AND pr.client_user_id = auth.uid()));

-- 3. VOICE_INTERACTIONS
DROP POLICY IF EXISTS "Authenticated users can manage voice_interactions" ON public.voice_interactions;
CREATE POLICY "Creators manage voice_interactions" ON public.voice_interactions FOR ALL TO authenticated USING (public.is_creator()) WITH CHECK (public.is_creator());
CREATE POLICY "Users manage own voice_interactions" ON public.voice_interactions FOR ALL TO authenticated USING (client_id = auth.uid()) WITH CHECK (client_id = auth.uid());

-- 4. PERMIT_REGISTRY
DROP POLICY IF EXISTS "Authenticated users can manage permit_registry" ON public.permit_registry;
CREATE POLICY "Creators manage permit_registry" ON public.permit_registry FOR ALL TO authenticated USING (public.is_creator()) WITH CHECK (public.is_creator());
CREATE POLICY "Clients read own permit_registry" ON public.permit_registry FOR SELECT TO authenticated USING (client_id = auth.uid());

-- 5. SERVICE_HISTORY
DROP POLICY IF EXISTS "Authenticated users can manage service_history" ON public.service_history;
CREATE POLICY "Creators manage service_history" ON public.service_history FOR ALL TO authenticated USING (public.is_creator()) WITH CHECK (public.is_creator());
CREATE POLICY "Clients read own service_history" ON public.service_history FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.equipment e JOIN public.properties p ON p.id = e.property_id WHERE e.id = service_history.equipment_id AND p.client_user_id = auth.uid()));

-- 6. DOCUMENT_EXTRACTIONS
DROP POLICY IF EXISTS "Authenticated users can manage document_extractions" ON public.document_extractions;
CREATE POLICY "Creators manage document_extractions" ON public.document_extractions FOR ALL TO authenticated USING (public.is_creator()) WITH CHECK (public.is_creator());
CREATE POLICY "Clients read own document_extractions" ON public.document_extractions FOR SELECT TO authenticated USING (client_id = auth.uid());

-- 7. WARRANTY_REGISTRY
DROP POLICY IF EXISTS "Authenticated users can manage warranty_registry" ON public.warranty_registry;
CREATE POLICY "Creators manage warranty_registry" ON public.warranty_registry FOR ALL TO authenticated USING (public.is_creator()) WITH CHECK (public.is_creator());
CREATE POLICY "Clients read own warranty_registry" ON public.warranty_registry FOR SELECT TO authenticated USING (client_id = auth.uid());

-- 8. STRUCTURAL_SPECIFICATIONS
DROP POLICY IF EXISTS "Authenticated users can manage structural_specifications" ON public.structural_specifications;
CREATE POLICY "Creators manage structural_specifications" ON public.structural_specifications FOR ALL TO authenticated USING (public.is_creator()) WITH CHECK (public.is_creator());
CREATE POLICY "Clients read own structural_specifications" ON public.structural_specifications FOR SELECT TO authenticated USING (client_id = auth.uid());

-- 9. HOME_KNOWLEDGE_BASE
DROP POLICY IF EXISTS "Authenticated users can manage home_knowledge_base" ON public.home_knowledge_base;
CREATE POLICY "Creators manage home_knowledge_base" ON public.home_knowledge_base FOR ALL TO authenticated USING (public.is_creator()) WITH CHECK (public.is_creator());
CREATE POLICY "Clients read own home_knowledge_base" ON public.home_knowledge_base FOR SELECT TO authenticated USING (client_id = auth.uid());

-- 10. PROPERTY_TIMELINE
DROP POLICY IF EXISTS "Authenticated users can manage property_timeline" ON public.property_timeline;
CREATE POLICY "Creators manage property_timeline" ON public.property_timeline FOR ALL TO authenticated USING (public.is_creator()) WITH CHECK (public.is_creator());
CREATE POLICY "Clients read own property_timeline" ON public.property_timeline FOR SELECT TO authenticated USING (client_id = auth.uid());

-- 11. SCHEDULED_REPORTS
DROP POLICY IF EXISTS "Authenticated manage scheduled_reports" ON public.scheduled_reports;
CREATE POLICY "Creators manage scheduled_reports" ON public.scheduled_reports FOR ALL TO authenticated USING (public.is_creator()) WITH CHECK (public.is_creator());

-- 12. EXPORT_JOBS
DROP POLICY IF EXISTS "Authenticated manage export_jobs" ON public.export_jobs;
CREATE POLICY "Creators manage export_jobs" ON public.export_jobs FOR ALL TO authenticated USING (public.is_creator()) WITH CHECK (public.is_creator());
CREATE POLICY "Users manage own export_jobs" ON public.export_jobs FOR ALL TO authenticated USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());

-- 13. PHOTO_ANALYSES
DROP POLICY IF EXISTS "Authenticated users can read photo analyses" ON public.photo_analyses;
DROP POLICY IF EXISTS "Authenticated users can insert photo analyses" ON public.photo_analyses;
CREATE POLICY "Creators manage photo_analyses" ON public.photo_analyses FOR ALL TO authenticated USING (public.is_creator()) WITH CHECK (public.is_creator());

-- 14. REFERRAL_EVENTS (uses referrer_property_id)
DROP POLICY IF EXISTS "Authenticated can read referral events" ON public.referral_events;
DROP POLICY IF EXISTS "Service can insert referral events" ON public.referral_events;
CREATE POLICY "Creators manage referral_events" ON public.referral_events FOR ALL TO authenticated USING (public.is_creator()) WITH CHECK (public.is_creator());
CREATE POLICY "Clients read own referral_events" ON public.referral_events FOR SELECT TO authenticated USING (public.owns_property(referrer_property_id));

-- 15. REFERRAL_CREDITS
DROP POLICY IF EXISTS "Authenticated can read referral credits" ON public.referral_credits;
DROP POLICY IF EXISTS "Authenticated can insert referral credits" ON public.referral_credits;
DROP POLICY IF EXISTS "Authenticated can update referral credits" ON public.referral_credits;
CREATE POLICY "Creators manage referral_credits" ON public.referral_credits FOR ALL TO authenticated USING (public.is_creator()) WITH CHECK (public.is_creator());
CREATE POLICY "Clients read own referral_credits" ON public.referral_credits FOR SELECT TO authenticated USING (public.owns_property(property_id));

-- 16. CROSS_CLIENT_INSIGHTS
DROP POLICY IF EXISTS "Clients can read insights" ON public.cross_client_insights;

-- 17. AI_NOTIFICATION_NUDGES
DROP POLICY IF EXISTS "System can create nudges" ON public.ai_notification_nudges;
CREATE POLICY "Creators can create nudges" ON public.ai_notification_nudges FOR INSERT TO authenticated WITH CHECK (public.is_creator());

-- 18. PUSH_NOTIFICATION_LOG
DROP POLICY IF EXISTS "Service role can insert push logs" ON public.push_notification_log;
CREATE POLICY "Creators insert push_notification_log" ON public.push_notification_log FOR INSERT TO authenticated WITH CHECK (public.is_creator());

-- 19. HOME_VALUE_SNAPSHOTS
DROP POLICY IF EXISTS "Anon read snapshots" ON public.home_value_snapshots;
DROP POLICY IF EXISTS "Authenticated read snapshots" ON public.home_value_snapshots;
DROP POLICY IF EXISTS "Service insert snapshots" ON public.home_value_snapshots;
CREATE POLICY "Creators manage home_value_snapshots" ON public.home_value_snapshots FOR ALL TO authenticated USING (public.is_creator()) WITH CHECK (public.is_creator());
CREATE POLICY "Clients read own home_value_snapshots" ON public.home_value_snapshots FOR SELECT TO authenticated USING (public.owns_property(property_id));

-- 20. Financial line items — token-based anon access
DROP POLICY IF EXISTS "Anon read invoice line items" ON public.invoice_line_items;
DROP POLICY IF EXISTS "Anon read estimate line items" ON public.estimate_line_items;
CREATE POLICY "Anon read invoice line items by token" ON public.invoice_line_items FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_line_items.invoice_id AND i.invoice_token IS NOT NULL));
CREATE POLICY "Anon read estimate line items by token" ON public.estimate_line_items FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM public.estimates e WHERE e.id = estimate_line_items.estimate_id AND e.proposal_token IS NOT NULL));
