-- mcp_activity: audit trail for the hcr-mcp authoring bridge (Phase 6).
-- Every tools/call against the MCP edge function writes one row BEFORE the
-- response returns: which tool ran, with what arguments, and whether it
-- succeeded. Written exclusively by the service-role client inside
-- supabase/functions/hcr-mcp; read by creators for review.

create table if not exists public.mcp_activity (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  tool_name text not null,
  args_json jsonb not null default '{}'::jsonb,
  result_summary text,
  success boolean not null default false
);

comment on table public.mcp_activity is
  'Audit log for hcr-mcp MCP tool calls (Claude authoring bridge).';

create index if not exists mcp_activity_created_at_idx
  on public.mcp_activity (created_at desc);

alter table public.mcp_activity enable row level security;

-- Inserts come only from the service-role client (bypasses RLS), so no
-- insert policy is granted to authenticated users. Creators may read the
-- trail; clients and trade partners may not.
create policy "Creators can read MCP activity"
  on public.mcp_activity
  for select
  to authenticated
  using (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid()
        and ur.role = 'creator'
    )
  );
