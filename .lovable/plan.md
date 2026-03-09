

# Projects Management System — Implementation Plan

## Database Changes

**1. Add columns to `projects` table:**
- `description` (text, nullable)
- `estimated_start_date` (date, nullable)
- `estimated_cost` (numeric, nullable)
- `contractor_name` (text, nullable)
- `contractor_contact` (text, nullable)

**2. Create `milestones` table:**
```sql
CREATE TABLE milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  due_date date,
  completed boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

**3. RLS on milestones:**
- Creators: ALL access
- Clients: SELECT + UPDATE (toggle completed) via property ownership chain through projects → properties

## Client Portal — `ProjectsTab.tsx` (full rewrite)

**Active Projects section:**
- Query projects with their milestones (separate query or join)
- Each project card shows: title, status badge (color-coded: planned=grey, in_progress=amber, approved=green, complete=blue), estimated start date, estimated cost, contractor name
- Cards are expandable (Collapsible) to reveal: milestone checklist with checkboxes (client can toggle completed), notes field (read-only), contractor contact info

**Upcoming Considerations section:**
- Already pulls from `pages` prop where `timing` is set — keep this, already works correctly with urgency badges

**Project Archive section:**
- Show completed projects in a collapsed Collapsible with a scrollable list inside, using `ScrollArea`

**Empty state:** Keep current "No Active Projects" card when no projects exist

## Admin Panel — `AdminClientDetail.tsx` Projects Tab

**Enhanced "Create Project" dialog:**
- Add fields: Description (textarea), Estimated Start Date (date input), Estimated Cost (number input), Linked Report Page (dropdown from `reportPages` query already available), Contractor Name (text), Contractor Contact (text)

**Table columns update:**
- Add: Start Date, Cost, Contractor columns
- Keep: Name, Status (inline dropdown), Actions (Edit/Delete)

**Milestones management:**
- Add expandable row or inline section per project with "Add Milestone" button
- Each milestone row: title input, due date, completed checkbox, delete button
- Milestones saved immediately on add/toggle/delete (no separate save button)

## Files to Change

| File | Change |
|------|--------|
| Migration SQL | Add columns to projects, create milestones table + RLS |
| `src/components/tabs/ProjectsTab.tsx` | Full rewrite with expandable cards, milestones, archive section |
| `src/pages/admin/AdminClientDetail.tsx` | Enhanced project form fields, milestones inline management, updated table columns |
| `src/integrations/supabase/types.ts` | Auto-updated after migration |

