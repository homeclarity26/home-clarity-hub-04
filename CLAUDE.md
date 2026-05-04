# Home Clarity Hub — Developer Reference

<!-- ADAM-BRAIN CONTEXT — read at session start -->
<!-- Run: python3 ~/Desktop/organize-pipeline/brain/memory.py recall "HCR HCH" -->
<!-- Or via claude.ai: adam-brain connector → recent or recall -->
<!-- Master context: ~/Desktop/organize-pipeline/brain/master-context.md -->
<!-- Owner: Adam Kilgore, Summit County OH. 27 years renovation. HCH = platform every HCR client gets for life. -->
<!-- HCR = $4,500, 48-hr assessment. First beta: Johnsons mid-May 2026. -->
<!-- Brand: Navy #0A1628, Gold #B87333, Cream #EDE9E1. NO em-dashes EVER. -->
<!-- Token efficiency: read this file + TODO.md only. Don't re-read all components unless modifying one. -->

**Branch:** `main`
**Last updated:** 2026-05-04

---

## 🔒 Source of truth for HCR structure

`HCR_STRUCTURE_LOCK.md` (in repo root) is the canonical spec for the
five-chapter HCR structure, page templates, portal navigation, and
visual system. If anything below this section conflicts with that
file, the lock file wins. Read it before any structural change.

---

## 🛡️ Rules for any future Claude (or human) session

These are hard rules, not suggestions. They exist because this codebase
shipped 67 latent schema bugs before tonight's floor rebuild caught them.
Follow them and we don't rebuild again.

### UI / visual changes — one approval per session

Before making any UI or visual change (layout, component, color, spacing, font, copy), **present the full plan for all UI changes in the session in a single message and wait for Adam's approval**. Once approved, execute all of them without asking again. Do not ask per-change. Do not make UI changes without the upfront plan.

If a session has no UI changes, skip this step entirely.

### Before you write any code

1. **Read this file top to bottom.** Then read `TODO.md`. Don't
   hallucinate columns, tables, or edge-function names — every table and
   helper is either listed here or documented in its own file.
2. **Check live-DB columns before using them.** For any table you'll
   `insert`/`update`/`select` from, run:
   ```bash
   SUPABASE_ACCESS_TOKEN=$PAT npx --yes supabase db query --linked <<SQL
   SELECT column_name, data_type, is_nullable, column_default
   FROM information_schema.columns
   WHERE table_schema='public' AND table_name='<your_table>'
   ORDER BY ordinal_position;
   SQL
   ```
   Or grep the generated types at `src/integrations/supabase/types.ts`.
   **Do not invent columns** — every single bug the floor rebuild found
   was a phantom column hiding behind an `as any` cast.

### While you write code

3. **`as any` is banned** except on `"postgres_changes"` realtime subs.
   If TypeScript won't accept your call, the types are stale or your
   code is wrong. Regenerate types (step 5) or fix the call.
4. **Schema first, code second.** Any feature that needs a new column
   or table starts with a migration file. The commit that adds the
   migration also regenerates types **in the same PR**.
5. **Regenerate types after every migration:**
   ```bash
   SUPABASE_ACCESS_TOKEN=$PAT npx --yes supabase gen types typescript \
     --project-id vvwojahsianpmwjvkunn > src/integrations/supabase/types.ts
   ```
   - After every Supabase migration that changes schema, type regeneration runs as its own one-file ticket. Do not bundle type regen with feature work. The migration ticket and the regen ticket are separate PRs.
6. **Every new edge function starts from the template** in
   `#### Edge function template` below. Auth is on by default — if the
   function needs to be open (cron/webhook/public), write a one-line
   comment explaining why.

### Before you claim a task is done

7. **Run `bun run build`.** Must be clean.
8. **Run `npx tsc --noEmit` (or `tsc -b --force`).** Must be 0 errors.
   Vite compiles *through* TS errors; tsc doesn't. Build-passes is not
   proof of correctness.
9. **Run the Golden Path** locally — at least the flow your change
   touches:
   ```bash
   bun --env-file=.env.local scripts/golden-path-all.ts
   ```
   All 8 flows must pass. "It compiled" is not enough; a flow must
   prove your change survives a real read + write against live prod.
10. **Let CI run.** Open a PR. The `.github/workflows/golden-path.yml`
    workflow runs build + 5 deterministic + 6 AI-dependent flows with
    retries. Red CI = don't merge. Never bypass.

### What you do NOT do

11. **Never edit migrations that already ran in prod.** Write a new one
    that fixes the previous.
12. **Never `ALTER TABLE` from the Supabase dashboard.** Every change
    is a checked-in migration, period.
13. **Never deploy a single edge function manually** when `_shared/**`
    changed. The CI's `deploy-edge-functions.yml` redeploys every
    function when `_shared/` changes — let it run. Manual per-function
    deploys are what caused 19 stale bundles this session.
