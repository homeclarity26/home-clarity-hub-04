# Home Clarity Hub — Master TODO

**Branch:** `claude/nostalgic-archimedes`
**Last updated:** 2026-03-17
**Read this file at the start of every session.**

---

## 🔴 CRITICAL — Must Complete Before App Works in Production

These are blockers. Nothing AI-powered works until these are done.

- [ ] **Deploy all 9 Edge Functions to Supabase**
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

- [ ] **Set Supabase Secrets**
  ```bash
  supabase secrets set GEMINI_API_KEY=your_key_here
  supabase secrets set RENTCAST_API_KEY=your_key_here
  ```

- [ ] **Set Frontend Env Var**
  - Add `VITE_GOOGLE_MAPS_API_KEY=your_key_here` to `.env`
  - Enable Places API in Google Cloud Console

- [ ] **Run all 4 pending DB Migrations** (in order, in Supabase SQL Editor or via `supabase db push`):
  1. `supabase/migrations/20260315000000_add_intake_fields.sql`
  2. `supabase/migrations/20260316000000_add_equipment_table.sql`
  3. `supabase/migrations/20260317000000_add_vendor_page_key.sql`
  4. `supabase/migrations/20260317100000_add_property_messages.sql`

---

## 🟠 HIGH PRIORITY — Core Features Not Yet Built

- [ ] **Admin: Messages panel in AdminClientDetail**
  - The `MessagesTab.tsx` is built for clients, but admins need a corresponding view in the client detail workspace
  - Add a "Messages" tab to `AdminClientDetail.tsx` that shows `property_messages` for that property
  - Admin can reply/send from there — use same `property_messages` table, sender_id = admin user
  - Show unread count badge on the tab

- [ ] **Resend email — client invitation**
  - Currently: `create-client-account` edge function creates an account and returns temp credentials; invite is manual copy-paste
  - Future: Resend API sends a branded HTML email with portal link + login credentials
  - Edge function already has the structure; just needs `RESEND_API_KEY` secret and `fetch("https://api.resend.com/emails", ...)`
  - Client invite email template: portal URL, email, temp password, what to expect

- [ ] **Hover.to / iGuide full embed in portal**
  - URLs are stored and show as external links in ReportTab digital home section ✅
  - Better UX: embed Hover.to iframe directly in a modal or a dedicated "3D Home" tab
  - iGuide embed: `<iframe src={iguideUrl} />` on Documents tab or Home tab
  - Check if Hover.to supports iframe embedding (some do via `/embed` URL param)

- [ ] **Property Value Tracking on HomeTab**
  - `lookup-property-data` (Rentcast) returns `estimatedValue` and `lastSalePrice`
  - Store estimated value in `properties.estimated_value` (column already exists)
  - HomeTab hero could show estimated value with "Last updated [date]" note
  - Periodic refresh: re-fetch from Rentcast when admin manually triggers or on a schedule

- [ ] **Admin Messages unread badge**
  - When clients send messages, admin should see a visual indicator (badge on Clients list, badge on AdminClientDetail Messages tab)
  - Count unread messages where `sender_id = client_user_id` and `is_read = false`
  - Use Supabase realtime subscription to show live updates

---

## 🟡 MEDIUM PRIORITY — Polish & Enhancement

- [ ] **Knowledge Base → AI context injection**
  - `AdminKnowledgeBase.tsx` exists but is siloed
  - The `draft-page-narrative` edge function should pull relevant KB articles as additional context
  - Enables regional/property-type-specific AI drafts (e.g., "Ohio homes built in 1998 commonly have...")
  - Implementation: store KB articles in a `knowledge_base` table; edge function fetches by category match

- [ ] **Report Template Library (admin-editable)**
  - Currently templates are hardcoded in `src/data/reportContent.ts`
  - Admin should be able to create/edit/clone page templates from a settings page
  - Store templates in `page_templates` table (already partially used by wizard via `templates` fetch)
  - Full CRUD UI in AdminSettings or a new AdminTemplates page

