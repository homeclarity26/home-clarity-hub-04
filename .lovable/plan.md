

## Creator Admin Portal — Implementation Plan

This is a large feature set. I'll break it into what can be built in this pass and what should be deferred.

### What to Build Now

**Routing restructure** — Move client portal to `/portal/:propertyId` and add `/admin/*` routes. Update login to redirect based on role. The existing `Index.tsx` becomes the portal page.

**Admin layout** — Sidebar (240px) + header bar with breadcrumbs, search, notification bell, "+ New Report" button. Clean white/grey design using Inter font and shadcn components. NOT the Dynastic Minimalism style.

**Admin pages with mock data:**

1. **Dashboard** (`/admin`) — Stats row (active clients, reports in progress, unanswered questions, published reports), recent activity feed, abbreviated client list (5 most recent), quick action buttons.

2. **Client List** (`/admin/clients`) — Full searchable/filterable table: name, address, status badge, version, last updated, unread comments, action buttons.

3. **Individual Client** (`/admin/clients/:clientId`) — Tabbed management page:
   - Overview: client info card, report status/version history, quick stats
   - Report: "Open in Portal" button + page manager table (name, group, status, drag reorder, + Add Custom Page)
   - Files: upload zones by category with thumbnails
   - Comments: filterable list with inline response
   - Projects, Payments, Schedule: management tables with forms

4. **Knowledge Base** (`/admin/knowledge-base`) — Pricing templates table, scope templates, system templates, versioning UI.

5. **New Report Wizard** (`/admin/clients/new`) — 4-step flow: Client Info → Upload Data → AI Generation (placeholder) → Review & Publish.

6. **Settings** (`/admin/settings`) — Account and integration settings placeholder.

### File Structure

```text
src/
  layouts/
    AdminLayout.tsx          — sidebar + header wrapper
  components/admin/
    AdminSidebar.tsx         — fixed 240px sidebar
    AdminHeader.tsx          — breadcrumbs, search, bell, + New Report
    StatsCard.tsx            — reusable stat card
    ActivityFeed.tsx         — recent activity list
    ClientTable.tsx          — full client table with filters
    ClientOverview.tsx       — client info + report stats
    ReportPageManager.tsx    — table of report pages with status
    FileManager.tsx          — file upload zones by category
    CommentsManager.tsx      — comments list with responses
    KnowledgeBase.tsx        — pricing/scope/system templates
    NewReportWizard.tsx      — 4-step wizard
  pages/
    admin/
      AdminDashboard.tsx
      AdminClients.tsx
      AdminClientDetail.tsx
      AdminKnowledgeBase.tsx
      AdminSettings.tsx
      AdminNewReport.tsx
  data/
    adminMockData.ts         — mock clients, activity, stats matching Johnson Residence
```

### Routing Changes

- `/portal/:propertyId` — client portal (current `Index.tsx`, wrapped with `EditModeProvider`)
- `/admin` — admin dashboard (creator only)
- `/admin/clients` — client list
- `/admin/clients/new` — new report wizard
- `/admin/clients/:clientId` — client detail (with tab parameter)
- `/admin/clients/:clientId/report` — redirects to portal in edit mode
- `/admin/knowledge-base` — templates
- `/admin/settings` — settings
- `/login` — routes creators → `/admin`, clients → `/portal/:propertyId`

### Login Redirect Logic

After sign-in, check role:
- `creator` → navigate to `/admin`
- `client` → fetch their first property → navigate to `/portal/:propertyId`

### Design Approach

- White background (`bg-white`), light grey sidebar (`bg-gray-50`)
- Inter font throughout (add `font-sans` class, no Playfair)
- Dense tables using shadcn `Table` components
- Status badges: Draft = `bg-gray-100 text-gray-600`, In Review = `bg-amber-50 text-amber-700`, Published = `bg-[#1B2B4D] text-white`
- Navy (`#1B2B4D`) for primary buttons, gold (`#C9A961`) for status accents
- All shadcn components: `Card`, `Table`, `Badge`, `Tabs`, `Button`, `Input`, `Select`, `Dialog`

### What's Deferred

- Real file uploads (UI only, store references)
- Real AI generation (placeholder progress UI)
- Real payment processing (UI only)
- Database tables for comments, files, projects, invoices (mock data for now)
- Drag-to-reorder pages (UI placeholder)

### Connection to Client Portal

- "Open in Portal" buttons link to `/portal/:propertyId?edit=true`
- Creator bar in portal gets "Back to Admin" link → `/admin/clients/:clientId`
- Settings gear in current header links to `/admin`

This is a large build (~20 files). I'll create the routing, layout, mock data, and all admin pages in one pass.

