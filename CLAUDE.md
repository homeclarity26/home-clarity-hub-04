# Home Clarity Hub — Developer Reference

**Branch:** `claude/nostalgic-archimedes`
**Stack:** React 18 + TypeScript + Vite (Bun runtime) · Supabase (Postgres, Auth, Storage, Edge Functions) · Gemini 2.0 Flash · shadcn/ui · TanStack React Query · Tiptap WYSIWYG · @react-pdf/renderer · date-fns

---

## What This App Does

Home Clarity Hub (HBC) is a **home stewardship platform** for professional home consultants. It has two sides:

1. **Admin Side** (`/admin/*`) — The consultant's workspace. Create clients, run intake, build reports, manage projects/payments/equipment/schedule/vendors.
2. **Client Portal** (`/portal/:propertyId`) — The homeowner's view. Read-only access to their report, projects, payments, equipment registry, schedule, documents, and a live AI chat assistant.

The core product is a structured **Home Report** — a multi-page document covering every system of a home (roof, HVAC, electrical, plumbing, kitchen, etc.) with condition ratings, narrative, spec sheets, tiered pricing recommendations, and a financial roadmap. The report is built in the admin, then published to the client portal.

---

## Tech Stack Details

| Layer | Technology |
|---|---|
| Frontend runtime | Bun (also works with Node 18+) |
| Framework | React 18 + TypeScript + Vite |
| UI components | shadcn/ui (Radix UI primitives + Tailwind CSS) |
| Data fetching | TanStack React Query v5 |
| Rich text editor | Tiptap (StarterKit + Image + Placeholder) |
| PDF generation | @react-pdf/renderer |
| Backend | Supabase (PostgreSQL + Auth + Storage + Edge Functions) |
| Edge Functions | Deno runtime |
| AI model | Google Gemini 2.0 Flash via `generativelanguage.googleapis.com/v1beta` |
| AI response format | `responseMimeType: "application/json"` for structured output |
| Date utilities | date-fns (`isPast`, `isAfter`, `addDays`, `format`) |
| Routing | React Router v6 |
| Notifications | sonner (toast) |

### Key Patterns

- **All AI calls** go through Supabase Edge Functions (never directly from the browser)
- **Gemini API format:** `generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`
- **Structured JSON responses:** always set `responseMimeType: "application/json"` in `generationConfig`
- **Mock user bypass:** `propertyId.startsWith("mock-")` pattern used throughout client portal tabs to show demo data without Supabase
- **Edit mode:** `useEditMode()` context — `canEdit` boolean gates all inline editing UI in the report
- **Image storage:** Supabase Storage bucket `report-images`, path `{reportId}/{pageId}/{filename}`

---

## Environment Variables

