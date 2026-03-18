
-- Fix the overly permissive audit_log insert policy
DROP POLICY IF EXISTS "System can insert audit_log" ON public.audit_log;
CREATE POLICY "Authenticated can insert audit_log" ON public.audit_log FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'creator'::app_role) OR auth.uid() = actor_id);
