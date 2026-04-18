-- Pass 3 floor rebuild: harden the trigger functions so a downstream
-- failure can't ever block the parent write.
--
-- Two classes of issue:
--
-- 1. `generate_proposal_token` calls `gen_random_bytes(16)` unqualified.
--    pgcrypto lives in the `extensions` schema on this project, and the
--    function itself is pinned to `search_path = 'public'` — so the bare
--    symbol resolves by accident of the caller's search_path rather than
--    by design. Matches the fix pattern already applied to
--    `generate_invoice_token` (`extensions.gen_random_bytes`). Making it
--    explicit so an `ALTER DATABASE ... SET search_path` change can never
--    silently break estimate inserts the way it briefly broke invoice
--    inserts tonight (the P0 the 2026-04-18 golden path surfaced).
--
-- 2. The three AFTER-row log triggers (`log_comment_activity`,
--    `log_page_update`, `log_report_status_change`) each do a JOIN lookup
--    plus an `INSERT INTO activity_log`. If the lookup or insert fails
--    for any reason (RLS surprise, an orphaned row, a future constraint
--    tightening), the AFTER trigger raises and the parent UPDATE/INSERT
--    aborts. The log row is telemetry — losing a telemetry row must never
--    block a user action. Wrapping each in EXCEPTION WHEN OTHERS THEN
--    NULL mirrors the pattern that fixed `fn_project_memory_sync` on the
--    AK Opps side and is the standard guard for non-essential observer
--    triggers.

CREATE OR REPLACE FUNCTION public.generate_proposal_token()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  IF NEW.proposal_token IS NULL THEN
    NEW.proposal_token := encode(extensions.gen_random_bytes(16), 'hex');
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_comment_activity()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
DECLARE
  v_property_id uuid;
  v_page_title text;
BEGIN
  BEGIN
    SELECT r.property_id, rp.title INTO v_property_id, v_page_title
    FROM report_pages rp
    JOIN reports r ON r.id = rp.report_id
    WHERE rp.id = NEW.report_page_id;

    INSERT INTO public.activity_log (user_id, property_id, action_type, message, metadata)
    VALUES (
      NEW.user_id,
      v_property_id,
      'comment',
      'New ' || NEW.comment_type || ' on ' || COALESCE(v_page_title, 'a page'),
      jsonb_build_object('comment_id', NEW.id, 'page_id', NEW.report_page_id, 'comment_type', NEW.comment_type)
    );
  EXCEPTION WHEN OTHERS THEN
    -- Swallow: activity_log is telemetry, never block the parent write.
    NULL;
  END;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_page_update()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
DECLARE
  v_property_id uuid;
BEGIN
  BEGIN
    SELECT r.property_id INTO v_property_id
    FROM reports r WHERE r.id = NEW.report_id;

    INSERT INTO public.activity_log (property_id, action_type, message, metadata)
    VALUES (
      v_property_id,
      'edit',
      NEW.title || ' page updated',
      jsonb_build_object('page_id', NEW.id, 'report_id', NEW.report_id)
    );
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_report_status_change()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    BEGIN
      INSERT INTO public.activity_log (user_id, property_id, action_type, message, metadata)
      VALUES (
        NEW.created_by,
        NEW.property_id,
        CASE WHEN NEW.status = 'published' THEN 'publish' ELSE 'edit' END,
        'Report status changed to ' || NEW.status,
        jsonb_build_object('report_id', NEW.id, 'old_status', OLD.status, 'new_status', NEW.status)
      );
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;
  RETURN NEW;
END;
$function$;
