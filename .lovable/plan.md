

# Comprehensive Plan: Make the App Fully Functional End-to-End

After thorough exploration, I've identified 6 critical gaps that prevent this app from working as a real product. Here's everything needed, organized by complexity.

---

## Gap 1: NewReportWizard Creates Property With `client_user_id = creator`

**The Problem**: In `NewReportWizard.tsx` line 214, the wizard sets `client_user_id: user.id` — but `user` is the logged-in *creator*, not the client. This means the property is owned by the creator, so:
- The client can never see it (RLS blocks them)
- The "publish" step calls `create-client-account` edge function which reassigns it, BUT if the creator skips publish or it fails, the data is stuck
- The `useClientPortal` hook fetches properties without filtering by `client_user_id`, so the creator sees all properties in their own portal view — data leak

**The Fix**:
- `NewReportWizard.tsx`: Use a sentinel/placeholder UUID for `client_user_id` during draft creation, OR keep `user.id` but make the publish step mandatory before navigating away
- Better: After creating property + report, immediately redirect to `AdminClientDetail` for that property instead of showing the "Upload Data" / "AI Generation" steps (which are currently fake `setTimeout` stubs anyway)
- Remove steps 2-3 ("Upload Data" and "AI Generation") — they're non-functional placeholders (`handleGenerate` is a 3-second timeout with no real logic)
- Consolidate the wizard to 3 steps: Client Info → Select Pages → Review & Publish

## Gap 2: Client Portal Has No Property Scoping

**The Problem**: `useClientPortal.ts` line 78 fetches properties with `.limit(1)` and NO filter on `client_user_id`. If a client has multiple properties, they'll always see the first one created (regardless of ownership). If a creator is logged in, they see *any* random property.

**The Fix**:
- Add `.eq("client_user_id", user.id)` filter to the property query
- When `propertyId` param is provided, also verify the client owns it
- Handle the case where a client has multiple properties (show a property selector or redirect to first owned property)

## Gap 3: Admin Client Data Incomplete — Profiles Missing Email/Phone

**The Problem**: `useAdminData.ts` fetches profiles but casts `email` and `phone` with `(profile as Record<string, unknown>)?.email` — this is because the Profile type doesn't include those fields in the generated types, but the columns DO exist in the DB. The real issue: `handle_new_user` trigger creates profiles but doesn't set `email`. The `create-client-account` edge function updates email *after* creation, but only if the function completes successfully.

**The Fix**:
- Update `handle_new_user` DB trigger to also set `email = NEW.email` on profile creation
- In `useAdminData.ts`, properly type the profile query to include email/phone fields

## Gap 4: Report Page "Edit" Button in Admin Does Nothing

**The Problem**: `ReportPageManager.tsx` line 92 renders an "Edit" button that has no `onClick` handler. The "Open in Portal" button constructs a URL with `?from=admin&clientId=` but the portal doesn't read or act on these query params. The "Add Page" button also does nothing.

**The Fix**:
- Wire "Edit" button to navigate to `/portal/${propertyId}?edit=true&page=${pageKey}` 
- In `Index.tsx`, read `edit` and `page` query params on mount to auto-enable edit mode and navigate to the correct report page
- Wire "Add Page" to open a dialog that lets the creator select from unused page_templates and insert a new report_page

## Gap 5: Client-Side Tabs Show No Real Data From DB

**The Problem**: The redesigned client-side tabs (Projects, Payments, Schedule) correctly fetch from Supabase, but the data will always be empty because:
1. Properties are created with `client_user_id = creator.id` (Gap 1)
2. RLS policies on `projects`, `invoices`, `schedule_events` check that the property's `client_user_id = auth.uid()` — so the creator can't see them in the portal view (they have a separate `has_role('creator')` policy, but only through the admin hooks)
3. The admin creates projects/invoices/events on `AdminClientDetail`, but the client portal tabs re-fetch independently

**The Fix**: Once Gap 1 is fixed (property ownership), the client tabs will work. For creator portal preview, add RLS-compatible queries or pass data through the already-loaded admin context.

## Gap 6: No Email Actually Sent to Clients

**The Problem**: `create-client-account` edge function generates a magic link via `admin.generateLink()` but never sends it. `generateLink` returns the link data but does NOT send an email — that's `admin.inviteUserByEmail()` or the user needs to use `signInWithOtp`. The magic link is returned but never emailed or displayed to the creator.

**The Fix**:
- Replace `generateLink` with `inviteUserByEmail` to actually send the email, OR
- Display the magic link / temp password to the creator in the publish result UI so they can share it manually
- The temp password IS created (line 79-84) but never shown to the creator — surface it in the response

---

## Implementation Plan (8 files, ~250 lines changed)

### 1. Database Migration: Fix `handle_new_user` trigger
```sql
-- Update trigger to capture email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, avatar_initials)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    UPPER(LEFT(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), 2))
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'client');
  RETURN NEW;
END;
$$;
```

### 2. `src/components/admin/NewReportWizard.tsx` — Simplify to 3 steps
- Remove "Upload Data" and "AI Generation" steps (non-functional stubs)
- Steps become: Client Info → Select Pages → Review & Publish
- On step 2 completion (after creating property/report/pages), show the publish UI immediately
- Surface the temp password or magic link in the publish result

### 3. `src/hooks/useClientPortal.ts` — Add property ownership filter
- Add `.eq("client_user_id", user.id)` when no `propertyId` param
- When `propertyId` is provided, still verify ownership in the query

### 4. `src/pages/Index.tsx` — Read URL query params for edit mode
- On mount, read `?edit=true` and `?page=page-key` from URL
- If `edit=true`, auto-enable edit mode via `EditModeContext`
- If `page=xxx`, auto-navigate to that report page

### 5. `src/components/admin/ReportPageManager.tsx` — Wire Edit/Add buttons
- "Edit" button: `window.open(\`/portal/${propertyId}?edit=true&page=${page.page_key}\`)`
- "Add Page" button: Open dialog to select unused templates and insert new report_page

### 6. `supabase/functions/create-client-account/index.ts` — Fix email delivery
- Replace `generateLink` with `inviteUserByEmail` to send actual email
- Return temp password in response for creator fallback
- Handle the case where invite email fails gracefully

### 7. `src/hooks/useAdminData.ts` — Fix profile type casting
- Use proper typing for email/phone from profiles query instead of unsafe casting

### 8. `src/components/Footer.tsx` — Sync balance with real data
- Accept `balance` prop from `Index.tsx` (computed from invoices)
- Replace hardcoded `$4,500` with actual computed value

---

## Files Modified (8 total)
1. **DB migration** — Fix `handle_new_user` trigger to set email
2. `src/components/admin/NewReportWizard.tsx` — Simplify wizard, surface credentials
3. `src/hooks/useClientPortal.ts` — Property ownership filter
4. `src/pages/Index.tsx` — URL param handling for edit mode + page navigation
5. `src/components/admin/ReportPageManager.tsx` — Wire Edit/Add Page buttons
6. `supabase/functions/create-client-account/index.ts` — Fix email delivery
7. `src/hooks/useAdminData.ts` — Fix profile typing
8. `src/components/Footer.tsx` — Dynamic balance from invoices

