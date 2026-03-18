

# Plan: Build 20 Killer Features for Home Clarity Hub

Based on codebase analysis, here are the 20 features organized into a build sequence that maximizes shared infrastructure. Each feature is scoped to be implementable independently.

---

## Feature Build Order

### 1. Client Health Score Dashboard
**What:** Composite 0-100 score per client based on report completion %, overdue equipment, unpaid invoices, message recency, and project progress. Show as color-coded badge in `ClientTable.tsx` and a breakdown card in `AdminClientDetail` overview.
**How:** Add a `computeClientHealthScore()` utility function. Inputs: `completePages/totalPages`, overdue equipment count, outstanding invoice amount, days since last message, active project count. Weight and normalize to 0-100. Render as a circular gauge in the admin client detail and a colored dot in the client list.

### 2. Revenue Analytics Dashboard
**What:** Replace the static revenue stats cards on `AdminDashboard` with a dedicated analytics section showing monthly revenue chart (bar chart), collection rate %, average invoice value, and revenue by client.
**How:** Add a `RevenueAnalytics` component using recharts. Query `invoices` and `payments_posted` grouped by month. Display as bar chart + summary KPIs. Add as a collapsible section on the dashboard.

### 3. AI Report QA Coach
**What:** On each report page in the admin editor, add a "QA Check" button that analyzes the narrative for completeness, clarity, and missing data points. Returns suggestions like "Consider adding estimated cost" or "Narrative is too short."
**How:** Create edge function `qa-coach` using Gemini. Pass the page's narrative, condition rating, findings, and block_config. Return an array of suggestions with severity. Display as a sidebar panel in the report page editor.

### 4. Batch Operations for Admin
**What:** Add multi-select checkboxes to `ClientTable` and `ReportPageManager`. Enable bulk actions: bulk status change, bulk AI draft, bulk email send.
**How:** Add checkbox column to tables, a floating action bar when items are selected, and batch mutation functions. For bulk AI draft, queue sequential calls to `draft-page-narrative`.

### 5. Interactive Home Health Dashboard (Client)
**What:** Visual house cross-section diagram on the client Home tab where each major system (roof, HVAC, plumbing, electrical, exterior walls, interior) is color-coded by condition rating from the report.
**How:** Create an SVG house diagram component. Map report page `group_name` to house sections. Color each section based on worst condition in that group (red/amber/green). Clickable sections navigate to that report chapter.

### 6. Project Approval Workflow (Client)
**What:** On report pages with pricing tiers, add an "Approve This Tier" button in the client portal. Opens a confirmation modal with tier details, then auto-creates a project + draft invoice and notifies admin.
**How:** Add approval button to `PricingTiers.tsx` (client view). On confirm, insert into `projects` table with `status: 'approved'`, create invoice line item, and insert activity_log entry. Toast with link to Projects tab.

### 7. Seasonal Maintenance Checklists (Client)
**What:** Auto-generated quarterly checklists based on equipment registry and report condition ratings. Show on Home tab as an interactive checklist.
**How:** Create `SeasonalChecklist` component. Generate items from equipment `next_service_date` and report page recommendations. Store completion state in a new `checklist_items` table (property_id, item_key, quarter, completed, completed_at). Display current season's checklist with checkboxes.
**DB:** New `checklist_items` table.

### 8. Document Vault with AI Categorization
**What:** Enhance `DocumentsTab` with drag-and-drop upload, AI auto-categorization of uploaded files, and folder-style organization.
**How:** Add drag-drop zone using native HTML5 drag events. On upload, call a Gemini edge function that reads the filename + first page content to suggest a category. Auto-tag and sort into virtual folders.

### 9. Annual Home Report Card
**What:** Auto-generated yearly summary showing systems improved vs. deteriorated, total maintenance spent, home value change, completed projects, and upcoming priorities. Viewable in portal and downloadable as PDF.
**How:** Create `AnnualReportCard` component. Aggregate data from report_pages condition changes, payments_posted totals, home_value_history, and completed projects. Add PDF generation using existing react-pdf infrastructure.

### 10. Smart Scheduling with Conflict Detection
**What:** Enhance the admin schedule event creation with conflict detection (overlapping events), suggested optimal timing based on equipment service dates, and automated reminder generation.
**How:** When creating a schedule event, query existing events for date overlap. Show warning if conflict found. Auto-suggest dates based on equipment `next_service_date`. Create reminder entries 7 and 1 day before.

