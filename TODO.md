# Home Clarity Hub — Master TODO

**Branch:** `claude/nostalgic-archimedes`
**Last updated:** 2026-03-21
**Read this file at the start of every session.**

---

## 🔴 CRITICAL — Must Complete Before App Works in Production

These are blockers. Nothing AI-powered works until these are done.

- [ ] **Set Supabase Secrets**
  - `STRIPE_SECRET_KEY` — needed for payment features (user will add later)
  - `STRIPE_WEBHOOK_SECRET` — needed for Stripe webhook verification
  - `GEMINI_API_KEY` — needed for all AI features (currently using Lovable AI gateway)
  - `RENTCAST_API_KEY` — needed for property auto-lookup

- [ ] **Set Frontend Env Var**
  - Add `VITE_GOOGLE_MAPS_API_KEY=your_key_here` to `.env`
  - Enable Places API in Google Cloud Console

---

## 🟡 MEDIUM PRIORITY — Polish & Enhancement

- [ ] **Resend email — client invitation**
  - Currently: `create-client-account` edge function creates an account and returns temp credentials; invite is manual copy-paste
  - Future: Resend API sends a branded HTML email with portal link + login credentials
  - Needs `RESEND_API_KEY` secret

- [ ] **Vendor Portal (future)**
  - Vendors currently just a contact list per creator
  - Phase 2: vendors get login accounts, receive job requests, submit quotes
  - New DB tables: `vendor_accounts`, `job_requests`, `quotes`

---

## ✅ COMPLETED

Everything below is done and committed.

### Infrastructure & Auth
- [x] Supabase auth (login, signup, forgot/reset password)
- [x] Creator vs. Client role system (`profiles.role`)
- [x] Edit mode context (`useEditMode`, `canEdit`)
- [x] Admin layout (AdminHeader, AdminSidebar, route guards)
- [x] Dark mode / theme toggle (persisted to localStorage)
- [x] PWA support (service worker, manifest.json, offline caching)
- [x] Print stylesheet optimization

### Client Intake (Stage 1)
- [x] 4-step intake wizard (`NewReportWizard.tsx`)
- [x] Google Places autocomplete on address
- [x] Property auto-populate via Rentcast
- [x] Client Intelligence Card — AI analysis of discovery notes
- [x] Digital Assets step — Hover.to + iGuide URLs with status badges
- [x] AI page recommendation in wizard
- [x] QA check before publish (0–100 score, issue list)
- [x] Publish + create client auth account
- [x] Copy Invite Message
- [x] Bulk AI Draft All Pages in wizard

### Digital Twin (Stage 2)
- [x] Equipment table + RLS
- [x] Admin equipment CRUD with full lifecycle, service status badges
- [x] Client portal equipment read-only view with overdue/due-soon banners
- [x] Serial plate scanner → auto-populate equipment specs (Gemini Vision)
- [x] "Save to Equipment Registry?" after successful scan
- [x] Equipment service reminder edge function (`maintenance-alerts`)

### Report Builder (Stage 3)
- [x] ReportPageManager with inline status dropdowns + completion % auto-calc
- [x] BlockRenderer — all block types
- [x] Tiptap WYSIWYG editor for narrative
- [x] Autosave via `useReportPage.ts`
- [x] AI narrative draft per page
- [x] AI Edit Panel — highlight text, get AI suggestion
- [x] Image grid (upload/reorder/delete)
- [x] Dependencies editor
- [x] Recommended Vendors block
- [x] Financial Roadmap page
- [x] Action Plan page
- [x] Report template library (admin CRUD)
- [x] Report sharing — deep-link share button per section
- [x] Report version history
- [x] Report clone dialog
- [x] WYSIWYG block-based report editor
- [x] Drag-and-drop report reorder
- [x] Batch operations bar for bulk page actions
- [x] Internal report comments

### AI Features (Stage 4)
- [x] All AI edge functions built
- [x] Knowledge Base → AI context injection in draft-page-narrative
- [x] AI smart reply for messages
- [x] AI client brief / meeting prep
- [x] AI follow-up suggestions
- [x] AI cost estimator
- [x] AI client insights
- [x] AI maintenance schedule
- [x] AI transcript summarizer
- [x] AI condition forecast
- [x] AI draft assistant
- [x] AI priority recommendations
- [x] AI score explainer
- [x] AI vendor match
- [x] AI weekly digest
- [x] Cross-client AI insights
- [x] CRM AI assistant
- [x] QA coach panel
- [x] Daily brief