- [ ] **Multi-Property Dashboard (map view)**
  - `AdminDashboard.tsx` shows client list + stats but no spatial view
  - Map view using Google Maps API (reuse the same key) showing all properties as pins
  - Color-coded by report status (draft=gray, published=green, overdue service=red)
  - Click a pin → navigate to AdminClientDetail

- [ ] **Client Notifications (Supabase Realtime)**
  - Trigger notifications when:
    - Report status changes to `published`
    - New invoice added (with due date)
    - New schedule event created
    - Equipment service date within 14 days
  - Initial implementation: in-portal notification bell icon with unread count
  - Future: email via Resend

- [ ] **Vendor Portal (future)**
  - Vendors currently just a contact list per creator
  - Phase 2: vendors get login accounts, receive job requests, submit quotes
  - New DB tables: `vendor_accounts`, `job_requests`, `quotes`

- [ ] **Equipment → Service Reminder Emails**
  - Equipment table has `next_service_date`
  - A scheduled Supabase Edge Function could query for equipment due within 30 days and email the client
  - Works with Resend once that's set up

- [ ] **Projects: "Create from Report Tier" in client portal**
  - Currently only admin can create "From Report Tier" invoices and projects
  - Client portal ProjectsTab could let clients request a project based on a report recommendation
  - Would create a `status: "requested"` project for admin to review

- [ ] **Report: Printable view**
  - PDF download exists via `@react-pdf/renderer` ✅
  - A browser print stylesheet (`@media print`) would be a fast addition
  - Could also offer a "Share link" that shows a clean read-only version without the portal chrome

---

## 🟢 LOW PRIORITY — Nice to Have

- [ ] **Admin message → client realtime delivery**
  - Supabase Realtime subscription in MessagesTab (`supabase.channel().on('postgres_changes', ...)`)
  - New messages appear without page refresh
  - Show typing indicator when advisor is composing

- [ ] **Dark mode / theme toggle**
  - Currently light theme only
  - shadcn/ui supports dark mode via class toggle
  - Add to Admin Settings + persist to user preferences in `profiles` table

- [ ] **Report page: "Share this section" button**
  - Each report page could have a share button that copies a deep-link: `/portal/{id}?page={slug}`
  - Useful for clients sharing a specific concern with a contractor

- [ ] **Admin bulk operations on report pages**
  - Select multiple pages → bulk status change (Draft / Complete / Inactive)
  - Select multiple → bulk AI draft
  - Currently each page must be updated one at a time in ReportPageManager

- [ ] **Client portal: Offline mode / PWA**
  - Add a service worker so clients can view their report offline
  - Cache report data on first load
  - "You're offline — showing cached version" banner

- [ ] **AI chat: Citation links**
  - Chat assistant currently returns free text
  - Should cite which report page the answer comes from: "See the Roof System page for details"
  - Clicking citation navigates to that page in the report

- [ ] **Stripe integration for payments**
  - `invoices` table exists with `status: pending | paid | overdue` ✅
  - Clients currently see invoices but can't pay online
  - Add Stripe Checkout link generation in the `create-client-account` or a new edge function
  - PaymentsTab "Pay Now" button links to Stripe Checkout session

- [ ] **Bulk export: all clients to CSV**
  - AdminClients list has no export
  - Simple CSV download of all properties + client names + report status
  - Useful for business reporting

---

## ✅ COMPLETED

Everything below is done and committed on `claude/nostalgic-archimedes`.

### Infrastructure & Auth
- [x] Supabase auth (login, signup, forgot/reset password)
- [x] Creator vs. Client role system (`profiles.role`)
- [x] Edit mode context (`useEditMode`, `canEdit`)
- [x] Admin layout (AdminHeader, AdminSidebar, route guards)

### Client Intake (Stage 1)
- [x] 4-step intake wizard (`NewReportWizard.tsx`)
- [x] Google Places autocomplete on address (`AddressAutocomplete.tsx`)
- [x] Property auto-populate via Rentcast (`lookup-property-data` edge function)
- [x] Client Intelligence Card — AI analysis of discovery notes (`analyze-discovery-notes` edge function)
- [x] Digital Assets step — Hover.to + iGuide URLs with status badges
- [x] AI page recommendation in wizard (`recommend-report-pages` edge function)
- [x] QA check before publish (`qa-report` edge function, 0–100 score, issue list)
- [x] Publish + create client auth account (`create-client-account` edge function)
- [x] Copy Invite Message — formatted portal URL + credentials for paste into email/text
- [x] Bulk AI Draft All Pages — wizard Step 3 "Auto-Draft" panel with progress bar

