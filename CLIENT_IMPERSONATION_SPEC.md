# Client Impersonation — Spec

**Owner:** Adam
**Status:** Draft, ready to build
**Last updated:** 2026-04-16

---

## Goal

Let an admin (role = `creator`) step into a specific client's session for a bounded time window and see the portal **exactly as that client sees it** — same JWT subject, same RLS context, same role-gated UI paths, same notifications and edit-mode flags. Every entry/exit is audit-logged. No passwords are ever handled.

Today, the "Preview Portal" button lets an admin view the portal URL under their own admin JWT. RLS policies that grant the `creator` role cross-property access let the page load — but it is not a faithful simulation, because:

- `useAuth().isCreator` is still true → admin-only UI may render.
- `useEditMode().canEdit` may be true → edit affordances show that a client would never see.
- Client-specific queries (e.g. "my unread messages") return different results under a creator JWT vs a client JWT.
- Push notifications, tutorial progress, NPS survey eligibility, and feature-flag cohorts are keyed to the client's user id — none of those fire under preview.

True impersonation fixes all of those by swapping the **session JWT subject** to the client's `auth.users.id` for a bounded window.

---

## Non-goals

- No passwordless "login as a user" for support staff outside the `creator` role.
- No impersonation across Supabase projects or tenants.
- No long-lived impersonation tokens. Max 10 minutes per session, renewable only by re-starting.
- No ability to perform destructive actions under the client's identity (see "Write-blocking" below).

---

## Threat model

| Risk | Mitigation |
|---|---|
| Admin account compromise lets an attacker silently log in as any client | Require a recent-auth check (within 5 min) before minting; log every event; alert on volume |
| Admin impersonates client and sends messages / approves invoices as them | Write-block mode ON by default: impersonated sessions are read-only unless admin explicitly enables writes (and every write is extra-flagged in the audit log) |
| JWT leaks / is replayed | 10-minute TTL, single-use, bound to admin's originating IP + user-agent hash |
| Audit log is tampered with | Append-only table, RLS blocks updates/deletes, periodic export to external store |
| Admin forgets they're impersonating and confuses "client state" with their own | Sticky red banner, header change, favicon swap, and page title prefix — impossible to miss |
| Client is notified unexpectedly (e.g., login email fires) | Mint via `admin.generateLink` / service-role flow that does NOT trigger auth hooks or emails |

---

## UX

### Entry point
**From `WorkspaceContextCard`** (admin → client workspace):

```
[ Preview Portal ]  — safe, admin's own session, new tab, with "Admin Preview" banner (already shipped)
[ Impersonate Client (10 min) ]  — new button, opens the impersonation modal
```

The "Impersonate" button is only visible to `creator` role.

### Confirmation modal
Before minting, show a blocking modal:

> **You're about to impersonate {client.name}.**
> - You will see the portal as them for up to 10 minutes.
> - Every action is logged to the client's account.
> - Writes are disabled by default.
> - The client will NOT be notified.
>
> Type the client's last name to confirm: `[ input ]`
> Reason for impersonation: `[ required textarea, min 10 chars ]`
>
> [ Cancel ]   [ Start 10-minute session ]

The typed-name gate is cheap and stops 99% of muscle-memory accidents. The reason is stored in the audit log.

### During impersonation
- **Sticky top banner** (`bg-destructive`, white text, not dismissable) across every page:
  > `IMPERSONATING {client.name} · {mm:ss} remaining · [Enable writes] · [End session]`
- `document.title` gets prefixed with `[IMPERSONATING]`.
- Favicon swaps to a red dot variant.
- `useAuth()` returns `{ isImpersonating: true, realUserId, impersonatedUserId }` — components can use this for targeted guards.
- Desktop sidebar and admin-only nav are hidden.
- On write attempt when write-block is ON: toast → "This action is blocked in read-only impersonation. Enable writes to proceed."

### Exit
- Countdown hits 0 → automatic end, toast + redirect back to the admin workspace tab they came from.
- Manual end → same.
- Closing the tab → client-side cleanup fires `navigator.sendBeacon` to the end-session endpoint.

---

## Architecture

### New table: `impersonation_events`

