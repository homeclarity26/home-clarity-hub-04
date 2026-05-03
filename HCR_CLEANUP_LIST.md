# HCR_CLEANUP_LIST.md

**Purpose:** Explicit list of files, components, schema artifacts, and code patterns to delete or rewrite during the rebuild. Each phase of `HCR_REBUILD_RUNNER.md` references this file.

**Read with:** `HCR_STRUCTURE_LOCK.md`

---

## Already done (do not redo)

- ✅ `WALKTHROUGH_FINDINGS.md` (root) → `docs/archive/2026-04-17-walkthrough-findings.md`
- ✅ Original `TODO.md` (root) → `docs/archive/2026-04-27-todo-pre-rebuild.md`
- ✅ New stub `TODO.md` at root pointing to runner

---

## Phase 0 — CLAUDE.md reconciliation (PR #0)

Rewrite these sections, not delete the file:

| Line range | Action |
|---|---|
| Top of file | INSERT new "Source of truth" callout pointing to `HCR_STRUCTURE_LOCK.md` |
| ~Line 230 (`6-tab portal consolidation`) | UPDATE: "6 tabs preserved (Home/Report/Schedule/Projects/Payments/Documents). Documents replaces Contacts. Trade partners surface contextually." |
| ~Line 275 (Monograms description) | UPDATE: deprecate chapter monograms; page-level badges may remain |
| ~Line 491 (full monogram block) | REPLACE: "The HCR has five chapters: Information, Interior Spaces, Exterior Spaces, Systems & Appliances, Strategy. The previous six-monogram chapter system (ES/EX/IN/SY/SP/SA) is deprecated. Page-level monogram badges may still be used but no longer represent chapters." |
| ~Lines 895–911 (source-of-truth list) | INSERT `HCR_STRUCTURE_LOCK.md` at #1, demote `HCR_Master_Spec_*.md` to "(historical, deprecated)" |

---

## Phase 1 — Naming consolidation (PR #1)

### Replace homeowner-facing strings

```bash
grep -rn '"Home OS"' src/ --include="*.tsx"
grep -rn '"Home OS Dashboard"' src/ --include="*.tsx"
grep -rn '"Client Portal"' src/components/portal/ --include="*.tsx"
```

Each match: replace with "Home Clarity Hub" (homeowner-facing).

### Component file names — leave internal naming alone

- `ConciergeBar.tsx`, `ConciergePanel.tsx` — keep file names internally
- User-visible labels inside those files: "Concierge" → "Bobby" (homeowner-facing only)
- Code-level `concierge_*` prefixes can stay

### Page titles, email templates, PDF outputs

Audit and update to "Home Clarity Hub" / "Bobby":

```bash
grep -rn -iE "home.?os" src/ supabase/functions/
grep -rn "Concierge" src/components/portal/ --include="*.tsx" | grep -v "ConciergeBar\|ConciergePanel"
```

---

## Phase 2 — Health Score remnants (PR #2)

```bash
grep -rn -iE "health.?score|healthScore|HEALTH_SCORE" src/ --include="*.tsx" --include="*.ts"
```

