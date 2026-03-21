

# Rebuild Help & Tutorials — Complete Audit + Architecture Plan

## STEP 1 — Current State Audit

### What Currently Exists

**Admin Help Center** (`/admin/help` — `AdminHelpCenter.tsx`, 343 lines):
1. **Interactive Walkthroughs** (5 tours): Dashboard Tour, Creating a Client & Report, Unified Inbox, Projects & Vendors, Automations. These are "fake" — clicking "Start Tour" just marks them complete instantly with no actual walkthrough.
2. **Step-by-Step Guides** (6 tabs, 11 guides total):
   - Getting Started (2): Setting Up Admin Account, Adding First Client
   - Reports (2): Writing a Report, Updating After Project Completion
   - Clients & Communication (2): Day-to-Day Communication, Reading the Timeline
   - Billing (2): Creating an Invoice, Payment Escalation Rules
   - AI Features (3): Report Draft Assistant, Message Reply Suggestions, Cost Estimator
   - Automations & Settings (2): Setting Up Automations, Customizing Branding
3. **Quick Reference Cards** (8 cards): Condition Ratings, Report Chapters, Project Statuses, Invoice Statuses, AI Tools, Automation Rules, Keyboard Shortcuts, Key Metrics

**Client Help Center** (`HelpCenterPanel.tsx` — Sheet panel, 3 tabs):
1. **Getting Started** (`GettingStartedTab.tsx`): 8-item checklist tied to `tutorial_progress` table (view report, check health score, review actions, explore projects, view equipment, view document, send message, check schedule)
2. **How-To Guides** (`HowToGuidesTab.tsx`): 8 accordion articles (Reading Report, Health Score, Projects, Payments & Invoices, Equipment Registry, Documents, Messaging Advisor, Annual Maintenance Schedule)
3. **FAQ** (`FAQTab.tsx`): 11 searchable Q&A items (report basics, HVAC condition, PDF download, portal privacy, sharing access, project completion, home value, re-assessment, membership, support)

**Other Help Infrastructure**:
- `HelpTooltip.tsx` — Contextual popover tooltip component
- `ClientOnboardingModal.tsx` — 4-step welcome modal for new clients
- `AdminSetupChecklist.tsx` — 5-item admin setup checklist on dashboard

### What's Outdated or Missing

**Admin Side — Missing Tutorials (19 gaps):**
| Missing Topic | Why It's Needed |
|--------------|-----------------|
| Client Workspace navigation (3-column layout, tab groups) | Major UI overhaul not reflected |
| CRM pipeline and stages | No tutorial exists |
| Estimate/Proposal Builder (create, send, track) | Only invoices covered, not estimates |
| Field Inspection mode | Feature exists, no tutorial |
| Knowledge Base usage | Feature exists, no tutorial |
| Goals management | Feature exists, no tutorial |
| Referral tracking | Feature exists, no tutorial |
| Annual Reviews | Feature exists, no tutorial |
| Analytics dashboard interpretation | Feature exists, no tutorial |
| Calendar management | Feature exists, no tutorial |
| Task Board (standalone tasks) | Feature exists, no tutorial |
| Vendor management (full lifecycle) | Only mentioned in passing |
| AI Agent usage (workspace rail, global) | Major new feature, no tutorial |
| Self-Learning Intelligence Layer | New feature, no tutorial |
| Digital Twin / Document Intelligence | Feature exists, no tutorial |
| Services Library configuration | Feature exists, no tutorial |
| Membership tier setup | No tutorial |
| Command Palette & shortcuts | Reference card exists but no guide |
| Announcements (create, manage) | No tutorial |

**Client Side — Missing Tutorials (9 gaps):**
| Missing Topic | Why It's Needed |
|--------------|-----------------|
| AI Home Concierge (ClientAgentPanel) | Major feature, no tutorial |
| Estimates/Proposals (view, accept, decline) | Feature exists, no tutorial |
| Services & Concierge Requests | Feature exists, no tutorial |
| Billing & Subscriptions | Feature exists, no tutorial |
| Photos (upload, gallery, flagging) | Feature exists, no tutorial |
| Referral Portal | Feature exists, no tutorial |
| Notification Preferences | Feature exists, no tutorial |
| Goal/Wishlist items | Feature exists, no tutorial |
| Property Selector (multi-property) | Feature exists, no tutorial |

**Structural Issues:**
- Admin help is a monolithic 343-line file with all content hardcoded inline
- Client help is a small sliding panel — adequate for original 8 features, insufficient for 15+ tabs
- No search functionality on admin side
- No shared data structure — tutorials are JSX, not data-driven
- "Interactive Walkthroughs" are non-functional (instant complete, no actual tour)

---

## STEP 2 — Proposed Architecture

### Data-Driven Tutorial System

Replace hardcoded JSX with a shared data model so tutorials are maintainable, searchable, and independently editable:

```typescript
// src/data/tutorials/types.ts
interface Tutorial {
  id: string;
  category: string;
  title: string;
  description: string;  // One-sentence summary
  audience: "admin" | "client" | "both";
  steps: { title: string; body: string }[];
  tip?: string;
  keywords: string[];   // For search
}
```

All tutorials live in separate data files per category, imported into a registry.

### Admin Tutorial Library — Proposed Categories (13 categories, ~35 guides)

**1. Getting Started** (4 guides)
- Setting up your HBC Creator account
- Configuring branding and business profile
- Setting up membership tiers and the Services Library
- Connecting Stripe for payments

**2. Client Management** (4 guides)
- Adding your first client
- Navigating the Client Workspace (3-column layout, tab groups)
- Understanding the CRM pipeline and client stages
- Reading the client activity timeline

**3. Reports** (4 guides)
- Creating a Home Clarity Report
- Rating and scoring each section
- Using the AI Draft Assistant for writing
- Publishing, updating, and versioning a report

