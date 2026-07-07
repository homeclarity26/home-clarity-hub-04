# Visual QA Checklist — Caldwell Prototype (38 screens)

Source of truth: `caldwell_prototype_screens.pdf` (Desktop, one level above repo) + `caldwell_prototype_v2.html` (repo root).
Status: ☐ not started · ◐ built, needs diff · ✅ matches prototype

## Admin Builder (screens 1–20) — Phase 5

| # | Screen | Key elements to match | Status |
|---|---|---|---|
| 1 | Step 1 Intake (empty) | Navy step rail w/ numbered steps + gold active, 6 upload cards 2-col, AUTO-FETCHED pill on Property Records, "Auto-saving every 30 seconds" footer | ☐ |
| 2 | Step 1 (after uploads) | UPLOADED pills, file summary chips, "READY TO ANALYZE / Run AI Analysis →" band | ☐ |
| 3 | Step 1 (analyzing) | ANALYZING checklist with progressive dots | ☐ |
| 4 | Step 1 (findings) | "What the AI Found" band + Approve & Build TOC CTA + findings cards | ☐ |
| 5–7 | Step 2 TOC | 4 section summary cards, checkbox card grid per section, section counts, Approve & Author Pages CTA | ☐ |
| 8 | Step 3 Kitchen (side-by-side) | Pages rail w/ status dots, ADMIN VIEW / CLIENT PREVIEW split, SYNCED LIVE tag, AI CO-PILOT ACTIVE chip, field groups (ROOM IDENTITY / DIMENSIONS & SPECS / FINISHES) | ☐ |
| 9 | Step 3 Primary Bathroom | Same as 8 + LINKED VISION PROJECT card in preview | ☐ |
| 10–11 | Step 3 Furnace | IDENTIFICATION / LIFECYCLE groups, condition segmented control, PHOTOS (REQUIRED) w/ REQUIRED pill, lifecycle timeline + alert in preview | ☐ |
| 12 | Step 3 Co-Pilot response | REPLACEMENT BRIEFING PACKAGE field group, dark co-pilot panel w/ one-tap actions + RESULT | ☐ |
| 13–14 | Step 3 Vision Primary Bath | Tier price list (Essential/Enhanced/Signature), EXECUTION PATH card, co-pilot actions | ☐ |
| 15 | Step 3 Executive Summary | WELCOME note field, TOP THEMES field, navy preview hero + pull-quote + Five themes | ☐ |
| 16–19 | Step 4 Strategy | DEFENSE→OFFENSE→EXPANSION sequencing cards (colored top borders), 10-year capital plan grid | ☐ |
| 20 | Step 5 Publish | 3 stat cards (89/6/28), final-preview band, "What happens when you publish" numbered list | ☐ |

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
