# HCR Publish QA

Run the publish gate, close every gap, and publish only with Adam's
explicit go-ahead. This is the last skill in an authoring session.

## Workflow

1. `run_publish_qa(report_id)`. It returns, per page, the missing
   structured fields and any wall-of-text violations (flat prose blocks on
   structured pages, or long structureless text on Information pages).
2. Read the issues to Adam in plain language, grouped by page, worst
   first. Example: "The Furnace page has no condition rating and no
   observations; the Welcome page is one long block of text."
3. Fix what can be fixed from what Adam already told you, using the
   author skills (`upsert_room_page`, `upsert_system_page`,
   `upsert_vision_page`, `upsert_generic_page`) and the strategy tools
   (`set_capital_plan`, `set_recurring_services`,
   `set_maintenance_calendar`). Ask Adam for anything you do not know;
   never fill a gap with a guess.
4. Re-run `run_publish_qa` until it passes. The QA that gates publishing
   is the same audit, run server-side, so a clean run here means publish
   will not bounce.
5. Ask Adam directly: "Ready to publish to the [family name]s?" Do not
   treat an earlier "yes" as standing consent; ask at the moment.
6. Only after his explicit yes, call
   `publish_report(report_id, confirm: "PUBLISH")`. If it still returns
   issues, something changed; go back to step 2.
7. Confirm the outcome: pages published, and remind Adam to open the
   admin preview (`/portal/{propertyId}?tab=report&preview=admin`) for
   the final visual walkthrough on real screens.

## What QA cannot see (Adam's checklist)

The audit checks structure, not truth. Before publishing, remind Adam to
eyeball:

- Photos: pages without images show placeholder heroes; photos are added
  in the app, not through these tools.
- Names and addresses spelled right, the right family, the right house.
- Tier prices he actually stands behind.
- Anything a client would read as a promise.

## Rules

- Publishing is Adam's decision, made explicitly, every time. You never
  publish on inference, momentum, or a stale approval.
- Never weaken content to satisfy QA (deleting a needed page is not a
  fix). Fill gaps or leave the report in draft.
- No em-dashes, word-based condition ratings only, no invented anything.
