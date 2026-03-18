

# UX Improvements Plan

## Overview
This plan covers 10 distinct changes across the client portal and admin side. I'll group them by file to minimize edits.

---

## 1. Payments Tab — Rename Title & Add Stripe Placeholder
**File: `src/components/tabs/PaymentsTab.tsx`**
- Line 330: Change "Payments & Financial History" → "Payments & Invoices"
- Transaction History sub-tab (lines 441-478): Already correctly pulls only from `paymentsPosted` — no hardcoded data. The mock data at lines 93-101 only loads for `mock-` propertyIds, which is the dev bypass pattern used everywhere. No changes needed here.
- Add a "Make a Payment" card in the Quick Actions section (after line 497) with a Stripe "coming soon" note and a credit card icon.

## 2. Projects Tab — "Ask About This Project" Button
**File: `src/components/tabs/ProjectsTab.tsx`**
- Add `onTabChange` call with a pre-filled message mechanism
- Inside the expanded project CollapsibleContent (around line 272), add a button: "Ask About This Project"
- Clicking it calls `onTabChange?.("messages")` and passes a pre-filled message via a new prop or URL state
- **Approach**: Add an optional `onAskAboutProject?: (projectName: string) => void` prop. In `Index.tsx`, when called, switch to messages tab and set a pre-filled message state that gets passed to `MessagesTab`.

**File: `src/pages/Index.tsx`**
- Add `pendingMessage` state
- Pass `onAskAboutProject` to ProjectsTab that sets the message and switches to messages tab
- Pass `initialMessage` prop to MessagesTab

**File: `src/components/tabs/MessagesTab.tsx`**
- Accept `initialMessage?: string` prop, populate the input field when it changes

## 3. Equipment Tab — "Schedule Service" Button
**File: `src/components/tabs/EquipmentTab.tsx`**
- On cards where `getServiceStatus` returns "Service Due Soon", "Service Overdue", or "Warranty Expired", add a "Schedule Service" button
- Uses the same `onAskAboutProject`-style pattern: new `onRequestService?: (equipmentName: string) => void` prop
- In `Index.tsx`, wire it to switch to messages with pre-filled text

## 4. Documents Tab — Search & Category Filter
**File: `src/components/tabs/DocumentsTab.tsx`**
- Add `searchQuery` and `categoryFilter` state
- Add a search `Input` and a `Select` dropdown for category filtering below the hero section
- Filter the `files` array by both before rendering categories

## 5. Admin Dashboard — "+ Invite / Add Client" Button
**File: `src/pages/admin/AdminDashboard.tsx`**
- The dashboard already has revenue stats (Total Invoiced, Collected, Outstanding, Overdue) and a Needs Attention section. These are already implemented.
- Add a "+ Invite / Add Client" button to Quick Actions (line 108 area), alongside the existing "Create New Report" button. Use `UserPlus` icon, navigate to `/admin/clients/new`.

## 6. Admin Clients Table — Onboarding Progress Column
**File: `src/components/admin/ClientTable.tsx`**
- Add an "Onboarding" column after "Version"
- Calculate onboarding steps from AdminClient data:
  1. Property details filled: `address` exists
  2. Discovery notes added: `discoveryNotes` not null
  3. Digital assets uploaded: `digitalAssetsStatus` === "complete"
  4. Report started: `totalPages > 0`
  5. Report published: `reportStatus === "published"`
- Show as "3/5" with a small progress indicator

## 7. Admin Settings — Stripe Integration Section
**File: `src/pages/admin/AdminSettings.tsx`**
- Replace the Integrations "Coming Soon" card with a Stripe Connect section
- Show a text input for Stripe Secret Key, a "Connect" button that saves via the `add_secret` tool pattern (store as a Supabase secret)
- For now, since we can't programmatically check if STRIPE_SECRET_KEY exists, show a toggle state: if user enters key and saves, show "Connected" badge. Store the connection status in the admin's profile metadata or a simple localStorage flag until proper checking is available.
- **Simpler approach**: Use the Stripe connector tool to enable Stripe properly. But since this is plan mode, I'll build a UI that prompts the admin to enter their key and saves it as a secret, with a "Connected" status badge.

## 8. Admin Settings — Notifications Preferences
**File: `src/pages/admin/AdminSettings.tsx`**
- Replace Notifications "Coming Soon" with toggle switches for:
  - New client message received
  - Invoice viewed by client
  - Payment posted
  - Report published
  - Project status changed
- Store preferences as JSON in the profile's metadata or a new column. Since we want to avoid a migration for a simple JSON blob, store in the existing `profiles.service_region`... no, that's wrong. 
- **Approach**: Create a new `notification_preferences` table OR store as JSONB. Since profiles already exist, I'll add a migration to add a `notification_preferences jsonb` column to profiles.

## 9. Mock Data Audit
- **PaymentsTab**: Mock data at lines 93-101 only fires for `mock-` propertyIds ✓
- **ProjectsTab**: Mock data at lines 71-86 only fires for `mock-` propertyIds ✓
- **EquipmentTab**: DEMO_EQUIPMENT at lines 63-69 only fires for `mock-` propertyIds ✓
- **DocumentsTab**: Mock files at lines 38-52 only fires for `mock-` propertyIds ✓
- **MessagesTab**: MOCK_MESSAGES only fires for `mock-` propertyIds ✓
- All mock data is properly gated. No changes needed — all real clients will see only live data.

## 10. Database Migration
**New migration**: Add `notification_preferences` JSONB column to `profiles` table with default `'{}'::jsonb`.

---

## Files Changed Summary

| File | Changes |
|------|---------|
| `src/components/tabs/PaymentsTab.tsx` | Rename title, add Stripe placeholder card |
| `src/components/tabs/ProjectsTab.tsx` | Add "Ask About This Project" button |
| `src/components/tabs/EquipmentTab.tsx` | Add "Schedule Service" button on flagged cards |
| `src/components/tabs/DocumentsTab.tsx` | Add search bar and category filter |
| `src/components/tabs/MessagesTab.tsx` | Accept `initialMessage` prop |
| `src/pages/Index.tsx` | Wire pre-filled message state between tabs |
| `src/pages/admin/AdminDashboard.tsx` | Add "+ Invite / Add Client" quick action |
| `src/components/admin/ClientTable.tsx` | Add onboarding progress column |
| `src/pages/admin/AdminSettings.tsx` | Activate Stripe & Notifications sections |
| Migration | Add `notification_preferences` to profiles |

## Execution Order
1. Migration (notification_preferences column)
2. MessagesTab (initialMessage prop)
3. Index.tsx (pendingMessage state wiring)
4. PaymentsTab (rename + Stripe card)
5. ProjectsTab (ask button)
6. EquipmentTab (schedule service button)
7. DocumentsTab (search + filter)
8. AdminDashboard (add client button)
9. ClientTable (onboarding column)
10. AdminSettings (Stripe + Notifications)