14. **Never add a "Coming soon" placeholder in the UI.** If a feature
    isn't ready, don't show it. If the data isn't there, show an honest
    empty state with specifics ("Not yet uploaded", "No services
    published yet"), not a future promise.
15. **Never add fixed heights or `overflow-y: auto` or `line-clamp-*`
    to any element wrapping AI-authored or admin-authored prose.**
    Universal expanding containers are the rule. See HCR Rebuild Locked
    Principles for full pattern.

---

## 🚦 Where the app stands (ALL REBUILD PHASES COMPLETE, 2026-05-04)

- **ALL 12 rebuild phases complete.** PRs #168–#199 merged on main.
- Golden Path 74/74 green; CI 11/11 jobs green on `main`.
- 0 TypeScript errors; 0 non-legit `as any` casts.
- CI auto-runs Golden Path on every push + daily at 12:00 UTC (11 jobs: build + 5 deterministic + 6 AI-dependent).
- CI auto-deploys edge functions when `supabase/functions/**` changes.
- Bobby chat is PERSISTENT — messages survive sessions via `bobby_threads` + `bobby_messages`.
- AI Co-Pilot has proposal engine — `propose-copilot-updates` suggests page edits.
- Proactive alerts run daily at 08:00 UTC via pg_cron.
- Push notifications wired for Bobby replies, escalations, and proactive alerts.
- Portal structure complete: 6 tabs, all templates rendering, Bobby bar on every screen.
- Photo edge functions use `gemini-flash-latest` + 90s timeout.
- `callClaude()` falls back to Gemini on Anthropic 400/401/402/403 + credit-exhausted body.
- `callAI()` (Gemini) falls back to Claude on 429/500/503/network error.

If you make a change that breaks any of the above, it's a regression.
Fix before merging.

---

## 🧠 AI architecture (post-2026-04-18)

Two-model hybrid with persistent semantic memory:

- **Gemini (*-latest aliases)** — fast, cheap, vision-capable. Used for:
  chat agent (hbc-agent), photo analysis (analyze-photo, categorize-photo,
  enhance-photo → `gemini-flash-latest`), embeddings (`gemini-embedding-001`,
  768-dim via `outputDimensionality: 768`), and ~50 smaller background
  tasks. Model IDs in `MODEL_MAP` all resolve to `gemini-flash-latest` /
  `gemini-pro-latest` / `gemini-flash-lite-latest` — which Google auto-bumps
  to the current stable.
- **Claude Sonnet 4.6 (`claude-sonnet-4-6`)** — long-form writing with
  consistency + voice. Used by 7 heavy functions: `seed-report-from-notes`,
  `generate-scope`, `generate-annual-review`, `draft-page-narrative`,
  `generate-exec-summary`, `ai-proposal-kickoff`, `ai-invoice-assistant`.
  Via `callClaude()` in `_shared/ai-client.ts` with prompt caching enabled
  (`cacheableContext` → `cache_control: ephemeral`). Falls back to Gemini
  Flash if `ANTHROPIC_API_KEY` is unset.

**Persistent memory + RAG (pgvector):**
- Tables with `embedding vector(768)` columns: `report_pages`,
  `knowledge_templates`, `home_knowledge_base`, plus the new `agent_memory`
  (per-creator, optionally per-property).
- RPCs for cosine-similarity search: `match_report_pages`,
  `match_knowledge_templates`, `match_home_knowledge`, `match_agent_memory`.
- `retrieveContext()` in `_shared/rag.ts` is the single helper for RAG —
  embeds a query, pulls top-K from each source, formats for Claude's
  `cacheableContext`. Call it at the top of any writing function.
- `embed-content` edge function backfills embeddings for any row with
  `embedding IS NULL`. `retrieve-similar` is the HTTP-facing version of
  `retrieveContext`.
- Agent tools: **`remember`** stores a memory (embeds inline), **`recall`**
  semantic-searches stored memories, **`retrieve_context`** pulls across
  all four sources, **`search_knowledge_base`** became semantic too.
- **Gotcha:** Supabase edge functions can't fire-and-forget — when the
  `serve()` handler returns, any pending work is killed. That's why
  `remember`/`add_kb_article` embed synchronously via `callGeminiEmbedding`
  rather than calling `embed-content` in the background.

## 💬 Bobby Persistence Architecture (2026-05-04)

Bobby is the homeowner-facing AI assistant. Messages are PERSISTENT, not ephemeral.

### Data flow

1. `useBobbyThread` hook (in portal) auto-creates a `bobby_threads` row on first load.
2. User sends message → inserted into `bobby_messages` (sender='user').
3. Hook invokes `hbc-agent` edge function with message + last 10 messages as history.
4. Agent reply persisted as `bobby_messages` (sender='bobby').
5. Supabase realtime subscription pushes new messages to all connected clients.

### Admin replies

1. Bobby escalates messages it can't handle → row in `escalation_queue`.
2. Adam sees pending escalations at `/admin/bobby-inbox` (AdminBobbyInbox.tsx).
3. Adam's reply is inserted as `bobby_messages` (sender='adam').
4. Push notification sent to homeowner via `send-push-notification` edge function.

### Rules for future sessions

- **Never revert ConciergePanel to ephemeral AgentChat.** The panel consumes `useBobbyThread`.
- **Never rename Bobby back to Concierge** in any homeowner-facing text. Internal code may still use `concierge/` paths.
- **The hbc-agent expects `{ message, history, context }` body** — not `{ message, propertyId, threadId }`.
- **Always persist the agent reply** — if hbc-agent returns `{ reply }`, it MUST be written to `bobby_messages`.

## 📲 Push Notification Stack

- **Service Worker:** `public/sw.js` — handles `push` events, shows native notifications, tracks clicks.
- **Subscription:** `push_subscriptions` table stores VAPID endpoint + keys per user.
- **Send function:** `supabase/functions/send-push-notification/index.ts` — takes `{ user_id, title, body, url }`.
- **Frontend helper:** `src/lib/pushNotifications.ts` — fire-and-forget `sendPushNotification()` + typed templates.
- **Triggers:** Bobby replies (AdminBobbyInbox), escalations (Bobby auto-escalate), proactive alerts (cron).

## 🤖 Proactive Alerts + Co-Pilot

### Proactive Alerts
- `generate-proactive-alerts` edge function scans all properties daily (08:00 UTC via pg_cron).
- Alert types: age-based (system >80% lifespan), service-overdue (>12 months), seasonal.
- Frequency cap: max 3 alerts per property per week.
- `NotificationBell.tsx` reads from `proactive_alerts` table.

### AI Co-Pilot
- `PostPublishCoPilot.tsx` on AdminClientDetail shows copilot_inbox items.
- "Analyze" button calls `propose-copilot-updates` edge function.
- Proposals suggest which report pages should be updated based on the inbox item content.
- `AddToMyHome.tsx` is the client-side floating button that submits to copilot_inbox.

---

## ✅ Migrations applied through 2026-05-04

Most recent:
- `20260504010000_schedule_proactive_alerts_cron.sql` — pg_cron schedules `generate-proactive-alerts` daily at 08:00 UTC via `pg_net.http_post`.
- `20260504000000_create_bobby_copilot_alerts.sql` — creates `bobby_threads`, `bobby_messages`, `escalation_queue`, `copilot_inbox`, `proactive_alerts` tables + RLS + adds `report_pages.proposed_by_ai` column.

Earlier:
- `20260418000000_pgvector_memory_foundation.sql` — pgvector, embedding columns, `agent_memory`, four `match_*()` RPCs.
- `20260417120000_handle_new_user_role_metadata.sql` — `handle_new_user()` honors `raw_user_meta_data.role`.

**Stack:** React 18 + TypeScript + Vite (Bun runtime) · Supabase (Postgres, Auth, Storage, Edge Functions) · Gemini 2.5 Flash · Claude Sonnet 4.6 · shadcn/ui · TanStack React Query · Tiptap WYSIWYG · @react-pdf/renderer · date-fns · framer-motion · DOMPurify · @dnd-kit

---

## ⚠️ Session Start Protocol

**At the start of every new session, read these files first:**
1. `CLAUDE.md` (this file) — current architecture + conventions
2. `TODO.md` — open tasks + priorities

**To minimize token cost in a new session:**
- Trust this file — don't re-read every listed component unless you're modifying it
- Don't launch parallel review agents unless the user explicitly asks for a review
- For single-file fixes, edit directly instead of running a full exploration

---

## What This App Does

Home Clarity Hub (HBC) is a **home stewardship platform** for professional home consultants. Two sides:

1. **Admin Side** (`/admin/*`) — Consultant workspace. Clients, intake, reports, projects, payments, equipment, schedule, vendors.
2. **Client Portal** (`/portal/:propertyId`) — Homeowner view. Read-only report, projects, payments, equipment registry, schedule, documents, AI chat.

Core product: a structured **Home Clarity Report** — multi-page document covering every area/system of a home (roof, HVAC, electrical, plumbing, kitchen, appliances, etc.) with condition ratings, narrative, specs, tiered pricing, financial roadmap, action plan. Built in admin, published to client portal.

---

## ✅ Deployment Status (LIVE)

- **Supabase project:** `vvwojahsianpmwjvkunn` at https://vvwojahsianpmwjvkunn.supabase.co
- **70+ edge functions:** ALL deployed + ACTIVE (includes generate-proactive-alerts, propose-copilot-updates, send-push-notification, send-maintenance-reminders)
- **All DB migrations:** applied through 2026-05-04 (bobby/copilot/alerts tables, pg_cron schedule)
- **pg_cron:** `generate-proactive-alerts-daily` runs at 08:00 UTC
- **Storage buckets:** `property-photos`, `report-images`, `wizard-uploads` — public read, creator write
- **Secrets set:** GEMINI_API_KEY, ANTHROPIC_API_KEY, RENTCAST_API_KEY, RESEND_API_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, VAPID keys, SUPABASE_* internals

**If edge functions are updated, redeploy with:**
```bash
export SUPABASE_ACCESS_TOKEN="<your token from supabase.com/dashboard/account/tokens>"
npx supabase functions deploy <function-name> --no-verify-jwt
```

---

## Recently Shipped — Full HCR Rebuild (PRs #101–#199, completed 2026-05-04)

The rebuild is COMPLETE. All 12 phases merged. Key milestones:

| Phase | PRs | What shipped |
|---|---|---|
| Floor rebuild | #101–#122 | Health Score deletion, 5-step wizard, 6-tab portal, ESLint rules, Golden Path 62/62, old wizard retired |
| Wizard overhaul | #149–#157 | AI-drafts every page on mount, 20 structural templates, voice input, PDF extraction |
| Infrastructure | #124–#145 | Anthropic/Gemini cross-fallbacks, wizard state persistence, multi-property selector, GP self-provisioning |
| Phase 0–4 | #168–#178 | CLAUDE.md reconciliation, naming consolidation (Bobby), 5-chapter taxonomy, visual system, report + room/system/vision templates, Information + Strategy standing pages |
| Phase 5 (Bobby) | #194–#195 | DB migration (bobby_threads + messages + escalation_queue), Bobby input bar, ConciergePanel rewrite, AdminBobbyInbox |
| Phase 6 | #179–#182 | TOC select-all, post-publish redirect, paired Hover/iGUIDE cards, Step 5 upload + missing-photo banner |
| Phase 7 (Co-Pilot) | #196 | PostPublishCoPilot with AI "Analyze" button, AddToMyHome floating button, copilot_inbox table |
| Phase 8 (Documents) | #183–#185 | Documents tab replaces Contacts, semantic search UI, context shortcuts on pages |
| Phase 9 (Alerts) | #186–#187, #197 | Recurring Care in Schedule, What Changed feed, proactive_alerts engine + NotificationBell |
| Phase 10 (Mobile) | #188–#189 | Mobile nav stacking, photo capture flow on Portal Home |
| Phase 11 (Twin) | #190–#191 | Cover/Twin view toggle, digital twin grid, hover states + vision badge |
| Phase 12 (Cleanup) | #192 | Delete 24 orphan components (-4,754 lines) |
| Integration | #198 | Bobby persistence (useBobbyThread), AI proposals, pg_cron for alerts |
| Push | #199 | Push notifications for Bobby replies, escalations, proactive alerts |

---

## Tech Stack Details

| Layer | Technology |
|---|---|
| Frontend runtime | Bun (also works with Node 18+) |
| Framework | React 18 + TypeScript + Vite |
| UI components | shadcn/ui (Radix UI + Tailwind CSS) |
| Data fetching | TanStack React Query v5 (60s staleTime, no focus refetch, 1 retry) |
| Rich text editor | Tiptap (StarterKit + Image + Placeholder) |
| PDF generation | @react-pdf/renderer |
| Animations | framer-motion |
| HTML sanitization | DOMPurify (wrapped in `<SanitizedHtml>` component) |
| Drag-and-drop | @dnd-kit (photos, sortable lists) |
| Backend | Supabase (PostgreSQL + Auth + Storage + Edge Functions) |
| Edge Functions | Deno runtime, auth helper at `supabase/functions/_shared/auth.ts` |
| AI model | Google Gemini 2.5 Flash via `generativelanguage.googleapis.com/v1beta` |
| AI agent | `hbc-agent` edge function, ~200 tools spanning admin + client roles |
| Routing | React Router v6, all admin/trade routes lazy-loaded |
| Notifications | sonner (toast) |

### Key Patterns

- **All AI calls** go through Supabase Edge Functions with `requireAuth` or `requireRole` from `_shared/auth.ts`
- **AI agent tools:** defined in `hbc-agent/index.ts` TOOLS array, executed in `executeTool` switch. Role-gated via `allowedRoles: ["creator"]` or `["client"]`
- **Structured JSON responses:** set `responseMimeType: "application/json"` in generationConfig
- **Frontend auth to edge functions:** use `supabase.functions.invoke()` — it auto-passes the user's JWT. For SSE streaming (like chat), manually pull token via `supabase.auth.getSession()` then `access_token` in Bearer header. **NEVER use `VITE_SUPABASE_PUBLISHABLE_KEY` in Authorization headers** — that's the anon key and auth-protected functions will reject it with 401.
- **Mock user bypass:** `propertyId.startsWith("mock-")` pattern in all client portal tabs for demo data
- **Edit mode:** `useEditMode()` context — `canEdit` boolean gates inline editing UI
- **Image storage:** `report-images` bucket for page photos, `property-photos` bucket for hero photos
- **Monograms:** The six-chapter monogram system (ES/EX/IN/SY/SP/SA) is deprecated. Page-level monogram badges may still be used but no longer represent chapters. The HCR has five chapters: Information, Interior Spaces, Exterior Spaces, Systems & Appliances, Strategy.
- **Condition ratings:** word-based only (Excellent / Good / Fair / Poor / Critical). HealthScoreRing deleted as of PR #101. No numerical health scores anywhere.

---

## Environment Variables

### Frontend (`.env`)
```
VITE_SUPABASE_URL="https://vvwojahsianpmwjvkunn.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY=...        (anon key)
VITE_SUPABASE_PROJECT_ID="vvwojahsianpmwjvkunn"
VITE_VAPID_PUBLIC_KEY=...                (push notifications)
VITE_QBO_*=...                           (QuickBooks — optional)
VITE_GOOGLE_MAPS_API_KEY=...             (optional — Places Autocomplete in the New Client wizard)
```

Without `VITE_GOOGLE_MAPS_API_KEY`, the New Client wizard's address field
(`src/components/admin/AddressAutocomplete.tsx`) falls back to a plain
text input with an inline "Add VITE_GOOGLE_MAPS_API_KEY to .env to enable
autocomplete and property images" hint — the wizard still works, just
without Places suggestions or the Street-View-backed property image.

To enable: create a Google Cloud project with **Maps JavaScript API** and
**Places API** enabled, create a browser API key, restrict it to your
portal domains, then drop it into `.env.local` as `VITE_GOOGLE_MAPS_API_KEY=...`.

### Supabase Edge Function Secrets (all set)
```
GEMINI_API_KEY              ✅ (flash/pro via *-latest, + embeddings)
ANTHROPIC_API_KEY           ✅ (added 2026-04-18 for Claude Sonnet hybrid)
RENTCAST_API_KEY            ✅ (for lookup-property-data)
RESEND_API_KEY              ✅ (for email)
STRIPE_SECRET_KEY           ✅ (for create-checkout / subscriptions)
STRIPE_WEBHOOK_SECRET       ✅
VAPID_PUBLIC_KEY            ✅
VAPID_PRIVATE_KEY           ✅
SUPABASE_URL / ANON / SERVICE_ROLE ✅
```

---

## Database Schema (Key Tables)

### Core
- `profiles` — user profile (id, email, full_name, phone, avatar_url)
- `user_roles` — (user_id, role: 'creator' | 'client' | 'trade_partner')
- `properties` — core property record. `client_user_id` links to the homeowner. `hero_image_url` for front-of-house photo.
- `reports` — status ('draft' | 'published'), completion_percent
- `report_pages` — narrative/specs/tiers/condition/images jsonb fields, status ('draft' | 'complete' | 'published'), `proposed_by_ai` boolean
- `invoices`, `projects`, `milestones`, `equipment`, `schedule_events`, `vendors`, `files`, `property_messages`

### Bobby + Co-Pilot + Alerts (added 2026-05-04)
- `bobby_threads` — one row per homeowner per property. `{id, property_id, client_user_id, last_message_at}`. Persistent across sessions.
- `bobby_messages` — `{id, thread_id, sender ('user' | 'bobby' | 'adam'), content, status, action_taken, created_at}`. Every message persists.
- `escalation_queue` — `{id, message_id, thread_id, property_id, status ('pending' | 'in_progress' | 'resolved' | 'dismissed'), context_summary, resolved_at}`. Admin inbox for Bobby handoffs.
- `copilot_inbox` — `{id, property_id, submitted_by, item_type ('photo' | 'document' | 'note'), content, file_url, status ('pending' | 'applied' | 'dismissed')}`. Client/admin submissions for report updates.
- `proactive_alerts` — `{id, property_id, user_id, alert_type, title, description, priority, dismissed, created_at}`. Generated daily by cron.
- `push_subscriptions` — `{id, user_id, endpoint, p256dh, auth, created_at}`. Web Push subscription storage.

### RLS status
- All Bobby/Co-Pilot/Alert tables have RLS: clients see own property data, creators see all.
- `properties`, `property_messages`, `report_pages`, `invoices`, `equipment` — scoped by `client_user_id` / `creator` role.
- 10 formerly-leaky tables fixed: `document_extractions`, `home_knowledge_base`, `property_timeline`, `structural_specifications`, `warranty_registry`, `permit_registry`, `service_history`, `photo_analyses`, `project_scopes`, `home_value_snapshots` — use `public.user_can_access_property(id)` helper.

---

## File Structure — Key Components

```
src/
├── components/
│   ├── ui/                       # Shared design primitives
│   │   ├── Monogram.tsx          # Chapter badges (page-level)
│   │   └── SanitizedHtml.tsx     # DOMPurify wrapper for AI output
│   ├── portal/
│   │   ├── PropertyHero.tsx      # Full-bleed hero w/ photo
│   │   ├── MobileBottomNav.tsx   # 4 tabs + More
│   │   ├── PortalSidebar.tsx     # Desktop sidebar + controlled mobile drawer
│   │   ├── NotificationBell.tsx  # Reads proactive_alerts + ai_notification_nudges
│   │   ├── AddToMyHome.tsx       # Floating "+" button for client copilot submissions
│   │   └── concierge/
│   │       ├── ConciergeBar.tsx  # Gold "B" Bobby bar (bottom of every screen)
│   │       └── ConciergePanel.tsx # PERSISTENT Bobby thread (uses useBobbyThread)
│   ├── portal/home/
│   │   ├── PortalHome.tsx        # Portal Home dashboard
│   │   └── BobbyInputBar.tsx     # Pinned "Ask Bobby" input under hero
│   ├── report/
│   │   ├── PublishBar.tsx        # Floating publish CTA in edit mode
│   │   ├── PageAIChat.tsx        # Inline AI edit on each report page
│   │   ├── ReportOverview.tsx    # Cover view with chapter cards
│   │   └── ReportChapterNav.tsx  # TOC drawer (keyboard-accessible)
│   ├── editor/
│   │   ├── ImageGrid.tsx         # Symmetrical CSS Grid + @dnd-kit reorder
│   │   └── AIEditPanel.tsx       # supabase.functions.invoke("ai-edit")
│   ├── tabs/
│   │   ├── HomeTab.tsx           # Hero + Bobby bar + tiles
│   │   ├── ProjectsTab.tsx       # Phase timeline + update feed
│   │   └── PaymentsTab.tsx       # Draw schedule bar
│   └── admin/
│       ├── wizard/               # 5-step new client wizard
│       ├── PostPublishCoPilot.tsx # AI proposal engine for copilot_inbox items
│       └── ... (existing)
├── hooks/
│   └── useBobbyThread.ts         # THE Bobby persistence hook (auto-create thread, realtime sub, agent invoke)
├── lib/
│   └── pushNotifications.ts      # sendPushNotification + templates (bobbyReply, bobbyEscalation, proactiveAlert)
├── pages/
│   ├── Index.tsx                 # Portal shell + AddToMyHome for non-creators
│   ├── admin/
│   │   └── AdminBobbyInbox.tsx   # Escalation management + reply composer
│   └── ... (all /admin/* and /trade/* routes lazy-loaded)
└── App.tsx                       # Routes include /admin/bobby-inbox

supabase/
├── functions/
│   ├── _shared/
│   │   ├── auth.ts               # requireAuth / requireRole / requirePropertyAccess
│   │   ├── ai-client.ts          # callAI (Gemini) + callClaude (Sonnet) with cross-fallbacks
│   │   └── rate-limit.ts
│   ├── hbc-agent/                # ~200 tools — Bobby's AI backend
│   ├── generate-proactive-alerts/ # Cron-triggered: age/service/seasonal alerts
│   ├── propose-copilot-updates/  # AI suggests which pages a copilot item should update
│   ├── send-push-notification/   # Web Push via VAPID
│   ├── seed-report-from-notes/   # Meeting notes → full report seed
│   ├── enhance-photo/            # Gemini Vision photo analysis
│   ├── ai-edit/                  # expand/tighten/match_brand_voice
│   └── ... (70+ total)
├── migrations/
│   ├── ...earlier migrations...
│   ├── 20260504000000_create_bobby_copilot_alerts.sql
│   └── 20260504010000_schedule_proactive_alerts_cron.sql
└── config.toml
```

---

## Key Conventions

### Calling edge functions from the frontend

```typescript
// ✅ CORRECT — user's JWT is auto-included
import { supabase } from "@/integrations/supabase/client";
const { data, error } = await supabase.functions.invoke("function-name", {
  body: { ...payload }
});

// ✅ CORRECT for SSE streaming — pull real JWT manually
const { data: sessionData } = await supabase.auth.getSession();
const token = sessionData?.session?.access_token;
if (!token) { toast.error("Please log in again."); return; }
const resp = await fetch(URL, {
  headers: { Authorization: `Bearer ${token}` },
  body: JSON.stringify(payload),
});

// ❌ WRONG — anon key will be rejected by auth-protected functions
headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` }
```

#### Edge function template (auth-on-by-default — copy verbatim)

Every new edge function starts from this scaffold. If auth is
intentionally skipped, replace the `requireRole` block with a
`// NO AUTH: <reason>` comment.

