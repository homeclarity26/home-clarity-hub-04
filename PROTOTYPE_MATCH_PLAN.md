# Prototype Match Plan

**Created:** 2026-05-04
**Status:** Active
**Problem:** The client portal does not match the v2 prototype. The report tab renders all pages as a flat text scroll instead of structured per-page templates. The portal home is missing its hero photo, has wrong greeting text, and uses iframes instead of thumbnail cards for 3D/360 embeds. Internal documents (transcripts, site notes) leak to the client Documents tab. Photos uploaded during intake never reach report pages.

**Root cause:** The wizard's publish pipeline (`pageAuthoringToBlocks()` in WizardContext.tsx) flattens all structured data to `text` ReportBlocks. The portal's ReportTab has per-page navigation and template routing already built (RoomTemplatePage, SystemTemplatePage, VisionTemplatePage) but they are bypassed because `PortalBlockViewer` (endless scroll) intercepts when `reports.blocks_json` has content (line 158 of ReportTab.tsx). Even when templates render, they receive no structured data (specs, tiers, condition_rating, images) because the publish pipeline doesn't write it.

---

## Workstream 1: Stop Internal Docs Leak (TODAY)

**Files:** `src/components/admin/wizard/Step5Publish.tsx`
**Effort:** 15 minutes

The publish flow at lines 216-276 migrates ALL intake files (transcripts, site notes, photos, Hover, iGUIDE) into `client_files`, making raw discovery call recordings and walkthrough notes visible on the client's Documents tab.

**Fix:** Filter the `allIntakeFiles` array to exclude `transcript` and `site_notes` categories. Only Hover, iGUIDE, and published photos should reach `client_files`.

---

## Workstream 2: Portal Home Fixes (TODAY)

**Files:** `src/components/portal/home/PortalHome.tsx`, `src/components/portal/PropertyHero.tsx`
**Effort:** 1-2 hours

### 2a. Hero Photo
PropertyHero already supports `heroImageUrl` with full-bleed photo + gradient overlay. The Caldwell property just needs `hero_image_url` set in the `properties` table. The component works correctly when the URL is provided.

**Fix:** Ensure the wizard intake collects/sets `hero_image_url` on the property. For now, manually set Caldwell's hero photo URL via SQL or admin UI.

### 2b. Greeting Shows Creator Email
When Adam previews as admin (`?preview=admin`), `user_metadata.full_name` returns his email. The prototype shows the property name ("The Caldwell Residence") overlaid on the hero, not a greeting with email.

**Fix:** In admin preview mode, use `propertyName` for the hero title, not the logged-in user's name. The `isAdminPreview` prop already exists.

### 2c. "28" Truncated Text
The "28" is likely a truncated yearBuilt or address value. Need to trace what `propertyAddress` resolves to for the Caldwell property.

### 2d. 3D/360 Cards — iframes vs Thumbnails
The EmbedBlocks (HoverEmbedBlock, IGuideEmbedBlock) render responsive iframes. The prototype shows static thumbnail images with "3D" / "360°" badges that open the full URL on click.

**Fix:** Change EmbedBlocks to render clickable thumbnail cards instead of iframes. Use a static preview image (screenshot or placeholder) with a badge overlay. Clicking opens the URL in a new tab.

### 2e. Section Label
Current: "Your home, in 3D" + "TOUR ANYTIME". Prototype: "YOUR HOME, ALWAYS AVAILABLE" in gold mono caps.

**Fix:** Update the section label text in PortalHome.tsx.

---

## Workstream 3: Report Per-Page Navigation (TODAY)

**Files:** `src/components/tabs/ReportTab.tsx`
**Effort:** 30 minutes

### The Bug
Line 158: `if (hasBlocks && !activePageId)` renders `PortalBlockViewer` (endless text scroll) whenever `reports.blocks_json` has content and no page is selected. The wizard always writes blocks_json, so this path always fires.

Below at line 597, `ReportHome` (the chapter-card landing page with per-page navigation) is ready but never reached.

**Fix:** Change line 158 to:
```typescript
if (hasBlocks && !activePageId && !hasRealPages) {
```
This makes PortalBlockViewer a fallback only for legacy reports that lack per-page data. Reports with `report_pages` rows go to ReportHome → per-page template views.

### Template Routing Already Works
`pickTemplate()` at line 38 maps group IDs to templates. `RoomTemplatePage`, `SystemTemplatePage`, `VisionTemplatePage` are imported and routed at lines 183-271. Once the PortalBlockViewer bypass is fixed, per-page navigation activates immediately.

---

## Workstream 4: Structured Report Templates (FOLLOW-UP SESSION)

**Files:** Multiple (publish pipeline + template renderers + wizard data collection)
**Effort:** 8-12 hours across multiple PRs

### The Problem
Templates exist but receive empty structured data. The wizard's `pageAuthoringToBlocks()` converts all content to flat `text` blocks. Report pages need:
- `specs` (JSON) — dimensions, finishes, appliances, plumbing fixtures
- `tiers` (JSON) — Essential/Enhanced/Signature price ranges + descriptions
- `condition_rating` (string) — Excellent/Good/Fair/Poor/Critical
- `images` (string[]) — photo URLs per page

### Sub-tasks

**4a. Publish Pipeline: Write Structured Data**
- Modify Step5Publish.tsx to write `specs`, `tiers`, `condition_rating`, `images` to `report_pages` during upsert
- Source data from wizard state: `pageSeeds[].specs_seed`, `pageSeeds[].suggested_condition`, `pageSeeds[].replacement_briefing_stub`
- The AI drafting already generates some of this data but it's discarded during publish

