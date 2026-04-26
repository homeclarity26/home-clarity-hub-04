-- HCR rebuild Phase 1 / M7: HBC concierge tier auto-update trigger.
--
-- The trigger is the single source of truth for properties.hbc_concierge_tier.
-- Frontend never computes this value. The renderer reads it. The block
-- renderer for the Recurring Services Register (B6) reads it. The
-- "If HBC managed" column on the register reads it. None of them
-- recompute. That's the whole point.
--
-- TIER LADDER (Master Spec 5.5 M3):
--   0  hbc_managed services  → 'none'
--   1-5                       → 'tier_200'
--   6-10                      → 'tier_400'
--   11+                       → 'tier_600'
--
-- Note for posterity: the M3 commit comment said the thresholds were
-- 3 / 6 / 9 — that was a misreading. The actual thresholds (per spec
-- and per the Master Plan M7 acceptance criterion "insert 6 rows with
-- hbc_managed=true, verify properties.hbc_concierge_tier='tier_400'")
-- are 5 / 10. This migration honors the spec.
--
-- WHY SECURITY DEFINER + explicit search_path:
--   Mirrors the harden_triggers floor-rebuild pattern (April 18). The
--   function reads recurring_services and writes properties — both
--   under public schema. Pinning search_path to 'public' prevents an
--   attacker from front-loading the search_path with a malicious
--   schema and shadowing those table references. SECURITY DEFINER
--   guarantees the function runs with the migration's privileges
--   regardless of what role fired the trigger (creator, service_role,
--   or any future role).
--
-- WHY fail-soft (BEGIN/EXCEPTION/END wrap):
--   Same harden_triggers principle. If the tier update fails for any
--   reason (concurrent property delete, transient lock contention, the
--   case statement somehow returning an unexpected value), the original
--   write to recurring_services must still succeed. A failed tier
--   update is recoverable on the next change; a failed parent write
--   loses a service the creator just typed in.
--
-- Idempotent (CREATE OR REPLACE FUNCTION, DROP-IF-EXISTS / CREATE for
-- the trigger).

-- ── 1. Trigger function ──────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.update_hbc_concierge_tier()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  managed_count int;
  property_id_val uuid;
BEGIN
  -- INSERT  → NEW.property_id is the affected property
  -- UPDATE  → both NEW and OLD have property_id; either works (a
  --           recurring_service moving to a different property is not
  --           a supported operation, but we coalesce defensively)
  -- DELETE  → only OLD is set
  property_id_val := COALESCE(NEW.property_id, OLD.property_id);

  -- Count after the trigger has fired — for AFTER triggers (which is
  -- what we're using below), the row change has already been applied
  -- so the SELECT sees the new state.
  SELECT count(*)
  INTO managed_count
  FROM public.recurring_services
  WHERE property_id = property_id_val
    AND hbc_managed = true;

  UPDATE public.properties
  SET hbc_concierge_tier = CASE
    WHEN managed_count = 0  THEN 'none'
    WHEN managed_count <= 5 THEN 'tier_200'
    WHEN managed_count <= 10 THEN 'tier_400'
    ELSE 'tier_600'
  END
  WHERE id = property_id_val;

  RETURN COALESCE(NEW, OLD);

EXCEPTION
  WHEN OTHERS THEN
    -- Fail-soft. Log via RAISE WARNING (visible in Postgres logs but
    -- never bubbles up to abort the parent statement). Per
    -- harden_triggers (Apr 18 floor rebuild), no downstream tier
    -- update may ever block a recurring_services write.
    RAISE WARNING 'update_hbc_concierge_tier failed for property %: % (parent write preserved)',
      property_id_val, SQLERRM;
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- ── 2. Trigger ───────────────────────────────────────────────────────────
-- AFTER (not BEFORE) so the count() reflects the post-change state of
-- recurring_services. FOR EACH ROW so multi-row INSERT/UPDATE batches
-- still produce one tier recompute per affected row — which is fine
-- because the function is idempotent (computes the correct count from
-- scratch every time).

DROP TRIGGER IF EXISTS trg_update_hbc_tier_after_change ON public.recurring_services;
CREATE TRIGGER trg_update_hbc_tier_after_change
  AFTER INSERT OR UPDATE OR DELETE ON public.recurring_services
  FOR EACH ROW
  EXECUTE FUNCTION public.update_hbc_concierge_tier();
