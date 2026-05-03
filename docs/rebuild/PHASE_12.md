# PHASE 12 — Final cleanup

Goal: remove dead code, verify the rebuild is complete.

---

## PR #32 — Dead components + cleanup

**Branch:** `phase-12/pr-32-final-cleanup`

**Tasks:**

1. Run orphan finder per `HCR_CLEANUP_LIST.md` Phase 12:

```bash
for f in src/components/**/*.tsx; do
  base=$(basename "$f" .tsx)
  count=$(grep -r "$base" src/ --include="*.tsx" --include="*.ts" | grep -v "$f" | wc -l)
  if [ "$count" -eq 0 ]; then echo "ORPHAN: $f"; fi
done
```

2. For each orphan: manual review, delete if confirmed unused.

3. Verify Health Score grep returns zero results:

```bash
grep -rn -iE "health.?score|healthScore|HEALTH_SCORE" src/ --include="*.tsx" --include="*.ts"
```

4. Verify Monogram component (if exists at `src/components/brand/Monogram.tsx`) is still used at page level. Otherwise delete.

5. Stale migrations are append-only — never delete. But check `supabase/migrations/seeds/` for any seed scripts that pre-populate the old chapter structure or contacts tab. Update those seeds (don't delete migration files).

6. Update `TODO.md` with final state.

**Verify:** build clean, tsc 0. Bundle size check — has cleanup reduced JS bundle? Note in PR description.

**STOP HERE — GATE FINAL.**

Print to chat:

```
🛑 GATE FINAL — V1 COMPLETE

All phases complete. Vercel preview is the v1 release candidate.

Adam, please walk through every primary flow:
☐ Wizard 5 steps with Caldwell test data
☐ All 5 chapters render correctly (Information / Interior / Exterior / Systems & Appliances / Strategy)
☐ All 5 page templates work (Room/System/Appliance/Vision/Generic)
☐ Bobby thread persists, escalation works
☐ Documents vault search works
☐ Recurring Care displays in Schedule
☐ Notifications bell works
☐ Mobile feels good on iPhone Safari
☐ Photo capture flow works
☐ Twin view toggle works
☐ AI Co-Pilot adds to published report

If everything works:
- Reply "v1 approved"
- Tag a release: git tag v1.0.0 && git push --tags
- Onboard the Johnsons

If issues:
- Reply with the list
- Open follow-up PRs for each
```

---

**End of Phase 12.** Append `- [x] V1 COMPLETE — {date}` to `TODO.md`.

The rebuild is done.
