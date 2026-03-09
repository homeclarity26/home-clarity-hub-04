

# Complete Data Flow Fix — Making the App Fully Functional

## The Core Problem
The app has all the pieces but they're not connected. Templates exist, BlockRenderer exists, but data doesn't flow properly from templates → report_pages → hooks → components.

## What This Plan Fixes (5 Critical Gaps)

1. **NewReportWizard doesn't copy block_config** — Pages created without their template configuration
2. **useReportPage doesn't handle new fields** — `key_observations`, `risks`, `dependencies`, `maintenance`, `creator_notes`, `block_config` never loaded/saved
3. **useClientPortal missing new fields** — Client portal can't render blocks properly
4. **ReportPage passes `blockConfig={null}`** — BlockRenderer never receives actual config
5. **Index.tsx doesn't pass dbPageId/images** — Data doesn't reach child components

---

## Implementation

### File 1: `src/components/admin/NewReportWizard.tsx`
**Line ~245-257 (page insert):**
Add `block_config` and all default_content fields when creating pages:
```typescript
const pageInserts = selectedTemplatesList.map((template, index) => {
  const defaultContent = template.default_content as Record<string, unknown>;
  return {
    report_id: report.id,
    template_id: template.id,
    block_config: template.block_config, // ← ADD
    group_name: template.group_name,
    page_key: template.slug,
    title: template.name,
    narrative: defaultContent.narrative ? [defaultContent.narrative] : [],
    key_observations: defaultContent.key_observations || null, // ← ADD
    maintenance: defaultContent.maintenance || null, // ← ADD
    sort_order: index,
    status: "draft",
  };
});
```

### File 2: `src/hooks/useReportPage.ts`
**Complete rewrite of data handling (~100 lines changed):**

1. Update `ReportPageRow` interface to include all fields:
```typescript
interface ReportPageRow {
  // ... existing fields ...
  block_config: BlockConfig | null;
  key_observations: string[] | null;
  risks: string[] | null;
  dependencies: { pageKey: string; title: string; type: string }[] | null;
  maintenance: { frequency?: string; tasks: string[] } | null;
  creator_notes: string | null;
}
```

2. Update `loadPage()` to populate all fields into state
3. Update `saveToDatabase()` to handle all new fields
4. Return `blockConfig` from the hook

### File 3: `src/hooks/useClientPortal.ts`
**Update DbPage interface and pages mapping:**

Add missing fields to `DbPage`:
```typescript
interface DbPage {
  // ... existing ...
  block_config: unknown;
  key_observations: unknown;
  risks: unknown;
  dependencies: unknown;
  maintenance: unknown;
  creator_notes: unknown;
}
```

Update `pages` memo to include new fields in returned `ReportPageData`.

### File 4: `src/components/report/ReportPage.tsx`
**Wire blockConfig from hook to renderer:**

1. Get `blockConfig` from `useReportPage` return
2. Pass real `blockConfig` to `<BlockRenderer>` instead of `null`
3. Load images from DB page data on mount

### File 5: `src/pages/Index.tsx`
**Pass dbPageId and images to ReportPage:**

Update `renderCurrentPage()` to pass:
- `dbPageId={portal.pageKeyToDbId[currentPageId]}`
- Images from `portal.pageImages[currentPageId]`

---

## Technical Details

### Data Types (add to `src/lib/templateUtils.ts`)
```typescript
export interface ExtendedPageData extends ReportPageData {
  key_observations?: string[];
  dependencies?: { pageKey: string; title: string; type: "before" | "after" }[];
  risks?: string[];
  maintenance?: { frequency?: string; tasks: string[] };
  creator_notes?: string;
  block_config?: BlockConfig;
}
```

### Save Flow
```
User edits → updatePageData() → debounce → saveToDatabase()
                                              ↓
                                  Maps all fields to DB columns
                                              ↓
                                  report_pages UPDATE
```

### Load Flow
```
Page mount → useReportPage(pageKey) → SELECT from report_pages
                                              ↓
                                  Convert DB row to ExtendedPageData
                                              ↓
                                  Return to component with blockConfig
```

---

## Files Modified (5 files, ~300 lines changed)
1. `src/components/admin/NewReportWizard.tsx` — Copy block_config + defaults
2. `src/hooks/useReportPage.ts` — Load/save all fields
3. `src/hooks/useClientPortal.ts` — Include new fields in page data
4. `src/components/report/ReportPage.tsx` — Wire blockConfig properly
5. `src/pages/Index.tsx` — Pass dbPageId and images

## No Database Changes
All columns already exist in `report_pages` table.

