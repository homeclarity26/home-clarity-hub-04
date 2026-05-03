# PHASE 10 — Mobile

Goal: make every primary flow excellent on iPhone Safari.

---

## PR #28 — Mobile audit + fixes

**Branch:** `phase-10/pr-28-mobile-audit`
**Files:** various components per audit findings

**Tasks:**

1. Run a full mobile audit at iOS Safari (375px viewport). Walk through each tab:
   - Home / Report / Schedule / Projects / Payments / Documents
   - Bobby Panel
   - Wizard (admin side)

2. For each issue found, document and fix:
   - Tap targets < 44px
   - Hidden essential UI on small screens
   - Hover-only interactions
   - Tooltips without tap alternative
   - Horizontal overflow

3. Ensure sidebar collapses to bottom-tab nav on mobile.

4. Verify ConciergeBar mobile drawer pattern (full-width, swipe-up to expand).

**Verify:** build clean, tsc 0. Manual test on actual iOS device (not just Chrome DevTools).

**Merge:** auto.

---

## PR #29 — Photo capture flow

**Branch:** `phase-10/pr-29-photo-capture`
**Files:** new `PhotoCaptureFlow.tsx`, update `PortalHome.tsx`, new edge function `classify-photo`

**Tasks:**

1. Add "Take photo" button on Portal Home (mobile-prominent).

2. On tap: open device camera (HTML5 `<input type="file" capture="environment">` for v1; native API in v2).

3. After capture: AI classifies — suggests room and system. User confirms or edits.

4. Save photo to digital twin (attached to room/system) AND to `copilot_inbox` for Adam to absorb into report.

**Verify:** build clean, tsc 0. Test on iOS Safari — capture photo, see classification.

**Merge:** auto.

---

**End of Phase 10.** Append `- [x] PHASE 10 COMPLETE` to `TODO.md`.

Next: read `docs/rebuild/PHASE_11.md`.
