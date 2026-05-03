# PHASE 8 — Documents vault

Goal: replace Contacts tab with real document vault. Same files, multiple front doors.

---

## PR #22 — Documents tab rebuild (replaces Contacts)

**Branch:** `phase-8/pr-22-documents-tab`
**Files:** new `DocumentsTab.tsx`, DELETE `ContactsTab.tsx`, `Index.tsx`, `PortalSidebar.tsx`

**Tasks:**

1. In `src/pages/Index.tsx` `VALID_TABS`: replace `"contacts"` with `"documents"`.

2. In `PortalSidebar.tsx` `NAV_SECTIONS`: replace Contacts entry with Documents entry. Use `FolderOpen` or `FileText` icon from lucide-react.

3. DELETE `src/components/tabs/ContactsTab.tsx`.

4. Create `DocumentsTab.tsx`:
   - Header: "Your Documents" + upload button
   - Filter chips: Reports / Proposals / Invoices / Receipts / SOWs / Warranties / Manuals / Permits / Photos / Other
   - List view: thumbnail, filename, type (auto-classified), date, attached room/system/project
   - Empty state if no documents

5. Inspect existing Supabase docs schema first. Use existing `useDocuments` hook (or create one if missing).

**Verify:** build clean, tsc 0. Visit /portal/{id}/documents — see new tab.

**Merge:** auto.

---

## PR #23 — Semantic search UI

**Branch:** `phase-8/pr-23-doc-search`
**Files:** new `DocumentVaultSearch.tsx`, update `DocumentsTab.tsx`

**Tasks:**

1. Add search bar at top of Documents tab.

2. Plumb to existing pgvector RAG (which Bobby already uses). If no existing client-facing doc search edge function, create one:

```
supabase/functions/search-documents/index.ts
```

3. Show results inline with relevance score, document preview, "Open" button.

4. Add "Ask Bobby about this" button on each result that pre-populates Bobby with: "Tell me about {document name}".

**Verify:** build clean, tsc 0. Search returns relevant results.

**Merge:** auto.

---

## PR #24 — Context shortcuts

**Branch:** `phase-8/pr-24-context-shortcuts`
**Files:** update System and Room block components, new `AttachedDocuments.tsx`

**Tasks:**

1. Create `AttachedDocuments.tsx` — small list component showing documents linked to a specific room/system/project. Each item: thumbnail, filename, "View" + "Open in Documents" buttons.

2. Wire `<AttachedDocuments roomId={...} />` into the bottom of every Room template page.

3. Wire `<AttachedDocuments systemId={...} />` into the bottom of every System/Appliance template page.

4. Same data as Documents tab. Different filter (only docs attached to this entity).

**Verify:** build clean, tsc 0. Click a system page — see attached warranties/manuals at bottom.

**Merge:** auto.

---

**End of Phase 8.** Append `- [x] PHASE 8 COMPLETE` to `TODO.md`.

Next: read `docs/rebuild/PHASE_9.md`.
