

## Next Pass: Admin CRUD for Schedule/Invoices/Projects + Knowledge Base + Activity Feed + Image Upload

Everything on the client portal side is now wired to the database. The remaining gaps are on the **admin side** (still using mock data for several features) and **infrastructure** (image upload, activity logging).

### What to Build

**1. Admin Client Detail — Wire Projects/Payments/Schedule tabs to real DB**
The admin `AdminClientDetail.tsx` still renders `mockProjects` and `mockInvoices` for the Projects, Payments, and Schedule tabs. Wire these to the real `projects`, `invoices`, and `schedule_events` tables. Add create/edit dialogs so creators can manage these from the admin panel.

- Replace `mockProjects`/`mockInvoices` imports with real queries filtered by `property_id`
- Add "Create Project" dialog (title, status, notes)
- Add "Create Invoice" dialog (description, amount, due_date, status)
- Add "Add Event" dialog for schedule tab (title, date, type)
- Wire the Schedule tab to `schedule_events` table instead of hardcoded reminders

**2. Knowledge Base — Persist to DB**
Currently uses `mockPricingTemplates` from `adminMockData.ts`. Create a `knowledge_templates` table and wire `KnowledgeBase.tsx` to CRUD from it.

- Migration: `knowledge_templates` table with `id, category (pricing/scope/systems), title, content (jsonb), region, version, created_at, updated_at`
- RLS: creators only
- Wire all three tabs (pricing, scope, systems) to real data
- Add create/edit dialogs

**3. Activity Feed — Real Activity Log**
Dashboard activity feed uses `mockActivities`. Create an `activity_log` table populated by DB triggers on key actions (comment added, report published, file uploaded, report page edited).

- Migration: `activity_log` table with `id, user_id, property_id, action_type, message, metadata (jsonb), created_at`
- DB triggers on: `report_comments` INSERT, `reports` status UPDATE, `report_pages` UPDATE
- RLS: creators can view all
- Wire `ActivityFeed.tsx` and `useAdminStats` to real data

**4. Image Upload End-to-End**
Storage bucket `report-images` exists but the uploader may not be fully wired. Verify `ImageUploader.tsx` uploads to the bucket and saves URLs back to `report_pages.images`.

### Priority Order
1. Admin client detail — real projects/invoices/schedule CRUD (highest impact, completes admin)
2. Activity feed — real activity log with triggers
3. Knowledge base persistence
4. Image upload verification/wiring

### Database Migrations
```sql
-- knowledge_templates
CREATE TABLE public.knowledge_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL, -- 'pricing', 'scope', 'systems'
  title text NOT NULL,
  content jsonb NOT NULL DEFAULT '{}',
  region text,
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.knowledge_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators can manage templates"
  ON public.knowledge_templates FOR ALL
  USING (public.has_role(auth.uid(), 'creator'));

-- activity_log
CREATE TABLE public.activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  message text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators can view activity"
  ON public.activity_log FOR ALL
  USING (public.has_role(auth.uid(), 'creator'));

-- Triggers for auto-logging
CREATE FUNCTION log_comment_activity() ...
CREATE FUNCTION log_report_status_change() ...
```

### Files to Create/Modify
- **Migration**: 2 new tables + triggers
- `src/pages/admin/AdminClientDetail.tsx` — replace mock data with real queries + add create dialogs
- `src/components/admin/KnowledgeBase.tsx` — wire to `knowledge_templates` table + add edit/create dialogs
- `src/components/admin/ActivityFeed.tsx` — accept real data from `activity_log`
- `src/pages/admin/AdminDashboard.tsx` — query `activity_log` instead of `mockActivities`
- `src/hooks/useAdminData.ts` — add hooks for projects, invoices, schedule_events, activity_log
- `src/components/editor/ImageUploader.tsx` — verify upload flow to storage bucket