Each match: delete (PR #101 already removed the data model).

---

## Phase 3 — Chapter taxonomy (PR #3)

### Code targets

- `src/components/report/ReportChapterNav.tsx` — REPLACE `CHAPTERS` array with the 5-entry version from `HCR_STRUCTURE_LOCK.md`
- `src/data/reportContent.ts` — verify all `reportGroups` ids map cleanly (existing IDs are fine; only the chapter mapping changes)
- Any string `"Strategic Plan"` (chapter label) → replace with `"Strategy"`

### Search-and-destroy

```bash
grep -rn '"Strategic Plan"' src/
grep -rn "ES.*EX.*IN.*SY.*SP" src/
grep -rn "chapter.*safety" src/ -i
```

---

## Phase 4 — Visual system (PR #4)

### Font references

```bash
grep -rn "Playfair Display" src/ index.html tailwind.config.ts
grep -rn "JetBrains Mono" src/ index.html tailwind.config.ts
```

Replace with Cormorant Garamond / IBM Plex Mono respectively.

### Color references

Update `tailwind.config.ts` and `src/index.css` CSS variables to match the locked palette in `HCR_STRUCTURE_LOCK.md`. Keep shadcn/ui semantic tokens (`--primary`, `--accent`, etc.) but map them to the locked colors.

---

## Phase 5 — Page templates (PR #6)

### Generic flat-grid rendering — preserve as fallback only

Current behavior in `src/components/tabs/ReportTab.tsx` lines ~169–230:

```tsx
<div className="grid grid-cols-12 gap-4">
  {sortedBlocks.map((block) => (
    <div key={block.id} className={spanClassFor(block.colSpan)}>
      <SharedBlockRenderer block={block} ... />
    </div>
  ))}
</div>
```

KEEP this pattern ONLY for `template === "generic"` (Information chapter). For Room/System/Appliance/Vision, replace with template-specific page wrappers.

### Old `financial-roadmap` and `action-plan` page references

- `src/data/reportContent.ts` — these page_keys deprecated
- Migration to rename: not needed (no production reports yet)

---

## Phase 6 — Bobby (PRs #11–#15)

### Old non-persistent chat behavior

If existing `ConciergePanel.tsx` doesn't persist messages across sessions, the persistence layer is new (`bobby_threads` + `bobby_messages` tables). Old non-persistent state goes away once new schema is wired.

### Homeowner-facing strings

```bash
grep -rn "Concierge" src/components/portal/ --include="*.tsx" | \
  grep -v "ConciergeBar\|ConciergePanel\|concierge_"
```

Replace with "Bobby" in homeowner-facing labels.

---

## Phase 7 — Documents tab (PR #22)

### Delete the Contacts tab

- `src/components/tabs/ContactsTab.tsx` — DELETE
- `src/pages/Index.tsx` — remove `"contacts"` from `VALID_TABS`, replace with `"documents"`
- `src/components/portal/PortalSidebar.tsx` — replace Contacts nav item with Documents nav item

### Documents collapsible inside ReportHome

`src/components/portal/report/ReportHome.tsx` currently has a `<Collapsible>` for Documents at the bottom. DELETE that section. Documents lives at the tab level now.

### Trade-partner browse surfaces (homeowner-facing only)

Trade partners stay in code (admin-side, `/trade` route group). Remove only homeowner-facing browse UI:

- Any "Browse vetted trade partners" link from homeowner portal
- Any trade-partner directory component shown to clients

Trade partners surface contextually: Bobby suggestions, Schedule vendor cards, appliance/system "Recommended vendors" sections, Recurring Services Register.

---

## Phase 9 — Mobile audit

### Desktop-only patterns to fix

- Any `display: none` hiding essential UI on mobile
- Any tap targets smaller than 44×44px in primary flows
- Any hover-only interactions in primary flows
- Any tooltips without tap-to-show alternative

---

## Phase 11 — Final cleanup (PR #32)

### Dead components

```bash
# Find unimported components:
for f in src/components/**/*.tsx; do
  base=$(basename "$f" .tsx)
  count=$(grep -r "$base" src/ --include="*.tsx" --include="*.ts" | grep -v "$f" | wc -l)
  if [ "$count" -eq 0 ]; then echo "ORPHAN: $f"; fi
done
```

Manual review before deleting each orphan.

### Old monogram component

If `src/components/brand/Monogram.tsx` exists and was tied to chapter monograms, check if still used at page level. If yes, keep. If no, delete.

### Stale migrations

Migrations are **append-only**. Never delete. But `supabase/migrations/seeds/` may have seed scripts pre-populating old chapter structure or contacts tab. Update those seeds; don't delete migration files.

---

## Files that look stale but ARE NOT — leave alone

| File | Why kept |
|---|---|
| `CLAUDE.md` | Reconciled in PR #0, not deleted |
| `README.md` | Lovable auto-generated, harmless |
| `QUESTIONS.md` | Active product questions for Adam |
| `CLIENT_IMPERSONATION_SPEC.md` | Separate feature spec, not structural |
| `.lovable/plan.md` | Lovable working scratch |
| `remotion/CLAUDE.md`, `remotion/README.md` | Scoped to Remotion subdirectory |
| `scripts/ci/README.md` | CI docs |
| Anything in `supabase/migrations/` | Append-only |
| `eslint-rules/` | Custom lint rules |

If unsure: leave it. A stale doc is a small drift; a deleted-but-needed file is a broken build.
