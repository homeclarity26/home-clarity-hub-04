# HCR_STRUCTURE_LOCK.md

**Status:** CANONICAL — supersedes all prior structural specs.
**Locked:** 2026-05-03
**Owner:** Adam Kilgore
**Reads with:** `caldwell_prototype_v2.html` (visual reference)

---

## Read this first

This document is the **single source of truth** for the structure of the Home Clarity Report (HCR), the Home Clarity Hub portal (HCH), and the admin tools that produce them. Where this document conflicts with anything else — including `CLAUDE.md`, the older `HCR_Master_Spec_*.md` files, prior PR descriptions, or any "C12 6-tab consolidation" decisions — **this document wins.**

Any future Claude Code (or human) session that touches HCH/HCR structure reads this file before writing any code. If a feature you're asked to build conflicts with this doc, stop and surface the conflict to Adam. Do not improvise.

The visual reference is `caldwell_prototype_v2.html` (in repo root). When this document defines a structural rule, the prototype shows what it looks like.

---

## Naming (locked)

- **Home Clarity Hub** (HCH) — replaces "Client Portal," "Home OS," "Home OS Dashboard" everywhere homeowner-facing
- **Home Clarity Report** (HCR) — the $4,500 deliverable. Name stays.
- **Bobby** — replaces "Concierge" everywhere homeowner-facing. Name stays.
- Internal code keeps `hch` prefix.

---

## The 5 Chapters (locked)

Every HCR has exactly **five chapters**, in this order:

1. **Information**
2. **Interior Spaces**
3. **Exterior Spaces**
4. **Systems & Appliances**
5. **Strategy**

There is no "Safety" chapter. There is no "Exterior" or "Interior" chapter alone. Safety belongs inside Systems & Appliances. Spaces are split into Interior vs. Exterior.

### Chapter 1 — Information (6 pages)

- Welcome Letter from Adam
- Executive Summary
- Your Home At-a-Glance (specs, permits, sales history)
- Project Vision Inventory (everything the family mentioned)
- Top Priorities (3–5 highest-priority items)
- How to Use This Report (navigation guide)

### Chapter 2 — Interior Spaces

Every room *inside* the home. One flat list of pages, ordered logically.
**Page template:** Room.

### Chapter 3 — Exterior Spaces

Roof, siding, windows, doors, gutters, deck/patio, driveway, landscape, foundation, exterior structures.
**Page template:** Room.

### Chapter 4 — Systems & Appliances

HVAC, water, electrical, safety (smoke/CO/security/fire ext./radon), plus every major appliance.
**Page templates:** System for systems, Appliance for appliances.

### Chapter 5 — Strategy

5 standing pages plus one page per Vision Project.

**Standing pages:**
- Recurring Services Register
- 10-Year Capital Plan
- Maintenance Calendar
- Sequencing & Dependencies (Defense → Offense → Expansion)
- How We Work With You Going Forward

**Plus:** one page per Vision Project (with Essential / Enhanced / Signature tiers).

---

## Page Templates (locked)

A page is **not** a flat list of blocks. Every page is one of these 5 templates with named regions pulling from `report_pages` columns.

### Template A — Room

Used for: Interior Spaces, Exterior Spaces.
Component: `RoomRecordBlock.tsx` as page-level shell.

```
HERO IMAGE (full-width, 280px tall, gradient overlay)
EYEBROW: Spaces · {group}
TITLE: {room name}
METADATA: dims · sqft · ceiling · floor
CONDITION DOT
─────────────────────────────────────
FINISHES (4-col desktop / 2-col mobile)
─────────────────────────────────────
FEATURES (bulleted list)
─────────────────────────────────────
NOTES (long-form, AI-Expand button)
─────────────────────────────────────
MAINTENANCE NOTES
─────────────────────────────────────
LINKED VISION PROJECTS
```

### Template B — System

Used for: HVAC, water, electrical, safety pages.
Component: `SystemRecordBlock.tsx` + `ReplacementBriefingBlock.tsx` when applicable.

```
PHOTO + SERIAL PLATE (split: photo left, plate right)
EYEBROW: Systems · {category}
TITLE: {system name}
─────────────────────────────────────
SPEC ROW (5–6 cols): Make | Model | Serial | Installed | Lifespan | Status
─────────────────────────────────────
LIFESPAN BAR
─────────────────────────────────────
CONDITION + STATUS NOTES
─────────────────────────────────────
REPLACEMENT BRIEFING CARD (if approaching EOL)
─────────────────────────────────────
MAINTENANCE SCHEDULE
```

### Template C — Appliance

Same component as System. Simpler density. No Replacement Briefing by default. Lifespan bar optional.

### Template D — Vision Project