### Digital Twin (Stage 2)
- [x] Equipment table migration + RLS (`20260316000000_add_equipment_table.sql`)
- [x] Admin equipment CRUD (`EquipmentSection.tsx`) — full lifecycle, service status badges
- [x] Client portal equipment read-only view (`EquipmentTab.tsx`) — overdue/due-soon banners
- [x] Serial plate scanner in BlockRenderer → auto-populate equipment specs (Gemini Vision)
- [x] "Save to Equipment Registry?" after successful scan

### Report Builder (Stage 3)
- [x] ReportPageManager with inline status dropdowns + completion % auto-calc
- [x] BlockRenderer — all block types: condition, narrative, specs, tiers, health bar, key observations, dependencies, risks, maintenance, creator notes, images
- [x] Tiptap WYSIWYG editor for narrative
- [x] Autosave via `useReportPage.ts`
- [x] AI narrative draft per page (`draft-page-narrative` edge function)
- [x] AI Edit Panel — highlight text, get AI suggestion (`ai-edit` edge function)
- [x] Image grid (upload/reorder/delete via Supabase Storage)
- [x] Dependencies editor — add before/after page relationships from dropdown
- [x] Recommended Vendors block — admin assigns vendors per page; client sees vendor cards
- [x] Financial Roadmap page (`FinancialRoadmapPage.tsx`) — tier cost aggregation by phase
- [x] Action Plan page (`ActionPlanPage.tsx`) — from recommendations + condition ratings

### AI Features (Stage 4)
- [x] 9 edge functions built (none deployed yet):
  - analyze-discovery-notes, recommend-report-pages, draft-page-narrative, ai-edit,
  - chat-assistant, qa-report, extract-serial-plate, lookup-property-data, create-client-account

### Client Portal (Stage 5)
- [x] Portal route `/portal/:propertyId` with `?edit=true` and `?page=slug` params
- [x] Tab navigation: Home · Report · Projects · Payments · Equipment · Documents · Messages · Contacts · Schedule
- [x] HomeTab — property hero, report progress, quick nav, AI chat button
- [x] ReportTab — full report viewer + digital home section with live Hover.to/iGuide links
- [x] PDF download in portal
- [x] ProjectsTab — project list
- [x] PaymentsTab — invoice table with overdue highlighting
- [x] EquipmentTab — read-only registry with service alerts
- [x] MessagesTab — chat-style client↔advisor messaging (`property_messages` table)
- [x] DocumentsTab — file downloads
- [x] ScheduleTab — full rewrite with event types, relative dates, history, seasonal checklists
- [x] ContactsTab — HBC team + vendor directory
- [x] AI chat assistant (ChatPanel.tsx, floating FAB)

### Admin Workspace (Stage 6)
- [x] AdminClientDetail with tabs: Overview · Report · Files · Comments · Projects · Payments · Equipment · Schedule · Vendors
- [x] ClientOverview — inline editing of all intake fields, digital assets status, Client Intelligence Card
- [x] "From Report Tier" invoice pre-fill in Payments
- [x] "From Recommendation" project pre-fill in Projects (AdminProjectsSection.tsx)
- [x] VendorManager — vendor cards show "Assigned to: page-slug" badge

### DB Migrations (all in `supabase/migrations/`)
- [x] Base schema (properties, reports, report_pages, profiles, invoices, projects, etc.)
- [x] `20260315000000_add_intake_fields.sql` — extended property fields (NOT YET RUN IN SUPABASE)
- [x] `20260316000000_add_equipment_table.sql` (NOT YET RUN IN SUPABASE)
- [x] `20260317000000_add_vendor_page_key.sql` (NOT YET RUN IN SUPABASE)
- [x] `20260317100000_add_property_messages.sql` (NOT YET RUN IN SUPABASE)
