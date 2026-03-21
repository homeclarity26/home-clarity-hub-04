

# Plan: Comprehensive Feature Audit Document

## What I Found

After auditing the TODO.md, the UI/UX review in `.lovable/plan.md`, all source files, database tables (130+ tables), 61 edge functions, and route definitions, here's the status:

### Summary
- **~200 features** have been built across 6 stages + payments + trade partner portal
- **All 61 edge functions** are deployed
- **All routes** (admin, portal, trade partner, auth, public) are wired
- **Database** has 130+ tables with data models for every feature

### What's Working (Verified in Code)
Everything in the TODO.md "COMPLETED" section checks out — components exist, edge functions are deployed, routes are registered, and database tables back them.

### Remaining Gaps / Issues Identified

**Configuration Blockers (user action needed):**
1. `STRIPE_SECRET_KEY` — payments won't process
2. `STRIPE_WEBHOOK_SECRET` — webhook verification fails
3. `VITE_GOOGLE_MAPS_API_KEY` — NOW CONFIGURED ✅

**Code/UX Issues (from `.lovable/plan.md` review, not yet addressed):**
- Portal has 14 tabs with no grouping/overflow
- Hardcoded/fake data in SmartActionTiles and AISuggestionsStrip
- Duplicate icons in SmartActionTiles
- Inconsistent empty states across portal tabs
- Admin dashboard has no visual hierarchy / zone prioritization
- Three overlapping onboarding mechanisms
- Portal uses tab state instead of URL routes (no deep linking / back button)
- "Proposals" vs "Estimates" naming inconsistency

**TODO.md items still marked incomplete but actually done:**
- `VITE_GOOGLE_MAPS_API_KEY` — now configured, TODO.md still says pending
- Resend email for client invitation — `send-client-invite` IS wired in NewReportWizard

## What I'll Create

A single Markdown file at `/mnt/documents/HBC_Feature_Audit.md` containing:

1. **Master Feature List** — Every feature organized by stage, with status (✅ Built, ⚠️ Needs Config, 🔴 Missing/Broken)
2. **Edge Functions Inventory** — All 61 functions with their frontend call sites
3. **Database Tables Inventory** — All 130+ tables grouped by domain
4. **Known Issues & Polish Items** — From the UI/UX review
5. **Configuration Blockers** — What secrets/keys are still needed
6. **Recommended Next Steps** — Prioritized list

This will be a persistent reference document you can keep updating session to session.

## Technical Approach

- Generate the Markdown file via script to `/mnt/documents/`
- Also update `TODO.md` in the codebase to fix the stale entries (mark Google Maps key as done, mark Resend invite as done)
- No code changes to the app itself — this is purely an audit artifact

