
-- Fix the permissive RLS on project_task_comments
DROP POLICY "Authenticated users manage own comments" ON public.project_task_comments;

CREATE POLICY "Creators manage all task comments" ON public.project_task_comments
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'creator'))
  WITH CHECK (public.has_role(auth.uid(), 'creator'));

CREATE POLICY "Users manage own comments" ON public.project_task_comments
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
