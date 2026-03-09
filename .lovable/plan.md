

## Next Pass: File Manager Persistence + Edit/Delete CRUD + Polish

### Completed So Far
All major features are wired to the database: client portal (dynamic loading, all 6 tabs), admin portal (dashboard with real activity feed, client detail with projects/invoices/schedule CRUD, knowledge base, settings). The remaining gaps are smaller but important for a complete product.

### What to Build

**1. File Manager — Wire to Storage**
`FileManager.tsx` still uses `mockFiles` from `adminMockData.ts`. Wire it to the `report-images` storage bucket (already exists and is public). Create a `client_files` table to track file metadata (name, category, property_id, storage_path, file_type, size). Add real upload functionality using the existing `ImageUploader` pattern. Admin can upload files per category; files are stored in Supabase storage and metadata tracked in the DB.

**2. Admin Edit/Delete on Projects, Invoices, Events**
Currently the admin can only *create* projects, invoices, and schedule events from `AdminClientDetail.tsx`. Add inline edit and delete actions (dropdown menu or icon buttons on each row) so creators can update statuses, amounts, dates, or remove records.

**3. Image Upload Wiring in Report Pages**
The `ImageUploader` component uploads to storage and returns URLs, but `ReportPage.tsx` needs to save those URLs back to `report_pages.images` via `updatePageData`. Verify this flow works end-to-end and fix any gaps.

**4. Clean Up Mock Data**
After wiring FileManager, `adminMockData.ts` should have no remaining consumers. Remove it or reduce to only type exports to keep the codebase clean.

**5. Polish: Empty States and Loading**
Review all tabs and admin pages for consistent empty states, loading spinners, and error handling. Ensure the portal gracefully handles a brand-new client with no data.

### Database Migration
```sql
CREATE TABLE public.client_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  category text NOT NULL DEFAULT 'General',
  storage_path text NOT NULL,
  file_type text,
  file_size text,
  created_at timestamptz DEFAULT now()
);
-- RLS: creators manage all, clients view their property's files
```

### Files to Create/Modify
- **Migration**: `client_files` table + RLS
- `src/components/admin/FileManager.tsx` — replace mock data with real storage queries + upload
- `src/pages/admin/AdminClientDetail.tsx` — add edit/delete actions on project/invoice/event rows
- `src/hooks/useAdminData.ts` — add `useClientFiles` hook
- `src/components/report/ReportPage.tsx` — verify image save flow
- `src/data/adminMockData.ts` — remove unused mock data

### Priority Order
1. File Manager persistence (last mock-data consumer)
2. Admin edit/delete CRUD
3. Image upload verification
4. Mock data cleanup
5. Empty state polish

