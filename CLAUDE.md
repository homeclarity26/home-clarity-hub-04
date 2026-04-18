# Home Clarity Hub — Developer Reference

**Branch:** `main`
**Last updated:** 2026-04-18 after the AI memory + Claude Sonnet hybrid rollout

## 🧠 AI architecture (post-2026-04-18)

Two-model hybrid with persistent semantic memory:

- **Gemini (*-latest aliases)** — fast, cheap, vision-capable. Used for:
  chat agent (hbc-agent), photo analysis (analyze-photo, categorize-photo,
  enhance-photo → `gemini-pro-latest`), embeddings (`gemini-embedding-001`,
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

## ✅ Migrations applied through 2026-04-18

Most recent: `20260418000000_pgvector_memory_foundation.sql` — enables
pgvector, adds embedding columns, creates `agent_memory`, registers the
four `match_*()` RPCs. Applied via `npx supabase db push --linked`.

Earlier today: `20260417120000_handle_new_user_role_metadata.sql` —
honors `raw_user_meta_data.role` in the `handle_new_user()` trigger so
admin-created creators don't get stuck with a `client` role too.
**Stack:** React 18 + TypeScript + Vite (Bun runtime) · Supabase (Postgres, Auth, Storage, Edge Functions) · Gemini 2.0 Flash · shadcn/ui · TanStack React Query · Tiptap WYSIWYG · @react-pdf/renderer · date-fns · framer-motion · DOMPurify · @dnd-kit

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
- **67 edge functions:** ALL deployed + ACTIVE
- **All DB migrations:** applied (hero_image_url column, RLS tightening on 10 tables, project_updates table)
- **Storage buckets:** `property-photos` and `report-images` — public read, creator write
- **Secrets set:** GEMINI_API_KEY, RENTCAST_API_KEY, RESEND_API_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, VAPID keys, SUPABASE_* internals

**If edge functions are updated, redeploy with:**
```bash
export SUPABASE_ACCESS_TOKEN="<your token from supabase.com/dashboard/account/tokens>"
npx supabase functions deploy <function-name> --no-verify-jwt
```

---

## Recently Shipped (PRs #2-11, 2026-04-15 to 2026-04-16)

| PR | Summary |
|---|---|
| #2 | Review-redesign pass: lazy routes, QueryClient defaults, Monogram/HealthScoreRing/PropertyHero/PublishBar/MobileBottomNav/SanitizedHtml components, HomeTab collapse, ReportOverview architectural cover, persistent AI command bar, auth on 3 edge functions, RLS tightening, DOMPurify wrapping |
| #3 | Phase 1: expanded report to 65+ page templates (appliances, exterior structures, additional spaces/systems, safety) + "Add Custom Page" dialog in ReportPageManager |
| #4 | Phase 4: invoice full lifecycle — send_invoice_reminder, explain_invoice, get_overdue_invoices, generate_draw_schedule tools + draw schedule visualization bar |
| #5 | Phase 5: project tracker — ProjectPhaseTimeline, ProjectUpdateFeed, project_updates table, 4 new hbc-agent tools |
| #6 | Phase 6: AI agent completeness — 20 new tools (KB, annual reviews, team, automations, settings, client-side) |
| #7 | Phase 3: photo system — symmetrical grid layouts, @dnd-kit reorder, enhance-photo edge function, 4 agent tools |
| #8 | Phase 2: AI-first report creation — seed-report-from-notes edge function + PageAIChat component + 6 agent tools |
| #9 | Phase 7: motion + polish — Framer Motion animations, typography sweep (text-xs→text-sm), 44px touch targets |
| #10 | Phase 8: auth sweep on 15 edge functions (18 total), noImplicitAny enabled, nested ErrorBoundaries |
| #11 | Post-deployment review: fixed API 401 bug (AIEditPanel + useChat now use real JWT), 3 critical + 4 high-severity findings |

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
- **Monograms:** chapter/module badges (ES/EX/IN/SY/SP/SA) via `<Monogram>` component. Use `chapterToMonogram(groupId)` to map group IDs
- **Health scores:** use `<HealthScoreRing>` — color-coded, animated, accessible (role="meter")

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
- `properties` — core property + admin-uploaded `hero_image_url` (PR #2 added this)
- `reports` — status ('draft' | 'published'), completion_percent
- `report_pages` — narrative/specs/tiers/condition/images jsonb fields, status ('draft' | 'complete' | 'published')
- `invoices`, `projects`, `milestones`, `equipment`, `schedule_events`, `vendors`, `files`, `property_messages`

### Added in recent PRs
- `project_updates` (PR #5) — social-feed-style project updates with optional photos. RLS: creators manage, clients read own
- `properties.hero_image_url` (PR #2) — admin-uploaded front-of-house photo

### RLS status
- `properties`, `property_messages`, `report_pages`, `invoices`, `equipment` — scoped by `client_user_id` / `creator` role (verified via live smoke test)
- 10 formerly-leaky tables fixed in PR #2: `document_extractions`, `home_knowledge_base`, `property_timeline`, `structural_specifications`, `warranty_registry`, `permit_registry`, `service_history`, `photo_analyses`, `project_scopes`, `home_value_snapshots` — now use `public.user_can_access_property(id)` helper

---

## File Structure — Key New/Changed Components

```
src/
├── components/
│   ├── ui/                       # Shared design primitives
│   │   ├── Monogram.tsx          # ✨ NEW — ES/EX/IN/SY/SP/SA chapter badges
│   │   ├── HealthScoreRing.tsx   # ✨ NEW — animated SVG meter
│   │   └── SanitizedHtml.tsx     # ✨ NEW — DOMPurify wrapper for AI output
│   ├── portal/
│   │   ├── PropertyHero.tsx      # ✨ NEW — full-bleed hero w/ photo
│   │   ├── MobileBottomNav.tsx   # ✨ NEW — 4 tabs + More (replaces hamburger-only)
│   │   ├── PortalSidebar.tsx     # Desktop sidebar + controlled mobile drawer
│   │   └── ... (other widgets: SmartActionTiles, AICommandBar, etc.)
│   ├── report/
│   │   ├── PublishBar.tsx        # ✨ NEW — floating publish CTA in edit mode
│   │   ├── PageAIChat.tsx        # ✨ NEW — inline AI edit on each report page
│   │   ├── ReportOverview.tsx    # Architectural cover w/ monogram TOC
│   │   ├── ReportChapterNav.tsx  # Monogram pills + TOC drawer (keyboard-accessible)
│   │   └── ... (existing renderers)
│   ├── editor/
│   │   ├── ImageGrid.tsx         # Symmetrical CSS Grid layouts + @dnd-kit reorder
│   │   ├── AIEditPanel.tsx       # ← uses supabase.functions.invoke() now
│   │   └── ...
│   ├── agent/
│   │   └── ClientAgentPanel.tsx  # Persistent command bar + ⌘K + Sheet
│   ├── chat/
│   │   └── useChat.ts            # ← uses real JWT from session (NOT anon key)
│   ├── tabs/
│   │   ├── HomeTab.tsx           # Collapsed to hero + AI bar + tiles + "Explore more"
│   │   ├── ProjectsTab.tsx       # Phase timeline + update feed
│   │   ├── PaymentsTab.tsx       # Draw schedule bar + Promise.allSettled
│   │   └── ...
│   └── admin/
│       ├── ReportPageManager.tsx # "Add Custom Page" dialog
│       └── ... (existing)
├── data/
│   └── reportContent.ts          # 65+ page templates (was 39) — appliances, safety, etc.
├── pages/
│   ├── Index.tsx                 # MobileBottomNav + memoized footerReportContext
│   └── ... (all /admin/* and /trade/* routes are lazy-loaded)
└── App.tsx                       # Lazy routes + QueryClient defaults + TradePartnerRoute

supabase/
├── functions/
│   ├── _shared/
│   │   ├── auth.ts               # ✨ NEW — requireAuth / requireRole / requirePropertyAccess
│   │   ├── ai-client.ts          # Gemini wrapper (callAI)
│   │   └── rate-limit.ts
│   ├── hbc-agent/                # ~200 tools — THE AI operating system
│   ├── seed-report-from-notes/   # ✨ NEW — meeting notes → full report seed
│   ├── enhance-photo/            # ✨ NEW — Gemini Vision photo analysis
│   ├── chat-assistant/           # Auth-protected
│   ├── ai-edit/                  # Auth-protected (creator-only)
│   └── ... (67 total)
└── migrations/
    ├── 20260415000000_add_hero_image_url.sql
    ├── 20260415000001_tighten_leaky_rls.sql
    └── 20260415000002_create_project_updates.sql
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
- **Fonts:** Playfair Display (headings, `font-display`), IBM Plex Mono (labels/badges/timestamps, `font-mono`), Inter (body, `font-sans`)
- **Monograms:** ES (Executive Summary, gold circle navy text), EX (Exterior, navy circle gold text), IN (Interior, gold circle navy text), SY (Systems, navy circle gold text), SP (Strategy, gold circle navy text), SA (Safety, navy circle gold text)
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

- TypeScript strict mode: `noImplicitAny: true` is on, but `strict: false` still. Flipping to full strict would surface errors in ~20 admin files using `any` casts on untyped Supabase tables. Fix incrementally.
- `supabase/functions/types.ts` needs regeneration after recent migrations (`npx supabase gen types typescript --project-id vvwojahsianpmwjvkunn > src/integrations/supabase/types.ts`)
- ~50 remaining edge functions still need `requireAuth` applied (18 of 67 have it so far)
- `files` and `comments` tables referenced in docs but don't exist in DB — code references may need updating (found in post-deploy smoke test)

These are all documented in TODO.md.

---

*This file is the source of truth. If you ship a PR that changes the architecture, conventions, or schema — update this file in the same PR.*
