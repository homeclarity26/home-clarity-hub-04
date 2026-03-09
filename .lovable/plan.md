

## Next Pass: Wire Client Portal to Real Data + Polish & Completeness

The admin is wired to the database, and AI chat/editing plus comments are built. The biggest remaining gap is that the **client portal itself still uses hardcoded mock data** from `reportContent.ts` — it doesn't read from the database for the client view. Additionally, several portal tabs are fully static/mock.

### What to Build

**1. Client Portal — Dynamic Property Loading**
Currently `Index.tsx` and `Header.tsx` import `reportPages` and `reportGroups` from static `reportContent.ts`. For logged-in clients, the portal should:
- Fetch the client's `properties` → `reports` → `report_pages` from the database
- Build the navigation groups and page list dynamically from `report_pages.group_name`
- Fall back to static data only if no DB records exist
- Use `useParams()` for `/portal/:propertyId` to load the correct property
- Pass the real `dbPageId` to `ReportPage` so comments work

**Files:** `src/pages/Index.tsx`, `src/components/Header.tsx`, `src/components/tabs/ReportTab.tsx`, `src/components/tabs/HomeTab.tsx`

**2. Dynamic Home Tab**
Replace hardcoded "The Johnson Residence" and "65% complete" with real data:
- Property name from `properties.property_name`
- Completion % calculated from `report_pages` statuses (complete / total)
- Creator name from the report's `created_by` profile

**Files:** `src/components/tabs/HomeTab.tsx`

**3. Report Landing Page — Dynamic TOC**
`ReportTab.tsx` currently uses static `reportGroups`/`reportPages`. Wire to dynamic data from the DB query so the Table of Contents reflects actual report pages.

**Files:** `src/components/tabs/ReportTab.tsx`

**4. Admin Mobile Responsiveness**
- Collapsible sidebar (hamburger on mobile, overlay drawer)
- Stats cards stack single-column
- Tables get horizontal scroll on small screens

**Files:** `src/layouts/AdminLayout.tsx`, `src/components/admin/AdminSidebar.tsx`

**5. Photo Grid in Report Pages**
The `ImageGrid` component exists but `ReportPage.tsx` doesn't display images from `report_pages.images`. Wire it so images stored in the DB render in the report page view.

**Files:** `src/components/report/ReportPage.tsx`

**6. Admin Settings — Wire to Profile**
Currently hardcoded values. Wire to the creator's `profiles` row for name/email/phone, with real save functionality.

**Files:** `src/pages/admin/AdminSettings.tsx`

### Implementation Approach

Create a new hook `useClientPortal(propertyId?)` that:
1. Fetches the client's property (first one if no ID)
2. Fetches the report + all report_pages for that property
3. Groups pages by `group_name` to build navigation
4. Returns `{ property, report, pages, groups, isLoading }`

Then refactor `Index.tsx` to use this hook and pass dynamic data down to Header, ReportTab, HomeTab, and Footer.

### Priority Order
1. Client portal dynamic loading (biggest functional gap)
2. Dynamic Home Tab + TOC
3. Photo grid wiring
4. Admin mobile responsive
5. Admin settings wiring