### Edge function auth template

```typescript
// supabase/functions/your-function/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireRole, corsHeaders, json } from "../_shared/auth.ts";
import { callAI } from "../_shared/ai-client.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const auth = await requireRole(req, ["creator"]); // or requireAuth(req) for any role
  if ("error" in auth) return auth.error;

  try {
    const body = await req.json();
    // ... work with auth.user, auth.userSupabase (RLS-respecting), auth.adminSupabase (bypasses RLS)
    return json({ ok: true, result: ... });
  } catch (e) {
    console.error("my-fn error:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown" }, { status: 500 });
  }
});
```

### Adding a new hbc-agent tool

1. Add tool definition to TOOLS array in `supabase/functions/hbc-agent/index.ts`:
   ```typescript
   { name: "my_tool", description: "...", parameters: { type: "object", properties: {...}, required: [...] }, allowedRoles: ["creator"] },
   ```
2. Add case handler in `executeTool()` switch — return `{ success: true, result: {...}, entity_id, entity_type }`
3. Deploy: `npx supabase functions deploy hbc-agent`

### Mock data bypass

```typescript
if (propertyId?.startsWith("mock-")) { return <MockView />; }
```

### Gemini call via _shared/ai-client

```typescript
const text = await callAI({
  system: "You are a...",
  prompt: userInput,
  json: true,             // for structured JSON response
  temperature: 0.3,
});
```

