

# Plan: Complete All UX/UI Debt Items

## Issues to Fix (8 total)

### 1. Portal Tab Overflow — Already Fixed ✅
The Header already groups tabs into 4 primary (Home, Report, Projects, Messages) + a "More" dropdown with 10 secondary tabs. Both desktop and mobile are handled. **No work needed.**

### 2. "Proposals" vs "Estimates" Naming Inconsistency
The Header labels the `estimates` tab as "Proposals", but the page component is `EstimatesPortal`. The admin side uses "Estimates & Proposals" together. The CRM pipeline uses `proposal_out` as a stage name (which is correct CRM terminology).

**Fix:** Standardize on "Estimates" everywhere in portal navigation since that's the tab ID and component name. Keep "Proposal" only in CRM pipeline stage names and the ProposalBuilder (which is the formatted output of an estimate).
- `Header.tsx` line 33: change label from `"Proposals"` to `"Estimates"`
- `AICommandBar.tsx` line 13: change `"Show open proposals"` to `"Show open estimates"`

### 3. Hardcoded Data in SmartActionTiles
Looking at the current code — `SmartActionTiles.tsx` already removed hardcoded filler items (comment on line says "No hardcoded fake urgency tiles"). The only "urgent" tile comes from real report data (poor/critical conditions). Recent and frequent tiles come from localStorage visit tracking. Default tiles are just fallback navigation shortcuts.

**Status: Already clean.** No work needed.

### 4. Hardcoded Data in AISuggestionsStrip
Same situation — `AISuggestionsStrip.tsx` already has the comment "Only show data-driven suggestions — no hardcoded filler items". Suggestions only come from `reportPages` with poor/critical conditions.

**Status: Already clean.** No work needed.

### 5. Duplicate Icons in SmartActionTiles
The `SECTION_META` map uses distinct icons per section (FileText, Hammer, Receipt, Calendar, Shield, FolderOpen, MessageSquare, UsersRound). No duplicates exist.

**Status: Already clean.** No work needed.

### 6. Inconsistent Empty States Across Portal Tabs
Most tabs use the `EmptyState` component, but a few use inline custom empty states:
- `MessagesTab` — custom inline empty (different style, no icon wrapper)
- `PaymentsTab` — uses `EmptyState` for invoices, but inline custom for transactions section
- `ScheduleTab` — needs verification

**Fix:** Standardize `MessagesTab` and `PaymentsTab` transaction section to use the shared `EmptyState` component for visual consistency.

### 7. Three Overlapping Onboarding Mechanisms
The three mechanisms are:
- `OnboardingOverlay.tsx` — **already removed** from Index.tsx (comment on line 20: "OnboardingOverlay removed — consolidated into ClientOnboardingModal")
- `ClientOnboardingModal` — active, shown to first-time clients ✅
- `AdminSetupChecklist` — active, shown on admin dashboard for creator setup ✅

These serve different audiences (client vs admin), so only 2 remain and they don't overlap. However, `OnboardingOverlay.tsx` still exists as a dead file.

**Fix:** Delete the unused `OnboardingOverlay.tsx` file.

### 8. Admin Dashboard Visual Hierarchy
The dashboard already implements the 4-zone layout:
- Zone 1: Briefing (DailyBrief + SetupChecklist + Stats)
- Zone 2: Action Required (OverdueCenter + ServiceRequests + Tasks)
- Zone 3: Insights (Revenue + Subscriptions + WeeklyDigest + CRM)
- Zone 4: Reference (collapsed — PropertyMap + NPS + EquipmentWarranty)

Each zone has a whisper-style label. **Already implemented.** No work needed.

---

## Summary of Actual Changes

Only 3 items need code changes:

| # | Task | Files |
|---|------|-------|
| 1 | Rename "Proposals" → "Estimates" in portal nav | `Header.tsx`, `AICommandBar.tsx` |
| 2 | Standardize empty states in MessagesTab + PaymentsTab | `MessagesTab.tsx`, `PaymentsTab.tsx` |
| 3 | Delete dead `OnboardingOverlay.tsx` file | `OnboardingOverlay.tsx` |

### Technical Details

**Task 1 — Naming fix:**
- `Header.tsx` line 33: `{ id: "estimates", label: "Proposals" }` → `{ id: "estimates", label: "Estimates" }`
- `AICommandBar.tsx` line 13: `"Show open proposals"` → `"Show open estimates"`

**Task 2 — Empty state consistency:**
- `MessagesTab.tsx`: Replace the inline empty div (lines ~155-159) with `<EmptyState icon={MessageSquare} title="No Messages Yet" description="Send a message to start the conversation with your advisor." />`
- `PaymentsTab.tsx`: Replace the inline transactions empty state (lines ~485-489) with `<EmptyState icon={List} title="No Transactions Yet" description="Your payment history will appear here." />`

**Task 3 — Dead code cleanup:**
- Delete `src/components/OnboardingOverlay.tsx`

