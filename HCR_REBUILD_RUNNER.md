# HCR_REBUILD_RUNNER.md

**Read first:** `HCR_STRUCTURE_LOCK.md` (canonical spec) and `HCR_CLEANUP_LIST.md` (kill targets).

This runner is split into phases. Each phase is a separate file in `docs/rebuild/`:

- `docs/rebuild/PHASE_0.md` — Foundation (PRs 0–2): CLAUDE.md reconcile, naming, kill Health Score
- `docs/rebuild/PHASE_1.md` — Structural foundation (PRs 3–4): chapter taxonomy, visual system [GATE 1]
- `docs/rebuild/PHASE_2.md` — Report Home (PR 5): chapter cards [GATE 2]
- `docs/rebuild/PHASE_3.md` — Page templates (PRs 6–8): Room, System, Vision [GATES 3, 4, 5]
- `docs/rebuild/PHASE_4.md` — Chapter content (PRs 9–10): Information, Strategy
- `docs/rebuild/PHASE_5.md` — Bobby (PRs 11–15): schema, panels, escalation [GATE 6]
- `docs/rebuild/PHASE_6.md` — Wizard improvements (PRs 16–19)
- `docs/rebuild/PHASE_7.md` — AI Co-Pilot (PRs 20–21)
- `docs/rebuild/PHASE_8.md` — Documents vault (PRs 22–24)
- `docs/rebuild/PHASE_9.md` — Recurring Care + Notifications (PRs 25–27)
- `docs/rebuild/PHASE_10.md` — Mobile (PRs 28–29)
- `docs/rebuild/PHASE_11.md` — Digital Twin (PRs 30–31)
- `docs/rebuild/PHASE_12.md` — Final cleanup (PR 32) [GATE FINAL]

---

## Hard rules (apply to every PR in every phase)

1. **One PR at a time.** Branch format: `phase-{N}/pr-{NN}-{slug}`.
2. **Verify before claiming done.** `bun run build` clean + `npx tsc --noEmit` 0 errors. If either fails, STOP.
3. **Merge via GitHub API path** (since `gh` CLI isn't authenticated). Use existing CLAUDE.md runbook.
4. **Squash merge + delete branch.** Pull main locally before next PR.
5. **Visual gates pause.** When a phase says "STOP HERE — GATE N," wait for Adam's "approved" reply.
6. **No scope creep.** Only touch files listed in the PR's tasks.
7. **Ambiguity → re-read `HCR_STRUCTURE_LOCK.md`.** Lock file wins. If still ambiguous, STOP and ask Adam.
8. **DB changes need migration + regenerated types in same PR** per existing CLAUDE.md rules.

After each PR merges, append to `TODO.md`:
```
- [x] PR #NN — {title} — merged {date}
```

After each phase completes, also append:
```
- [x] PHASE N COMPLETE — {date}
```

---

## How to start

In a fresh Claude Code session, paste:

```
Read these files in repo root in this order:
1. HCR_STRUCTURE_LOCK.md — the canonical spec
2. HCR_CLEANUP_LIST.md — the kill targets
3. HCR_REBUILD_RUNNER.md — this overview
4. docs/rebuild/PHASE_0.md — start here

Then begin Phase 0, PR #0. When Phase 0 completes, read 
docs/rebuild/PHASE_1.md and continue. Work through all phases in order.

Pause at every visual gate — do not proceed until Adam replies "approved".

If you have questions, surface them in chat before writing code.
```

Walk away. Check chat for visual gates roughly 6 times across the run.

---

## Failure handling

If at any point a PR can't merge cleanly:

- **Build fails:** STOP, show Adam the error
- **Visual gate rejected:** iterate the same PR
- **Schema migration fails:** STOP, surface the error
- **Ambiguity in spec:** re-read lock file, then ask Adam

Never force-push. Never delete history. Every change recoverable via `git revert`.