Used for: Strategy chapter, vision pages only.
Component: `VisionProjectBlock.tsx` as page-level shell.

```
ASPIRATIONAL IMAGE (the "after" rendering, 280px)
EYEBROW: Strategy · Vision · {priority window}
TITLE: {project name}
─────────────────────────────────────
PROJECT METADATA (priority, category, est. timing)
─────────────────────────────────────
THREE TIER CARDS — side-by-side, equal height:
  ┌───────────┐ ┌───────────┐ ┌───────────┐
  │ ESSENTIAL │ │ ENHANCED  │ │ SIGNATURE │
  │ Good      │ │ Better    │ │ Best      │
  │ $X – $Y   │ │ $X – $Y   │ │ $X – $Y   │
  │ scope...  │ │ scope...  │ │ scope...  │
  └───────────┘ └───────────┘ └───────────┘
─────────────────────────────────────
SEQUENCING NOTES (dependencies)
─────────────────────────────────────
LINKED ROOMS
```

The three tier cards are **non-negotiable**. Always 3, always side-by-side on desktop, always Essential/Enhanced/Signature with Good/Better/Best price ranges. Data lives in `page.tiers` JSON (an array of 3 tier objects).

### Template E — Generic

Used for: Information chapter only.
Component: existing `SharedBlockRenderer` flat grid.

The flat block-grid pattern dies for every other template. Information pages only.

---

## Portal Navigation (locked)

Single-page React app with persistent left sidebar (220px desktop, drawer on mobile) + main content + persistent Bobby surface at bottom of every screen.

### 6 sidebar tabs (in this exact order)

1. **Home** — Portal Home dashboard (NOT the report)
2. **Report** — Report Home with 5 chapter cards + Twin View toggle
3. **Schedule** — Service requests, upcoming maintenance, **Recurring Care section**, calendar view
4. **Projects** — Active renovation projects, photos, status. **KEEP**
5. **Payments** — Stripe-powered invoice and subscription payment. **KEEP**
6. **Documents** — Central vault. **REPLACES Contacts.** Trade partners surface contextually elsewhere.

### Within the Report tab

- **Default view = Cover view:** chapter cards on magazine-cover layout per `caldwell_prototype_v2.html` lines 2389+
- **Toggle = Twin view:** 2D floor plan; tap room → that room's report page
- Click chapter card → see that chapter's pages in sub-nav
- Click page → render with appropriate Page Template (A/B/C/D/E)
- Each page has prev/next arrows

---

## Portal Home (locked)

Layout top to bottom:

1. **Hero photo** with gradient overlay + family name in display font + address
2. **Pinned "Ask Bobby" input bar** — directly under hero. Tap = full Bobby panel opens.
3. **Today's Brief** — top 3 actionable items
4. **What Changed feed** — recent updates
5. **Media cards (paired assets)** — 2-col desktop, stacked mobile:
   - Hover.to 3D model (URL + PDF download)
   - iGUIDE 360° tour (URL + PDF floor plans download)
6. **Small media cards** — Welcome video, Hover Measurement Report
7. **"What HCH does for you"** — 6-card benefit grid (Bobby / Digital Twin / Concierge / Recurring Care / Document Vault / Project Tracking). Marketing framing only — links to relevant tab.
8. **Quick links** — 4 cards: Open my report, Recurring services, 10-year roadmap, Vision projects

---

## Bobby (locked)

Backend (~200 tools, hybrid Claude Sonnet 4.6 + Gemini 2.5, pgvector RAG) is **solid and not part of this rebuild**. Only UX surface and persistence layer rebuilt.

### Two entry points, one persistent thread

1. **Pinned "Ask Bobby" input** at top of Portal Home (premium feel, primary entry)
2. **Floating ConciergeBar** at bottom of every screen (always-available, secondary entry)

Both open the same `AskBobbyPanel`. Both show the same persistent thread. Messages survive across sessions, devices, topics.

### Visual treatment

Per `caldwell_prototype_v2.html` lines 2816–2880:
- Gold "B" avatar (rebrand from "HC")
- "Ask Bobby anything" headline
- Slide-in panel from right at 420px desktop, full-width mobile
- Suggested prompts at top of fresh thread
- Message thread with Bobby/User differentiated visually
- Eyebrow pattern on all section headings

### New schema

- `bobby_threads` — one row per homeowner. Persistent.
- `bobby_messages` — `{thread_id, sender (user | bobby | adam), content, status (pending | sent | escalated | resolved), action_taken, created_at}`
- `escalation_queue` — Admin view. Rows where Bobby couldn't resolve.

### Admin side

- `BobbyEscalationQueue` page on admin side. Pending escalations with full client context.
- Adam responds inline. Response appears in homeowner's thread tagged "From Adam."
- Adam can review/edit/approve a Bobby suggestion before sending — workflow for high-stakes responses.

