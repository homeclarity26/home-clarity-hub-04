

# Self-Learning Intelligence Layer — Architecture Plan

## What Already Exists (Learning Infrastructure Audit)

The app already captures a significant amount of raw data, but **none of it feeds back** into AI suggestions or auto-fill. It's storage, not learning.

### Existing Data Sources (passive logging, no feedback loop)
| Table | What It Captures | Used by AI? |
|-------|------------------|-------------|
| `agent_logs` | Every agent interaction: message, reply, tools called, duration, page context | No — logged but never queried by the agent |
| `activity_log` | All admin/client actions: edits, publishes, comments, payments | No — displayed in timeline only |
| `audit_log` | Before/after diffs on entity changes | No |
| `page_views` / `client_sessions` | Client portal engagement (pages visited, session duration) | No — displayed in engagement tab only |
| `feedback` / `client_satisfaction_scores` | Client ratings + comments | No |
| `report_edit_history` | Field-level edit diffs on report pages | No |
| `ai_draft_history` | AI-generated narratives (input notes → generated text) | No |
| `narrative_snippets` | Reusable narrative blocks with usage_count | No — `usage_count` exists but never incremented |
| `maintenance_outcomes` | Actual vs predicted maintenance results | No — predictions exist but outcomes never feed back |
| `portfolio_snapshots` | Daily business metrics snapshots | No — stored but never trended |
| `health_score_history` | Historical health scores per client | No — stored but never analyzed for trends |
| `estimates` | Full proposal analytics (view count, time spent, sections viewed, accepted/declined) | No |
| `knowledge_templates` | Knowledge base articles with categories | Partially — injected into `draft-page-narrative` for context |

**Summary:** The app has ~15 data sources that could power a learning system, but currently zero feedback loops exist. Every AI call uses only the immediate context — never historical patterns.

---

## What Needs to Be Built

### New Database Tables (5 tables)

1. **`advisor_patterns`** — Learned playbooks from admin behavior
   - `admin_id`, `pattern_type` (report_structure, estimate_template, workflow_sequence, communication_style, pricing_pattern), `pattern_key` (e.g., "kitchen_report", "hvac_estimate"), `pattern_data` (JSONB — the learned template/structure), `usage_count`, `last_used_at`, `confidence_score` (0-1, increases with repeated use)

2. **`ai_suggestion_outcomes`** — Feedback loop for every AI suggestion
   - `suggestion_type` (draft_narrative, auto_fill, estimate_prefill, smart_reply, agent_recommendation), `suggestion_data` (JSONB — what was suggested), `outcome` (accepted, edited, rejected), `edited_data` (JSONB — what the admin changed it to, if edited), `context` (JSONB — what entity, what page), `admin_id`, `created_at`

3. **`client_behavior_profiles`** — Per-client engagement/personality model
   - `client_id` (unique), `engagement_level` (high, medium, low, dormant), `communication_preference` (detailed, summary, minimal), `response_speed_avg_hours`, `portal_focus_areas` (JSONB — array of most-visited tabs), `goals_active`, `satisfaction_trend` (improving, stable, declining), `churn_risk_score` (0-100), `last_computed_at`

4. **`cross_client_insights`** — Aggregated anonymous patterns
   - `insight_type` (common_issue, budget_pattern, timeline_pattern, seasonal_trend, churn_signal), `insight_key` (e.g., "homes_1960s_electrical"), `insight_data` (JSONB), `affected_client_count`, `confidence`, `last_updated`

5. **`learning_events`** — Raw event bus for all learnable moments
   - `event_type` (report_completed, estimate_sent, estimate_responded, project_closed, draft_edited, goal_added, agent_query, etc.), `actor_id`, `actor_role`, `entity_type`, `entity_id`, `event_data` (JSONB — full payload), `created_at`

### New Edge Functions (2 functions)

1. **`learn-from-activity`** — Background processor triggered by cron or event
   - Reads recent `learning_events`, aggregates into `advisor_patterns`, `client_behavior_profiles`, and `cross_client_insights`
   - Updates `narrative_snippets.usage_count` when snippets are reused
   - Computes client engagement levels from `page_views` + `client_sessions`
   - Identifies churn signals from declining engagement + overdue invoices

2. **`get-smart-context`** — Called by `hbc-agent` before each AI call
   - Given an entity type + context, returns relevant learned patterns:
     - For report drafting: advisor's typical structure, preferred language, past narratives for similar systems
     - For estimates: typical pricing for this service type, acceptance rate data
     - For client interactions: client's behavior profile, preferred communication style
     - Cross-client insights relevant to this property (age, location, systems)

### Modified Edge Functions

1. **`hbc-agent/index.ts`** — Inject learned context into system prompt
   - Before the ReAct loop, call `get-smart-context` to fetch relevant patterns
   - Append to system prompt: "Based on your past work: [patterns]"
   - After tool execution, log a `learning_event` for each action taken
   - Log suggestion outcomes when admin edits or overrides AI-suggested content

2. **`draft-page-narrative/index.ts`** — Use advisor patterns for style
   - Query `advisor_patterns` for this admin's report writing style
   - Include past narratives for the same system type as few-shot examples
   - After generation, log to `ai_suggestion_outcomes`

