# PHASE 6 — Wizard improvements

Goal: ship Adam's wizard ergonomics changes.

---

## PR #16 — Paired Asset cards (Hover + iGUIDE)

**Branch:** `phase-6/pr-16-paired-assets`
**Files:** `Step1Intake.tsx`, new or extended `IntakeUploadCard.tsx`

**Tasks:**

1. Create or extend a `PairedAssetCard` component:
   - URL input (e.g., "Hover.to 3D model URL")
   - PDF upload field (e.g., "Hover Measurement Report PDF")
   - Both fields in one card with shared label

2. Replace the existing Hover and iGUIDE intake cards in Step 1 with PairedAssetCard versions.

3. Plumb the URL + PDF through to the property record so both surface together on Portal Home media cards.

**Verify:** build clean, tsc 0. Run wizard manually — Step 1 shows paired cards.

**Merge:** auto.

---

## PR #17 — TOC select-all toolbar

**Branch:** `phase-6/pr-17-toc-toolbar`
**Files:** `Step2TOC.tsx`

**Tasks:**

1. Add toolbar above TOC list with 4 buttons:
   - Select all
   - Select all in section (when a section is hovered/active)
   - Defaults only (resets to default-included pages)
   - Clear all

2. Each button operates on existing TOC checkbox state.

**Verify:** build clean, tsc 0.

**Merge:** auto.

---

## PR #18 — Step 5 last-chance + missing-photo aggregate

**Branch:** `phase-6/pr-18-step5`
**Files:** `Step5Publish.tsx`

**Tasks:**

1. Add "Last chance to add anything" section above the Publish button:
   - Drag-drop upload zone
   - AI auto-routes uploads to correct pages

2. Replace per-item missing-photo acks with single aggregate banner:

```
⚠️ 12 items don't have photos yet.
   They'll show clean placeholder hero images.

   [Add photos]    [Continue]
```

Both buttons drive the wizard forward — "Continue" just acknowledges and proceeds.

**Verify:** build clean, tsc 0. Manually walk through Step 5 with a partial report.

**Merge:** auto.

---

## PR #19 — Post-publish redirect

**Branch:** `phase-6/pr-19-post-publish`
**Files:** `Step5Publish.tsx`

**Tasks:**

1. After successful publish, redirect to:

```
/portal/{propertyId}/report?preview=admin
```

So Adam lands on the live client report immediately to review.

**Verify:** build clean. Manually publish a test report — confirm redirect.

**Merge:** auto.

---

**End of Phase 6.** Append `- [x] PHASE 6 COMPLETE` to `TODO.md`.

Next: read `docs/rebuild/PHASE_7.md`.