```sql
create table public.impersonation_events (
  id uuid primary key default gen_random_uuid(),
  -- Identity
  admin_user_id uuid not null references auth.users(id),
  client_user_id uuid not null references auth.users(id),
  property_id uuid references public.properties(id),
  -- Session
  session_token_jti text not null unique,    -- matches the minted JWT's jti claim
  started_at timestamptz not null default now(),
  expires_at timestamptz not null,           -- started_at + 10 min
  ended_at timestamptz,                      -- null until explicitly ended
  end_reason text,                           -- 'manual' | 'timeout' | 'admin_logout' | 'force_revoked'
  -- Accountability
  reason text not null check (char_length(reason) >= 10),
  admin_ip inet,
  admin_user_agent_hash text,
  writes_enabled boolean not null default false,
  -- Events during session (JSONB array, appended to by edge fns)
  actions jsonb not null default '[]'::jsonb
);

-- RLS: admins see only their own impersonation events; writes restricted to service role
alter table public.impersonation_events enable row level security;

create policy "creator reads own impersonation events"
  on public.impersonation_events for select
  using (admin_user_id = auth.uid()
    and exists(select 1 from public.user_roles
               where user_id = auth.uid() and role = 'creator'));

-- No insert/update/delete policies for any role — only service role writes via edge fns.
-- Explicit deny-update trigger to prevent tamper even if a policy bug slips through:
create function public.impersonation_events_deny_update()
returns trigger language plpgsql as $$
begin
  raise exception 'impersonation_events is append-only';
end $$;

create trigger impersonation_events_no_update
  before update or delete on public.impersonation_events
  for each row execute function public.impersonation_events_deny_update();
```

### New edge functions

All are `creator`-role-gated via the existing `_shared/auth.ts#requireRole` helper.

#### `admin-start-impersonation`

```
POST /functions/v1/admin-start-impersonation
Body: { clientUserId: uuid, propertyId: uuid, reason: string }

1. requireRole(req, ["creator"])  → returns admin.user
2. Verify recent-auth: reject if session.aal < 'aal1' OR session age > 5 min
   (force the admin to re-enter password or re-auth)
3. Verify the admin owns this client:
   select 1 from properties where id = propertyId
     and client_user_id = clientUserId
     and creator_id = admin.user.id     -- or whatever join column applies
4. Mint a client JWT using service role:
   const { data, error } = await adminSupabase.auth.admin.createSession({
     userId: clientUserId,
     expiresIn: 600,  // 10 min
     // Custom claims proving provenance:
     appMetadata: {
       impersonated_by: admin.user.id,
       impersonation_jti: newJti,
       writes_enabled: false,
     }
   })
   (If the SDK doesn't expose createSession directly, fall back to:
    generateLink type='magiclink' → exchange server-side → extract access_token.
    Document which path is used.)
5. Insert impersonation_events row with jti, expires_at, admin_ip from req headers.
6. Return { accessToken, refreshToken: null, expiresAt, jti, propertyUrl }
   Note: no refresh token — this session CANNOT be extended.
```

#### `admin-end-impersonation`

```
POST /functions/v1/admin-end-impersonation
Body: { jti: string, endReason: 'manual' | 'timeout' | 'admin_logout' }

1. Look up impersonation_events by jti.
2. Verify the caller's JWT matches one of:
   - admin_user_id (admin calling)
   - client_user_id with app_metadata.impersonation_jti == jti (impersonated session calling)
3. Update ended_at = now(), end_reason = body.endReason.
4. Revoke the session via supabase.auth.admin.signOut(clientSessionId).
5. Return { ok: true }
```

#### `admin-toggle-impersonation-writes`

```
POST /functions/v1/admin-toggle-impersonation-writes
Body: { jti: string, enabled: boolean, reason: string }

Writes-enabled events are logged as a discrete action entry in the session row.
```

#### Guard on every write-capable edge function

Add a shared helper in `_shared/auth.ts`:

```ts
export async function blockImpersonatedWrites(req: Request, opts?: { allowIfWritesEnabled?: boolean }) {
  const auth = await requireAuth(req);
  if ('error' in auth) return auth;
  const meta = auth.user.app_metadata ?? {};
  if (meta.impersonated_by) {
    if (!opts?.allowIfWritesEnabled || !meta.writes_enabled) {
      return { error: json({ error: 'writes blocked during impersonation' }, { status: 403 }) };
    }
    // Log this write attempt
    await adminSupabase.from('impersonation_events')
      .update({ actions: sql`actions || ${JSON.stringify([{ type: 'write', path: req.url, at: new Date() }])}::jsonb` })
      .eq('session_token_jti', meta.impersonation_jti);
  }
  return auth;
}
```