**4. Projects & Proposals** (4 guides)
- Creating a project and assigning it to a client
- Building and sending an estimate/proposal
- Managing proposal status (sent, accepted, declined, converted)
- Tracking project progress, milestones, and change orders

**5. Equipment & Maintenance** (3 guides)
- Adding equipment and logging warranty information
- Setting up maintenance reminders and seasonal checklists
- Resolving overdue service items

**6. Payments & Billing** (3 guides)
- Creating and sending an invoice
- Tracking payment status and escalation rules
- Managing subscriptions and reading revenue analytics

**7. Communication** (3 guides)
- Messaging clients through the portal
- Creating and managing announcements
- Using the AI Agent to draft communications

**8. AI & Intelligence** (3 guides)
- Using the AI Agent (global and workspace rail)
- AI tools: Score Explainer, Cost Estimator, Meeting Prep
- How the Self-Learning Intelligence Layer works

**9. Scheduling & Calendar** (2 guides)
- Managing your calendar and events
- Annual Reviews overview

**10. Vendors** (2 guides)
- Adding and managing vendors
- Requesting bids and assigning vendors to projects

**11. Tools** (3 guides)
- Using the Knowledge Base
- Managing Goals
- Tracking Referrals

**12. Automations** (1 guide)
- Configuring and monitoring automation rules

**13. Settings & Admin** (2 guides)
- Account settings and notification preferences
- Using the Command Palette and keyboard shortcuts

**Quick Reference Cards** — Keep existing 8, add 2:
- Client Workspace Tab Groups
- Estimate/Proposal Status Labels

### Client Tutorial Library — Proposed Categories (9 categories, ~25 guides)

**1. Getting Started** (3 guides)
- Welcome to your Home Clarity Portal
- How to navigate your portal (tabs, More menu)
- How to use the AI Home Concierge

**2. Your Home Report** (3 guides)
- How to read your Home Clarity Report
- Understanding your Home Health Score
- Viewing your property history and past versions

**3. Maintenance & Equipment** (3 guides)
- Viewing your equipment registry
- Understanding warranty and service status
- Your seasonal maintenance checklist

**4. Projects & Goals** (3 guides)
- Viewing your active projects
- Adding a goal or wishlist item
- Reviewing and responding to a proposal

**5. Payments** (3 guides)
- Viewing your invoices
- Making a payment
- Understanding your billing and subscription

**6. Schedule** (2 guides)
- Viewing your maintenance calendar
- Scheduling a consultation with your advisor

**7. Photos & Documents** (3 guides)
- Uploading photos of your home
- Uploading and managing documents
- Requesting a service

**8. Communication** (3 guides)
- Messaging your advisor
- Using the AI assistant for home questions
- Contacting your home team and vendors

**9. Referrals** (2 guides)
- How the referral program works
- How to share your referral link

### Updated FAQ — expand from 11 to ~20 items covering estimates, AI concierge, subscriptions, photos, referrals, services.

---

## STEP 3 — File Structure

```
src/data/tutorials/
  types.ts                          — Tutorial interface
  admin/
    getting-started.ts
    client-management.ts
    reports.ts
    projects-proposals.ts
    equipment-maintenance.ts
    payments-billing.ts
    communication.ts
    ai-intelligence.ts
    scheduling.ts
    vendors.ts
    tools.ts
    automations.ts
    settings.ts
    reference-cards.ts
    index.ts                        — Re-export all admin tutorials
  client/
    getting-started.ts
    report.ts
    maintenance-equipment.ts
    projects-goals.ts
    payments.ts
    schedule.ts
    photos-documents.ts
    communication.ts
    referrals.ts
    faq.ts
    index.ts                        — Re-export all client tutorials

src/components/help/
  TutorialSearch.tsx                — Shared search component
  TutorialGuide.tsx                 — Renders a single tutorial (steps + tip)
  TutorialCategory.tsx              — Accordion of tutorials in a category
  // Existing files updated:
  HelpCenterPanel.tsx               — Rebuilt with new data + search
  GettingStartedTab.tsx             — Keep checklist, update items
  HowToGuidesTab.tsx                — Rebuilt with client tutorial data
  FAQTab.tsx                        — Rebuilt with expanded FAQ data

src/pages/admin/
  AdminHelpCenter.tsx               — Rebuilt with admin tutorial data + search
```

### Key Design Decisions
- **Each tutorial is a standalone object** — easy to add, edit, or remove independently
- **Keyword search** across both admin and client libraries
- **Same rendering components** shared between admin and client
- **Remove fake walkthroughs** — replace with the actual step-by-step guides (which are more useful)
- **Keep the admin setup checklist and client onboarding modal** — they serve different purposes (progressive disclosure vs reference library)

---

## STEP 4 — Gaps Between Plan and App

Every admin sidebar item and client portal tab is covered. The only features NOT covered by tutorials are:
- **Notification Preferences** (client) — included in Communication category
- **Digital Twin** — mentioned in Client Management workspace guide
- **Multi-property switching** — mentioned in Getting Started navigation guide

No gaps remain between the planned tutorial library and current app features.

## Files Changed Summary

| Action | File Count | Description |
|--------|-----------|-------------|
| Create | ~25 data files | Tutorial content in `src/data/tutorials/` |
| Create | 3 components | TutorialSearch, TutorialGuide, TutorialCategory |
| Rebuild | 1 page | `AdminHelpCenter.tsx` |
| Rebuild | 3 components | HelpCenterPanel, HowToGuidesTab, FAQTab |
| Update | 1 component | GettingStartedTab (add missing checklist items) |
| No change | 3 files | HelpTooltip, ClientOnboardingModal, AdminSetupChecklist |

