# PHASE 2 — Report Home

Goal: Make the front door of the report match the prototype.

---

## PR #5 — Report Home cover with 5 chapter cards

**Branch:** `phase-2/pr-05-report-home`
**Files:** `src/components/report/ReportOverview.tsx`, `src/components/portal/report/ReportHome.tsx`

**Tasks:**

1. Reference `caldwell_prototype_v2.html` lines 2389+ (`ClientReportHome` component). The visual target:
   - Magazine-cover left side (HCRLogo, eyebrow "Home Clarity Report · {date}", display title with property name, italic address, vertical metadata strip)
   - Chapter cards on right side (5 cards, each with "Section NN" eyebrow, display title, 2-line description, page count, "Open →" CTA)
   - "Begin reading" button below cards, links to first page of first chapter
   - Footer note about "How this report stays alive"

2. Update `ReportOverview.tsx` to render 5 chapter cards in order from PR #3. If layout breaks at 5 cards, use:

```tsx
<div className="grid grid-cols-2 gap-4">
  {chapterData.slice(0, 4).map(...)}      {/* 2x2 */}
  <div className="col-span-2">
    {chapterData[4]}                       {/* 5th spans full width */}
  </div>
</div>
```

3. Each chapter card description should match prototype tone:

- **Information**: "Welcome letter, executive summary, top priorities, vision inventory, at-a-glance specs"
- **Interior Spaces**: "Every room inside your home — your home's living record"
- **Exterior Spaces**: "Roof, siding, windows, structures, landscape — everything outside your home"
- **Systems & Appliances**: "Every furnace, condenser, water heater, fridge, range, and major appliance with its full lifecycle"
- **Strategy**: "Your 10-year capital plan, maintenance calendar, vision projects, and recurring services"

4. Remove the Documents/Equipment collapsibles from `ReportHome.tsx` per `HCR_CLEANUP_LIST.md` Phase 7. Leave just `<ReportOverview>` render. Documents tab rebuild happens in Phase 8.

**Verify:** `bun run build` clean, `npx tsc --noEmit` 0 errors.

**STOP HERE — GATE 2.**

Print to chat:

```
🛑 GATE 2 — Report Home review

PR #5 merged. Preview: {URL}

Adam, please:
1. Visit /portal/{id}/report
2. Compare to caldwell_prototype_v2.html line 2389+ (ClientReportHome)
3. Verify:
   ☐ Magazine-cover layout (HCRLogo, eyebrow, title, address)
   ☐ 5 chapter cards in correct order
   ☐ "Begin reading" CTA links to first page
   ☐ Old Documents/Equipment collapsibles are gone

Reply "approved" to continue to PR #6.
Reply "fix X" to iterate.
```

---

**End of Phase 2.** Append `- [x] PHASE 2 COMPLETE` to `TODO.md`.

Next: read `docs/rebuild/PHASE_3.md`.
