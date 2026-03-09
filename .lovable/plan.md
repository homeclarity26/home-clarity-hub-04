

## Completed So Far

1. Database persistence (reports, report_pages, edit history)
2. Enhanced edit mode UX (CreatorBar, editable fields/specs/tiers/dropdowns)
3. Creator Admin Portal (all pages wired to real DB)
4. AI Client Chat Assistant (edge function + slide-up panel)
5. AI Creator Editing Panel (sparkle button + diff preview)
6. Client Comments on report pages
7. Client Portal wired to real DB (dynamic property/report/pages loading)
8. Admin mobile responsiveness (collapsible sidebar)
9. Admin settings wired to profile
10. Report landing page with dynamic TOC
11. Photo grid wiring in report pages

## What Remains

| Priority | Feature | Description |
|----------|---------|-------------|
| **High** | Projects tab — dynamic data | Currently hardcoded "Furnace Replacement", "Electrical Panel Upgrade" etc. Should pull recommendations with timing from `report_pages` and allow clients to mark projects as approved/in-progress/complete. Needs a `projects` table. |
| **High** | Contacts tab — dynamic data | Hardcoded "Adam Kinney". Should pull creator profile from the report's `created_by`, and eventually vendor contacts from a `vendors` table. |
| **High** | Schedule tab — dynamic data | Fully hardcoded dates. Should pull from a `schedule_events` table linked to properties. |
| **High** | Payments tab — dynamic data | Hardcoded balance and transactions. Needs a `payments`/`invoices` table or Stripe integration. |
| **Medium** | Knowledge Base — real persistence | Admin knowledge base uses mock pricing/scope/system templates. Needs a `knowledge_templates` table. |
| **Medium** | New Report Wizard — seed report pages | Wizard creates property + report but doesn't seed `report_pages`. Should generate default pages from templates. |
| **Medium** | Image upload to storage | `ImageUploader` uploads to Supabase storage but needs a storage bucket configured and wired end-to-end. |
| **Low** | Activity feed — real data | Admin dashboard activity feed is mock. Needs an `activity_log` table with triggers on key actions. |

## Recommended Next Pass: Dynamic Portal Tabs + New Report Seeding

Build the most impactful remaining work: make the four static client tabs dynamic and complete the new report creation flow.

### 1. Projects Tab — Dynamic from Report Data
- Pull all `report_pages` that have `timing` or `recommendations` and display them as "upcoming considerations"
- Create a `projects` table: `id, property_id, report_page_id, title, status (planned/approved/in_progress/complete), approved_tier, notes, created_at, updated_at`
- Allow clients to "approve" a recommendation which creates a project record
- Show active/completed projects from the `projects` table

### 2. Contacts Tab — Dynamic Creator Info
- Pull the report's creator profile (name, email, phone) from `profiles` via `useClientPortal`
- Display dynamically instead of hardcoded "Adam Kinney"
- Keep vendor placeholders as-is (future feature)

### 3. Schedule Tab — Events Table
- Create `schedule_events` table: `id, property_id, title, description, event_date, event_type (appointment/milestone/reminder), status, created_at`
- RLS: clients see their property's events, creators manage all
- Admin can add events from client detail page
- Client sees real upcoming events

### 4. Payments Tab — Invoices Table
- Create `invoices` table: `id, property_id, description, amount, status (pending/paid/overdue), due_date, paid_date, created_at`
- RLS: clients see their property's invoices, creators manage all
- Admin can create invoices from client detail page
- Client sees real balance and transaction history

### 5. New Report Wizard — Seed Report Pages
- When wizard creates a report, also seed default `report_pages` from a template set (e.g., HVAC, Roofing, Electrical, Plumbing, Foundation, Kitchen, Bathroom)
- Each page gets default group_name, page_key, title, empty narrative, draft status

### Database Migrations
```sql
-- projects table
CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  report_page_id uuid REFERENCES report_pages(id),
  title text NOT NULL,
  status text NOT NULL DEFAULT 'planned',
  approved_tier text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- schedule_events table
CREATE TABLE schedule_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  event_date timestamptz NOT NULL,
  event_type text NOT NULL DEFAULT 'appointment',
  status text NOT NULL DEFAULT 'scheduled',
  created_at timestamptz DEFAULT now()
);

-- invoices table
CREATE TABLE invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  description text NOT NULL,
  amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  due_date date,
  paid_date date,
  created_at timestamptz DEFAULT now()
);
```

### Files to Create/Modify
- **Migration**: 3 new tables + RLS policies
- `src/components/tabs/ProjectsTab.tsx` — dynamic from report_pages + projects table
- `src/components/tabs/ContactsTab.tsx` — dynamic creator info from useClientPortal
- `src/components/tabs/ScheduleTab.tsx` — dynamic from schedule_events
- `src/components/tabs/PaymentsTab.tsx` — dynamic from invoices
- `src/hooks/useClientPortal.ts` — expose creator profile data (already has `creatorName`)
- `src/components/admin/NewReportWizard.tsx` — seed report_pages on creation
- `src/pages/Index.tsx` — pass additional portal data to tabs

