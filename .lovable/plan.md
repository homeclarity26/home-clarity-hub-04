

# Plan: Embed AI Agent into Client Workspace

## Current State

The HBC Agent already exists as a fully-featured agentic AI assistant with 70+ tools (clients, invoices, projects, reports, vendors, scheduling, messaging, etc.). It currently renders as a **global floating button + right-side Sheet** via `AgentPanel.tsx` in `AdminLayout.tsx`. It's context-aware — it detects the current route and passes `currentEntityType` / `currentEntityId` to the backend.

The problem: it's a floating overlay that feels disconnected from the client workspace. It doesn't automatically scope to the current client, and the admin has to explain context manually.

## What Changes

Instead of just a floating sheet, the AI agent becomes a **first-class panel inside the Client Workspace** — a persistent, collapsible right rail that is always scoped to the active client.

### Architecture

```text
┌──────────────────────────────────────────────────────────┐
│ Breadcrumb: Clients > Smith Residence                    │
├────────────┬──────────────────────────┬──────────────────┤
│            │                          │                  │
│  Context   │   Tab Content Area       │  AI Agent Rail   │
│  Card      │                          │  (collapsible)   │
│  (280px)   │   [Tab Groups here]      │                  │
│            │                          │  Pre-loaded w/   │
│            │                          │  client context:  │
│            │                          │  - name, address │
│            │                          │  - health score  │
│            │                          │  - open invoices │
│            │                          │  - active projs  │
│            │                          │  - report status │
│            │                          │                  │
│            │                          │  Quick chips:    │
│            │                          │  "Draft estimate"│
│            │                          │  "Summarize rpt" │
│            │                          │  "Schedule visit"│
│            │                          │  "Check overdue" │
│            │                          │                  │
└────────────┴──────────────────────────┴──────────────────┘
```

### Key Behaviors

1. **Auto-scoped context**: When the workspace loads, it pre-injects the client's ID, name, property, report summary, open invoices, and active projects into every agent call — the admin never has to say "for client Smith."

2. **Client-specific quick chips**: Instead of generic chips ("+ New client"), the workspace agent shows contextual ones:
   - "Draft an estimate for this client"
   - "Summarize the report"
   - "What needs attention?"
   - "Schedule a follow-up"
   - "Check overdue invoices"
   - "Write a check-in email"

3. **Collapsible rail**: A toggle button (sparkle icon) in the workspace header expands/collapses the right rail. State persists in localStorage. When collapsed, the global FAB still works as a fallback.

4. **Action results navigate in-workspace**: When the agent creates an invoice or project, the action card's "View" link switches to the relevant workspace tab instead of navigating away.

5. **Tab-aware prompting**: The agent knows which workspace tab is active. If the admin is on the "Financial" tab and asks "create an invoice", the agent skips asking for client ID and pre-fills context.

## Implementation Steps

### Step 1: Create WorkspaceAgentRail component
New file: `src/components/admin/workspace/WorkspaceAgentRail.tsx`

Extracts the chat UI from `AgentPanel.tsx` into a reusable inner component (`AgentChat`), then wraps it in a workspace-aware rail that:
- Receives `clientId`, `clientName`, `propertyId`, `propertyAddress` as props
- Overrides the agent context to always scope to this client
- Renders client-specific quick chips
- Has a collapse/expand toggle

### Step 2: Refactor AgentPanel into AgentChat + AgentPanel
Split `AgentPanel.tsx` into:
- `AgentChat.tsx` — the core chat logic (messages, send, voice, confirmation cards, markdown rendering). Accepts `contextOverride` and `quickChips` props.
- `AgentPanel.tsx` — the global floating FAB + Sheet that wraps `AgentChat` (unchanged behavior for non-workspace pages)

### Step 3: Integrate into ClientWorkspaceLayout
The workspace layout renders:
```text
<div className="flex">
  <WorkspaceContextCard />        {/* left sidebar */}
  <div className="flex-1">        {/* center content */}
    <WorkspaceTabGroups />
  </div>
  <WorkspaceAgentRail />          {/* right rail, collapsible */}
</div>
```

When the rail is open, the center content area shrinks. When collapsed, it gets full width.

### Step 4: Enhanced context injection
The workspace fetches client summary data (already available from `useAdminData` hooks) and passes a rich context object to every agent call:
```typescript
contextOverride: {
  currentEntityType: "client",
  currentEntityId: clientId,
  currentEntityName: clientName,
  propertyId,
  activeTab: currentTab,        // e.g. "financial"
  enrichment: {
    openInvoiceCount: 3,
    overdueAmount: 1200,
    activeProjectCount: 2,
    reportCompletion: 85,
    healthScore: 72,
    lastContactDays: 14,
  }
}
```

The `hbc-agent` edge function already receives context — no backend changes needed. The enrichment data becomes part of the system prompt automatically.

### Step 5: In-workspace navigation from action cards
When `ActionCard` renders inside the workspace, its "View" links resolve to tab switches (e.g., creating an invoice navigates to `?tab=payments`) instead of full-page navigations. Pass an `onNavigate` callback from the workspace.

## Files Changed

| Action | File | Description |
|--------|------|-------------|
| Create | `src/components/admin/workspace/WorkspaceAgentRail.tsx` | Collapsible right rail wrapping AgentChat |
| Create | `src/components/agent/AgentChat.tsx` | Extracted core chat logic from AgentPanel |
| Refactor | `src/components/agent/AgentPanel.tsx` | Slim down to FAB+Sheet wrapping AgentChat |
| Edit | `src/components/admin/workspace/ClientWorkspaceLayout.tsx` | Add agent rail to layout |
| No change | `supabase/functions/hbc-agent/index.ts` | Already handles context — no backend changes |

This adds ~2 new files and refactors 1 existing file. The global agent continues working everywhere else; the workspace just gets a smarter, always-visible version.

