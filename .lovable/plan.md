

# Ship-Ready Plan: Full Audit & Remaining Fixes

After a thorough review of the entire codebase, here are all remaining issues organized by priority.

---

## CRITICAL — Blocks Core Functionality

### 1. `useReportPage.ts` fetches pages without scoping to a specific report (Bug)
**Line 43-47**: The hook queries `report_pages` by `page_key` with `.limit(1)` but NO filter on `report_id`. If two clients have the same page template (e.g. "roof-system"), the query returns a random one. This is a data leak and correctness issue.

**Fix**: Pass `reportId` or `propertyId` as a prop to `useReportPage` and filter the query by report. The `useClientPortal` hook already has the `report_id` — thread it through `ReportTab` → `ReportPage` → `useReportPage`.

### 2. `useReportPage.ts` auto-creates properties and reports as fallback (Lines 94-143)
If no page is found, the hook creates a new property with hardcoded "742 Evergreen Terrace" and a report. This is dangerous in production — a typo in `page_key` or a timing issue creates orphan data. Remove this entire fallback block; if no page exists for the key, just use the static fallback data without writing anything to DB.

### 3. `inviteUserByEmail` fails silently for confirmed users
The edge function calls `createUser` with `email_confirm: true`, then immediately calls `inviteUserByEmail` on the same email. Since the user is already confirmed, the invite may fail or send a confusing email. The temp password approach works but is never surfaced clearly.

**Fix**: Skip `inviteUserByEmail` since the user already has a password. Instead, send a welcome email via a simple edge function or just display the temp password + portal URL prominently in the wizard result.

### 4. RLS policies use `RESTRICTIVE` mode (all policies are `Permissive: No`)
Every RLS policy is set as restrictive (`NOT PERMISSIVE`). In Postgres, restrictive policies are ANDed together, meaning a user must pass ALL policies. This means a creator who has the "Creators can manage" policy AND a separate "Clients can view their own" policy must pass BOTH — which fails because the creator isn't the client.

**This is the root cause of many data access issues.** The policies should be `PERMISSIVE` (the default), where any matching policy grants access (OR logic).

**Fix**: Migration to drop all restrictive policies and recreate them as permissive (`USING ... WITH CHECK ...`).

---

## HIGH — Required for Professional Ship

### 5. No delete RLS policies
The `projects`, `invoices`, and `schedule_events` tables have no explicit DELETE policies for clients. The admin `ALL` policy covers creators, but clients can't delete their own projects (if that's intended, fine — but should be explicit).

### 6. Signup page creates users with `client` role by default — but signup should be disabled
The public signup page lets anyone create an account. Clients should only be created by the creator through the wizard. The signup page should either be removed or restricted to creator invitations only.

**Fix**: Remove the `/signup` route and the "Don't have an account?" link from the login page. Client accounts are created exclusively through the admin wizard.

### 7. No error handling on client portal when no property exists
`useClientPortal` returns early with `setIsLoading(false)` if no properties are found, but `Index.tsx` renders an empty shell with no explanation. Client sees a blank portal.

**Fix**: Add an empty state in `Index.tsx` when `portal.property` is null — "Your portal is being prepared. Contact your HBC advisor for access."

### 8. Admin Settings notification switches are non-functional
The switches in `AdminSettings.tsx` use `defaultChecked` and have no `onChange` handlers or persistence. They're purely decorative.

**Fix**: Either wire them to a `settings` table or remove the Notifications card and add a "Coming Soon" placeholder.

### 9. Admin Settings integrations buttons are non-functional
"Connect" buttons for Google Calendar, Stripe, hover.to do nothing.

**Fix**: Same approach — remove or add "Coming Soon" labels.

---

## MEDIUM — Polish for Production

### 10. No loading state on Login after successful sign-in
After successful login, the `navigate()` call happens but the page may flash the login form before the auth state propagates. Add a brief loading state.

### 11. `AdminDashboard` "Review Flagged Items" button does nothing
The button has no `onClick` handler.

**Fix**: Navigate to `/admin/clients` with a `?status=review` filter, or open a flagged items view.

### 12. No "back to admin" navigation when creator views portal via edit link
When a creator opens `/portal/xxx?edit=true` from the admin, the only way back is the Settings gear icon. Should have a clear "Back to Admin" button or banner.

### 13. Mobile footer overlaps content
The footer is `fixed bottom-0` with `pb-48 md:pb-[140px]` padding on main, but on smaller screens with the chat panel, content may still be obscured.

### 14. PDF download doesn't include extended fields
`AdminClientDetail.tsx` line 80-91 builds `pagesMap` for PDF but doesn't include `key_observations`, `risks`, `dependencies`, `maintenance`, or `creator_notes`. The PDF is incomplete compared to the portal view.

---

## Implementation Plan (execute in one shot)

### DB Migration — Fix restrictive RLS policies
Drop all existing policies and recreate as permissive. This is the single most impactful fix — it unblocks all data access.

### Files to modify:

1. **`src/hooks/useReportPage.ts`** (~30 lines changed)
   - Accept `reportId` prop, filter query by `report_id`
   - Remove the auto-create property/report fallback block (lines 94-143)
   - If no page found, just use fallback data without DB writes

2. **`src/components/report/ReportPage.tsx`** (~2 lines)
   - Pass `reportId` to `useReportPage`

3. **`src/components/tabs/ReportTab.tsx`** (~3 lines)
   - Thread `reportId` from portal data down to `ReportPage`

4. **`src/pages/Index.tsx`** (~5 lines)
   - Pass `reportId` from `portal.report?.id` to `ReportTab`
   - Add empty state when `portal.property` is null

5. **`src/pages/Signup.tsx`** — Delete or redirect to login
   - Remove public signup; client accounts are creator-managed only

6. **`src/pages/Login.tsx`** (~3 lines)
   - Remove "Don't have an account? Sign up" link

7. **`src/App.tsx`** (~3 lines)
   - Remove `/signup` route

8. **`src/pages/admin/AdminSettings.tsx`** (~10 lines)
   - Mark non-functional Notifications/Integrations as "Coming Soon"

9. **`src/pages/admin/AdminDashboard.tsx`** (~2 lines)
   - Wire "Review Flagged Items" to navigate to clients with review filter

10. **`supabase/functions/create-client-account/index.ts`** (~10 lines)
    - Remove `inviteUserByEmail` call (user already confirmed with password)
    - Ensure temp password is always returned for new users

11. **`src/pages/admin/AdminClientDetail.tsx`** (~10 lines)
    - Include extended fields in PDF data map

12. **DB Migration** — Recreate all RLS policies as permissive (CRITICAL)

### Total: ~12 files, 1 migration