Every `creator`-or-`client` write function that currently calls `requireAuth` → swap to `blockImpersonatedWrites`. The agent tools that mutate data (`send_invoice_reminder`, `create_project_update`, etc.) also need this guard.

### Front-end

#### New context: `ImpersonationProvider`

Wraps the app inside `AuthProvider`. Tracks:
- `isImpersonating: boolean` (derived from JWT's `app_metadata.impersonated_by`)
- `realUserId: string | null`
- `remainingMs: number`
- `writesEnabled: boolean`
- `startImpersonation(clientUserId, propertyId, reason)` — calls edge fn, swaps session via `supabase.auth.setSession`, navigates to portal
- `endImpersonation(reason)` — calls edge fn, restores original session from sessionStorage

**Original session stash:** before swap, save `{ accessToken, refreshToken }` to `sessionStorage` (NOT localStorage — tab-scoped). On end, restore.

#### `ImpersonationBanner` component

Sticky, `bg-destructive`, shown whenever `isImpersonating === true`. Renders the countdown, write-toggle, and end button. Uses `setInterval(..., 1000)` for countdown; fires `endImpersonation('timeout')` at 0.

#### Integration points

- `App.tsx`: wrap inside `ImpersonationProvider`.
- `Index.tsx`: render `<ImpersonationBanner />` at the top when impersonating (replaces / stacks with current "Admin Preview" banner).
- `useAuth` consumers that check `isCreator`: consider whether any need to branch on `isImpersonating` too (most should behave as client-role, which the swapped JWT already delivers — but `PortalSidebar` admin-only nav needs an explicit guard).
- `useEditMode`: verify `canEdit` is false under impersonation even if the RLS accidentally permits it.
- `WorkspaceContextCard`: add the "Impersonate Client (10 min)" button, below "Preview Portal."

---

## Rollout plan

| Step | Deliverable |
|---|---|
| 1 | Migration: `impersonation_events` table + deny-update trigger |
| 2 | Edge fns: `admin-start-impersonation`, `admin-end-impersonation`, `admin-toggle-impersonation-writes` |
| 3 | Shared `blockImpersonatedWrites` helper; wire into 3 high-risk write fns first (messages, invoices, project updates) |
| 4 | `ImpersonationProvider` + `ImpersonationBanner` + `useAuth` wiring |
| 5 | Add "Impersonate" button to `WorkspaceContextCard` + confirmation modal |
| 6 | Wire remaining write fns to the guard; audit coverage with a test that tries each fn under an impersonated JWT |
| 7 | Admin view: `/admin/audit/impersonation` page showing session history with filters (who, when, which client, reason, actions taken) |
| 8 | Monitoring: Supabase log filter for `impersonated_by` claim; alert if > N sessions per admin per day |

---

## Testing

- Integration test: start session → verify `app_metadata.impersonated_by` present on resulting JWT → hit a write endpoint → expect 403 → toggle writes → expect success → end session → verify endpoint 403s again.
- Integration test: 10-min expiry. Mock clock forward; verify session rejected server-side and client auto-ends.
- RLS test: impersonated session tries to read another client's property → must return no rows.
- Tamper test: attempt to UPDATE an `impersonation_events` row → trigger blocks it.
- UI test: banner renders, countdown ticks, end button works, navigation out-and-back preserves banner.

---

## Open questions

1. Does the current `supabase.auth.admin` flow in this Supabase version support minting a session for a specific user without sending a magic-link email? Verify against the SDK version in `package.json` before kickoff; if not, use the `generateLink` + server-side exchange path.
2. Should the client be notified after-the-fact that their account was impersonated (e.g. a passive entry in their activity log)? Legal + product decision.
3. How does this interact with Stripe / QBO integrations that may have their own session cookies? Likely out of scope (those are external auth flows), but call it out in the audit log when an impersonated session hits those integration endpoints.