### Modified Frontend Components (3 files)

1. **`AgentChat.tsx`** — Track suggestion outcomes
   - When agent suggests something and admin modifies it, capture the delta
   - Send outcome events to a new `/learning-event` endpoint or inline in next agent call

2. **`ClientAgentPanel.tsx`** — Personalize based on behavior profile
   - Fetch `client_behavior_profiles` for this client on mount
   - Adjust quick chips and greeting based on engagement level
   - High engagement → proactive suggestions; Low engagement → simpler prompts

3. **Report editor (ReportPage.tsx)** — Log when AI drafts are edited
   - After AI draft is generated and admin saves edits, log the diff as a `learning_event`

---

## Phased Build Plan

### Phase 1 — Event Bus + Suggestion Tracking (highest value, lowest complexity)
**Tables:** `learning_events`, `ai_suggestion_outcomes`
**Changes:** Instrument `hbc-agent` to log learning events after every tool call. Instrument `draft-page-narrative` to log suggestion outcomes. Add a simple outcome tracker in `AgentChat.tsx`.
**Value:** Starts capturing data immediately. Every interaction becomes training data.
**Effort:** ~2 hours

### Phase 2 — Advisor Pattern Recognition
**Tables:** `advisor_patterns`
**Edge function:** `learn-from-activity` (cron, runs daily)
**What it does:** Analyzes `learning_events` + `report_pages` + `estimates` + `ai_suggestion_outcomes` to extract:
- Report structure preferences (section order, rating tendencies, language style)
- Estimate pricing patterns (avg price per service type, typical line items)
- Workflow sequences (what steps admin takes for common tasks)
**Value:** Pre-fill reports/estimates based on how the advisor actually works.
**Effort:** ~3 hours

### Phase 3 — Smart Context Injection into Agents
**Edge function:** `get-smart-context`
**Changes:** `hbc-agent` calls `get-smart-context` before each conversation to load:
- Advisor's patterns (for admin) or client's behavior profile (for client)
- Relevant cross-client insights
- Past suggestion outcomes to improve current suggestions
**Value:** Every AI response becomes personalized and historically informed.
**Effort:** ~3 hours

### Phase 4 — Client Behavior Profiling
**Tables:** `client_behavior_profiles`
**Changes:** `learn-from-activity` computes profiles from `page_views`, `client_sessions`, `feedback`, `estimates` (response time), agent interaction frequency.
**Frontend:** `ClientAgentPanel` adapts tone and suggestions per profile.
**Value:** Passive clients get gentle nudges, power users get advanced suggestions.
**Effort:** ~2 hours

### Phase 5 — Cross-Client Intelligence
**Tables:** `cross_client_insights`
**Changes:** `learn-from-activity` aggregates anonymized patterns:
- "Homes built before 1970 commonly need electrical panel upgrades" (from `report_pages` condition data + property year)
- "Projects of type X typically run Y% over budget" (from `projects` actual vs estimated)
- "Clients who ignore 3+ maintenance items show churn signals" (from engagement data)
**Value:** Proactive alerts like "Based on homes similar to yours, you may want to consider..."
**Effort:** ~3 hours

### Phase 6 — Approval Layer + Labeling
**Changes:** All learned patterns that could result in client-facing actions pass through the existing `requiresConfirmation` flow in the agent. AI suggestions are labeled with a "✨ Suggested based on your past work" badge in the UI. The admin always has final say.
**Effort:** ~1 hour

---

## Technical Decisions

### No vector database or RAG pipeline needed (yet)
The data volume for a single advisor with <500 clients is small enough that structured JSONB queries in Postgres are faster and simpler than a vector DB. The `advisor_patterns` and `cross_client_insights` tables use JSONB with indexed keys. If the platform scales to multiple advisors with thousands of clients, a pgvector extension could be added later for semantic search across narratives — but that's a scale concern, not a current need.

### No third-party services required
- AI: Already using Lovable AI gateway (Gemini 2.5 Flash)
- Storage: All in existing Supabase Postgres
- Processing: Edge functions with cron scheduling (already used for `payment-escalation-check`, `maintenance-alerts`)

### Privacy architecture
- `client_behavior_profiles` are per-client, accessible only to the admin
- `cross_client_insights` contain only aggregated, anonymous patterns — never individual client data
- Learning events are scoped to `actor_id` and never cross tenant boundaries
- Client agent only sees its own profile, never other clients' data

---

## Files Summary

| Action | File | Phase |
|--------|------|-------|
| Migration | 5 new tables | 1-5 |
| Create | `supabase/functions/learn-from-activity/index.ts` | 2 |
| Create | `supabase/functions/get-smart-context/index.ts` | 3 |
| Edit | `supabase/functions/hbc-agent/index.ts` | 1, 3 |
| Edit | `supabase/functions/draft-page-narrative/index.ts` | 1 |
| Edit | `src/components/agent/AgentChat.tsx` | 1, 6 |
| Edit | `src/components/agent/ClientAgentPanel.tsx` | 4 |
| Edit | `src/components/report/ReportPage.tsx` | 1 |