### 11. Client Comparison View (Admin)
**What:** Side-by-side comparison of 2-3 clients showing their health scores, report completion, equipment status, and financial summary.
**How:** New admin page `/admin/compare`. Multi-select clients from dropdown. Display comparison table with key metrics side by side.

### 12. Template Marketplace (Admin)
**What:** Browse, preview, and clone report page templates. Admin can create custom templates from existing pages and share them across clients.
**How:** New admin page `/admin/templates`. CRUD on `page_templates` table. "Save as Template" button on any report page. Preview modal showing block_config layout.

### 13. Photo Annotation Tool
**What:** On report section photos, allow admin to add annotations (arrows, circles, text callouts) to highlight specific issues. Clients see annotated versions.
**How:** Canvas-based annotation overlay on images. Store annotations as JSON alongside the image URL in the `images` JSONB array. Render annotations on client view.

### 14. Equipment Lifecycle Predictor
**What:** For each equipment item, show a predictive replacement timeline based on age, condition, and industry averages. Display as a visual timeline in the Equipment tab.
**How:** Create `EquipmentLifecycleChart` component. Use install_date + category-based average lifespans (stored as constants) to calculate expected replacement year. Display as a horizontal timeline with items positioned by replacement urgency.

### 15. Client Portal Customization (Admin)
**What:** Admin can customize the client portal appearance per client: choose accent color, upload a custom header image, toggle which tabs are visible.
**How:** Add `portal_config` JSONB column to `properties` table. Admin UI with color picker and tab toggles. Client portal reads config and applies overrides.
**DB:** Add `portal_config` JSONB column to `properties`.

### 16. Automated Follow-Up Sequences
**What:** After report publish, auto-schedule a sequence of follow-up touchpoints: 1-week check-in, 30-day review, 90-day action plan reminder. Show in admin as a timeline.
**How:** When report status changes to `published`, insert a series of `schedule_events` with predefined offsets. Display as a "Follow-Up Sequence" section in admin client detail.

### 17. Client Satisfaction Tracking
**What:** Expand the existing `FeedbackWidget` into a full satisfaction tracking system. Track NPS scores over time, show trends on admin dashboard.
**How:** Add `feedback_type` (nps, csat, general) to feedback table. New `SatisfactionDashboard` component on admin side showing average NPS, response rate, and trend chart.
**DB:** Add `feedback_type` column to `feedback` table.

### 18. Vendor Performance Tracking
**What:** Track vendor performance across projects: on-time completion rate, client satisfaction, cost accuracy. Display as a vendor scorecard.
**How:** Add `actual_cost`, `completed_date`, `client_rating` to projects table. Aggregate by vendor name. Display as a vendor performance dashboard in admin.
**DB:** Add columns to `projects` table.

### 19. Home Warranty Tracker
**What:** Dedicated warranty management section showing all active warranties, expiration dates, coverage details, and claim contact info. Alert when warranties are expiring.
**How:** Use existing equipment `warranty_expiry` field. Create `WarrantyTracker` component for client Equipment tab showing warranty status, days remaining, and expiring-soon alerts. Add `warranty_details` JSONB to equipment table.
**DB:** Add `warranty_details` JSONB to `equipment`.

### 20. Multi-Property Support
**What:** Allow clients to have multiple properties linked to their account. Add a property switcher in the portal header.
**How:** The data model already supports this (properties.client_user_id can have multiple rows). Add a property selector dropdown in the portal header. Update `useClientPortal` to accept a selected property ID. Store last-viewed property in localStorage.

---

## Implementation Sequence

Build in this order to maximize shared infrastructure:

```text
Phase 1 (Core Value):     1 → 2 → 5 → 6
Phase 2 (AI & Content):   3 → 8 → 9
Phase 3 (Operations):     4 → 10 → 16
Phase 4 (Engagement):     7 → 14 → 19
Phase 5 (Platform):       12 → 15 → 20
Phase 6 (Analytics):      11 → 13 → 17 → 18
```

## Database Changes Required

| Feature | Migration |
|---------|-----------|
| 7 | New `checklist_items` table |
| 15 | Add `portal_config` JSONB to `properties` |
| 17 | Add `feedback_type` to `feedback` |
| 18 | Add `actual_cost`, `completed_date`, `client_rating` to `projects` |
| 19 | Add `warranty_details` JSONB to `equipment` |

## Edge Functions Required

| Feature | Function |
|---------|----------|
| 3 | `qa-coach` (Gemini) |
| 8 | `categorize-document` (Gemini) |

All other features are purely frontend + existing Supabase queries.

