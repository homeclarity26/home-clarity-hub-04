

# Critical Setup Tasks — Plan

## Status Summary

| Task | Can I handle it? | Status |
|------|-------------------|--------|
| 1. Run DB Migrations | **Yes** — via migration tool | 3 of 4 are missing from DB |
| 2. Deploy Edge Functions | **Yes** — via deploy tool | All 9 need deploying |
| 3. Set Secrets (GEMINI/RENTCAST) | **Yes** — via add_secret tool | Will prompt you for values |
| 4. Set Frontend Env Var (Google Maps) | **Yes** — via add_secret tool | Will prompt you for value |

Additionally, I need to **fix 4 build errors** in edge functions before deploying (TypeScript `err` is `unknown` type errors).

---

## Task 1 — Run DB Migrations

The database is missing schema from 3 of the 4 named migration files:

- **`add_intake_fields`** — Properties table is missing `city`, `state`, `zip`, `county`, `property_type`, `relationship_type`, `hover_url`, `hover_pdf_url`, `iguide_pdf_url`, `client_intelligence_summary`, `discovery_notes`, `intake_status`, `digital_assets_status` (only `iguide_url` exists)
- **`add_equipment_table`** — The `equipment` table does not exist at all
- **`add_vendor_page_key`** — The `vendors` table is missing the `report_page_key` column
- **`add_property_messages`** — The `property_messages` table does not exist

**Fix needed**: The `add_equipment_table` migration references `profiles.role` for the creator RLS policy, but roles are stored in `user_roles` table. I'll fix the policy to use `has_role()` function instead.

I'll run all 3 missing migrations (intake fields, equipment, vendor page key, property messages) using the migration tool.

## Task 2 — Deploy 9 Edge Functions

Before deploying, I need to fix **4 TypeScript errors** across edge functions where `catch (err)` blocks reference `err.message` but `err` is typed as `unknown`:

**Files to fix** (one-line change each):
- `supabase/functions/analyze-discovery-notes/index.ts` line 97
- `supabase/functions/draft-page-narrative/index.ts` line 142
- `supabase/functions/lookup-property-data/index.ts` line 120
- `supabase/functions/recommend-report-pages/index.ts` line 137

Fix: Change `err.message` → `(err instanceof Error ? err.message : "Internal error")`

Then deploy all 9 functions using the deploy tool.

## Task 3 — Set Secrets

Use the `add_secret` tool to prompt you for:
1. `GEMINI_API_KEY`
2. `RENTCAST_API_KEY`

## Task 4 — Set Frontend Env Var

Use the `add_secret` tool to prompt you for:
1. `VITE_GOOGLE_MAPS_API_KEY`

---

## Execution Order

1. Fix the 4 edge function TypeScript errors
2. Run the 3 pending DB migrations (with fixed equipment RLS)
3. Deploy all 9 edge functions
4. Prompt for GEMINI_API_KEY, RENTCAST_API_KEY, and VITE_GOOGLE_MAPS_API_KEY secrets

