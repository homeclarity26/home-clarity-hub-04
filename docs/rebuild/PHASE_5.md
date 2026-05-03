# PHASE 5 — Bobby (front door)

Goal: build the persistent unified-thread surface that replaces the prototype's Concierge demo.

---

## PR #11 — Bobby thread schema

**Branch:** `phase-5/pr-11-bobby-schema`
**Files:** new migration, regenerated types, new hook

**Tasks:**

1. Create migration `supabase/migrations/{timestamp}_create_bobby_threads.sql`:

```sql
CREATE TABLE public.bobby_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  client_user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_message_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(property_id)
);

CREATE TABLE public.bobby_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid REFERENCES public.bobby_threads(id) ON DELETE CASCADE NOT NULL,
  sender text NOT NULL CHECK (sender IN ('user', 'bobby', 'adam')),
  content text NOT NULL,
  status text NOT NULL DEFAULT 'sent' CHECK (status IN ('pending', 'sent', 'escalated', 'resolved')),
  action_taken jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.escalation_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid REFERENCES public.bobby_messages(id) ON DELETE CASCADE NOT NULL,
  thread_id uuid REFERENCES public.bobby_threads(id) ON DELETE CASCADE NOT NULL,
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'dismissed')),
  context_summary text,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

CREATE INDEX idx_bobby_messages_thread_created ON public.bobby_messages(thread_id, created_at DESC);
CREATE INDEX idx_escalation_queue_status_created ON public.escalation_queue(status, created_at DESC);

ALTER TABLE public.bobby_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bobby_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escalation_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Homeowners read own thread" ON public.bobby_threads
  FOR SELECT USING (client_user_id = auth.uid());

CREATE POLICY "Homeowners read own messages" ON public.bobby_messages
  FOR SELECT USING (
    thread_id IN (SELECT id FROM public.bobby_threads WHERE client_user_id = auth.uid())
  );

CREATE POLICY "Homeowners write own messages" ON public.bobby_messages
  FOR INSERT WITH CHECK (
    sender = 'user' AND
    thread_id IN (SELECT id FROM public.bobby_threads WHERE client_user_id = auth.uid())
  );

CREATE POLICY "Creators read all threads" ON public.bobby_threads
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'creator')
  );

CREATE POLICY "Creators read all messages" ON public.bobby_messages
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'creator')
  );

CREATE POLICY "Creators manage escalations" ON public.escalation_queue
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'creator')
  );
```

2. Regenerate types:

```bash
SUPABASE_ACCESS_TOKEN=$PAT npx --yes supabase gen types typescript \
  --project-id vvwojahsianpmwjvkunn > src/integrations/supabase/types.ts
```

3. Add `src/hooks/useBobbyThread.ts`:
   - Auto-creates thread if missing on first home portal load
   - Subscribes to realtime updates
   - Returns `{ thread, messages, isLoading, sendMessage }`

**Verify:** migration applies cleanly, types regenerated, no TS errors, build clean.

**Merge:** auto.

---

## PR #12 — Ask Bobby pinned input on Portal Home

**Branch:** `phase-5/pr-12-ask-bobby-input`
**Files:** new `src/components/portal/home/BobbyInputBar.tsx`, update `PortalHome.tsx`

**Tasks:**

1. Create `BobbyInputBar.tsx`:
   - Pinned at top of Portal Home, directly under hero photo
   - Gold "B" avatar on left
   - Input field with placeholder "Ask Bobby anything..."
   - Tap input or button → opens `AskBobbyPanel` (PR #13)
   - Mobile: full-width, ≥56px tall

2. In `PortalHome.tsx`, place `<BobbyInputBar />` immediately after hero photo, before Today's Brief.

3. Visual treatment per `caldwell_prototype_v2.html` ConciergeBar styling but adapted for inline placement (not floating).

**Verify:** build clean, tsc 0.

**Merge:** auto.

---

## PR #13 — AskBobbyPanel — replaces ConciergePanel

**Branch:** `phase-5/pr-13-ask-bobby-panel`
**Files:** new `AskBobbyPanel.tsx`, update `ConciergeBar.tsx`, replace `ConciergePanel.tsx`

**Tasks:**

1. Create `AskBobbyPanel.tsx`:
   - Slide-in panel from right, 420px desktop, full-width mobile
   - Header: gold "B" avatar, "Ask Bobby" headline, "Trained on your home" eyebrow
   - Suggested prompts at top of empty thread
   - Message thread (uses `useBobbyThread` hook from PR #11)
   - User messages right-aligned with cream-light background
   - Bobby messages left-aligned with white background
   - Adam messages left-aligned with subtle navy left border + "From Adam" eyebrow
   - Input at bottom

2. Update `ConciergeBar.tsx`:
   - Rename user-visible labels: "Concierge" → "Bobby"
   - When tapped, opens `AskBobbyPanel`
   - Keep file name as `ConciergeBar.tsx`

3. The pinned input from PR #12 also opens `AskBobbyPanel`. Both entry points = same panel = same persistent thread.

4. Replace or deprecate the old `ConciergePanel.tsx` demo behavior. New panel uses real persisted messages from `bobby_messages`.

**Verify:** build clean, tsc 0.

**Merge:** auto.

---

## PR #14 — Escalation queue (admin)

**Branch:** `phase-5/pr-14-escalation-queue`
**Files:** new `AdminBobbyInbox.tsx`, new `EscalationCard.tsx`, `App.tsx`

**Tasks:**

1. Create `AdminBobbyInbox.tsx`:
   - Lists pending escalations from `escalation_queue` ordered by created_at desc
   - Each row: client name, property address, original message, AI context summary, "Reply" button
   - Reply opens inline composer that posts to `bobby_messages` with sender='adam'
   - Marking resolved updates `escalation_queue.status`

2. Add admin route in `App.tsx`:

```tsx
<Route path="bobby-inbox" element={<AdminBobbyInbox />} />
```

3. Add link in admin sidebar.

**Verify:** build clean, tsc 0.

**Merge:** auto.

---

## PR #15 — Push notifications

**Branch:** `phase-5/pr-15-push`
**Files:** new edge function `notify-bobby-response`, update `useBobbyThread`

**Tasks:**

1. Edge function fires on new `bobby_messages` row where:
   - `sender = 'adam'` → notify the homeowner
   - `sender = 'user'` AND status changes to 'escalated' → notify Adam

2. Use existing PWA push notification infrastructure if it exists. If not, defer push to a later PR (in-app + email digest sufficient for v1).

3. Email digest fallback via Resend API (or existing email infra).

**Verify:** build clean, tsc 0.

**STOP HERE — GATE 6.**

```
🛑 GATE 6 — Bobby UX flow review

Phase 5 complete. Preview: {URL}

Adam, please:
1. Visit Portal Home — see "Ask Bobby" input pinned under hero
2. Tap it — AskBobbyPanel opens from right
3. Send a test message
4. Visit any other tab — ConciergeBar floats at bottom
5. Tap ConciergeBar — same panel, same thread
6. Switch to admin → /admin/bobby-inbox
7. Reply as admin — verify it appears in homeowner thread

Verify:
☐ Two entry points open same panel
☐ Messages persist across sessions
☐ Mobile layout works (test in iOS Safari)
☐ Admin escalation queue functional

Reply "approved" or "fix X".
```

---

**End of Phase 5.** Append `- [x] PHASE 5 COMPLETE` to `TODO.md`.

Next: read `docs/rebuild/PHASE_6.md`.
