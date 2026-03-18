

# CRM System Build Plan for HBC

## Overview

Build a unified CRM system covering Clients and Trade Partners with AI assistance, replacing the current separate Clients and Vendors pages. The system spans 8 sections across 3 phases.

---

## Current State

- **Clients page** (`/admin/clients`): functional table with search, filters, batch ops, health badges, CSV export
- **Vendors page** (`/admin/vendors`): basic card grid with CRUD dialog against `central_vendors` table
- **Trade Partner portal** (`/trade`): static shell with hardcoded zeros, no live data
- **Database**: `properties` (client data), `central_vendors` (trade partners), `projects`, `invoices`, `activity_log`, `property_messages`, `project_tasks`, etc. all exist
- **AI**: Edge functions using Gemini API already established; `GEMINI_API_KEY` and `LOVABLE_API_KEY` both available

---

## Phase 1 — CRM Hub + Client Profile + AI Assistant

### 1A. Database Migrations

New tables needed:
- `crm_contacts` — unified contact metadata (stage, tags, last_contact_date, lifetime_value, referral_source, since_date, contact_type: 'client' | 'trade_partner', linked property_id or vendor_id)
- `crm_pipeline_history` — stage change log (contact_id, from_stage, to_stage, changed_by, changed_at, notes)
- `crm_activity_log` — CRM-specific activity feed (contact_id, activity_type, channel, content_preview, metadata, logged_by, logged_at)
- `crm_contacts_people` — associated people per account (contact_id, name, relationship, phone, email, preferred_method, birthday, notes)
- `crm_saved_filters` — saved filter presets (name, filter_json, contact_type, created_by)
- `crm_automation_rules` — automation trigger/action definitions (trigger_type, conditions_json, action_type, action_config_json, enabled, created_by)

Add columns to `central_vendors`: `tier` (preferred/approved/inactive), `license_number`, `insurance_expiry`, `website`, `vetting_checklist` (jsonb), `user_id` (for portal login link).

RLS policies: all tables scoped to authenticated creators via `has_role(auth.uid(), 'creator')`.

### 1B. CRM Hub Page — `/admin/crm`

- New page component `AdminCRM.tsx`
- Top-level tabs: "Clients" | "Trade Partners"
- Universal search bar across both types
- "Add Contact" dropdown button
- View toggles: Table (default) | Kanban | Card Grid | Map
- **Client table**: Name, Company/Property, Health Score badge, Stage (pipeline), Last Contact, Active Projects count, Balance Due, Tags, AI flag, Actions menu
- **Trade Partner table**: Name, Company, Trade/Specialty, Rating (stars), Tier badge, Active Projects, Availability, Last Engagement, Tags, Actions menu
- Both tables: multi-select, bulk actions bar, column sort/filter, inline edit, saved filter presets, CSV/PDF export
- Update sidebar nav: replace "Clients" and "Vendors" with single "CRM" link
- Add routes: `/admin/crm`, `/admin/crm/clients/:id`, `/admin/crm/trade-partners/:id`, `/admin/crm/pipeline`
- Keep old routes as redirects for backward compatibility

### 1C. Client Profile Redesign — `/admin/crm/clients/:id`

New component `CRMClientProfile.tsx` with 10 tabs:
1. **Overview** — hero card, quick stats, AI intelligence card, property snapshot, sticky notes
2. **Pipeline & Stage** — visual pipeline, stage history, one-click stage change
3. **Timeline** — chronological activity feed, "Log Activity" button with form (call/meeting/email/note), filters by type
4. **Contacts** — associated people list, add/edit contact
5. **Projects** — reuse existing `AdminProjectsSection`
6. **Financial** — invoices, estimates, payments, financial summary card, estimate-to-invoice conversion
7. **Communication** — scoped message thread, AI "Write for me", template picker, scheduled send
8. **Documents & Reports** — files list, report links, document request button
9. **Referrals & Relationships** — referral chain, linked trade partners
10. **Settings** — portal access, notifications, automations, archive/delete

### 1D. AI CRM Assistant — Global Slide-Over Panel

- New edge function `crm-ai-assistant` using Lovable AI gateway
- System prompt with full CRM context (contacts, projects, invoices, activity)
- Supports natural language commands for: contact management, communication drafting, task creation, financial operations, project actions, insights/reports, automation setup
- Shows interpreted action with "Confirm?" before executing mutations
- Streaming responses via SSE
- Triggered by sparkle button in CRM header and on every profile page
- "What can you do?" help prompt
- Session memory within conversation