### Frontend (`.env`)
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_GOOGLE_MAPS_API_KEY=...       # ← NOT YET SET — needed for AddressAutocomplete
```

### Supabase Edge Function Secrets (set via `supabase secrets set`)
```
GEMINI_API_KEY=...                 # ← NOT YET DEPLOYED — required for all AI features
RENTCAST_API_KEY=...               # ← NOT YET DEPLOYED — required for property auto-lookup
```

---

## Database Schema (Key Tables)

### `profiles`
- `id` (uuid, FK → auth.users)
- `role` — `'creator'` | `'client'`
- `email`, `full_name`, `phone`, `avatar_url`

### `properties`
Core property record. Extended by `20260315000000_add_intake_fields.sql`:
- `id`, `property_name`, `address`, `client_user_id`, `creator_user_id`
- `city`, `state`, `zip`, `county`
- `property_type` — `single_family` | `multi_family` | `condo` | `townhome`
- `relationship_type` — `owner_occupied` | `recently_purchased` | `pre_purchase` | `investment`
- `hover_url`, `hover_pdf_url`, `iguide_pdf_url`
- `client_intelligence_summary` — AI-generated summary from discovery notes
- `discovery_notes` — raw intake notes
- `intake_status` — default `'draft'`
- `digital_assets_status` — `'not_started'` | `'partial'` | `'complete'`
- `metadata` (jsonb) — year_built, sqft, bedrooms, bathrooms, etc.

### `reports`
- `id`, `property_id`, `title`, `status` (`draft` | `published`), `completion_percent`

### `report_pages`
- `id`, `report_id`, `page_key`, `group_name`, `title`, `status`
- `narrative` (jsonb array), `specs` (jsonb), `tiers` (jsonb), `condition_rating`
- `key_observations`, `dependencies`, `risks`, `maintenance_notes`, `creator_notes` (all jsonb)
- `sort_order`, `images` (text array)

### `equipment` ← Added `20260316000000_add_equipment_table.sql`
- `id`, `property_id` (FK → properties)
- `name`, `category` — `hvac` | `plumbing` | `electrical` | `appliances` | `exterior` | `structure` | `safety` | `other`
- `brand`, `model`, `serial_number`
- `install_date`, `warranty_expiry`, `last_service_date`, `next_service_date` (dates)
- `estimated_replacement_cost` (numeric), `condition` — `excellent` | `good` | `fair` | `poor` | `unknown`
- `notes`, `report_page_id` (FK → report_pages, nullable), `sort_order`
- RLS: creators manage all; clients read their own property equipment

### `invoices`
- `id`, `property_id`, `title`, `description`, `amount`, `status` (`pending` | `paid` | `overdue`)
- `due_date`, `paid_date`

### `projects`
- `id`, `property_id`, `title`, `description`, `status`, `priority`, `estimated_cost`, `actual_cost`

### Other Tables
- `schedule_events` — appointments, tasks per property
- `vendors` — vendor directory per creator
- `files` — file attachments per property
- `comments` — threaded comments per property

---

## Pending Database Migrations (NOT YET RUN IN SUPABASE)

These migrations exist in `/supabase/migrations/` but have not been applied to the live Supabase project:

1. **`20260315000000_add_intake_fields.sql`** — Adds city, state, zip, county, property_type, relationship_type, hover_url, hover_pdf_url, iguide_pdf_url, client_intelligence_summary, discovery_notes, intake_status, digital_assets_status to `properties` table
2. **`20260316000000_add_equipment_table.sql`** — Creates full `equipment` table with RLS policies and indexes

**To apply:** Run in Supabase Dashboard → SQL Editor, or via `supabase db push`

---

## File Structure

```
src/
├── components/
│   ├── admin/
│   │   ├── AdminHeader.tsx           # Top nav for admin pages
│   │   ├── AdminSidebar.tsx          # Left nav for admin
│   │   ├── AdminProjectsSection.tsx  # Projects CRUD per client
│   │   ├── ActivityFeed.tsx          # Recent activity per client
│   │   ├── AddressAutocomplete.tsx   # Google Places autocomplete
│   │   ├── ClientIntelligenceCard.tsx # AI analysis of discovery notes
│   │   ├── ClientOverview.tsx        # Client summary + inline property editing
│   │   ├── ClientTable.tsx           # Admin clients list table
│   │   ├── CommentsManager.tsx       # Threaded comments
│   │   ├── DigitalAssetsStep.tsx     # Hover.to + iGuide URL/PDF management
│   │   ├── EquipmentSection.tsx      # Admin equipment CRUD
│   │   ├── FileManager.tsx           # File uploads per property
│   │   ├── KnowledgeBase.tsx         # Admin knowledge base
│   │   ├── NewReportWizard.tsx       # 4-step new client intake wizard
│   │   ├── ReportPageManager.tsx     # Admin report page list/status
│   │   ├── StatsCard.tsx             # Dashboard stat cards
│   │   └── VendorManager.tsx         # Vendor directory
│   ├── chat/
│   │   ├── ChatPanel.tsx             # Slide-out chat sheet
│   │   ├── ChatMessage.tsx           # Individual message bubbles
│   │   └── useChat.ts                # Chat state + edge function calls
│   ├── editor/
│   │   ├── AIEditPanel.tsx           # AI-powered text improvement panel
│   │   ├── EditableSection.tsx       # Tiptap WYSIWYG editor wrapper
│   │   ├── EditorToolbar.tsx         # Rich text formatting toolbar
│   │   ├── ImageGrid.tsx             # Photo grid with upload/delete
│   │   └── ImageUploader.tsx         # Supabase Storage uploader
│   ├── report/
│   │   ├── BlockRenderer.tsx         # Renders all block types + serial plate scanner
│   │   ├── CommentsSection.tsx       # Client comments on report pages
│   │   ├── CreatorBar.tsx            # Edit mode toggle bar for admin
│   │   ├── CreatorNotes.tsx          # Internal admin notes on pages
│   │   ├── DependenciesList.tsx      # Page dependency relationships
│   │   ├── EditableDropdown.tsx      # Inline condition rating selector
│   │   ├── EditableField.tsx         # Inline text field editor
│   │   ├── EditableSpecs.tsx         # Editable spec key/value pairs
│   │   ├── EditableTiers.tsx         # Editable pricing tier table
│   │   ├── HealthBar.tsx             # Visual health meter
│   │   ├── KeyObservations.tsx       # Bullet list of key findings
│   │   ├── MaintenanceNotes.tsx      # Maintenance schedule section
│   │   ├── PricingTiers.tsx          # Essential/Enhanced/Signature display
│   │   ├── ReportPage.tsx            # Full single report page renderer
│   │   ├── RisksConcerns.tsx         # Risk flags list
│   │   └── SaveIndicator.tsx         # Autosave status indicator
│   ├── tabs/                         # Client portal tab components
│   │   ├── ContactsTab.tsx
│   │   ├── DocumentsTab.tsx
│   │   ├── EquipmentTab.tsx          # Read-only equipment registry
│   │   ├── HomeTab.tsx               # Portal landing with stats + nav
│   │   ├── PaymentsTab.tsx           # Invoice list with due dates + overdue highlighting
│   │   ├── ProjectsTab.tsx
│   │   ├── ReportTab.tsx             # Full report viewer + editor
│   │   └── ScheduleTab.tsx
│   ├── Footer.tsx
│   ├── Header.tsx                    # Client portal tab bar
│   └── NavLink.tsx
├── contexts/
│   ├── AuthContext.tsx               # Supabase auth + profile
│   └── EditModeContext.tsx           # Report edit mode toggle
├── data/
│   └── reportContent.ts             # Static template data + ReportPageData types
├── features/
│   └── pdf/
│       ├── PDFDownloadButton.tsx
│       └── PDFReport.tsx             # @react-pdf/renderer report document
├── hooks/
│   ├── useAdminData.ts              # TanStack Query hooks for admin
│   ├── useClientPortal.ts           # Portal data loader
│   ├── useReportPage.ts             # Single page data + autosave
│   └── use-toast.ts
├── integrations/
│   └── supabase/
│       ├── client.ts
│       └── types.ts                 # Generated DB types
├── lib/
│   └── templateUtils.ts             # BlockConfig + PageContent types
└── pages/
    ├── Index.tsx                    # Client portal main page
    ├── Login.tsx / Signup.tsx / ForgotPassword.tsx / ResetPassword.tsx
    └── admin/
        ├── AdminClientDetail.tsx    # Per-client tabbed workspace
        ├── AdminClients.tsx         # Clients list page
        ├── AdminDashboard.tsx       # Dashboard overview
        ├── AdminKnowledgeBase.tsx
        ├── AdminNewReport.tsx       # Entry point → NewReportWizard
        └── AdminSettings.tsx