**4b. Room Template**
Prototype shows: hero photo, specs grid (dimensions, sqft, ceiling, floor), condition badge, FINISHES grid (wall paint, trim, ceiling paint, flooring), APPLIANCES grid, PLUMBING grid, OBSERVATIONS section, LINKED VISION PROJECT callout.

RoomTemplatePage.tsx exists — verify it renders these sections when specs data is present.

**4c. System Template**
Prototype shows: specs, condition, replacement briefing (timeline + cost), observations.

SystemTemplatePage.tsx exists — verify it renders replacement briefing when data is present.

**4d. Vision Template**
Prototype shows: hero photo with overlay + tags (LIFESTYLE, YEAR 1-2), THE VISION narrative, italic callout, WHY DESIGN MATTERS FIRST callout with gold border, INVESTMENT RANGES with 3 tier cards (Essential/Enhanced/Signature).

VisionTemplatePage.tsx exists — verify it renders tier cards when tiers data is present.

**4e. AI Spec Extraction**
The `draft-page-narrative` and `seed-report-from-notes` functions need to return structured spec data, not just narrative text. For room pages: dimensions, finishes, appliances. For system pages: age, model, condition. For vision pages: tiers with price ranges.

---

## Workstream 5: Recurring Services Register (FOLLOW-UP SESSION)

**Files:** New renderer component, data pipeline
**Effort:** 6-8 hours

### What the Prototype Shows
- Summary cards: Today's Spend, If HBC Managed, Time Spent Coordinating
- HBC Concierge pitch block with pricing math
- Categorized service tables (Cleaning, Lawn, Snow, Pest, HVAC, Chimney, Inspection, Specialty)
- Each table: SERVICE, VENDOR, FREQUENCY, NEXT DUE, $/MO columns
- Overdue items flagged in red
- ANNUAL SPEND BY CATEGORY horizontal bar chart

### What Exists
- `generate-recurring-services-register` edge function — extracts services from intake signals
- `RecurringServicePreview` type in WizardContext — already defined with category, service_name, vendor_name, frequency, cost fields
- `recurringServicesPreview` state in wizard — populated by Step 4
- `recurring_services` DB table — exists for persistent storage

### What's Missing
- No renderer for the recurring services page in the portal report
- The data from `recurringServicesPreview` is never written to the DB during publish
- No wizard intake field for collecting existing recurring services data from the client
- No concierge pricing pitch block
- No spend chart component

---

## Workstream 6: Capital Plan + Maintenance Calendar (FOLLOW-UP SESSION)

**Files:** New renderer components, publish pipeline
**Effort:** 4-6 hours

### What the Prototype Shows
- 3 phase cards (Defense/Offense/Expansion) with colored top borders and project lists
- 10-year Gantt chart with project bars, drag-drop capability, annual cost row
- 4-season maintenance calendar grid (Spring/Summer/Fall/Winter) with task lists

### What Exists
- `CapitalPlan` type in WizardContext — `years[]` with year, phase, project, ballpark costs
- `MaintenanceCalendar` type — `winter/spring/summer/fall` arrays with task/system/frequency
- Both are populated by Step 4 generators (`generate-capital-plan`, `generate-maintenance-calendar`)
- Data exists in wizard state but is never written to report_pages during publish

### What's Missing
- Strategy page renderer that shows phase cards + Gantt + calendar (not just narrative text)
- Publish pipeline writing capitalPlan/maintenanceCalendar as structured blocks
- Drag-drop Gantt interaction (stretch goal — static chart first)

---

## Workstream 7: Photo Auto-Routing (FOLLOW-UP SESSION)

**Files:** `WizardContext.tsx`, `Step3Authoring.tsx`, `Step5Publish.tsx`
**Effort:** 3-4 hours

### What Should Happen
1. Photos uploaded in Step 1 get stored in wizard-uploads bucket
2. After Step 3 drafts pages, batch-categorize photos via `categorize-photo` edge function (Gemini Vision)
3. Each photo gets a `pageSlug` assignment
4. Step 5 publish writes assigned photo URLs to `report_pages.images`
5. Templates render photos in their hero/gallery sections

### What Exists
- `categorize-photo` edge function — fully built, returns `pageSlug` suggestions
- `report_pages.images` column — exists, read by template components
- Template components — already render images when present

### What's Missing
- `categorize-photo` is never called during the wizard flow
- No `photoAssignments` state in WizardContext
- Step 5 never writes to `report_pages.images` during upsert
- No photo management UI on Step 5

---

## Execution Order

### Today (Session 1):
1. **W1** — Stop internal docs leak (15 min)
2. **W3** — Fix report per-page navigation — one line change (30 min)
3. **W2** — Portal Home fixes (1-2 hrs)
4. Commit, build, typecheck, deploy

### Session 2 (next):
5. **W7** — Photo auto-routing (3-4 hrs)
6. **W4a** — Publish pipeline structured data (2-3 hrs)
7. **W4b-d** — Verify/fix template renderers (2-3 hrs)

### Session 3:
8. **W5** — Recurring services register (6-8 hrs)
9. **W6** — Capital plan + maintenance calendar (4-6 hrs)
10. **W4e** — AI spec extraction improvements (2-3 hrs)

### Session 4:
11. Visual walkthrough against all 55 prototype screens
12. Polish pass on every template
13. Caldwell demo seed with real data
