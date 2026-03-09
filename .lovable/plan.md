

## What's Done So Far

1. Database persistence (reports, report_pages, edit history) — Done
2. Enhanced edit mode UX (CreatorBar, editable fields/specs/tiers/dropdowns) — Done
3. Creator Admin Portal (routing, layout, dashboard, clients, knowledge base, wizard, settings) — Done

## What's Remaining (from original gap analysis)

| Priority | Feature | Description |
|----------|---------|-------------|
| **High** | Connect admin to real database | Admin currently uses mock data. Wire client list, dashboard stats, and client detail pages to real `properties`, `reports`, `report_pages`, and `profiles` tables. |
| **High** | AI Assistant — Client chat | Footer search bar is non-functional. Build a chat panel that slides up, powered by AI with report content context. |
| **High** | AI Assistant — Creator editing panel | 350px right panel with sparkle button on blocks, instruction input, diff preview, Apply/Discard. |
| **Medium** | Report landing page | Navy hero page when Report tab clicked without selecting a specific page. |
| **Medium** | Client comments on report pages | Notes/questions section at bottom of each page, visible in both portal and admin. |
| **Medium** | Back to Admin navigation | "Back to Admin" button in CreatorBar when portal opened from admin link. |
| **Medium** | Admin mobile responsiveness | Collapsible sidebar, responsive tables. |
| **Low** | Photo grid wiring | Image grid exists but isn't in the report page template. |

## Recommended Next Step: **Connect Admin to Real Database**

This is the logical next step — the admin portal exists but runs entirely on mock data. Wiring it to real data makes the admin functional and is prerequisite for the AI assistants and comments features.

### What to build

1. **AdminDashboard** — Query `properties` (count), `reports` (count by status), `report_pages` (count by status) for real stats. Activity feed stays mock for now (needs an `activity_log` table later).

2. **AdminClients page** — Replace `mockClients` with a query joining `properties` → `reports` → `profiles` to build the client table with real names, addresses, statuses.

3. **AdminClientDetail** — Fetch the specific property, its report, report pages, and client profile. Wire the Overview tab stats and Report tab page manager to real data.

4. **NewReportWizard** — On Step 1 completion, actually INSERT into `profiles`, `properties`, `reports`, and seed `report_pages` rows. This creates real client records.

5. **No new tables needed** — Existing schema covers all of this. May need a small migration to add a `phone` and `email` column to `profiles` if not present.

### Files to modify
- `src/pages/admin/AdminDashboard.tsx` — real queries
- `src/pages/admin/AdminClients.tsx` — real queries replacing mock
- `src/pages/admin/AdminClientDetail.tsx` — real queries
- `src/components/admin/ClientTable.tsx` — accept real data shape
- `src/components/admin/ClientOverview.tsx` — accept real data
- `src/components/admin/ReportPageManager.tsx` — real report_pages query
- `src/components/admin/NewReportWizard.tsx` — real inserts on completion
- `src/data/adminMockData.ts` — keep as fallback but no longer primary
- Migration: add `email` and `phone` to `profiles` table