---

## Design System Reference

- **Colors:** all HSL, defined in `src/index.css` under `:root`
  - Navy `221 47% 20%` (primary)
  - Cream `40 33% 97%` (background)
  - Gold `43 41% 59%` (accent) + `--hbc-gold-readable: 34 47% 38%` for text on cream
  - Rust `16 86% 39%` (destructive/rust accent)
- **Fonts:** Cormorant Garamond SemiBold/Bold (headings, `font-display`), IBM Plex Mono (labels/badges/timestamps, `font-mono`), Inter (body, `font-sans`)
- **Chapters:** The HCR has five chapters: Information, Interior Spaces, Exterior Spaces, Systems & Appliances, Strategy. The previous six-monogram chapter system (ES/EX/IN/SY/SP/SA) is deprecated. Page-level monogram badges may still be used for individual pages but no longer represent chapters.
- **Touch targets:** all interactive elements `min-h-[44px]`
- **Motion:** 400-800ms ease-out, respects `prefers-reduced-motion` (zeroed globally in index.css)

---

## Runbook

### Run the Golden Paths (deploy gate)

**This is the single most-important check before shipping.** Four
business-critical flows, end-to-end, against live prod. If the suite is
green, the app works for real users right now. Any red = nothing else
is true until it goes green again.

```bash
# Run everything (one green/red signal)
bun --env-file=.env.local scripts/golden-path-all.ts

# Run one flow (faster iteration when debugging a specific area)
bun --env-file=.env.local scripts/golden-path.ts            # core: auth → seed → publish → invoice → portal
bun --env-file=.env.local scripts/golden-path-messaging.ts  # creator ↔ client messaging + cross-tenant check
bun --env-file=.env.local scripts/golden-path-proposal.ts   # client approves a tier → project + invoice
bun --env-file=.env.local scripts/golden-path-rls.ts        # every tenant-scoped table resists cross-client reads
```

