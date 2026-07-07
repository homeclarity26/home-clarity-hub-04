# Visual QA Checklist — Caldwell Prototype (38 screens)

Source of truth: `caldwell_prototype_screens.pdf` (Desktop, one level above repo) + `caldwell_prototype_v2.html` (repo root).
Status: ☐ not started · ◐ built, needs diff · ✅ matches prototype

## Admin Builder (screens 1–20) — Phase 5

| # | Screen | Key elements to match | Status |
|---|---|---|---|
| 1 | Step 1 Intake (empty) | Navy step rail w/ numbered steps + gold active, 6 upload cards 2-col, AUTO-FETCHED pill on Property Records, "Auto-saving every 30 seconds" footer | ✅ 2026-07-07 headless-Chrome diff vs proto_01 (`?scenario=wizard-step1-empty`). Intentional addition: Client & Property form card above the upload grid (functional prerequisite the prototype assumes already done) |
| 2 | Step 1 (after uploads) | UPLOADED pills, file summary chips, "READY TO ANALYZE / Run AI Analysis →" band | ◐ UPLOADED pills + gold-edged file chips verified in `wizard-step1` scenario; READY TO ANALYZE band built (shows when intake exists and findings don't) but no fixture captures that intermediate state |
| 3 | Step 1 (analyzing) | ANALYZING checklist with progressive dots | ☐ ANALYZING checklist built (pulsing dots) but it is transient client state during the live edge-function call; no fixture |
| 4 | Step 1 (findings) | "What the AI Found" band + Approve & Build TOC CTA + findings cards | ✅ 2026-07-07 diff vs proto_04 (`?scenario=wizard-step1`). REVIEW & APPROVE eyebrow + Cormorant heading + navy CTA + 6 findings cards |
| 5–7 | Step 2 TOC | 4 section summary cards, checkbox card grid per section, section counts, Approve & Author Pages CTA | ✅ 2026-07-07 diff vs proto_05-07 (`?scenario=wizard-step2`). Titles use colon instead of em-dash (ban). Extra select-all/defaults/clear helpers + featured star retained from functional wizard |
| 8 | Step 3 Kitchen (side-by-side) | Pages rail w/ status dots, ADMIN VIEW / CLIENT PREVIEW split, SYNCED LIVE tag, AI CO-PILOT ACTIVE chip, field groups (ROOM IDENTITY / DIMENSIONS & SPECS / FINISHES) | ◐ 2026-07-07 diff vs proto_08 (`?scenario=wizard-step3`). Rail/top bar/split/chips/condition segmented control match; field groups are the wizard's generic set (NARRATIVE / OBSERVATIONS / LIFECYCLE / ADMIN NOTES), not per-type ROOM IDENTITY / DIMENSIONS & SPECS / FINISHES (structured per-type editors are a follow-up) |
| 9 | Step 3 Primary Bathroom | Same as 8 + LINKED VISION PROJECT card in preview | ◐ Same layout verified; LINKED VISION PROJECT preview card not built (generic preview) |
| 10–11 | Step 3 Furnace | IDENTIFICATION / LIFECYCLE groups, condition segmented control, PHOTOS (REQUIRED) w/ REQUIRED pill, lifecycle timeline + alert in preview | ◐ Condition segmented control (navy active) + LIFECYCLE group match; IDENTIFICATION / PHOTOS (REQUIRED) groups and lifecycle timeline preview need the per-type system editor (follow-up) |
| 12 | Step 3 Co-Pilot response | REPLACEMENT BRIEFING PACKAGE field group, dark co-pilot panel w/ one-tap actions + RESULT | ◐ Dark navy panel, gold AI CO-PILOT eyebrow, WATCHING YOUR EDITS chip, gold primary chip + outline chips, RESULT area w/ mono eyebrow all built; RESULT needs a live reply (no fixture); REPLACEMENT BRIEFING PACKAGE group not built |
| 13–14 | Step 3 Vision Primary Bath | Tier price list (Essential/Enhanced/Signature), EXECUTION PATH card, co-pilot actions | ◐ Vision pages render through the generic editor; tier list + EXECUTION PATH admin groups are the per-type editor follow-up |
| 15 | Step 3 Executive Summary | WELCOME note field, TOP THEMES field, navy preview hero + pull-quote + Five themes | ◐ Exec summary renders through the generic narrative editor (observations/lifecycle suppressed per type); WELCOME/TOP THEMES split + navy hero preview not built |
| 16–19 | Step 4 Strategy | DEFENSE→OFFENSE→EXPANSION sequencing cards (colored top borders), 10-year capital plan grid | ✅ 2026-07-07 diff vs proto_16-19 (`?scenario=wizard-step4`). Rust/gold/navy top borders, YEAR eyebrows, gold-bar year grid. Editable plan rows + services/calendar editors retained below (functional wizard surface the prototype doesn't show) |
| 20 | Step 5 Publish | 3 stat cards (89/6/28), final-preview band, "What happens when you publish" numbered list | ✅ 2026-07-07 diff vs proto_20 (`?scenario=wizard-step5`). Counts reflect fixture (35/4/9); publish CTA uses real client name ("Publish to the Caldwells"); what-happens list rewritten to match the actual publish sequence (no promised features) |

## Client Portal (screens 21–34) — Phases 2–4

| # | Screen | Key elements to match | Status |
|---|---|---|---|
| 21–22 | Portal Home | Full-bleed hero w/ gradient + family name + address chip, YOUR HOME ALWAYS AVAILABLE media cards (3D + 360), Bobby bar bottom | ☐ |
| 23 | Report Home | "Read by chapter" Cormorant title, section cards w/ page counts + Open buttons, "How this report stays alive" callout | ✅ 2026-07-07 headless-Chrome diff vs proto_23. Intentional deviations per structure lock: 5 chapters (prototype shows 4), Cover/Twin toggle + HCR logo retained from app shell |
| 24 | Room: Kitchen | Eyebrow SPACES · KITCHEN & PANTRY, metadata strip (18×22 · 396 sqft · 10ft · Floor 1), EXCELLENT dot, FINISHES 2-col grid, FIXTURES & POWER grid, OBSERVATIONS prose, "Not yet documented" italics, LINKED VISION PROJECT callout, CONCIERGE ACTION callout | ✅ 2026-07-07 headless-Chrome diff vs proto_24. Copy uses colon/comma where prototype used em-dash (em-dash ban) |
| 25–26 | System: Furnace | FAIR dot + APPROACHING END-OF-LIFE pill, spec grid, lifecycle gradient bar (2009 → Today · 17 years → EOL ~2029), PROACTIVE LIFECYCLE ALERT amber callout, REPLACEMENT BRIEFING navy card w/ 3 tier cards | ✅ 2026-07-07 headless-Chrome diff vs proto_25/26. Title uses colon (em-dash ban); prices hyphen-formatted |
| 27–28 | Vision: Primary Bath | Navy hero w/ LIFESTYLE + YEAR 1-2 pills, THE VISION prose, WHY DESIGN MATTERS FIRST gold callout, INVESTMENT RANGES 3 tiers w/ RECOMMENDED pill, HOW WE EXECUTE navy callout (AKR disclosure) | ✅ 2026-07-07 headless-Chrome diff vs proto_27/28. Title uses colon (em-dash ban); prices hyphen-formatted |
| 29–30 | Recurring Services | H1 "Everything you're paying for, in one place", 3 stat cards ($1,918 / 20 / 9 overdue), navy HBC Concierge pitch card + gold CTA, vendor table w/ overdue rows flagged | ✅ 2026-07-07 headless-Chrome diff vs proto_29/30. Intentional deviations: intro/Concierge copy uses colon/semicolon (em-dash ban); Concierge body rewritten to honest time-not-money framing per locked pricing principle ("AI Concierge" → Bobby per naming lock); table is flat (per target PNGs) rather than category-grouped |
| 31–32 | Strategy & Roadmap | "Your 10-Year Plan", Defense/Offense/Expansion cards w/ colored top borders, capital plan Gantt w/ phase cost footer | ✅ 2026-07-07 headless-Chrome diff vs proto_31/32. Long Gantt bar labels clip at first-year cell (prototype clips mid-word too); no grand total anywhere per locked rule |
| 33 | Concierge panel (open) | Slide-over panel, "Trained on the Caldwell home", 5 demo prompt buttons | ☐ |
| 34 | Concierge response | User prompt echo + navy CONCIERGE reply bubble w/ action confirm | ☐ |

## Cover Sheet (screens 35–38) — informational (prototype meta-pages; no app equivalent required)

| # | Screen | Notes | Status |
|---|---|---|---|
| 35–38 | Cover sheets | Design-system reference only (palette swatches, typography, next steps). Verify tokens match: navy #0A1628, gold #B87333, cream #EDE9E1, rust #B7410E; Cormorant/Inter/IBM Plex Mono | ✅ tokens verified 2026-07-06 |

## Cross-cutting rules (every screen)

- Eyebrow pattern: gold mono uppercase label + navy Cormorant title
- No em-dashes in client copy
- No inline hex — tokens only
- Word-based condition ratings only
- Expanding containers on all prose (no fixed heights/clamps)
- 44px touch targets