supabase/
├── functions/
│   ├── ai-edit/                     # AI text improvement
│   ├── analyze-discovery-notes/     # AI analysis of intake notes
│   ├── chat-assistant/              # AI chat with full report context
│   ├── create-client-account/       # Creates Supabase auth account for client
│   ├── draft-page-narrative/        # AI drafts report page narrative
│   ├── extract-serial-plate/        # Gemini Vision reads equipment labels
│   ├── lookup-property-data/        # Rentcast API property auto-populate
│   ├── qa-report/                   # Pre-publish QA check
│   └── recommend-report-pages/      # AI recommends pages to include
└── migrations/
    └── (14 migration files)
```

---

## What's Been Built

### ✅ Stage 1 — Client Intake & Setup

**New Client Intake Wizard** (`NewReportWizard.tsx`) — 4-step wizard:

- **Step 1 — Client & Property:** Name, email, phone, full address (Google Places autocomplete), city/state/zip/county, property type, relationship type, year built, sqft, bed/bath, discovery notes. Includes a **Client Intelligence Card** that sends discovery notes to the `analyze-discovery-notes` edge function and returns AI-extracted goals, constraints, and priorities.
- **Step 2 — Digital Assets:** Hover.to scan URL + PDF URL, iGuide URL + PDF URL, with status badge tracking (Not Started / Partial / Ready).
- **Step 3 — Select Pages:** Template browser grouped by category. AI page recommendation via `recommend-report-pages` edge function (triggered by "AI Suggest" button using the intelligence summary).
- **Step 4 — Review & Publish:** Summary of selections, **QA Check** panel (runs `qa-report` edge function, returns 0–100 score, error/warning/info issues), publish creates DB records and sends client invitation email.

**Address Autocomplete** (`AddressAutocomplete.tsx`):
- Google Places Autocomplete API
- Auto-fills city, state, zip, county, and property fields
- Requires `VITE_GOOGLE_MAPS_API_KEY` env var

**Property Auto-Populate** (triggered on address selection):
- Calls `lookup-property-data` edge function → Rentcast API
- Auto-fills year built, sqft, bedrooms, bathrooms, estimated value, last sale price/date
- Graceful fallback if `RENTCAST_API_KEY` not set

**Client Intelligence Card** (`ClientIntelligenceCard.tsx`):
- Manual "Analyze" button trigger (no auto-analyze)
- Sends discovery notes to `analyze-discovery-notes`
- Returns: summary (2–3 sentences), goals array, constraints array, priorities array
- Accept/regenerate flow, saves `client_intelligence_summary` to properties table

**Digital Assets Step** (`DigitalAssetsStep.tsx`):
- Hover.to and iGuide URL + PDF management
- Digital assets status badge (Not Started / Partial / Ready)
- Saves to `hover_url`, `hover_pdf_url`, `iguide_pdf_url`, `digital_assets_status` columns

---

### ✅ Stage 2 — Digital Twin (Equipment Registry)

**Equipment DB Table** (`20260316000000_add_equipment_table.sql`):
- Full schema with 15 fields per item
- Categories: hvac, plumbing, electrical, appliances, exterior, structure, safety, other
- Conditions: excellent, good, fair, poor, unknown
- Links to `report_pages` via `report_page_id` (optional)
- RLS: creators manage all, clients read their own

**Admin Equipment Manager** (`EquipmentSection.tsx`):
- Full CRUD with add/edit dialog, delete confirm
- Groups equipment by category
- Service status badges: **Overdue** (past next_service_date), **Due Soon** (within 60 days), **Warranty Expired**, **Up to Date**
- Date logic uses `date-fns`: `isPast()`, `isAfter()`, `addDays(now, 60)`
- All fields: name, category, condition, brand, model, serial, replacement cost, install date, warranty expiry, last service, next service, linked report page, notes
- Linked to AdminClientDetail as its own tab

**Client Portal Equipment Tab** (`EquipmentTab.tsx`):
- Read-only view for homeowners
- Alert banners at top: overdue count + due-soon count
- Category ordering with condition color dots
- Demo data for mock-* propertyIds (5 items: 2 HVAC, water heater, electrical panel, smoke detectors)

---

### ✅ Stage 3 — Report Builder

**Report Page Manager** (`ReportPageManager.tsx`):
- Admin list of all report pages with status (Complete / Published / Draft / Needs Review / Inactive)
- "Open in Portal" links directly to edit mode

**Report Page Editor** (multiple components in `src/components/report/`):
- **Block Renderer** renders all page content types: condition rating (dropdown), narrative (WYSIWYG), specs table (editable key/value), pricing tiers (Essential/Enhanced/Signature), health bar, key observations, dependencies, risks, maintenance notes, creator notes, image grid
- **Tiptap WYSIWYG** editor for narrative sections with toolbar (bold, italic, bullets, etc.)
- **Autosave** — changes save automatically via `useReportPage.ts` debounced save
- **Condition Rating** — dropdown with color-coded labels (Excellent/Good/Fair/Poor/Critical)
- **Image Grid** — upload, reorder, delete photos per page (Supabase Storage)
- **AI Narrative Draft** — "Draft with AI" button calls `draft-page-narrative` edge function passing property context + existing data
- **AI Edit Panel** (`AIEditPanel.tsx`) — highlight text → get AI suggestions for improvement via `ai-edit` edge function
- **Serial Plate Scanner** — camera capture button (edit mode only), calls `extract-serial-plate` edge function (Gemini Vision), merges returned data into specs

---

### ✅ Stage 4 — AI Features

**9 Edge Functions** (all built, none yet deployed):

| Function | Purpose | AI Model |
|---|---|---|
| `analyze-discovery-notes` | Extracts goals, constraints, priorities from raw intake notes | Gemini 2.0 Flash |
| `recommend-report-pages` | Suggests which report pages to include based on client intelligence | Gemini 2.0 Flash |
| `draft-page-narrative` | Writes full narrative for a single report page given property context | Gemini 2.0 Flash |
| `ai-edit` | Improves/rewrites selected text on command | Gemini 2.0 Flash |
| `chat-assistant` | AI chat with full report as context — answers questions about the home | Gemini 2.0 Flash |
| `qa-report` | Reviews all pages before publish, scores 0–100, flags issues | Gemini 2.0 Flash |
| `extract-serial-plate` | Reads equipment label photos (Gemini Vision multimodal) | Gemini 2.0 Flash |
| `lookup-property-data` | Fetches property data from Rentcast API | — (external API) |
| `create-client-account` | Creates Supabase auth user for new client | — (admin SDK) |

**Chat Assistant** (`chat/` components):
- Floating action button in client portal (bottom-right)
- Slide-out Sheet panel (`ChatPanel.tsx`)
- Sends full report context (all pages, conditions, specs, tiers, recommendations) with every request
- Message history maintained in session
- `initialQuery` prop allows pre-populating with context (e.g., from HomeTab "Ask a question" button)

**QA Check** (in `NewReportWizard.tsx` Step 4):
- "Run QA Check" button → calls `qa-report` edge function
- Score badge: green ≥80, orange ≥60, red <60
- Issue list with severity icons (error = red X, warning = orange triangle, info = blue circle)
- Checks for: empty narratives, missing condition ratings, default placeholder text, missing specs, incomplete tiers

**Serial Plate Scanner** (in `BlockRenderer.tsx`):
- Camera file input with `capture="environment"` (opens phone camera on mobile)
- Base64 encodes image via `FileReader` + `Uint8Array` + `btoa`
- Calls `extract-serial-plate` (Gemini Vision)
- Returns: brand, model, serial, manufactured date, efficiency, capacity, voltage, refrigerant, weight, country, certifications
- Merges into existing specs array (updates matching keys, appends new ones)

---

### ✅ Stage 5 — Client Portal

**Portal Structure** (`src/pages/Index.tsx`):
- Route: `/portal/:propertyId`
- `?edit=true` query param enables edit mode
- `?page=slug` query param jumps to specific report page

**Tab Navigation** (`Header.tsx`):
- Home · Report · Projects · Payments · Equipment · Documents · Schedule · Contacts

**Tab Components:**
- `HomeTab.tsx` — Hero with property name, report progress bar, quick nav cards, "Ask a question" button (opens chat assistant)
- `ReportTab.tsx` — Full paginated report with sidebar navigation
- `ProjectsTab.tsx` — Project list with status/priority/cost
- `PaymentsTab.tsx` — Invoice table with description, due date, amount, status; overdue row highlighting (bg-destructive/5); "Paid [date]" for completed invoices
- `EquipmentTab.tsx` — Equipment registry (see above)
- `DocumentsTab.tsx` — File downloads
- `ScheduleTab.tsx` — Appointment calendar
- `ContactsTab.tsx` — Contact directory

---

### ✅ Stage 6 — Admin Workspace

**Admin Client Detail** (`AdminClientDetail.tsx`):
Tabs: Overview · Report · Files · Comments · Projects · Payments · Equipment · Schedule · Vendors

**Client Overview** (`ClientOverview.tsx`):
- Property info display + **inline editing** (Edit/Cancel/Save buttons)
- Edit mode shows form with all intake fields: phone, city, state, zip, county, property type, relationship type, year built, sqft, bedrooms, bathrooms
- Saves to `properties` table + `metadata` jsonb column
- Shows digital assets status badge
- Embeds `ClientIntelligenceCard` for AI discovery note analysis

**Payments in Admin** (`AdminClientDetail.tsx`):
- Invoice CRUD (create/edit/delete)
- **"From Report Tier" pre-fill** — selects a report page → selects a tier → pre-fills invoice with tier title and cost (parses "$4,000–$8,000" range strings, takes low end as amount)

**PDF Download** (`PDFDownloadButton.tsx`):
- @react-pdf/renderer generates full report PDF
- Available in both admin and client portal

---

### ✅ Stage 7 — Settings & Infrastructure

**Admin Settings** (`AdminSettings.tsx`) — Profile, branding, notification preferences

**Auth Flow:**
- Login / Signup / Forgot Password / Reset Password
- `AuthContext.tsx` — Supabase auth + profile loading
- `create-client-account` edge function creates client auth accounts

**Knowledge Base** (`AdminKnowledgeBase.tsx`, `KnowledgeBase.tsx`) — Admin reference docs

---

## What Still Needs to Be Built

### ✅ Recently Completed (this session)

- **Page status controls in ReportPageManager** — inline `Select` dropdown per row changes status directly from the admin Report tab; triggers `completion_percent` recalculation on every change
- **Report completion % auto-calc** — `recalculateCompletion(reportId)` counts complete+published pages / total, writes to `reports.completion_percent`; called after every status change; progress bar + `X/Y complete` count shown in ReportPageManager header
- **Financial Roadmap page** (`src/components/report/FinancialRoadmapPage.tsx`) — live aggregation of all report pages' tier costs; groups into Urgent/Near-Term/Planned phases based on condition ratings; Essential/Balanced/Premium tier switcher; total + phase-level cost summaries
- **Action Plan page** (`src/components/report/ActionPlanPage.tsx`) — auto-generates prioritized to-do list from all pages' recommendations + condition ratings; collapsible groups (Urgent/Near-Term/Planned); expand/collapse per item; count summary strip
- Both special pages hooked into `ReportTab.tsx` — detected by page slug and rendered instead of standard `ReportPage` when `activePageId` is `"financial-roadmap"` or `"action-plan"`
- AI page recommendation in wizard (Step 3) was already wired via `handleAiRecommendPages` calling `recommend-report-pages` edge function

---

### 🔴 Critical — Must Deploy Before App Works

1. **Deploy all 9 Edge Functions to Supabase**
   ```bash
   supabase functions deploy analyze-discovery-notes
   supabase functions deploy recommend-report-pages
   supabase functions deploy draft-page-narrative
   supabase functions deploy ai-edit
   supabase functions deploy chat-assistant
   supabase functions deploy qa-report
   supabase functions deploy extract-serial-plate
   supabase functions deploy lookup-property-data
   supabase functions deploy create-client-account
   ```

2. **Set Supabase Secrets**
   ```bash
   supabase secrets set GEMINI_API_KEY=your_key_here
   supabase secrets set RENTCAST_API_KEY=your_key_here
   ```

3. **Set Frontend Env Var**
   - Add `VITE_GOOGLE_MAPS_API_KEY=your_key_here` to `.env`
   - Enable Places API in Google Cloud Console

4. **Run Pending DB Migrations**
   - Apply `20260315000000_add_intake_fields.sql` in Supabase SQL Editor
   - Apply `20260316000000_add_equipment_table.sql` in Supabase SQL Editor

---

### 🟠 High Priority — Core Features Not Yet Built

5. ~~AI Page Recommendation Integration (NewReportWizard Step 3)~~ ✅ **Already built** — `handleAiRecommendPages` calls `recommend-report-pages` edge function from wizard Step 3 "AI Suggest" button

6. **Report Page Auto-Draft on Creation**
   - When a page is added via the wizard or admin, offer to auto-draft the narrative immediately
   - `draft-page-narrative` edge function is built but only triggered manually inside the page editor
   - Should offer "Auto-draft all selected pages?" at the end of the wizard

7. ~~Financial Roadmap Page~~ ✅ **Built** — `FinancialRoadmapPage.tsx` aggregates all page tiers, groups by urgency phase, Essential/Balanced/Premium switcher, cost totals

8. ~~Action Plan Page~~ ✅ **Built** — `ActionPlanPage.tsx` auto-generates from recommendations + conditions, collapsible priority groups

9. **Report Page Dependencies**
   - The `DependenciesList.tsx` component exists and `dependencies` field exists in DB schema
   - Admin UI to set "complete X before Y" relationships between pages
   - Visual dependency graph or ordered list showing sequencing logic

10. **Vendor Connection on Report Pages**
    - Each report page should allow linking 1+ vendors from the VendorManager
    - Client portal: "Recommended Vendors" section on each report page
    - Admin: assign vendors to pages via dropdown or search

---

### 🟡 Medium Priority — Polish & Enhancement

11. **Report Sharing / Client Portal Access Control**
    - Current publish flow creates the DB records and sends an email
    - Email template for client invitation is not fully built (check `create-client-account` function)
    - Need a clean onboarding email: portal link, what to expect, contact info
    - Consider magic link vs. password auth for clients

12. **Report Completion Tracking**
    - `completion_percent` field exists in `reports` table
    - No logic currently calculates it from page statuses
    - Should be: (pages with status = 'complete' or 'published') / (total pages) * 100
    - HomeTab progress bar reads this value — it needs to be kept current

13. **Bulk AI Draft All Pages**
    - "Draft All with AI" button in the wizard review step or report manager
    - Calls `draft-page-narrative` sequentially for each selected page
    - Progress indicator showing page-by-page completion

14. ~~Report Page Status Workflow~~ ✅ **Built** — inline Select dropdown in ReportPageManager table; status changes instantly update DB + trigger completion % recalc

15. **Equipment → Report Page Sync**
    - Equipment items can be linked to a report page via `report_page_id`
    - The serial plate scanner in `BlockRenderer.tsx` writes to the page specs, but doesn't create/update an equipment record
    - Should offer: "Save to Equipment Registry?" after a successful scan
    - Would auto-create an equipment item with extracted brand/model/serial

16. **Client Portal — Report Download Button**
    - PDFDownloadButton exists in admin
    - Should also be accessible from the client portal Report tab
    - Requires checking if `pdfData` is populated in `Index.tsx` (it is — already built)

17. **Schedule Tab Enhancement**
    - `ScheduleTab.tsx` — minimal current state
    - Should show appointments with calendar view or sorted list
    - Admin ability to create events linked to a property (already has `schedule_events` table + hooks)

18. **Projects ↔ Report Pages**
    - Projects should be linkable to specific report pages/recommendations
    - "Create Project from Tier" flow similar to the existing "From Report Tier" invoice flow
    - Client portal ProjectsTab should group by report section

19. **Comments Threading**
    - `CommentsManager.tsx` exists for admin
    - Client portal doesn't currently have a comments/messages tab
    - Should be accessible from the portal as a communication channel

---

### 🟢 Low Priority — Nice to Have

20. **Hover.to + iGuide Embed**
    - `hover_url` and `iguide_pdf_url` are stored
    - Client portal should display Hover.to 3D model as embedded iframe (on Home or Documents tab)
    - iGuide should be available as a PDF download or embedded viewer

21. **Property Value Tracking**
    - `lookup-property-data` returns `estimatedValue` and `lastSalePrice`
    - HomeTab could show a value estimate widget
    - Would need periodic refresh (Rentcast has rate limits — store and cache the value)

22. **Report Template Library**
    - Current templates are hardcoded in `reportContent.ts`
    - Admin should be able to create/edit/clone page templates
    - Templates stored in a `page_templates` table so they persist per creator

23. **Multi-Property Dashboard**
    - AdminDashboard currently shows client list + stats
    - A map view of all properties (using stored lat/lng or geocoding the addresses) would be compelling
    - Portfolio health summary: how many properties have overdue equipment, upcoming service, incomplete reports

24. **Client Notifications**
    - Supabase realtime or email notifications when:
      - Report is published/updated
      - New invoice created
      - Schedule event added
      - Equipment service date approaching

25. **Knowledge Base Integration**
    - `AdminKnowledgeBase.tsx` exists but is disconnected from the report editor
    - The `draft-page-narrative` edge function could pull relevant KB articles as context
    - Would improve AI narrative quality for regional/property-type-specific knowledge

26. **Vendor Portal**
    - Vendors currently in a list per creator account
    - Future: vendors have their own login, receive job requests, submit quotes
    - Would integrate with Projects and the report page vendor recommendation feature

---

## How to Run Locally

```bash
# Install dependencies
bun install