### Notifications

- Push notification to homeowner when Bobby or Adam responds
- Push notification to Adam when something escalates
- Email digest opt-in on either side

---

## Documents (locked)

The Documents tab is a **central vault + context shortcuts** pattern.

### Documents tab — central vault

- **Semantic search** at top, pgvector across all docs
- **Filter chips:** Reports / Proposals / Invoices / Receipts / SOWs / Warranties / Manuals / Permits / Photos / Other
- **Recent uploads** at top
- Each doc: thumbnail, filename, type (auto-classified), date, attached room/system/project, "Ask Bobby about this" button
- Upload via drag-drop (desktop) or photo-snap (mobile)
- Auto-classification on upload via existing edge functions

### Context shortcuts (same files, multiple front doors)

- Hover URL+PDF, iGUIDE URL+PDF, floor plans, welcome video → paired cards on Portal Home
- Warranties + manuals → on each appliance/system page in Systems & Appliances
- Scopes of Work + project photos → inside Projects tab (per project)
- Invoices + receipts → inside Payments tab
- HCR PDFs + addendums → on Report cover

A document uploaded once is searchable in the vault AND appears wherever it logically belongs.

### Trade partners — out of nav, into context

- Bobby/Concierge recommends them when asked
- Each scheduled service in Schedule tab shows the vendor
- Each appliance/system page can show "Recommended vendors" for service
- Strategy chapter's Recurring Services Register lists them

Trade partners are not a phone-book to browse.

---

## Schedule + Recurring Care (locked)

The Schedule tab has two sections:

1. **Calendar view** — upcoming services, maintenance, project milestones
2. **Recurring Care section** — first-class subsection

### Recurring Care section

- Vendor list with photo, frequency, last visit, next visit, cost, total spent YTD
- One-tap rebook for the same vendor at the same cadence
- Auto-reminders before each visit
- Each visit attaches to room/system in the digital twin
- Phase 2: integrated Stripe payment per visit

Same data as Strategy chapter's Recurring Services Register. Report view = **plan**. Schedule view = **live management**.

### Vendor source

Recurring Care vendors do NOT need to be HBC trade partners. Homeowner keeps existing cleaner/gardener and tracks them in HCH. Lower friction. HBC trade partners surface as recommendations when the homeowner doesn't have someone yet.

---

## Proactive Notifications (locked)

### Severity types

- **Age-based**: "Your water heater is 9 years old. Want to plan replacement?"
- **Service-overdue**: "HVAC has not been serviced in 14 months. Schedule with Brunner?"
- **Warranty**: "The Bosch dishwasher warranty expires in 60 days."
- **Recall**: "There is an active recall on your model of smoke detector."
- **Seasonal**: "October — gutter cleaning, sprinkler blowout, furnace tune-up, sump pump test."
- **Project-aware**: "You have $42K left in the kitchen budget."

### Surfaces

- **Bell icon** in header with count badge
- **Today's Brief on Portal Home** — top 3 actionable inline
- **Email digest** — opt-in, daily or weekly
- **Push notifications** — opt-in, time-sensitive only
- **Adam-side mirror dashboard** — Adam sees the same notifications

### Schema

- `proactive_alerts` — `{property_id, severity, type, title, body, action, due_date, status (pending | shown | acknowledged | resolved | dismissed), created_at}`

### Frequency capping

Default: max 3 push per week, max 5 email digest items per week. Built-in throttling.

---

## Wizard (5 steps + improvements)

### Step 1 — Intake

- **Paired Asset cards** for Hover and iGUIDE: each has URL field + PDF upload field together. Same fields flow through to Portal Home media cards.

### Step 2 — TOC

- **Toolbar controls:** Select all / Select all in section / Defaults only / Clear all
- Existing per-page checkbox stays.

### Step 3 — Authoring

No structural changes. Page-template selector wires correct template automatically.

### Step 4 — Strategy

No structural changes.

### Step 5 — Publish

- **"Last chance to add anything"** upload bucket above publish button. Same drag-drop pattern as Step 1.
- **Aggregate missing-photo banner:** *"12 items don't have photos yet — they'll show clean placeholders. [Add photos] [Continue]"* — one decision, not 12.
- **Post-publish redirect:** success → `/portal/{propertyId}/report?preview=admin`

---

## AI Co-Pilot (locked) — always available post-publish

### Two front doors, one engine

1. **Admin entry:** persistent "Add to Report" button on `AdminClientDetail`. Mini-wizard: upload → AI proposes page updates and new pages → Adam approves → republished.
2. **Client entry:** "Add to my home" surface in HCH. Client uploads photo, note, or document → goes to Adam's Co-Pilot inbox → Adam reviews/approves/edits → absorbs into report.

