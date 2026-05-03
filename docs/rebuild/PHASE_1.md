# PHASE 1 — Structural foundation

Goal: lock the chapter structure and visual atoms before building anything visual.

---

## PR #3 — 5-chapter taxonomy

**Branch:** `phase-1/pr-03-chapters`
**Files:** `src/components/report/ReportChapterNav.tsx`, verify `ReportOverview.tsx`

**Tasks:**

1. In `ReportChapterNav.tsx`, REPLACE the `CHAPTERS` array with EXACTLY:

```tsx
export const CHAPTERS: ChapterDef[] = [
  { id: "information", label: "Information",
    groupIds: ["information"] },
  { id: "interior-spaces", label: "Interior Spaces",
    groupIds: ["interior-living", "interior-bedrooms", "interior-bathrooms",
               "interior-utility", "interior-unfinished", "interior-additional"] },
  { id: "exterior-spaces", label: "Exterior Spaces",
    groupIds: ["exterior", "exterior-structures"] },
  { id: "systems-appliances", label: "Systems & Appliances",
    groupIds: ["systems-hvac", "systems-mechanical", "systems-additional",
               "safety-detection", "appliances"] },
  { id: "strategy", label: "Strategy",
    groupIds: ["strategy"] },
];
```

2. Search and replace `"Strategic Plan"` (chapter label) with `"Strategy"` everywhere:

```bash
grep -rn '"Strategic Plan"' src/
```

3. Verify `ReportOverview.tsx` continues to render correctly. If 5-card layout looks off, use 2-2-1 grid (5th card spans both columns at bottom).

4. Do NOT change `reportGroups` in `src/data/reportContent.ts` yet. Group IDs map cleanly via the `groupIds` arrays above.

**Verify:** `bun run build` clean, `npx tsc --noEmit` 0 errors. Visit `/portal/{id}/report`. Cover page shows exactly 5 chapter cards in correct order.

**Merge:** auto.

---

## PR #4 — Visual system lock

**Branch:** `phase-1/pr-04-visual-system`
**Files:** `tailwind.config.ts`, `src/index.css`, `index.html`, components with hardcoded colors

**Tasks:**

1. Set CSS variables in `src/index.css` to EXACTLY these values:

```css
:root {
  --navy: #0A1628;
  --navy-soft: #1B2B4D;
  --gold: #B87333;
  --gold-light: #D4A574;
  --cream: #EDE9E1;
  --cream-light: #F5F2EC;
  --white: #FFFFFF;
  --rust: #B7410E;
  --text: #0A1628;
  --text-muted: #6B6B6B;
  --text-subtle: #999999;
  --border: #E5E0D6;
  --border-strong: #C9C2B5;
  --success: #2F6E40;
  --warning: #B58A1F;
  --danger: #B7410E;
}
```

2. Map shadcn/ui semantic tokens:
   - `--primary` → navy
   - `--accent` → gold
   - `--background` → cream
   - `--foreground` → text
   - `--muted` → text-muted
   - `--border` → border
   - `--destructive` → rust

3. In `index.html`, update Google Fonts:

```html
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
```

4. In `tailwind.config.ts`:

```ts
fontFamily: {
  display: ['"Cormorant Garamond"', 'serif'],
  sans: ['Inter', 'sans-serif'],
  mono: ['"IBM Plex Mono"', 'monospace'],
},
```

5. Search for old fonts and replace each match:

```bash
grep -rn "Playfair Display" src/ index.html tailwind.config.ts
grep -rn "JetBrains Mono" src/ index.html tailwind.config.ts
```

6. Add `.eyebrow` utility class in `src/index.css`:

```css
.eyebrow {
  font-family: 'IBM Plex Mono', monospace;
  text-transform: uppercase;
  font-size: 10px;
  letter-spacing: 0.12em;
  color: hsl(var(--accent));
}
```

7. Update condition dot colors in `ConditionPillBlock.tsx` and `ConditionRatingBlock.tsx`:
   - Excellent #2F6E40
   - Good #5A8A4F
   - Fair #B58A1F
   - Poor #B7410E
   - Critical #8B0000

**Verify:** `bun run build` clean, `npx tsc --noEmit` 0 errors.

**STOP HERE — GATE 1.**

Print to chat:

```
🛑 GATE 1 — Visual baseline review

PR #4 merged. Vercel preview deployed: {URL}

Adam, please:
1. Open the preview side-by-side with caldwell_prototype_v2.html
2. Click around existing screens (still wrong structure, ignore that)
3. Verify atoms match:
   ☐ Cream background matches prototype #EDE9E1
   ☐ Headings render in Cormorant Garamond
   ☐ Eyebrow text in IBM Plex Mono, gold, 10px, uppercase
   ☐ Condition dots use 5 prototype colors

Reply "approved" to continue to PR #5.
Reply "fix X" to iterate.
```

Wait for "approved." Do not proceed without it.

---

**End of Phase 1.** Append `- [x] PHASE 1 COMPLETE` to `TODO.md`.

Next: read `docs/rebuild/PHASE_2.md`.
