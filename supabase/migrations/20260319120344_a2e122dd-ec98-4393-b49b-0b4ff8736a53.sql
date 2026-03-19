
-- Add missing columns to push_subscriptions
ALTER TABLE public.push_subscriptions 
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS user_agent text,
  ADD COLUMN IF NOT EXISTS last_used_at timestamptz;

-- Create push_notification_log table
CREATE TABLE IF NOT EXISTS public.push_notification_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  title text NOT NULL,
  body text,
  url text,
  sent_at timestamptz NOT NULL DEFAULT now(),
  clicked_at timestamptz
);

ALTER TABLE public.push_notification_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own push logs"
  ON public.push_notification_log FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert push logs"
  ON public.push_notification_log FOR INSERT TO authenticated
  WITH CHECK (true);

-- Update RLS on push_subscriptions to also work with user_id
DROP POLICY IF EXISTS "Users manage their push_subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users manage their push_subscriptions" 
  ON public.push_subscriptions FOR ALL TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = admin_id OR auth.uid() = client_id);
