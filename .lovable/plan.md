

# Agent Knowledge & Capability Audit + Gap Plan

## STEP 1: Current Agent Infrastructure

### A. HBC Agent (Admin) — `supabase/functions/hbc-agent/index.ts`
**Architecture:** ReAct loop with Gemini 2.5 Flash, 70+ tool definitions, role-based access (`creator` vs `client`), confirmation flow for destructive/communication actions, agent_logs audit table.

**Current Admin Tools (16 groups, ~50 tools):**
| Group | Tools | Actions |
|-------|-------|---------|
| Client Mgmt | create/update/get/list/search/archive_client, update_stage, add_tag, log_activity, get_timeline | Full CRUD + CRM |
| Reports | get_report, list_pages, update_page, set_page_status, publish_report | Read + edit + publish |
| Field Inspection | create/get_field_inspections | Start + list |
| Projects | create/update/get/list/delete_project, add_task, update/complete_task, create_change_order, budget_summary | Full CRUD |
| Estimates | create/get/list/send_estimate, convert_to_invoice | Full lifecycle |
| Invoices | create/update/list/mark_paid/send/void_invoice, get_financial_summary | Full lifecycle |
| Vendors | create/update/get/list_vendors, create_review, request_bid | Full CRUD + bids |
| Communication | send_message, ai_write_message, get_inbox, mark_read | Messaging |
| Scheduling | create/get_calendar/get_upcoming/delete_event | Calendar CRUD |
| Equipment | add/get/update/delete_equipment | Full CRUD |
| Home Goals | create/list_home_goals | Create + list |
| Membership | list_membership_tiers, list_services | Read-only |
| Automations | list/toggle_automation | Read + toggle |
| Announcements | create/list_announcements | Create + list |
| Analytics | get_revenue_metrics, get_client_metrics, get_dashboard_summary | Read-only |
| Settings | get/update_admin_profile | Profile CRUD |

**Current Client Tools (10 tools):**
| Tool | Action |
|------|--------|
| client_get_home_summary | Read projects, invoices, equipment counts |
| client_get_report | Read published report + pages |
| client_get_projects | Read projects |
| client_get_invoices | Read invoices |
| client_send_message | Send message to advisor |
| client_request_appointment | Submit appointment request |
| client_get_equipment | Read equipment list |
| client_add_home_goal | Create a home goal |
| client_submit_feedback | Submit NPS/rating |
| (shared) create_home_goal / list_home_goals | Also accessible to client role |

### B. Chat Assistant (Client Report Chat) — `supabase/functions/chat-assistant/index.ts`
**Purpose:** Report-specific Q&A using Gemini direct API (not the agent). Streams responses with citation support (`[See: Page Title]`). Injected with full report page data, property info, goals, projects.
**Limitation:** Read-only, no tool calling, no action execution. Purely conversational about the report.

### C. CRM AI Assistant — `supabase/functions/crm-ai-assistant/index.ts`
**Purpose:** Chat-only assistant for CRM page. Uses Lovable AI gateway with streaming.
**Limitation:** No tool calling — it's a conversational-only assistant. It *describes* what it would do but cannot actually execute anything.

### D. Client Agent Panel — `src/components/agent/ClientAgentPanel.tsx`
**Purpose:** Floating sheet on client portal that calls `hbc-agent` with `role: "client"`.
**Passes:** userId, propertyId, sessionId, role="client", currentEntityType="client_portal".
**Missing:** Does NOT pass enrichment data (health score, report status, equipment, etc.). Does NOT pass `currentEntityName`.

---

## STEP 2: Knowledge Gaps — "How Do I..." Coverage

