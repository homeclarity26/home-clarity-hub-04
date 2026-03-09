

# Report Page Template System (93 Templates)

## Current State
- `page_templates` table exists with correct schema (name, slug, group_name, sub_group, block_config, default_content, version, is_custom, icon)
- Only 4 templates seeded: Kitchen, Primary Bedroom, Roof System, Furnace
- `report_pages` table already has `template_id`, `block_config`, `key_observations`, `risks`, `dependencies`, `maintenance`, `creator_notes` columns
- `NewReportWizard` hardcodes 14 default pages instead of using templates
- `ReportPage` component doesn't render blocks dynamically from block_config

## Plan

### Step 1: Seed all 93 templates (database insert)
Insert the remaining 89 templates into `page_templates` using the data insert tool. Organized by group:

**Exterior (31 templates):** Roof System (exists), Gutters & Downspouts, Soffits & Fascia, Chimney, Skylights, Siding, Exterior Paint/Stain, Brick & Masonry, Stucco/EIFS, Windows, Exterior Doors, Garage Doors, Storm Doors & Windows, Foundation, Crawl Space, Exterior Grading & Drainage, Retaining Walls, Basement Exterior Waterproofing, Driveway, Walkways & Paths, Patio, Deck, Porch/Covered Porch, Steps & Railings, Landscaping, Trees & Large Plantings, Irrigation System, Fencing, Exterior Lighting, Pool/Hot Tub/Spa, Outbuildings/Sheds

**Interior (37 templates):** Kitchen (exists), Pantry, Dining Room, Breakfast Nook, Primary Bedroom (exists), Primary Bathroom, Primary Closet, Bedroom 2-5, Bathroom 2-3, Powder Room, Living Room, Family Room, Great Room, Den/Study, Home Office, Library, Sunroom, Bonus Room, Playroom, Nursery, Media Room, Home Theater, Exercise Room, Wine Cellar, Basement Full Overview, Basement Finished Area, Basement Utility Area, Mudroom, Laundry Room, Foyer/Entry, Hallways, Stairways, Attic, Storage Areas, Garage Interior, In-Law Suite, Guest Suite

**Systems (18 templates):** Furnace (exists), Air Conditioning, Heat Pump, Boiler, Ductwork, Thermostat/Controls, Water Heater, Water Softener, Sump Pump, Electrical Panel, Wiring, Plumbing Supply, Drain/Sewer, Well System, Septic System, Security System, Fire/CO Detection, Ventilation/ERV/HRV

**Information (3 templates):** Executive Summary, Property Overview, Methodology

**Strategy (4 templates):** Financial Roadmap, Action Plan, Maintenance Calendar, Warranty Tracker

Each template gets appropriate `block_config` (which blocks active/required) and `default_content` (placeholder narrative, observations, specs, maintenance text) per the user's specifications.

### Step 2: Update NewReportWizard — Template Selection UI
Modify `src/components/admin/NewReportWizard.tsx`:
- Fetch all templates from `page_templates` table on mount
- In Step 1 (after client info), add a new step or section showing templates grouped by group_name/sub_group
- Each template has a Switch toggle to activate/deactivate
- Show count: "32 of 93 pages active"
- Default: all templates inactive; creator toggles which to include
- When creating report pages, use selected templates' block_config and default_content instead of hardcoded pages

### Step 3: Dynamic Block Renderer Component
Create `src/components/report/BlockRenderer.tsx`:
- Takes `blockConfig` (JSON from template/page) and page content data
- Renders blocks in order: page_header, narrative, key_observations, health_bar, specs, tiers, timing, dependencies, risks, photos, maintenance, creator_notes, client_comments
- Each block only renders if `active: true` in config
- New block components needed:
  - `KeyObservations` — bulleted list
  - `DependenciesList` — tag-style linked project names
  - `RisksConcerns` — amber-background bulleted list
  - `MaintenanceNotes` — frequency-tagged recommendations
  - `CreatorNotes` — private textarea (hidden from clients)
- Existing blocks reused: HealthBar, EditableSpecs, PricingTiers/EditableTiers, CommentsSection, EditableSection, EditableField, EditableDropdown, ImageGrid

### Step 4: Refactor ReportPage to use BlockRenderer
Update `src/components/report/ReportPage.tsx`:
- Read `block_config` from page data (falls back to template default)
- Replace current hardcoded block rendering with `<BlockRenderer>` component
- This single component now handles all 93 template types

### Step 5: Page Status Auto-Detection
Add a utility function `computePageStatus(blockConfig, content)`:
- "Complete" — all required blocks have non-placeholder content
- "Draft" — some blocks populated, some still placeholder
- "Needs Review" — flagged by AI
- "Inactive" — toggled off
Wire this into the save flow so status auto-updates.

## Files to Create
1. `src/components/report/BlockRenderer.tsx` — dynamic block rendering
2. `src/components/report/KeyObservations.tsx` — bullet list block
3. `src/components/report/DependenciesList.tsx` — tag display block
4. `src/components/report/RisksConcerns.tsx` — amber-bg risk list
5. `src/components/report/MaintenanceNotes.tsx` — maintenance block
6. `src/components/report/CreatorNotes.tsx` — private notes block
7. `src/lib/templateUtils.ts` — status auto-detection utility

## Files to Modify
1. `src/components/admin/NewReportWizard.tsx` — template selection + seeding from templates
2. `src/components/report/ReportPage.tsx` — use BlockRenderer
3. `src/hooks/useReportPage.ts` — handle new fields (key_observations, risks, dependencies, maintenance, creator_notes, block_config)

## Database Operations
- Insert ~89 rows into `page_templates` via data insert tool (no schema changes needed)

