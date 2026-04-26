-- HCR rebuild Phase 1 / M5: create annual_review_notes.
--
-- Powers the "Notes for Next Visit" admin-only field ([v2.32]). One row
-- per page (or page_key) per property per year. The creator types raw
-- thoughts during a walkthrough — "check that crawlspace seam next
-- spring," "client mentioned wanting a wine fridge in the basement
-- buildout, follow up." Hidden from clients. Persists across report
-- regenerations via page_key fallback.
--
-- WHY this is its own table instead of a column on report_pages:
--   1. Survives report deletion. A page can disappear when a report is
--      regenerated; a page_key-anchored note survives and re-attaches
--      to the new page.
--   2. Multi-year history. visit_year scopes lets the creator see
--      "what did I write about this room last year?" without rewriting.
--   3. Locked admin-only RLS. Carving it onto report_pages would mean
--      adding a NEVER-EXPOSE-TO-CLIENT column to a table that clients
--      otherwise read freely — fragile. Separate table = airtight RLS.
--
-- ⚠ CRITICAL RLS: client must never see these.
-- The deliberate absence of a client policy is the feature here. RLS
-- denies by default — without a permissive policy, no client query
-- returns a single row. We DO NOT add a service-role policy either:
-- nothing automated writes here. If a future edge function needs to
-- (e.g. to summarize prior years' notes for the next walkthrough), it
-- runs as the creator's session, not service role.
--
-- Idempotent (CREATE IF NOT EXISTS, DROP-IF-EXISTS / CREATE for the
-- single creator policy, DO block for the page-anchor CHECK).

-- ── 1. Table ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.annual_review_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,

  -- Page anchor: prefer report_page_id when the page exists right now;
  -- fall back to page_key (a stable string like "primary_bath" or
  -- "system_furnace") that survives report regeneration. Exactly one
  -- of the two must be set — enforced by the CHECK constraint below.
  -- Cascade on report_page_id so deleting a page deletes its current-cycle
  -- notes; page_key-anchored notes are preserved by setting report_page_id
  -- back to NULL via app code at regeneration time.
  report_page_id uuid REFERENCES public.report_pages(id) ON DELETE CASCADE,
  page_key text,

  visit_year int NOT NULL,

  notes_html text NOT NULL,

  -- WHO wrote it. RESTRICT (not CASCADE) — we don't want creator-account
  -- deletion to silently delete walkthrough notes; require an explicit
  -- reassignment first.
  created_by_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ── 2. Page-anchor CHECK ────────────────────────────────────────────────
-- Enforces the spec's "Either report_page_id OR page_key is set, never
-- both" invariant. Without this, the renderer would have to handle three
-- ambiguous states (both set, both null) and pick one — guaranteed bug
-- waiting to happen.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'annual_review_notes_page_anchor_check'
      AND conrelid = 'public.annual_review_notes'::regclass
  ) THEN
    ALTER TABLE public.annual_review_notes
      ADD CONSTRAINT annual_review_notes_page_anchor_check
      CHECK (
        (report_page_id IS NOT NULL AND page_key IS NULL)
        OR
        (report_page_id IS NULL AND page_key IS NOT NULL)
      );
  END IF;
END $$;

-- ── 3. Indexes ───────────────────────────────────────────────────────────
-- Per Master Spec 5.1.5:
--   (property_id, visit_year) — "show me this year's notes for this property"
--   (report_page_id)          — "show me the note attached to this page"

CREATE INDEX IF NOT EXISTS idx_annual_review_notes_property_year
  ON public.annual_review_notes (property_id, visit_year);

CREATE INDEX IF NOT EXISTS idx_annual_review_notes_page
  ON public.annual_review_notes (report_page_id);

-- ── 4. updated_at trigger ────────────────────────────────────────────────

DROP TRIGGER IF EXISTS annual_review_notes_set_updated_at ON public.annual_review_notes;
CREATE TRIGGER annual_review_notes_set_updated_at
  BEFORE UPDATE ON public.annual_review_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ── 5. RLS — locked admin-only ──────────────────────────────────────────
-- ONE policy. Creator manages everything. No client read. No service role.
-- The absence is the contract — RLS denies by default.

ALTER TABLE public.annual_review_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Creators manage all annual review notes" ON public.annual_review_notes;
CREATE POLICY "Creators manage all annual review notes"
  ON public.annual_review_notes
  FOR ALL
  USING (public.has_role(auth.uid(), 'creator'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'creator'::public.app_role));
