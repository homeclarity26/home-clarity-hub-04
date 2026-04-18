-- Walkthrough finding #13:
-- handle_new_user() unconditionally inserts a `client` row in user_roles for
-- every new auth user — even when an admin explicitly creates a creator or
-- trade_partner via the Auth Admin API. That left admin-created creator
-- accounts with two role rows (creator + client), which polluted role-based
-- routing and `getCRMClientsEnriched`-style counts.
--
-- Fix: honor `raw_user_meta_data->>'role'` if it's a known role; otherwise
-- default to 'client' for the normal self-signup case. To create a creator
-- programmatically: pass `user_metadata: { role: 'creator', full_name: '...' }`
-- to `auth.admin.createUser`.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  requested_role text;
  resolved_role app_role;
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, avatar_initials)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    UPPER(LEFT(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), 2))
  );

  requested_role := NEW.raw_user_meta_data->>'role';

  -- Allow only known roles; anything else falls back to 'client' so a
  -- malformed metadata payload can't grant elevated access.
  IF requested_role = 'creator' THEN
    resolved_role := 'creator'::app_role;
  ELSIF requested_role = 'trade_partner' THEN
    resolved_role := 'trade_partner'::app_role;
  ELSE
    resolved_role := 'client'::app_role;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, resolved_role)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$function$;