### Admin Side — What the agent DOESN'T know how to explain:
The system prompt is operationally focused ("I can do everything") but has **zero app navigation knowledge**. It cannot explain:
1. How to use the Knowledge Base (pricing/scope/system templates)
2. How the Proposal Builder works
3. How to use the Digital Twin / Document Intelligence features
4. How Annual Reviews work
5. How the Integrations Hub / Settings page works
6. How the Field Inspection mode works step-by-step
7. How the Report Editor WYSIWYG works
8. How the AI tools work (Score Explainer, Condition Forecast, Meeting Prep, etc.)
9. How the Referral tracking system works
10. How to use the Command Palette / keyboard shortcuts
11. How the Analytics dashboard works
12. How to use message templates
13. How the Task Board (Kanban) works

### Client Side — What the agent DOESN'T know how to explain:
1. How to navigate the portal (tab layout, More dropdown)
2. How to use the report chapter navigation
3. How the Cost Comparison Tool works
4. How to upload photos and flag concerns
5. How to use the Concierge Request / Services menu
6. How to view warranties in Equipment tab
7. How to view/accept estimates (EstimatesPortal)
8. How to use the billing/subscription features
9. How the notification preferences work
10. How the referral portal works

---

## STEP 3: Action Gaps — "Do It For Me" Coverage

### Admin Agent — Missing Tool Capabilities:
| Missing Action | Why It's Missing |
|----------------|------------------|
| Create/manage report (initialize, add pages) | Only read/edit/publish exist; no `create_report` or `add_report_page` |
| Knowledge Base CRUD | No tools for knowledge_templates table |
| Referral tracking | No tools to create/manage referrals |
| Task Board operations | No standalone task CRUD (only project sub-tasks) |
| Message templates | No tools to use/apply templates |
| Annual review generation | No tool to trigger annual review |
| AI tool invocations (Meeting Prep, Weekly Digest, Condition Forecast, etc.) | No agent tools to trigger these 15+ specialized edge functions |
| Subscription/billing management | No tools for membership management |
| Document upload/processing | No tools for Digital Twin actions |
| Notification/email sending | No tools for notification dispatch |
| Goal updates (complete/delete) | Only create/list exist |
| Estimate update/delete | Only create/get/list/send/convert exist |
| Project phase management | No tools for project phases (Gantt) |
| Vendor assignment to projects | No tools for vendor-project linking |

### Client Agent — Missing Tool Capabilities:
| Missing Action | Why It's Missing |
|----------------|------------------|
| View warranties / next service dates | `client_get_equipment` exists but no warranty-specific query |
| Upload photos | No tool for photo upload |
| Flag concern on a photo | No tool |
| Submit concierge/service request | No tool |
| View/accept/decline estimates | No tool |
| View schedule/upcoming events | No tool |
| View documents | No tool |
| Update/complete/delete a goal | Only add exists |
| View payment history | `client_get_invoices` exists but no detailed payment view |
| Make a payment | No tool (Stripe) |
| Refer a friend | No tool |
| Update notification preferences | No tool |

---

## STEP 4: Context Awareness Gaps

### Admin Agent:
- **Workspace rail** (`WorkspaceAgentRail`) correctly passes `clientId`, `propertyId`, `activeTab`, and enrichment data — this is well-implemented.
- **Global agent** (non-workspace pages) passes minimal context — only route-derived entity type/ID. Missing: dashboard stats, task counts, calendar data.

### Client Agent:
- **ClientAgentPanel** passes `propertyId` but does NOT pass:
  - `currentEntityName` (always empty string)
  - No enrichment data (health score, open invoice count, equipment needing service, report completion %)
  - No active tab awareness

---

## STEP 5: Recommended Build Plan

### Phase 1 — Comprehensive System Prompts (Knowledge Base)
**Goal:** Both agents can answer any "How do I..." question.

1. **Add an app knowledge document** to each system prompt — a structured map of every feature, where it lives, and how to use it. This goes directly into `ADMIN_SYSTEM_PROMPT` and `CLIENT_SYSTEM_PROMPT` in `hbc-agent/index.ts`.
   - Admin: ~40 features across Dashboard, Inbox, Clients, CRM, Projects, Tasks, Calendar, Analytics, Goals, Referrals, Announcements, Automations, Annual Reviews, Knowledge Base, Help, Settings
   - Client: ~15 tabs (Home, Report, Projects, Payments, Equipment, Documents, Messages, Photos, Services, Estimates, Schedule, Billing, Notifications, Refer, Contacts)

