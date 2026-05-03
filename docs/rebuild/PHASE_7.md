# PHASE 7 — AI Co-Pilot (post-publish additions)

Goal: persistent surface for adding to a published report. Two front doors, one engine.

---

## PR #20 — Admin Co-Pilot panel

**Branch:** `phase-7/pr-20-copilot-admin`
**Files:** new migration, new `AICoPilotPanel.tsx`, `AdminClientDetail.tsx`

**Tasks:**

1. Migration `supabase/migrations/{timestamp}_create_copilot_inbox.sql`:

```sql
CREATE TABLE public.copilot_inbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  source text NOT NULL CHECK (source IN ('client', 'admin')),
  kind text NOT NULL CHECK (kind IN ('photo', 'note', 'document', 'request')),
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'absorbed', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  absorbed_at timestamptz
);

ALTER TABLE public.copilot_inbox ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators full access" ON public.copilot_inbox
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'creator')
  );

CREATE POLICY "Clients write own property" ON public.copilot_inbox
  FOR INSERT WITH CHECK (
    source = 'client' AND
    property_id IN (SELECT id FROM public.properties WHERE owner_id = auth.uid())
  );
```

2. Add `proposed_by_ai boolean DEFAULT false` to `report_pages`:

```sql
ALTER TABLE public.report_pages ADD COLUMN proposed_by_ai boolean DEFAULT false;
```

3. Regenerate Supabase types.

4. Create `AICoPilotPanel.tsx`:
   - Persistent floating button on `AdminClientDetail` ("Add to Report")
   - Opens slide-in mini-wizard
   - Upload zone (any file)
   - AI proposes which pages to update or what new pages to create
   - Adam approves/edits/rejects each proposal
   - Approved changes flow into `report_pages` (with `proposed_by_ai = true` until accepted) and republish

5. Add panel to `AdminClientDetail`.

**Verify:** migration applies, types regen, build clean, tsc 0.

**Merge:** auto.

---

## PR #21 — Client-side "Add to my home"

**Branch:** `phase-7/pr-21-copilot-client`
**Files:** new `AddToMyHome.tsx`, integration into `PortalHome.tsx` or sidebar

**Tasks:**

1. Add "+" button accessible from homeowner side. Possible placements (pick one):
   - Floating button next to ConciergeBar
   - Quick-action card on Portal Home
   - Header utility icon

2. Tap → opens "Add to my home" mini-form:
   - Take photo / upload file / leave a note
   - Submitted as `copilot_inbox` row with `source = 'client'`
   - Goes to Adam's Co-Pilot panel for review

3. Confirmation message: "Adam will review and add this to your report. You'll see it next time you open the report."

**Verify:** build clean, tsc 0. Submit a test photo from a homeowner account → Adam sees it in his Co-Pilot inbox.

**Merge:** auto.

---

**End of Phase 7.** Append `- [x] PHASE 7 COMPLETE` to `TODO.md`.

Next: read `docs/rebuild/PHASE_8.md`.
