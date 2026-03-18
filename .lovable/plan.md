

# Implementation Plan — 8 Tasks

## Task 1: Admin Messages Panel
**File: `src/components/admin/AdminMessagesSection.tsx` (new)**

Create a new component mirroring `MessagesTab.tsx` but styled for admin. Query `property_messages` for the given property, show full thread, allow reply, mark unread as read on mount.

**File: `src/pages/admin/AdminClientDetail.tsx`**
- Add `"messages"` to the `ClientTab` type and `tabs` array
- Render `<AdminMessagesSection propertyId={client.propertyId} />` when `activeTab === "messages"`

## Task 2: Unread Message Badges
**File: `src/pages/admin/AdminClientDetail.tsx`**
- Query `property_messages` for unread count (where `sender_id != current user` and `is_read = false`) for this property
- Show badge next to "Messages" tab label

**File: `src/hooks/useAdminData.ts`**
- In `useAdminClients`, add a query for `property_messages` where `is_read = false` grouped by property, add `unreadMessages` field to `AdminClient`

**File: `src/components/admin/ClientTable.tsx`**
- Add a "Messages" column showing unread count with a `MessageSquare` icon (similar to existing Comments column)

## Task 3: Report Completion Auto-Calculation
Already implemented. `useClientPortal.ts` line 255-266 already calculates `completionPercent` dynamically from `dbPages` where `status === "complete"`. The `ReportPageManager` also does live calculation. The `HomeTab` receives `completionPercent` as a prop and renders it. No changes needed — this is already working.

## Task 4: Page Status Workflow Controls
Already implemented. `ReportPageManager.tsx` already has inline `<Select>` dropdowns for each page status with options: Draft, Needs Review, Complete, Published, Inactive. Updates Supabase immediately on change and recalculates completion. No changes needed.

## Task 5: Property Value Widget on HomeTab
**File: `src/components/tabs/HomeTab.tsx`**
- Add `estimatedValue?: number | null` prop
- Display formatted dollar amount in the hero section below the address (or "Value estimate pending" if null)

**File: `src/pages/Index.tsx`**
- Pass `estimatedValue={portal.property?.estimated_value}` to `HomeTab`

## Task 6: PDF Download in Client Portal
Already implemented. `ReportTab.tsx` line 332-342 already renders `<PDFDownloadButton>` in the report hero when `pdfData` is provided. The `pdfData` is already built in `Index.tsx` and passed to `ReportTab`. No changes needed.

## Task 7: Schedule Tab Calendar View
**File: `src/components/tabs/ScheduleTab.tsx` (rewrite)**
- Replace the list view with a monthly calendar grid
- Show a month header with prev/next navigation
- Render a 7-column grid (Sun-Sat) with day cells
- Place event dots/badges on their corresponding dates
- Click a day to expand and show events for that day
- Keep the existing seasonal checklists and quick actions below the calendar
- Use brand colors: Navy `#1B2B4D`, Rust `#B7410E`, Cream `#E8DCC4`

## Task 8: Create Project from Tier Flow
**File: `src/components/report/PricingTiers.tsx`**
- Add props: `pageTitle`, `pageKey`, `propertyId`, `onProjectCreated`
- Add a "Create Project" button below each tier card
- On click: insert into `projects` table with title = `{pageTitle} — {tierLabel}`, estimated_cost parsed from price, description = tier description
- Show toast with success message

**File: `src/components/report/BlockRenderer.tsx`**
- Pass `pageTitle`, `pageKey`, `propertyId` props through to `PricingTiers`

**File: `src/components/report/ReportPage.tsx`**
- Pass `propertyId` to `BlockRenderer`

---

## Execution Order
1. Task 1 — Admin Messages Panel (new component + wire into AdminClientDetail)
2. Task 2 — Unread badges (useAdminData + ClientTable + AdminClientDetail tab)
3. Task 5 — Property value widget (HomeTab + Index)
4. Task 7 — Schedule calendar view (ScheduleTab rewrite)
5. Task 8 — Create project from tier (PricingTiers + BlockRenderer)
6. Tasks 3, 4, 6 — Already implemented, no changes needed

## Files Changed
| File | Change |
|------|--------|
| `src/components/admin/AdminMessagesSection.tsx` | New — admin messages thread |
| `src/pages/admin/AdminClientDetail.tsx` | Add messages tab + unread badge |
| `src/hooks/useAdminData.ts` | Add unread messages to AdminClient |
| `src/components/admin/ClientTable.tsx` | Add messages column |
| `src/components/tabs/HomeTab.tsx` | Add estimated value display |
| `src/pages/Index.tsx` | Pass estimatedValue prop |
| `src/components/tabs/ScheduleTab.tsx` | Calendar view rewrite |
| `src/components/report/PricingTiers.tsx` | Add Create Project buttons |
| `src/components/report/BlockRenderer.tsx` | Pass props for tier project creation |