### 1E. Keyboard Shortcuts

- `N` — new contact
- `F` — focus search/filter
- `?` — open AI assistant

---

## Phase 2 — Trade Partner Profile + Trade Partner Portal

### 2A. Trade Partner Profile — `/admin/crm/trade-partners/:id`

New component `CRMTradePartnerProfile.tsx` with 9 tabs:
1. **Overview** — hero card with specialty tags, tier, rating, license/insurance, AI card
2. **Pipeline & Status** — relationship stages, vetting checklist
3. **Projects & Work History** — all projects, per-project performance, "Assign to Project"
4. **Bids & Quotes** — bid list, status tracking, comparison tool
5. **Timeline & Communication** — activity feed + messaging
6. **Documents** — W-9, insurance, license, contracts, expiry tracking, "Request Document"
7. **Financial** — total paid, open POs, payment history
8. **Reviews & Performance** — internal review log (quality/timeliness/communication/professionalism), AI summary
9. **Portal Access** — invite to portal, manage permissions

### 2B. Trade Partner Portal — `/trade` (Fully Functional)

Wire all pages to live data:
- **Dashboard**: real project count, open tasks, upcoming schedule, unread messages, open bids
- **Projects** (`/trade/projects`): assigned projects list, scoped project detail
- **Tasks** (`/trade/tasks`): tasks across projects, inline status updates, notes
- **Schedule** (`/trade/schedule`): calendar view, mark unavailable, request reschedule
- **Messages** (`/trade/messages`): threaded messaging with admin, file attachments, AI draft assist
- **Documents** (`/trade/documents`): shared files, uploads with category tags, "Submit Invoice"
- **Bids** (`/trade/bids`): bid invitations, submission form, past bid status

Add routes for each tab page. Create `useTradePartnerData` hook for all queries.

---

## Phase 3 — Pipeline View + Dashboard Widget + Automations

### 3A. Pipeline Management — `/admin/crm/pipeline`

- Kanban board with two swimlane groups: Clients (top) and Trade Partners (bottom)
- Client stages: Lead → Onboarding → Active → Proposal Out → Project Running → Completed → At Risk → Churned
- Trade Partner stages: Prospecting → Vetting → Approved → Active → Preferred → Inactive
- Cards: name, key metric, days in stage, last contact, next action
- Drag-and-drop between stages (updates database)
- Summary bar: count and total LTV per stage

### 3B. CRM Dashboard Widget

Add to `/admin` dashboard:
- "Relationships at a Glance" card: totals, health distribution, pipeline counts
- "Today's CRM Actions": tasks due, overdue follow-ups, at-risk clients
- "Recent Activity": last 5 CRM events
- Quick action buttons

### 3C. Smart Automations

Extend existing automations page with CRM triggers:
- Client: portal inactivity, health score drop, invoice overdue, stage completion, welcome sequence
- Trade Partner: insurance/license expiry, project inactivity, bid response timeout, project completion review

---

## Technical Approach

- **Database**: 6 new tables + column additions via migration tool
- **AI**: New `crm-ai-assistant` edge function using Lovable AI gateway (LOVABLE_API_KEY)
- **Routing**: New routes under `/admin/crm/*` with redirects from old paths
- **Components**: ~15 new page/section components, reusing existing UI primitives (Card, Table, Badge, Dialog, Tabs, etc.)
- **Data hooks**: New `useCRMContacts`, `useCRMPipeline`, `useTradePartnerData` hooks
- **Design**: Matches existing HBC design system — navy accents, cream backgrounds, `font-sans`, consistent card styles
- **Empty states**: Beautiful, action-oriented for every list
- **Loading states**: Skeleton loaders on all data components
- **Mobile**: Responsive across all CRM pages

---

## Implementation Order

Each phase will be broken into implementation messages:

**Phase 1** (prioritized):
1. Database migrations (new tables + columns)
2. CRM Hub page with both tables and view toggles
3. Client profile redesign (10 tabs)
4. AI CRM Assistant edge function + slide-over panel
5. Sidebar navigation update + route wiring

**Phase 2**:
6. Trade Partner profile (9 tabs)
7. Trade Partner portal — all 7 functional pages

**Phase 3**:
8. Pipeline Kanban view
9. Dashboard CRM widget
10. Automation rules engine