# Start dev server
bun run dev
# → http://localhost:8080

# Deploy edge functions (one at a time or all)
supabase functions deploy <function-name>

# Run database migrations
supabase db push
# or paste SQL directly in Supabase Dashboard → SQL Editor
```

---

## Key Conventions

### Gemini API Calls (Edge Functions)
```typescript
const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: {
        temperature: 0.7,
        responseMimeType: "application/json",
      },
    }),
  }
);
const json = await response.json();
const result = JSON.parse(json.candidates[0].content.parts[0].text);
```

### Gemini Vision (multimodal — extract-serial-plate)
```typescript
contents: [{
  role: "user",
  parts: [
    { inlineData: { mimeType: file.mimeType, data: base64String } },
    { text: prompt }
  ]
}]
```

### Supabase Edge Function Call from Frontend
```typescript
const { data, error } = await supabase.functions.invoke("function-name", {
  body: { ...payload }
});
```

### Mock Data Bypass Pattern
```typescript
// Used in all client portal tabs
if (propertyId?.startsWith("mock-")) {
  // Return hardcoded demo data
  return <MockView />;
}
// Otherwise fetch from Supabase
```

### TanStack Query Pattern (Admin)
```typescript
const { data, isLoading } = useQuery({
  queryKey: ["key", id],
  enabled: !!id,
  queryFn: async () => {
    const { data } = await supabase.from("table").select("*").eq("id", id);
    return data || [];
  },
});
```

### Service Status Logic (Equipment)
```typescript
import { isPast, isAfter, addDays } from "date-fns";
const now = new Date();
const nextService = item.next_service_date ? new Date(item.next_service_date) : null;
const warrantyExpiry = item.warranty_expiry ? new Date(item.warranty_expiry) : null;

if (nextService && isPast(nextService)) → "Overdue"
if (nextService && isAfter(addDays(now, 60), nextService)) → "Due Soon"
if (warrantyExpiry && isPast(warrantyExpiry)) → "Warranty Expired"
else → "Up to Date"
```

---

## Current Branch State

- **Branch:** `claude/nostalgic-archimedes`
- **Last commit:** `186acf9` — "Add equipment registry, property editing, and payments improvements (A/B/C)"
- All code changes from these sessions are committed
- 2 DB migrations pending (not yet applied to Supabase)
- 9 edge functions pending deployment
- 2 API keys need to be configured (Gemini, Rentcast)
- 1 frontend env var needed (Google Maps)
