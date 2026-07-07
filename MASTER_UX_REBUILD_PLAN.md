# MASTER UX REBUILD PLAN — Prototype Match + MCP Authoring

**Created:** 2026-07-06 (Fable 5 session)
**Status:** CANONICAL execution plan. Supersedes PROTOTYPE_MATCH_PLAN.md workstreams W4–W7 (absorbed below). Does not supersede HCR_STRUCTURE_LOCK.md.

## Governing decisions (from Adam, 2026-07-06)

1. **Everything gets done** — client portal, strategy pages, photos, admin builder visuals, MCP authoring.
2. **Production contains demo data only** — migrations/republishes are low-risk; no real-client safety gates needed yet.
3. **Doc precedence:** `HCR_STRUCTURE_LOCK.md` wins on *structure* (6-tab portal, Bobby naming, 5 chapters). `caldwell_prototype_v2.html` + `caldwell_prototype_screens.pdf` (38 screens, on Desktop one level above repo) win on *page-level visual design*.
4. **Admin Builder must visually match the prototype** (screens 1–20), not just function.
5. **NEW ARCHITECTURE DECISION — Claude-as-author via MCP:** report content authoring moves OUT of the app into Claude (Claude Code / claude.ai with skills), connected to the app via an MCP server. The app's job: enforce the structured schema, render it beautifully, deliver it to clients. In-app AI co-pilot becomes optional assist, not the primary authoring path.

## Root cause recap (why prior attempts failed)

- The wizard's publish step (`WizardContext.tsx`, `pageAuthoringToBlocks()`) flattens structured data (specs, tiers, condition, lifecycle, images) into plain `text` blocks.
- Legacy `BlockRenderer.tsx:313-336` renders narrative `string[]` as bare `<p>` tags → wall of text.
- The styled template components (`RoomTemplatePage`, `SystemTemplatePage`, `VisionTemplatePage`) and 27 typed blocks (`ReplacementBriefingBlock`, `ConditionRatingBlock`, etc.) already exist but receive empty/flattened data.
- Already-published rows in Supabase (`vvwojahsianpmwjvkunn`) contain flattened content — component fixes alone change nothing visible. **Every phase below ends with republished data + visual verification, not just merged code.**

---

## PHASE 0 — Runtime truth + baseline (½ session)

1. Pull live `reports.blocks_json` + `report_pages` rows for the demo report; record which render path each page actually hits.
2. Run app locally; screenshot 6 representative pages (portal home, report home, room, system, vision, strategy) side-by-side with prototype screens 21–32.
3. Produce a per-screen QA checklist (all 38 screens) that later phases check off.

**Exit:** documented baseline; checklist committed as `docs/VISUAL_QA_CHECKLIST.md`.

## PHASE 1 — Structured content contract (1 session) ⭐ root cause

The single source of truth for what a page IS. Everything else (wizard, MCP, renderers) conforms to it.

1. Define zod schemas per page type (Room / System / Appliance / Vision / Generic / Strategy pages) covering: specs, finishes, fixtures, condition_rating, lifecycle (age/lifespan/EOL), tiers (essential/enhanced/signature + recommended flag), key_observations, risks, maintenance, linked vision projects, images, narrative-as-observations.
2. Fix publish pipeline: wizard writes structured columns + typed blocks; NEVER flat text for structured page types.
3. Add a publish-time validation gate: a page that would render as ≥3 consecutive bare paragraphs fails QA with a specific error.
4. Kill the legacy client-facing path: `ReportTab` always routes to templates; legacy `string[]` narratives are auto-upgraded to observation sections at read time.

**Exit:** republish demo report → structured rows verified in DB; no client page renders via legacy BlockRenderer.

## PHASE 2 — Client report pages match prototype (1–2 sessions)

Match screens 23–28 exactly. Files: `src/components/report/templates/*`, `ReportChapterNav.tsx`, `ReportHome.tsx`.

- **Report Home** — "Read by chapter" section cards (screen 23) with page counts + Open buttons; "How this report stays alive" callout.
- **Room pages** (screen 24) — eyebrow (`SPACES · KITCHEN & PANTRY`), Cormorant title, metadata strip (dims · sqft · ceiling · floor), condition dot, FINISHES grid, FIXTURES & POWER grid, OBSERVATIONS prose, "Not yet documented" italics for empty fields, LINKED VISION PROJECT callout, CONCIERGE ACTION callout.
- **System pages** (screens 25–26) — spec grid (make/model/serial/installed/lifespan/age), lifecycle gradient timeline bar, PROACTIVE LIFECYCLE ALERT amber callout, REPLACEMENT BRIEFING navy card with 3 tier cards (Essential/Enhanced/Signature, recommended highlighted).
- **Vision pages** (screens 27–28) — navy hero with badges, THE VISION prose, WHY DESIGN MATTERS FIRST gold-left-border callout, INVESTMENT RANGES 3-tier cards with RECOMMENDED pill, HOW WE EXECUTE navy-left-border callout (AK Renovations transparency language).
- **Navigation** — keep 6-tab structure (structure lock) but style report chapter nav + sidebar to prototype: cream left rail, gold active markers, mono uppercase eyebrows.

**Exit:** side-by-side screenshots match screens 23–28; QA checklist items ticked.

## PHASE 3 — Strategy pages (1 session) [absorbs W5+W6]

- **Recurring Services Register** (screens 29–30): three stat cards (Total monthly / Active services / Overdue), navy HBC Concierge pitch card with CTA, vendor table (SERVICE | VENDOR | FREQUENCY | NEXT DUE | $/MO) with overdue rows flagged rust.
- **Strategy & Roadmap / Your 10-Year Plan** (screens 31–32): Defense/Offense/Expansion phase cards with colored top borders, 10-year capital plan Gantt (time-based stops, never summed), phase cost-range footer row.
- **Maintenance Calendar**: 4-season grid.

