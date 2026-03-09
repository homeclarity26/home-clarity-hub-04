

## Status Check

All core features are now wired to the database with no remaining mock data. Here's where things stand:

**Fully Complete:**
- Database persistence for all tables (reports, report_pages, projects, invoices, schedule_events, client_files, knowledge_templates, activity_log)
- Client portal with all 6 dynamic tabs
- Admin portal with CRUD for projects, invoices, schedule events, files
- Knowledge base with real persistence
- Activity feed with DB triggers
- AI chat assistant + AI editing panel
- Comments system
- Edit mode with CreatorBar, editable fields/specs/tiers
- New Report Wizard with auto-seeded pages

**Remaining Polish & Enhancements:**

| Priority | Feature | Effort |
|----------|---------|--------|
| **High** | Confirmation dialogs before delete actions | Small |
| **High** | Seed default knowledge base templates | Small |
| **Medium** | Edit dialogs for existing projects/invoices/events (currently only create + delete + status change) | Medium |
| **Medium** | Realtime subscriptions on activity feed + comments | Small |
| **Medium** | Report page image upload wiring (ImageUploader saves URLs but ReportPage doesn't pass images to EditableSection or persist them via updatePageData) | Small |
| **Low** | Report PDF export | Large |
| **Low** | Email notifications for comments/status changes | Medium |
| **Low** | Multi-property support per client | Medium |

## Recommended Next Pass: Polish & Complete Gaps

### 1. Confirmation Dialogs on Destructive Actions
Add `AlertDialog` before deleting projects, invoices, events, files, and knowledge templates in `AdminClientDetail.tsx`, `FileManager.tsx`, and `KnowledgeBase.tsx`.

### 2. Seed Default Knowledge Base Templates
Insert 5 starter pricing templates (Kitchen Remodel, Roof Replacement, HVAC System, Bathroom Renovation, Exterior Painting) via migration so the Knowledge Base isn't empty on first load.

### 3. Wire Image Upload in Report Pages
`ReportPage.tsx` passes no `images` prop to `EditableSection`. Fix by passing `pageData.images` (from `report_pages.images` column) and saving uploaded URLs back via `updatePageData({ images })`. The `useReportPage` hook already handles saving arbitrary fields.

### 4. Realtime Activity Feed
Add Supabase realtime subscription on `activity_log` table so new activities appear live on the admin dashboard without refresh. Enable realtime publication for `activity_log`.

### 5. Edit Dialogs for Existing Records
Add edit capability (not just create/delete/status) for projects, invoices, and events — clicking a row opens a pre-filled dialog to edit all fields.

### Files to Modify
- `src/pages/admin/AdminClientDetail.tsx` — confirmation dialogs + edit dialogs
- `src/components/admin/FileManager.tsx` — confirmation dialog on delete
- `src/components/admin/KnowledgeBase.tsx` — confirmation dialog + edit dialog
- `src/components/report/ReportPage.tsx` — wire images prop
- `src/hooks/useReportPage.ts` — ensure images field loads/saves
- `src/pages/admin/AdminDashboard.tsx` — realtime subscription
- **Migration**: seed knowledge templates + enable realtime on activity_log