2. **Deprecate `crm-ai-assistant`** — the CRM page should use the main `hbc-agent` instead (which already has all CRM tools). The standalone CRM assistant is a weaker duplicate.

### Phase 2 — Missing Admin Tools (~15 new tools)
Add to `hbc-agent/index.ts`:

| Tool | Description |
|------|-------------|
| `create_report` | Initialize a new report for a property |
| `add_report_page` | Add a page to a report |
| `create_standalone_task` | Create a task not tied to a project |
| `update_home_goal` | Update goal status/details |
| `delete_home_goal` | Delete a goal |
| `update_estimate` | Update estimate fields |
| `delete_estimate` | Delete a draft estimate |
| `create_referral` | Log a referral |
| `knowledge_base_search` | Search knowledge templates |
| `trigger_ai_tool` | Meta-tool that invokes specialized edge functions (meeting-prep, weekly-digest, condition-forecast, score-explainer, maintenance-schedule, smart-notifications) |
| `send_notification_email` | Trigger email notification |
| `create_announcement_update` | Update/delete announcement |
| `list_tasks` | List all admin tasks (standalone) |
| `update_standalone_task` | Update a standalone task |

### Phase 3 — Missing Client Tools (~10 new tools)
Add to `hbc-agent/index.ts`:

| Tool | Description |
|------|-------------|
| `client_get_schedule` | Get upcoming events/maintenance for property |
| `client_get_documents` | List documents for property |
| `client_get_warranties` | Get equipment with warranty status |
| `client_get_estimates` | List estimates for property |
| `client_accept_estimate` | Accept a sent estimate |
| `client_submit_service_request` | Submit a concierge/service request |
| `client_update_goal` | Update/complete a goal |
| `client_get_maintenance_due` | Get maintenance items due this month |
| `client_submit_referral` | Submit a friend referral |
| `client_update_notifications` | Update notification preferences |

### Phase 4 — Enhanced Context Injection
1. **Client Agent Panel** — inject enrichment data:
   - Property name, health score, report completion %, open invoice count, equipment needing service, active project count, last advisor contact date
   - Pass `activeTab` from the portal's URL state

2. **Graceful limits** — Add a structured fallback in the system prompt: "If you cannot perform an action, explain what you can't do, why, and offer to walk the user through doing it manually or flag it for their advisor."

### Phase 5 — Consolidate AI Assistants
1. Retire `crm-ai-assistant` edge function — route CRM AI panel through `hbc-agent`
2. Consider whether `chat-assistant` (report Q&A) should merge into `hbc-agent` or remain separate (it has deep report context injection that works well as-is — recommend keeping it separate for now since it's specialized)

---

## Files to Change

| Action | File | Description |
|--------|------|-------------|
| Edit | `supabase/functions/hbc-agent/index.ts` | Add ~25 new tools, expand system prompts with app knowledge, add graceful limits |
| Edit | `src/components/agent/ClientAgentPanel.tsx` | Add enrichment context, property name, active tab |
| Edit | `src/components/admin/CRMAIAssistant.tsx` | Rewire to use hbc-agent instead of crm-ai-assistant |
| Delete | `supabase/functions/crm-ai-assistant/index.ts` | Deprecated — consolidated into hbc-agent |

### No database changes needed
All tables already exist. This is purely edge function logic + frontend context passing.

### Estimated scope
- Phase 1 (prompts): ~200 lines of system prompt additions
- Phase 2-3 (tools): ~400 lines of new tool handlers
- Phase 4 (context): ~30 lines in ClientAgentPanel
- Phase 5 (consolidation): ~20 lines rewiring CRM assistant

