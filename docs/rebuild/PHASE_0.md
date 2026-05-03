# PHASE 0 — Foundation (no visuals)

Goal: align documentation, remove distractions, before any structural code changes.

---

## PR #0 — Reconcile CLAUDE.md

**Branch:** `phase-0/pr-00-reconcile-claude-md`
**Files:** `CLAUDE.md` only

**Tasks:**

1. Read `HCR_STRUCTURE_LOCK.md` and `HCR_CLEANUP_LIST.md` first.

2. At the top of `CLAUDE.md` (after existing front-matter HTML comments), insert:

```markdown
## 🔒 Source of truth for HCR structure

`HCR_STRUCTURE_LOCK.md` (in repo root) is the canonical spec for the
five-chapter HCR structure, page templates, portal navigation, and
visual system. If anything below this section conflicts with that
file, the lock file wins. Read it before any structural change.
```

3. Find the section near line 491 listing chapter monograms (`ES, EX, IN, SY, SP, SA`). Replace with:

```
The HCR has five chapters: Information, Interior Spaces, Exterior Spaces, Systems & Appliances, Strategy. The previous six-monogram chapter system (ES/EX/IN/SY/SP/SA) is deprecated. Page-level monogram badges may still be used for individual pages but no longer represent chapters.
```

4. Find the line near 230 about "C12 6-tab portal consolidation". Add inline note:

```
The 6-tab portal navigation is preserved (Home, Report, Schedule, Projects, Payments, Documents). Documents replaces Contacts. Trade partners surface contextually (Bobby, Schedule, appliance pages) rather than as a tab. Stripe payments and project tracking are first-class.
```

5. In the source-of-truth document list (around lines 895–911), insert `HCR_STRUCTURE_LOCK.md` at #1 with note "supersedes prior HCR structure specs in conflict." Demote `HCR_Master_Spec_*.md` references to "(historical, deprecated)".

**Do not touch:** any code in `/src`. Documentation only.

**Verify:** `git diff` shows changes only to `CLAUDE.md`.

**Merge:** auto.

---

## PR #1 — Naming consolidation

**Branch:** `phase-0/pr-01-naming`

**Tasks:**

1. Run searches:

```bash
grep -rn '"Home OS"' src/ --include="*.tsx"
grep -rn '"Home OS Dashboard"' src/ --include="*.tsx"
grep -rn '"Client Portal"' src/components/portal/ --include="*.tsx"
grep -rn -iE "home.?os" src/ supabase/functions/
```

2. For each homeowner-visible string match, replace with "Home Clarity Hub" (or "HCH" for tight space).

3. Replace homeowner-facing "Concierge" labels with "Bobby":

```bash
grep -rn "Concierge" src/components/portal/ --include="*.tsx" | \
  grep -v "ConciergeBar\|ConciergePanel\|concierge_"
```

For each match: change user-facing label only. Keep file names and code identifiers as-is.

4. Update email template subject lines, PDF cover page text, header logo alt-text to "Home Clarity Hub".

**Do not touch:** internal code identifiers, function names, table names, file names. Only user-visible strings.

**Verify:** `bun run build` clean, `npx tsc --noEmit` 0 errors. Open deployed preview, header shows "Home Clarity Hub".

**Merge:** auto.

---

## PR #2 — Kill Health Score remnants

**Branch:** `phase-0/pr-02-health-score`

**Tasks:**

1. Run:

```bash
grep -rn -iE "health.?score|healthScore|HEALTH_SCORE" src/ --include="*.tsx" --include="*.ts"
```

2. Delete each match. PR #101 already removed the data model; this removes UI fragments.

3. If a component is *only* about health score, delete the whole component file.

**Verify:** search returns zero results, `bun run build` clean, `npx tsc --noEmit` 0 errors.

**Merge:** auto.

---

**End of Phase 0.** Append `- [x] PHASE 0 COMPLETE` to `TODO.md`.

Next: read `docs/rebuild/PHASE_1.md`.
