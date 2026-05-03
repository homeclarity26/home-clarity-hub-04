# PHASE 11 — Digital Twin

Goal: 2D floor plan visual entry into the report. Cover view ↔ Twin view toggle.

---

## PR #30 — 2D floor plan + Twin/Cover toggle

**Branch:** `phase-11/pr-30-digital-twin`
**Files:** new `TwinView.tsx`, update `ReportHome.tsx`

**Tasks:**

1. Add toggle to `ReportHome.tsx`:

```
[Cover view]  [Twin view]
```

Style as small pill toggle in the report header.

2. Cover view = existing `ReportOverview`.

3. Twin view = `TwinView` component:
   - 2D top-down floor plan (generate from existing room dimensions or use SVG layout placeholder for v1)
   - Each room is a tappable region
   - Tap room → navigate to that room's report page

4. v1 acceptable layout: stacked floor plans (basement / main / upper) with rooms as clickable rectangles labeled with room name. Doesn't have to be photo-realistic — just clickable and clear.

**Verify:** build clean, tsc 0. Toggle works, rooms are tappable.

**Merge:** auto.

---

## PR #31 — Click-to-drill from twin

**Branch:** `phase-11/pr-31-twin-drill`
**Files:** `TwinView.tsx`

**Tasks:**

1. Verify each room in TwinView links to the correct report page.

2. Add hover state showing condition dot per room.

3. Add small badge for rooms with active vision projects.

**Verify:** build clean, tsc 0. Manual test.

**Merge:** auto.

---

**End of Phase 11.** Append `- [x] PHASE 11 COMPLETE` to `TODO.md`.

Next: read `docs/rebuild/PHASE_12.md`.
