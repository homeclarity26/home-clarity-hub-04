# PHASE 3 — Page templates (the endless-scroll fix)

Goal: stop rendering every page as a flat block grid. Pick a template per page type. **This is the highest-impact phase.**

---

## PR #6 — Page template selector + Room template

**Branch:** `phase-3/pr-06-room-template`
**Files:** `src/components/tabs/ReportTab.tsx`, new `src/components/report/templates/RoomTemplatePage.tsx`

**Tasks:**

1. In `ReportTab.tsx` lines ~169–230, add a template selector helper:

```tsx
function pickTemplate(
  page: ReportPageData,
  group: PortalGroup | undefined
): "room" | "system" | "appliance" | "vision" | "generic" {
  const groupId = group?.id ?? "";
  if (groupId === "appliances") return "appliance";
  if (groupId.startsWith("systems-") || groupId === "safety-detection") return "system";
  if (groupId.startsWith("interior-") || groupId.startsWith("exterior")) return "room";
  if (groupId === "strategy" && page.page_key?.startsWith("vision-")) return "vision";
  return "generic";
}
```

2. Add a switch in the page-render branch:

```tsx
const template = pickTemplate(page, group);
if (template === "room") {
  return <RoomTemplatePage 
    page={page} 
    group={group}
    images={images} 
    prevPage={prevPage} 
    nextPage={nextPage}
    onNavigate={onNavigate}
    propertyAddress={propertyAddress}
  />;
}
// other templates fall through to existing flat block grid for now
```

3. Create `RoomTemplatePage.tsx`. Reference `caldwell_prototype_v2.html` for layout: hero image at top with gradient overlay, eyebrow, display title, metadata strip, condition dot, sections separated by horizontal rules: Finishes (4-col grid), Features (bulleted), Notes, Maintenance Notes, Linked Vision Projects.

4. Use the existing `RoomRecordBlock.tsx` as page-level body. Pull data from `page.specs`, `page.narrative`, `page.images`, `page.condition_rating`. No schema changes.

5. Eyebrow at top:

```tsx
<div className="eyebrow">Spaces · {group?.title ?? ""}</div>
<h1 className="font-display text-[34px] text-primary mt-2">{page.title}</h1>
```

6. Prev/next nav at bottom from existing pattern.

**Do NOT change:** `reportGroups`, `CHAPTERS` array, generic flat-grid render (still fallback for non-room pages).

**Verify:** `bun run build` clean, `npx tsc --noEmit` 0 errors.

**STOP HERE — GATE 3.**

```
🛑 GATE 3 — Room template review

PR #6 merged. Preview: {URL}

Adam, please:
1. Visit /portal/{id}/report → Interior Spaces → click any room
2. Compare to caldwell_prototype_v2.html (room page renders around line 2424)
3. Verify Room template:
   ☐ Hero image at top with gradient
   ☐ Eyebrow: "Spaces · {group}"
   ☐ Display title in Cormorant
   ☐ Metadata strip (dims, sqft, ceiling)
   ☐ Condition dot
   ☐ Finishes grid
   ☐ Features list
   ☐ Notes section
   ☐ Prev/Next nav at bottom
   ☐ NOT a wall of text

Reply "approved" or "fix X".
```

---

## PR #7 — System + Appliance templates

**Branch:** `phase-3/pr-07-system-template`
**Files:** `src/components/tabs/ReportTab.tsx`, new `SystemTemplatePage.tsx`, new `AppliancePage.tsx`

**Tasks:**

1. Create `SystemTemplatePage.tsx` per `HCR_STRUCTURE_LOCK.md` Template B: split header (photo + serial plate), eyebrow, title, spec row (5–6 cols: Make/Model/Serial/Installed/Lifespan/Status), lifespan bar, condition + status notes, Replacement Briefing card (conditional), maintenance schedule.

2. Use `SystemRecordBlock.tsx` as page body. Use `ReplacementBriefingBlock.tsx` conditionally when status approaches end-of-life.

3. Create `AppliancePage.tsx` — wrapper around `SystemTemplatePage` with `simplified={true}` prop omitting Replacement Briefing and making Lifespan Bar optional.

4. Wire the switch in `ReportTab.tsx`:

```tsx
if (template === "system") return <SystemTemplatePage page={page} group={group} ... />;
if (template === "appliance") return <AppliancePage page={page} group={group} ... />;
```

**Verify:** `bun run build` clean, `npx tsc --noEmit` 0 errors.

**STOP HERE — GATE 4.**

```
🛑 GATE 4 — System/Appliance template review

PR #7 merged. Preview: {URL}

Adam, please:
1. Systems & Appliances → click furnace, AC, water heater
2. Click into appliances (refrigerator, dishwasher, etc.)
3. Verify:
   ☐ System layout: photo + serial plate split, spec row, lifespan bar
   ☐ Replacement Briefing appears for end-of-life systems
   ☐ Appliance layout: simpler, no Replacement Briefing default
   ☐ Eyebrow: "Systems · {category}"

Reply "approved" or "fix X".
```

---

## PR #8 — Vision template with 3 tier cards

**Branch:** `phase-3/pr-08-vision-template`
**Files:** `src/components/tabs/ReportTab.tsx`, new `VisionTemplatePage.tsx`

**Tasks:**

1. Create `VisionTemplatePage.tsx` per `HCR_STRUCTURE_LOCK.md` Template D specification.

2. **Three tier cards are non-negotiable.** Always 3, always side-by-side on desktop (responsive: stack on mobile), always Essential / Enhanced / Signature labels with Good / Better / Best price ranges. Pull from `page.tiers` JSON array of 3 tier objects:

```ts
{ label: string, range: { low: number, high: number }, scope: string }
```

3. If `page.tiers` has fewer than 3 tiers, render placeholder cards labeled "Configure tier" — do not collapse to fewer columns.

4. Use existing `VisionProjectBlock.tsx` as page-level body shell.

5. Wire in `ReportTab.tsx`:

```tsx
if (template === "vision") return <VisionTemplatePage page={page} group={group} ... />;
```

**Verify:** `bun run build` clean, `npx tsc --noEmit` 0 errors.

**STOP HERE — GATE 5.**

```
🛑 GATE 5 — Vision template review

PR #8 merged. Preview: {URL}

Adam, please:
1. Strategy chapter → click any vision project
2. Verify:
   ☐ Aspirational image at top
   ☐ Three tier cards SIDE-BY-SIDE on desktop
   ☐ Essential / Enhanced / Signature labels
   ☐ Good / Better / Best price ranges visible
   ☐ Scope description in each card
   ☐ Linked rooms section at bottom

Reply "approved" or "fix X".
```

---

**End of Phase 3.** The endless-scroll problem is dead. Append `- [x] PHASE 3 COMPLETE` to `TODO.md`.

Next: read `docs/rebuild/PHASE_4.md`.