Required env (already in `.env.local` on Adam's machine):
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

Each script exits 0 on PASS, 1 on FAIL. The meta-runner does the same
for the whole suite. Full suite runs in ~50s when healthy. Every script
self-cleans — throwaway users + test rows are deleted at the end,
pass or fail. See each script's top comment + `WALKTHROUGH_FINDINGS.md`
"Golden Path run" section for what each step means in business terms.

**When to run:**
- After any migration, edge-function change, or Vercel deploy.
- Before telling Adam the work is "done." "The AI said it's good" ≠
  "the Golden Path still passes." Run the suite, then claim green.
- Weekly even when nothing's changed — catches upstream Supabase /
  Anthropic / Gemini breakage before a real client hits it.

Every bug this suite has surfaced (5 P0s on 2026-04-18 alone:
status-constraint drift, PricingTiers crash, seed parseJSON fragility,
broken invoice gen_random_bytes, client-side RLS on approve-tier) was
invisible to unit tests + code review + Claude's own inspection. The
Golden Paths are the only signal that catches these bugs before clients do.

### Local dev
```bash
bun install
bun run dev           # → http://localhost:8080
bun run build         # production build; chunked via vite.config.ts manualChunks
```

### Deploy a single edge function
```bash
export SUPABASE_ACCESS_TOKEN="..."
npx supabase functions deploy <name> --no-verify-jwt
```

### Run a new migration
```bash
export SUPABASE_ACCESS_TOKEN="..."
# Creates migration file:
# supabase/migrations/<timestamp>_<name>.sql
npx supabase db push
```

### Create + merge a PR from a feature branch
```bash
# Create branch, commit, push:
git checkout -b feature/x && git add -A && git commit -m "..." && git push -u origin feature/x

# PR via GitHub API (since gh CLI may not be installed):
TOKEN=$(git credential fill <<< $'protocol=https\nhost=github.com' | grep password | cut -d= -f2)
PR=$(curl -s -X POST -H "Authorization: token $TOKEN" \
  https://api.github.com/repos/homeclarity26/home-clarity-hub-04/pulls \
  -d '{"title":"...","head":"feature/x","base":"main","body":"..."}')
PR_NUM=$(echo "$PR" | python3 -c "import sys,json; print(json.load(sys.stdin).get('number',''))")
curl -s -X PUT -H "Authorization: token $TOKEN" \
  https://api.github.com/repos/homeclarity26/home-clarity-hub-04/pulls/$PR_NUM/merge \
  -d '{"merge_method":"squash"}'
curl -s -X DELETE -H "Authorization: token $TOKEN" \
  https://api.github.com/repos/homeclarity26/home-clarity-hub-04/git/refs/heads/feature/x
git checkout main && git pull origin main
```

---

## Pre-Launch Verification Checklist

Run this before letting any real client touch the app. Paper review misses runtime bugs — this catches them. Layered cheap → expensive:

| Layer | What | Automated? | Who runs it |
|---|---|---|---|
| **Static** | `bun run build` + typecheck | Yes (CI + every PR) | Claude, default |
| **Smoke tests** | `bun --env-file=.env.local scripts/smoke-test-ai.ts` — hits every AI edge function, asserts 200 + non-empty + not a catch-block fallback | Yes, but requires `SUPABASE_TEST_USER_JWT` in `.env.local` | Claude after every backend change |
| **Role walk-through** | Log in as admin → create a client → log in as that client → click every primary tab → send a message → ask the Home Assistant something → verify a reply comes back. ~30 min. | No | **Adam, before every release** |
| **Error paths** | Force offline Gemini (wrong API key) and confirm the UI shows a readable error, not a silent blank | No, spot-check | Adam or Claude |
| **RLS spot audit** | Create a second test user; confirm they cannot read the first user's properties/messages/invoices | No, spot-check | Claude whenever RLS changes |
| **Mobile real-device** | Open on an actual phone (not devtools emulator) — tap through the portal, check touch targets + keyboard | No | **Adam, before every release** |
| **Observability** | Sentry on front-end + Supabase log drains wired to something Adam checks | Set up once | Adam (one-time) |

**The single highest-leverage item is the role walk-through.** Most bugs that slip past reviews are caught in 5 minutes of clicking around as a client. Treat it as a ship gate.

**Getting a test JWT for the smoke script:** log in as a creator in the browser → open devtools Network tab → find any edge-function call → copy the `Authorization: Bearer ...` value → put the token into `.env.local` as `SUPABASE_TEST_USER_JWT=eyJ...`. Rotate when it expires.

### Session Start Protocol reminder

When a new session inherits this file, it should:
1. Not assume any checklist items are done. Read `TODO.md`'s "Pre-launch status for current build" section.
2. After any backend change, re-run the smoke test before marking a task done.
3. After any UI change, flag to Adam that a role walk-through is needed — don't pretend to have done it.

---

## Known Small TODOs (non-blocking)

- TypeScript `strict: false` at root — `noImplicitAny` + `strictNullChecks`
  are off. The floor rebuild cleaned up every `as any` (PR #65), so
  turning on full strict mode would surface only genuine null-safety
  gaps rather than schema drift. Flip incrementally.
- The `_shared/ai-client.ts` bundled-per-function model is fragile by
  design. Long-term we should consider a shared-runtime approach, but
  the CI deploy workflow covers it in practice — any `_shared/**` change
  now redeploys every function.
- 10 edge functions still `throw` on bad input; they all work on good
  input. Convert remaining ones to structured 400s as you touch them.
- Pre-launch checklist items (role walk-through, mobile real-device)
  are **Adam-does-it-before-release** — automation is a substitute but
  not a replacement. Don't skip.

These are all documented in TODO.md.

---

## Floor-rebuild artifacts (reference)

Tonight's rebuild left these helpers on disk — don't delete them:

- `scripts/ci/golden-path.yml.template` — source of truth for the CI
  runner; if you need to modify `.github/workflows/golden-path.yml`,
  update the template first so the intent is documented.
- `scripts/ci/deploy-edge-functions.yml.template` — same for the
  edge-function auto-deploy workflow.
- Migrations `20260418060000_restore_report_and_page_columns.sql`,
  `20260418070000_harden_triggers.sql`, `20260418080000_restore_creator_notes.sql`
  restore columns + harden triggers that the rebuild surfaced.
- `supabase/config.toml` lists `verify_jwt = false` per-function; the
  functions that matter do their own `requireAuth`/`requireRole` in-app
  via `_shared/auth.ts`.

If you find yourself about to do something that feels like it's
papering over a problem — stop. Re-read the rules at the top of this
file. Most paper-overs are the exact pattern that led to the floor
rebuild.

---

*This file is the source of truth. If you ship a PR that changes the architecture, conventions, or schema — update this file in the same PR.*

---

## HCR Rebuild Locked Principles

These principles emerged from the v2 prototype lock and the four-pass codebase audit completed 2026-04-26. They apply to every ticket in MASTER_IMPLEMENTATION_PLAN.md and to any future HCR work. They do not replace the existing principles in this file. They extend them.

### No Health Score, anywhere

The Health Score concept is removed system-wide. Word-based condition ratings are the only acceptable surface: Excellent, Good, Fair, Poor, Critical. Each rating has a color (success / success / accent / destructive / destructive). No numerical score appears in any UI, in any DB column, in any edge function output, in any block content, in any printed PDF, or in any client-facing copy.

If a ticket touches a Health Score artifact (file, column, function, block type), the ticket either deletes the artifact or migrates its data to the word-rating model per the sequence in Master Spec Section 5.7. Tickets that "preserve Health Score for backward compatibility" or "leave the column for safety" are non-compliant. Drop the column, delete the file, ship the migration.

### Universal expanding containers

Every container that holds AI-authored or admin-authored prose expands to fit content. No fixed heights. No max-height. No inner scroll on prose containers. No line-clamp on multi-line prose. No text-overflow ellipsis on prose.

Exceptions are narrow: single-line metadata in lists (truncate allowed), photo captions in grid view (2-line clamp acceptable because full caption shows on photo open), vendor names in tight table columns (truncate at column boundary with full name on hover/tap). Everything else expands.

The pattern is enforced by ESLint rule `no-fixed-height-on-prose` (added in Phase 9). The rule flags max-h-*, overflow-y-auto, and line-clamp-* Tailwind utilities on elements with dangerouslySetInnerHTML or known prose-bearing component children.

### AI Expand and Tighten — universal pattern

Every prose field (admin or client side) is wrapped by the AIExpandTightenField component. The component renders the field plus three buttons: Expand, Tighten, optionally Match brand voice. Each button calls the ai-edit edge function with the matching mode.

When you build any new prose-bearing component, use AIExpandTightenField. Do not roll your own textarea. Do not add a "smart edit" button that calls anything other than ai-edit. The component is the universal pattern. No exceptions for "small" or "internal" fields.

### Visual diff acceptance criterion

Every ticket that changes UI ships with a visual diff verification. Acceptance criteria for any UI ticket includes "matches screen N in v2 PDF" with the specific screen number, OR "produces a clean visual diff against the locked prototype" if the change is small enough to inspect inline.

The v2 PDF is the visual source of truth. caldwell_prototype_v2.html is the interactive source of truth. Both are stored in Adam's Drive at 03 HOMETOWN BUILDERS CLUB > HCR > Prototype v2. If a ticket's visual outcome is ambiguous, the prototype wins.

### One-to-three file rule

Every ticket touches a maximum of 3 files. Tickets that need to touch more get split. The rule is non-negotiable for two reasons: it forces clean dependency boundaries, and it makes Adam's PR review tractable.

If a ticket appears to require touching more than 3 files, the right move is to break it into a sequence with explicit depends_on. Example: "Add condition_rating block type" looks like 1 file (types.ts) until you realize it also needs a renderer (blocks/ConditionRatingBlock.tsx) and a switch update (BlockRenderer.tsx). That's 3 files exactly. If a fourth file would be needed (like a migration), that's the next ticket.

The rule applies to test files too. If adding a feature requires updating 5 test files, split the ticket. The exception is when a single new test file is added alongside the feature — that counts as one of the 3.

### Golden Path 74/74 baseline

The Golden Path test suite is at 74/74 (grew from 47 → 62 → 74 across the rebuild). CI runs all 74 on every push. A ticket that breaks any green test does not merge. A ticket that adds a new test and the test fails on first run is fine. A ticket that "skips" a test to ship faster is non-compliant.

### Em-dashes are never permitted in client copy

Adam's preference is locked. No em-dashes in any text that reaches a user. ESLint rule no-em-dashes-in-jsx (added in Phase 9) flags them in JSX text, JSX attribute strings, and template literals. Comment em-dashes don't count. The rule auto-suggests replacement with comma + space or semicolon + space, but final replacement requires manual review because the right replacement varies by context.

This rule applies to AI-generated content as well. The match_brand_voice mode of ai-edit explicitly forbids em-dashes. The frontend runs a final check after match_brand_voice returns: if the output contains an em-dash, the field is not auto-replaced and a toast prompts the user to retry or edit manually.

### HCR colors are canonical everywhere

The HCR brand palette applies system-wide, including AKR-branded admin documents (proposals, invoices, change orders, the Master Financial Ledger). There is no dual brand system. The canonical hex values are in Master Spec Section 6.9.

Inline hex codes outside the design token file (src/index.css) are flagged by ESLint rule no-inline-hex (added in Phase 9). Future work uses CSS variables and shadcn tokens exclusively.

### IBM Plex Mono is loaded (fixed PR #108)

The brand specifies three fonts: Cormorant Garamond (display), Inter (body), IBM Plex Mono (data labels and uppercase mono captions). Plex Mono is loaded via index.html. Every `font-mono` usage renders Plex Mono.

### Caldwell residence is pure 1998 build

The fictional sample home is a pure 1998 Colonial. Not "1998 over 1920s bones." Not "rebuilt in 1998 on an older foundation." Pure 1998. Six photos from earlier batches that depicted older structures (stone basement, knob-and-tube, old boiler) are NOT for Caldwell content and have been set aside for future sample homes.

Any AI content generation for Caldwell that drifts toward older-construction tropes is a regression. The systems are 1998 originals or post-1998 replacements. The framing is conventional 2x6. The electrical is 200-amp Square D QO from 1998.

### AKR is openly disclosed as Adam's company

Vision projects on the report disclose that AK Renovations is Adam Kilgore's general contracting business. Transparency is the brand position. The disclosure is not buried, not euphemistic, and not optional.

The Vision page renderer (Section 3 ticket B5) includes an "Execution Path" section that names AKR explicitly when AKR is the recommended trade partner for the project. When AKR is not the recommended trade partner (because scope or specialty is outside AKR's range), the Execution Path names the recommended trade partner instead. Either way, the path is named.

### HBC Concierge pricing is honest

The pricing tiers are $200/month for up to 5 services managed, $400/month for up to 10, $600/month for over 10. The value proposition is time savings and frustration reduction, not cost reduction. Concierge subscription does not save the family money on the underlying services. It saves them the coordination overhead of managing those services themselves.

Any AI-generated copy that frames Concierge as "saving you money" is non-compliant. The honest framing template is: "You'd be on our $X/month plan plus your current $Y in services equals $Z total. What you stop doing: scheduling, chasing receipts, remembering due dates, vetting vendors."

### Prototype-first methodology is permanent

The working pattern that produced v2: build interactive prototype as self-contained HTML in pieces, iterate until Adam approves, lock prototype as visual specification, derive written spec from locked prototype, hand prototype + spec to Claude Code.

This pattern applies to any future major UX decision. Specs are not written before the prototype is locked. The prototype IS the specification for visual decisions. Written specs translate the prototype into engineering deliverables, not the other way around.

---

## HCR Rebuild — Forbidden Patterns

In addition to the existing forbidden patterns above, the following patterns are forbidden during HCR rebuild work. They are tripwires that have caused real damage in this codebase.

### Suggesting a fresh approach to anything in v2

The v2 prototype is locked. "Fresh approach" suggestions are non-compliant. If a v2 pattern seems suboptimal, the response is either to flag it as an open question for Adam (do not proceed) or to implement it as specified (proceed). Never silently substitute your preferred pattern.

### Adding features that aren't in the prototype

Features absent from the prototype are absent from the spec. A ticket that introduces UI not present in v2 is out of scope. If you find a gap that the prototype clearly missed (say, a confirmation dialog for a destructive action), flag it as an open question and stop. Do not add it.

### Generating placeholder content when the Mock Report has the real content

The Mock Report (deliverable 3) is the canonical content for every Caldwell page. Tickets that need Caldwell sample content reference the Mock Report directly. Tickets that generate "placeholder" Caldwell content are non-compliant — the placeholder will drift from the Mock Report and create a parallel reality.

### Changing colors, fonts, spacing, or component patterns

The brand system is locked. Cormorant Garamond, Inter, IBM Plex Mono. Navy #0A1628, Gold #B87333, Cream #EDE9E1, Rust #B7410E. The shadcn/ui component patterns. Tailwind spacing scale. Tickets that introduce new fonts, new spacing units, or new component primitives are non-compliant.

### Reverting Bobby to Concierge or removing persistence

Bobby is the locked name. ConciergePanel uses useBobbyThread for persistent messaging. Never replace it with ephemeral AgentChat. Never rename Bobby back to "Concierge" or "Home Assistant" in homeowner-facing text. The folder path `portal/concierge/` stays for code organization but all user-facing copy says "Bobby."

### Touching more than 3 files in a single ticket

Stated above as a principle, repeated here as a forbidden pattern because it's the most common violation. If your ticket needs to touch 4+ files, split it. There is always a clean split.

### Skipping Golden Path tests

The 62/62 baseline must hold. Skipping a test "temporarily" or marking it `.skip` to ship faster is non-compliant. If a test catches a real regression in your ticket, the right move is to fix the regression, not skip the test.

### Improvising on missing spec

If a ticket appears to need information not in the spec, the right response is to stop and ask Adam. Do not improvise. Do not "interpret what Adam probably wanted." Do not fill the gap with your own design judgment. The spec is the source of truth; gaps in the spec are work for Adam, not for you.

---

## HCR Rebuild — Ticket Discipline

Every ticket in MASTER_IMPLEMENTATION_PLAN.md follows this structure. Tickets that don't follow it are non-compliant and should be rejected before work begins.

### Required ticket fields

Every ticket has:

1. **ID** — unique identifier (e.g., A1, B7, C12, D3, M2)
2. **Title** — one-line summary
3. **Phase** — Phase 1 through Phase 10 per Master Spec Section 6.6
4. **Files touched** — explicit file paths, max 3
5. **Time estimate** — in hours, integer
6. **Acceptance criteria** — bulleted list, each item testable
7. **Visual diff reference** — screen number from v2 PDF, OR explicit "no UI change"
8. **Depends on** — list of ticket IDs that must merge first, OR "none"
9. **Golden Path test** — the test number this ticket affects, plus a one-line description of how to verify
10. **Notes** — anything Adam should know before merging

### Acceptance criteria specificity

"Implement the foo" is not an acceptance criterion. "When user clicks Save in Step 3, page row updates with status='complete'" is. Each criterion is a single observable behavior. If a criterion can't be tested by clicking through the app or running a script, rewrite it.

### Visual diff workflow

For UI tickets:
1. Implement the change locally.
2. Open the affected page on local dev.
3. Open the v2 PDF to the referenced screen number.
4. Compare side-by-side.
5. Note any visual deltas in the PR description.
6. If deltas exist that aren't justified by the ticket scope, fix them or split into a follow-up ticket.

### Time estimate calibration

- 1-2 hours: simple file deletion, single-component refactor, ESLint rule addition, type regen
- 3-4 hours: new block type with renderer, new edge function with simple logic, table migration with backfill
- 5-8 hours: complex new component (AIExpandTightenField, ConciergeBar), wizard step rebuild, multi-edge-function workflow

Tickets estimated above 8 hours should be split. The 8-hour ceiling is empirically the point where context degrades and quality drops.

### Dependency rules

If ticket B depends on ticket A, B's depends_on field lists A. The punch list is sequenced so dependencies merge first. If you find yourself wanting to start B before A merges, the right move is to wait or to inline a short stub that lets B proceed independently — not to violate the sequence.

### PR review

Adam is the PR reviewer for every HCR rebuild ticket. Nothing merges without his verification. The PR description must include:
- Ticket ID
- Visual diff notes (or "no UI change")
- Golden Path test status (which tests passed, which failed if any)
- Any deviations from the spec, with rationale

---

## HCR Rebuild — File and Component Conventions

### New components live in dedicated subdirectories

- `src/components/admin/wizard/` — the 5-step wizard step components and shared sub-components (Step1Intake.tsx, Step2TOC.tsx, Step3Authoring.tsx, Step4Strategy.tsx, Step5Publish.tsx, AICoPilotPanel.tsx, SideBySideEditor.tsx, AIClarifyingQuestions.tsx, AIQualityGate.tsx, CustomPageDialog.tsx, FieldChecklist.tsx)
- `src/components/portal/concierge/` — ConciergeBar.tsx (Bobby floating bar), ConciergePanel.tsx (persistent Bobby thread via useBobbyThread)
- `src/components/portal/home/` — PortalHome.tsx, PortalHomeHero.tsx, TodaysBrief.tsx, HoverEmbed.tsx, IGuideEmbed.tsx, FloorPlanEmbed.tsx
- `src/components/portal/report/` — ReportHome.tsx and supporting components
- `src/components/wysiwyg/blocks/` — new block renderers (RoomRecordBlock.tsx, SystemRecordBlock.tsx, ReplacementBriefingBlock.tsx, VisionProjectBlock.tsx, RecurringServicesBlock.tsx, CapitalPlanBlock.tsx, MaintenanceCalendarBlock.tsx, TodaysBriefBlock.tsx, ConditionRatingBlock.tsx, ConditionPillBlock.tsx, FieldChecklistBlock.tsx, ConciergeActionBlock.tsx)
- `src/components/editor/` — AIExpandTightenField.tsx (extends existing editor folder)

Existing components stay in their current locations. No bulk relocation in this rebuild.

### Edge functions live where they always have

`supabase/functions/{function-name}/index.ts`. Each new function gets its own folder. Each function has an entry in `supabase/config.toml`.

### Migration files follow Supabase convention

`supabase/migrations/YYYYMMDDhhmmss_descriptive_name.sql`. Timestamps strictly ascending. No edits to past migrations. Past migrations are immutable history.

### Block type registration

A new block type requires three changes:
1. Add the type literal to the BlockType union in `src/components/wysiwyg/types.ts`
2. Add a default content shape and template entry to BLOCK_TEMPLATES
3. Add a case to BlockRenderer.tsx switch statement that renders the block

These three changes are 3 files exactly — at the limit of the 3-file rule. Any additional file (a migration, a new edge function, a separate test file) is a follow-up ticket.

### Naming conventions

- Components: PascalCase, descriptive. ReplacementBriefingBlock not RBBlock.
- Hooks: camelCase starting with "use". useReplacementBriefing not getReplacementBriefing.
- Types: PascalCase. ReplacementBriefingTier not replacement_briefing_tier.
- DB columns: snake_case. hbc_concierge_tier not hbcConciergeTier.
- File names: match the default export. ReplacementBriefingBlock.tsx exports ReplacementBriefingBlock.

### State management

The rebuild does not introduce a new state management library. Existing patterns continue:
- React Query for server state (with the existing mobile-tuned defaults — staleTime, gcTime, no focus refetch)
- React Context for cross-cutting client state (auth, edit mode, theme)
- Local component state for UI ephemera

Specifically: do not introduce Zustand, Redux, Jotai, or Recoil during this rebuild. If a new piece of cross-cutting state emerges that doesn't fit the existing patterns, flag it as an open question for Adam.

### Type regeneration is its own ticket

After any DB migration that changes schema, type regeneration runs as its own ticket touching one file (`src/integrations/supabase/types.ts`). The ticket is one PR, no logic changes. Bundling type regen with feature work creates messy diffs that obscure the actual code changes.

---

## HCR Rebuild Reference Documents

When working on any HCR rebuild ticket, these are the source-of-truth documents. They live in Adam's Google Drive at `03 HOMETOWN BUILDERS CLUB > HCR > Audit + Spec` (and earlier folders for the prototype).

### Required reads before starting any rebuild ticket

1. **HCR_STRUCTURE_LOCK.md** (repo root) — supersedes all prior structural specs in conflict. The canonical five-chapter structure, page templates, portal nav, Bobby, and visual system.
2. **HCR_REBUILD_RUNNER.md** (repo root) — phase sequencing and PR discipline.
3. **HCR_CLEANUP_LIST.md** (repo root) — explicit kill targets per phase.
4. **HCR_PROTOTYPE_DECISIONS_LOG.md** — every locked decision through [v2.44]. Non-negotiable inputs.
5. **HCR_Master_Spec_Section_1_Foundation.md** (historical, deprecated — superseded by lock file in conflict)
6. **HCR_Master_Spec_Section_2_Admin_Builder.md** (historical, deprecated)
7. **HCR_Master_Spec_Section_3_Page_Renderers.md** (historical, deprecated)
8. **HCR_Master_Spec_Section_4_Client_Portal.md** (historical, deprecated)
9. **HCR_Master_Spec_Section_5_Backend.md** (historical, deprecated)
10. **HCR_Master_Spec_Section_6_Cross_Cutting.md** (historical, deprecated)
11. **MASTER_IMPLEMENTATION_PLAN.md** — the punch list with all tickets
12. **HCR Mock Report — The Caldwell Residence** — long-form Caldwell content used as AI seed and demo

### Visual source of truth

- `caldwell_prototype_v2.html` — interactive prototype, 3.4 MB version with embedded photos, viewing copy
- `caldwell_prototype_v2_slim.html` — 214 KB slim version for project knowledge upload
- `caldwell_prototype_v2_screens.pdf` — 55-page PDF of every screen (50 desktop + 5 mobile) for visual diff reference

### Audit findings

- `HCR_Audit_Pass_A_Edge_Functions.md` — 71 edge functions classified
- `HCR_Audit_Pass_B_Portal_Surface.md` — 16 tabs and 40 portal components mapped to v2 6-tab structure
- `HCR_Audit_Pass_C_Redundancy.md` — 11 cross-surface redundancies reconciled
- `HCR_Audit_Pass_D_Brand_Copy.md` — em-dash, font, color, Health Score sweeps quantified

### Project context

- `HCR_REBUILD_CONTEXT.md` — strategic foundation
- `HCR_PROTOTYPE_BRIEF.md` — prototype success criteria
- `HCR_CODEBASE_GROUND_TRUTH.md` — repo state pre-rebuild
- `HCR_SESSION_HANDOFF.md` — current session state

### When in doubt

If a ticket's correct behavior isn't clear from the documents above, stop and ask Adam. Do not improvise. The spec is comprehensive; gaps in the spec are work for Adam.
