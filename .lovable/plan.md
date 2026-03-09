

# Fix 4 Visual/UI Issues

## Issue 1: "SCHEDULEEDIT" concatenation
The nav items render correctly in the `<nav>` with `gap-10`, and the edit pencil is in the separate user section. The problem is at medium-width viewports where `justify-between` compresses the gap between the nav and user section, making "SCHEDULE" and the pencil button appear adjacent. 

**Fix in `Header.tsx`**: Add `ml-4` or a visual separator to the user section div, and ensure the nav has `flex-shrink-0` so items don't compress. Also reduce nav gap slightly at medium widths to prevent collision.

## Issue 2: Contact card initials/names
The ContactsTab doesn't render any avatar circles with initials — it uses `<User>` and `<Headset>` icons. The user is likely seeing the avatar from the header or a different component bleeding through, OR wants initials added to the contact cards.

**Fix in `ContactsTab.tsx`**: 
- Add avatar circles to both cards: "AK" for Adam Kinney, "CS" for HBC Support/Client Services
- Ensure first card clearly shows "Adam Kinney" as the heading (it already does via `creatorName`)

## Issue 3: Balance mismatch ($4,500 vs $0.00)
`PaymentsTab.tsx` line 36 has `return computed || 4500` — a hardcoded fallback of $4,500 when no invoices exist. The Footer gets `invoiceBalance` from `useClientPortal` which computes `0` when no invoices exist.

**Fix in `PaymentsTab.tsx`**: Remove the `|| 4500` fallback. When no invoices exist, show `$0.00` — matching the footer.

## Issue 4: Footer shows "3 upcoming appointments" when none exist
`Footer.tsx` line 25 hardcodes `"3 upcoming appointments"` for the schedule tab.

**Fix**: 
- Add a `scheduleCount` prop to Footer (passed from `Index.tsx`)
- In `useClientPortal.ts`, expose `scheduleEventCount` from the data already fetched, OR
- Simpler: change the Footer to show a generic message like "View your timeline" instead of a count, since Schedule events are fetched separately in `ScheduleTab`
- Best approach: pass a `scheduleCount` prop. In `Index.tsx` we don't currently have this data at the top level, so the simplest fix is to change the hardcoded string to `"View your schedule & timeline"` — no false promises about count.

## Files Changed (4)

1. **`src/components/Header.tsx`** — Add spacing between nav and user section to prevent "SCHEDULEEDIT" overlap
2. **`src/components/tabs/ContactsTab.tsx`** — Add avatar initials circles ("AK" and "CS") to contact cards  
3. **`src/components/tabs/PaymentsTab.tsx`** — Remove `|| 4500` hardcoded fallback on line 36
4. **`src/components/Footer.tsx`** — Change schedule secondary text from `"3 upcoming appointments"` to `"View your schedule & timeline"`

