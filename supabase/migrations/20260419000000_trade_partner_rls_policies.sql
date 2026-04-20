-- WebKit deep-E2E finding (2026-04-19):
--
-- The trade-partner side of the app (/trade/*) was RLS-bricked end-to-end.
-- Every table the trade-partner hooks read had policies ONLY for creator
-- and client — no trade_partner policy at all. `useMyAssignedProjects`,
-- `useMyTasks`, `useMyBids`, `useMyMessages`, and `useSendProjectMessage`
-- all silently returned empty arrays (for reads) or 403ed (for writes).
-- The trade dashboard would say "No projects assigned yet" for every real
-- trade partner on the platform.
--
-- The access path for a trade_partner:
--   auth.uid()
--     → central_vendors.user_id
--     → central_vendors.id
--     → project_tasks.assigned_vendor_id
--     → project_tasks.project_id (= projects.id)
--     → project_messages / project_files share that project_id
--
-- We add minimal policies that grant trade partners exactly the access the
-- UI hooks already assume they have — nothing more. Creator-side policies
-- (still ALL cmd) are unaffected.

-- ─── Helper: does the current auth.uid() have a task on this project? ───
-- SECURITY DEFINER so the function can peek at central_vendors / project_tasks
-- without getting blocked by those tables' own RLS. Tight: returns boolean
-- only; never leaks row data back to the caller.
CREATE OR REPLACE FUNCTION public.current_user_assigned_to_project(_project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM central_vendors cv
    JOIN project_tasks pt ON pt.assigned_vendor_id = cv.id
    WHERE cv.user_id = auth.uid()
      AND pt.project_id = _project_id
  );
$$;

-- ─── central_vendors ─────────────────────────────────────────────────────
-- Trade partner can see their own vendor row (for profile + company_name
-- lookup that the hooks use as a cache key). UPDATE omitted for now —
-- profile editing lives on the admin side.
CREATE POLICY "Trade partners view own vendor row"
  ON public.central_vendors
  FOR SELECT
  USING (user_id = auth.uid());

-- ─── projects ────────────────────────────────────────────────────────────
-- Trade partner can SELECT projects they have a task on.
CREATE POLICY "Trade partners view assigned projects"
  ON public.projects
  FOR SELECT
  USING (public.current_user_assigned_to_project(id));

-- ─── project_tasks ───────────────────────────────────────────────────────
-- Trade partner can SELECT and UPDATE (status transitions) their own tasks.
-- Gate the vendor->user join via central_vendors to avoid recursing through
-- the helper function (which would open a second query per row).
CREATE POLICY "Trade partners view own tasks"
  ON public.project_tasks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM central_vendors cv
      WHERE cv.id = project_tasks.assigned_vendor_id
        AND cv.user_id = auth.uid()
    )
  );

CREATE POLICY "Trade partners update own task status"
  ON public.project_tasks
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM central_vendors cv
      WHERE cv.id = project_tasks.assigned_vendor_id
        AND cv.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM central_vendors cv
      WHERE cv.id = project_tasks.assigned_vendor_id
        AND cv.user_id = auth.uid()
    )
  );

-- ─── project_messages ────────────────────────────────────────────────────
-- Trade partner can read + write messages on projects they have a task on.
-- WITH CHECK also requires they are the sender — can't spoof another user.
CREATE POLICY "Trade partners read/write project messages"
  ON public.project_messages
  FOR SELECT
  USING (public.current_user_assigned_to_project(project_id));

CREATE POLICY "Trade partners insert project messages as self"
  ON public.project_messages
  FOR INSERT
  WITH CHECK (
    public.current_user_assigned_to_project(project_id)
    AND sender_id = auth.uid()
  );

-- ─── project_files ───────────────────────────────────────────────────────
-- Trade partner sees files on their assigned projects that are marked
-- shared-with-client OR that they uploaded themselves. The hook already
-- filters by share_with_client | uploaded_by — we just need to stop RLS
-- from wiping the result first.
CREATE POLICY "Trade partners view files on assigned projects"
  ON public.project_files
  FOR SELECT
  USING (
    public.current_user_assigned_to_project(project_id)
    AND (
      share_with_client IS TRUE
      OR uploaded_by = auth.uid()
    )
  );

CREATE POLICY "Trade partners upload to assigned projects"
  ON public.project_files
  FOR INSERT
  WITH CHECK (
    public.current_user_assigned_to_project(project_id)
    AND uploaded_by = auth.uid()
  );

-- ─── contractor_bids ─────────────────────────────────────────────────────
-- Trade partner sees bids where contractor_name matches their vendor
-- company_name. The hook re-filters client-side anyway, but without a
-- policy the base query returns 0 rows. Match is case-insensitive; text
-- comparison, not uuid, because contractor_bids doesn't have a vendor_id FK.
CREATE POLICY "Trade partners view own bids by company name"
  ON public.contractor_bids
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM central_vendors cv
      WHERE cv.user_id = auth.uid()
        AND LOWER(cv.company_name) = LOWER(contractor_bids.contractor_name)
    )
  );