### Client Portal (Stage 5)
- [x] Portal route `/portal/:propertyId` with `?edit=true` and `?page=slug` params
- [x] Tab navigation: Home · Report · Projects · Payments · Equipment · Documents · Messages · Contacts · Schedule
- [x] HomeTab with property hero, report progress, quick nav, AI chat button, referral portal, property value widget
- [x] ReportTab with full report viewer + digital home section with Hover.to/iGuide iframe embeds + fullscreen modals
- [x] PDF download in portal
- [x] ProjectsTab — project list + "Request from Recommendation" flow
- [x] PaymentsTab — invoice table with overdue highlighting + Stripe "Pay Now" button
- [x] EquipmentTab — read-only registry with service alerts
- [x] MessagesTab — chat-style client↔advisor messaging with realtime
- [x] DocumentsTab — file downloads
- [x] ScheduleTab — event types, relative dates, history, seasonal checklists
- [x] ContactsTab — HBC team + vendor directory
- [x] AI chat assistant (ChatPanel.tsx, floating FAB)
- [x] Notification bell with unread count + AI nudges
- [x] Client referral portal
- [x] Estimates portal
- [x] Satisfaction surveys / NPS
- [x] Appointment request modal
- [x] Concierge request modal
- [x] Service request form
- [x] Interactive health dashboard
- [x] Predictive maintenance card
- [x] Seasonal maintenance tips & checklist
- [x] Property timeline
- [x] Cost comparison tool
- [x] Document expiration tracker
- [x] Home improvement wishlist
- [x] Photo inspection sidebar
- [x] AI command bar
- [x] AI suggestions strip
- [x] Voice nav button
- [x] Glossary tooltips
- [x] SMS notification settings

### Admin Workspace (Stage 6)
- [x] AdminClientDetail with all tabs
- [x] ClientOverview — inline editing, digital assets, Client Intelligence Card
- [x] "From Report Tier" invoice pre-fill
- [x] "From Recommendation" project pre-fill
- [x] VendorManager with page assignments
- [x] Admin messages section with realtime + video messages + AI smart reply
- [x] Property map view (Leaflet) on dashboard
- [x] Revenue analytics
- [x] Tasks section
- [x] Time tracking
- [x] Profitability card
- [x] Portal engagement card
- [x] Client health / risk scores
- [x] CRM with pipeline, contacts, timeline, communication, documents, financial, settings tabs
- [x] Subscription management (create, cancel, events)
- [x] Recurring invoice scheduler
- [x] Admin referrals tracking
- [x] Admin announcements
- [x] Admin annual reviews
- [x] Admin automations
- [x] Admin calendar / smart schedule
- [x] Admin field inspection
- [x] Admin goals dashboard
- [x] Admin help center
- [x] Admin inbox
- [x] Admin knowledge base
- [x] Admin vendor directory with performance tracking
- [x] Admin task board
- [x] Admin analytics
- [x] Admin settings (integrations hub, API/webhooks, SLA, push notifications, reports/exports)
- [x] Command palette (Cmd+K)
- [x] Keyboard shortcuts
- [x] Quick add FAB
- [x] Onboarding checklist / workflow builder
- [x] Audit log
- [x] Bulk report generator
- [x] Client CSV export
- [x] Client comparison view
- [x] Client smart filters
- [x] Photo submission review
- [x] Services library

### Payments & Stripe
- [x] Stripe checkout session (create-checkout edge function)
- [x] Stripe subscription management (create-subscription, cancel-subscription edge functions)
- [x] Stripe webhook handler (stripe-webhook edge function)
- [x] Subscription manager UI in admin
- [x] Subscription dashboard widget
- [x] Membership tier manager
- [x] Client portal "Pay Now" button
- [x] Estimates → Invoice conversion flow
- [x] Change orders on invoices
- [x] Payment escalation check

### Trade Partner Portal
- [x] Trade partner layout + dashboard
- [x] Bids, projects, messages, documents, schedule, tasks pages