### Schema

- `copilot_inbox` — `{property_id, source (client | admin), kind (photo | note | document | request), payload, status (pending | absorbed | rejected), created_at}`
- AI-proposed page edits flow through standard `report_pages` rows with `proposed_by_ai = true` flag, awaiting Adam's approval.

---

## Visual System (locked)

### Color tokens

```
--navy:        #0A1628
--navy-soft:   #1B2B4D
--gold:        #B87333
--gold-light:  #D4A574
--cream:       #EDE9E1
--cream-light: #F5F2EC
--white:       #FFFFFF
--rust:        #B7410E   /* DANGER ONLY */
--text:        #0A1628
--text-muted:  #6B6B6B
--text-subtle: #999999
--border:      #E5E0D6
--border-strong: #C9C2B5
--success:     #2F6E40
--warning:     #B58A1F
--danger:      #B7410E
```

Match `caldwell_prototype_v2.html` lines 14–31.

### Typography

- **Display:** Cormorant Garamond, weights 500/600/700
- **Body:** Inter, weights 400/500/600/700
- **Mono:** IBM Plex Mono, weights 400/500

If any code references "Playfair Display" or "JetBrains Mono", remove.

### Eyebrow pattern (signature visual rhythm)

```html
<div class="font-mono uppercase text-[10px] tracking-[0.12em] text-accent">
  {Section name}
</div>
<h2 class="font-display text-[24px] text-primary">{Title}</h2>
```

Every section uses this. Non-negotiable.

### Status dots — 5-color condition system

- Excellent → `#2F6E40`
- Good → `#5A8A4F`
- Fair → `#B58A1F`
- Poor → `#B7410E`
- Critical → `#8B0000`

8px circle + uppercase mono label inline.

---

## Mobile (locked)

- Test target: iOS Safari first. Android Chrome second.
- PWA installability for v1. Native iOS app deferred.
- All tap targets ≥ 44px.
- Photo capture flow optimized — camera button on Portal Home, AI auto-suggests room/system, one-tap confirm.
- ConciergeBar mobile: full-width drawer, swipe up to expand.
- Sidebar collapses to bottom-tab navigation on mobile.

Phase 9 of the runner does a mobile audit pass on every tab.

---

## Digital Twin Placement (locked)

The Digital Twin is **inside the Report tab as a view toggle**, not a 7th tab.

- Cover view (default) = chapter cards on magazine layout
- Twin view (toggle) = 2D floor plan; tap room → that room's report page

Same data. Two visual entry points. v1 is 2D top-down generated from existing room dimensions. 3D walkthrough deferred to v2.

---

## Group → Chapter Mapping (locked)

| Group ID                  | Chapter             |
|---------------------------|---------------------|
| `information`             | Information         |
| `interior-living`         | Interior Spaces     |
| `interior-bedrooms`       | Interior Spaces     |
| `interior-bathrooms`      | Interior Spaces     |
| `interior-utility`        | Interior Spaces     |
| `interior-unfinished`     | Interior Spaces     |
| `interior-additional`     | Interior Spaces     |
| `exterior`                | Exterior Spaces     |
| `exterior-structures`     | Exterior Spaces     |
| `systems-hvac`            | Systems & Appliances|
| `systems-mechanical`      | Systems & Appliances|
| `systems-additional`      | Systems & Appliances|
| `safety-detection`        | Systems & Appliances|
| `appliances`              | Systems & Appliances|
| `strategy`                | Strategy            |

---

## What is OUT (do not build in v1)

- ❌ Six-chapter monograms (ES/EX/IN/SY/SP/SA). Deprecated.
- ❌ "Safety" as its own chapter
- ❌ "Strategic Plan" chapter name. It's "Strategy."
- ❌ Endless-scroll page rendering for any template except Generic
- ❌ "Spaces" as a single combined chapter
- ❌ Autopilot — held for v2
- ❌ 3D walkthrough scan — phase 2
- ❌ Paint colorimeter hardware
- ❌ Native iOS app
- ❌ iOS Share Sheet integration
- ❌ Voice input on mobile
- ❌ Email forwarding for vendor docs — phase 2
- ❌ Spend/budget intelligence in notifications — phase 2
- ❌ Trade Partners portal upgrades
- ❌ Realtors portal
- ❌ Health Score 0–100 system — fully killed

---

## What changes in CLAUDE.md (handled by PR #0 in runner)

- Add "Source of truth" callout at top pointing to this file
- Replace "ES/EX/IN/SY/SP/SA" chapter monogram references with the 5-chapter system
- Update "C12 6-tab consolidation" reference to note Documents replaces Contacts
- Insert this file at #1 of source-of-truth document list