**Exit:** demo data renders all three; matches screens.

## PHASE 4 — Photos + media (½–1 session) [absorbs W7]

- Wire `categorize-photo` → `report_pages.images`; hero image per page; masonry gallery.
- Portal Home media cards: Hover 3D + iGUIDE 360 embeds (screen 21).

**Exit:** every featured demo page has images; portal home hero + media cards match screen 21.

## PHASE 5 — Admin Builder visual match (1–2 sessions)

Match screens 1–20. Function exists; this is a reskin + layout pass of `WizardShell`, step components, `SideBySideEditor`, `AICoPilotPanel`.

- Navy full-height left rail: BUILDING REPORT eyebrow, property name in Cormorant, address, numbered step list with gold active state + check marks, "Auto-saving every 30 seconds" footer.
- Step headers: `STEP N OF 5` mono gold eyebrow + Cormorant title + divider.
- Step 1 Intake: 6 upload cards in 2-col grid, UPLOADED/AUTO-FETCHED pills, file summary chips, "READY TO ANALYZE / Run AI Analysis →" band, ANALYZING checklist, "What the AI Found" review band (screens 1–4).
- Step 2 TOC: 4 section summary cards, per-section checkbox card grids, Approve & Author Pages CTA (screens 5–7).
- Step 3 Authoring: pages rail with status dots, ADMIN VIEW / CLIENT PREVIEW split with SYNCED LIVE tag, AI CO-PILOT ACTIVE chip + dark co-pilot panel with one-tap actions + RESULT area, "N of M reviewed / Mark Reviewed" header (screens 8–15).
- Step 4 Strategy: sequencing cards + editable capital plan grid (screens 16–19).
- Step 5 Publish: three stat cards, final-preview band, "What happens when you publish" numbered list (screen 20).

**Exit:** admin wizard screenshots match screens 1–20.

## PHASE 6 — MCP authoring bridge (2 sessions) 🆕

Claude (Code or claude.ai) authors report content; app renders it.

**6a. MCP server** (Supabase edge function, streamable HTTP, token-auth to Adam's creator account; every write audited to `mcp_activity` table):

- `list_properties`, `get_report(report_id)`, `get_page(page_key)`
- `create_report(property)` / `propose_toc(pages[])`
- `upsert_room_page(structured fields per Phase 1 schema)`
- `upsert_system_page(...)`, `upsert_appliance_page(...)`
- `upsert_vision_project(tiers, vision, execution)`
- `set_capital_plan(phases, gantt entries)`, `set_recurring_services(rows)`, `set_maintenance_calendar(seasons)`
- `attach_image(page_key, storage_path)` + `upload_image` (base64 → storage bucket)
- `run_publish_qa()` → returns checklist results; `publish_report()` (explicit, confirmed)
- All writes validate against the Phase 1 zod schemas server-side → Claude physically cannot create a wall of text.

**6b. Claude skills** (authored with Adam, iterated in real use):

- `hcr-intake` — ingest transcript/notes/photos/Hover/iGUIDE links → findings summary + proposed TOC
- `hcr-author-space`, `hcr-author-system`, `hcr-author-vision` — one page at a time, Adam's voice rules baked in, writes via MCP
- `hcr-strategy` — capital plan, services register, maintenance calendar
- `hcr-publish-qa` — runs QA tool, fixes gaps, hands to Adam for publish
- Workflow: Adam has a conversation with Claude (walkthrough debrief), Claude writes pages through MCP, Adam reviews in the app's admin preview, publishes in-app.

**6c. App-side:** wizard remains as the review/edit/QA surface; in-app AI drafting stays but demoted to "assist" (cheaper to maintain, no longer the critical path).

**Exit:** full Caldwell-style report authored end-to-end from a Claude conversation, rendered perfectly in the portal.

## PHASE 7 — Migration, QA, polish (1 session)

- One-time upgrade script for any remaining flattened demo rows (backup first).
- Full 38-screen visual QA pass; fix diffs.
- Polish: cream shimmer skeletons (prototype defines the CSS), fade-in transitions, mobile pass on report templates (single-column grids, sticky chapter nav, 44px targets).

## PHASE 8 — Beyond-prototype upgrades (optional backlog, post-match)

1. Top Priorities strip on Report Home (3–5 items, condition + $ range).
2. "What changed since your last visit" feed (the evolving-record retention story).
3. Contextual Bobby actions on every overdue service / aging system / vision project (pre-filled).
4. PDF export via existing `@react-pdf/renderer` dep.
5. Report-wide search (cmd-k) across pages.
6. Client engagement analytics (which pages get read).

---

## Sequencing rationale

Phase 1 (schema) unblocks everything: Phases 2–5 render it, Phase 6 writes to it. MCP (6) intentionally comes after rendering (2–4) so authored content is immediately visible — but 6a's tool design should be reviewed against the Phase 1 schema at the end of Phase 1 to avoid rework. If Adam wants to start authoring with Claude sooner, Phase 6 can run in parallel after Phase 2.

## Standing rules for every session

- End each phase with: republished demo data + screenshots vs prototype + checklist updates. Merged code without visible change = not done.
- Palette/typography locked per `HCR_STRUCTURE_LOCK.md` (navy #0A1628, gold #B87333, cream #EDE9E1, rust #B7410E; Cormorant/Inter/IBM Plex Mono).
- Eyebrow pattern (gold mono uppercase + Cormorant navy title) on every section.
- Word-based condition ratings only; no numeric health scores.
- Approved Supabase ref: `vvwojahsianpmwjvkunn`. Never `abarpsxwglxuessimrkk`.
