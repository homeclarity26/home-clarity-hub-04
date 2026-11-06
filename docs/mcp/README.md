# HCR MCP Authoring Bridge

Adam authors Home Clarity Report content by talking to Claude (claude.ai or
Claude Code). Claude writes structured pages into the app through this MCP
server; the app renders them with the existing block renderers. The schema
is the guardrail: Claude physically cannot write walls of text, em-dashes,
numeric health scores, or invented tier pricing.

## Architecture

```
Claude (claude.ai connector / Claude Code)
        |  MCP streamable HTTP (JSON-RPC 2.0 over POST, stateless, no SSE)
        v
supabase/functions/hcr-mcp/
  index.ts      HTTP entry: bearer auth (HCR_MCP_TOKEN, constant-time),
                service-role client, mcp_activity audit before every reply
  protocol.ts   Pure JSON-RPC / MCP layer (initialize, tools/list,
                tools/call, ping; notifications answered 202)
  tools.ts      12 tools; every input validated with zod
        |
        v
supabase/functions/_shared/
  reportPageSchemas.ts   Port of src/lib/reportPageSchemas + MCP guardrails
  reportPageMapping.ts   Port of the wizard's pure publish mapping
        |
        v
report_pages / reports (same rows and typed blocks Step 5 publishes)
```

Parity is enforced, not hoped for: `src/lib/mcpPageMapping.test.ts` asserts
that the `_shared` port produces byte-identical blocks and columns to
`src/lib/wizardPublishMapping.ts` for equivalent content, and that the
copied block-template defaults match `BLOCK_TEMPLATES`. If either side
changes, the test fails and the port gets re-synced.

## Tools

| Tool | Arguments | What it does |
| --- | --- | --- |
| `list_properties` | none | Properties with client name and reports (id, status) |
| `get_report` | `report_id` | TOC: every page with page_key, group, status, populated vs missing structured fields |
| `get_page` | `report_id`, `page_key` | Full row: typed blocks, structured columns, images |
| `upsert_room_page` | `report_id`, `page_key`, `title`, `group`, `content` (narrative, dims, floorSqft, ceiling, floorLevel, finishes, fixtures, observations, conditionRating, specs) | Writes a room_record page |
| `upsert_system_page` | envelope + `is_appliance` + `content` (identity, lifespan, condition, statusFlags, specs, observations, needsBriefing, replacementBriefing with tiers) | Writes system_record (+ replacement_briefing) and derives current_age_years / expected_lifespan_years |
| `upsert_vision_page` | envelope + `content` (vision, whyDesignFirst, designPhaseWeeks/Cost, tiers, executionPath, priorityWindow, category, observations) | Writes a vision_project page with AKR disclosure always on |
| `upsert_generic_page` | envelope + `sections: [{heading, paragraphs[]}]` | Information-chapter pages as headed text blocks |
| `set_capital_plan` | `report_id`, `startYear?`, `items[]` (projectName, phase defense/offense/expansion, yearStart, yearEnd?, costLow?, costHigh?) | capital_plan block on `capital-plan-10yr` |
| `set_recurring_services` | `report_id`, `services[]` (category, serviceName, vendorName?, frequency, costPerVisit?, annualCost?, hbcManaged) | recurring_services_register block on `recurring-services` |
| `set_maintenance_calendar` | `report_id`, `seasons {spring,summer,fall,winter}[{task, system}]` | maintenance_calendar block on `maintenance-calendar` |
| `run_publish_qa` | `report_id` | Per-page missing-field report + wall-of-text violations |
| `publish_report` | `report_id`, `confirm: "PUBLISH"` | Publishes only if QA passes; rebuilds `reports.blocks_json`, flips report + pages to published |

The `set_*` tools replace their block in place on the standing Strategy
page, so re-running them updates rather than duplicates.

### Guardrails baked into the schemas

- Prose caps: observations 400 chars each (max 12), generic paragraphs 900
  chars (max 6 per section), narratives 2,400 chars.
- No em-dashes anywhere in client copy (schema rejection, not a lint).
- Word-based condition ratings only (Excellent / Good / Fair / Poor /
  Critical); anything else is rejected.
- Tier sets publish only as a fully priced Essential / Enhanced / Signature
  triple. A partial set is dropped to scaffolding, never padded.
- Unknown fields are omitted and render as "Not yet documented". The
  schemas have no way to fake them.
- `publish_report` demands the literal string `PUBLISH` and a clean QA run.

## Auth

The function skips Supabase JWT verification (`verify_jwt = false` in
`supabase/config.toml`) because MCP clients cannot mint Supabase user JWTs.
Instead every request must carry:

```
Authorization: Bearer <HCR_MCP_TOKEN>
```

`HCR_MCP_TOKEN` is an edge-function secret compared in constant time
(SHA-256 of both values, fixed-length XOR). All DB access uses the
service-role client, so the token is equivalent to creator access: treat it
like a password, rotate it by setting a new secret.

Every `tools/call` writes a row to `mcp_activity` (tool_name, args_json,
result_summary, success) before the response returns. Creators can review
the trail; the table is service-role write-only.

## Deploy runbook (Adam)

The edge function cannot be deployed from this environment (no Supabase
token). From the repo root on your machine:

```bash
export SUPABASE_ACCESS_TOKEN="<token from supabase.com/dashboard/account/tokens>"

# 1. Apply the mcp_activity migration
npx supabase db push

# 2. Set the MCP bearer secret (generate a long random value)
supabase secrets set HCR_MCP_TOKEN="$(openssl rand -hex 32)"
# Keep a copy of the value; you need it for the connector setup below.

# 3. Deploy the function
npx supabase functions deploy hcr-mcp --no-verify-jwt

# 4. Smoke-test
curl -s -X POST \
  "https://vvwojahsianpmwjvkunn.supabase.co/functions/v1/hcr-mcp" \
  -H "Authorization: Bearer $HCR_MCP_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
# Expect a JSON result listing 12 tools. A GET should return 405; a wrong
# token should return 401.
```

Follow-up ticket per repo convention: regenerate
`src/integrations/supabase/types.ts` after the migration lands (one-file
PR, no logic changes).

Note: `_shared/` changed in this work, so CI's deploy-edge-functions
workflow will redeploy every function when this merges. That is expected;
do not hand-deploy other functions around it.

## Connect Claude

### claude.ai (custom connector)

Settings > Connectors > Add custom connector:

- URL: `https://vvwojahsianpmwjvkunn.supabase.co/functions/v1/hcr-mcp`
- Auth: Bearer token, value = your `HCR_MCP_TOKEN`

Then paste the skill files from `docs/mcp/skills/` into Claude as skills
(or project instructions) so authoring follows the house voice and rules.

### Claude Code

```bash
claude mcp add --transport http hcr \
  https://vvwojahsianpmwjvkunn.supabase.co/functions/v1/hcr-mcp \
  --header "Authorization: Bearer <HCR_MCP_TOKEN>"
```

Verify with `/mcp` in a session: the `hcr` server should list 12 tools.

## Verified locally vs awaiting deploy

Verified in this repo (no deploy needed):

- `deno check` on the edge function and shared modules: clean.
- `deno test` on the protocol layer: 10/10.
- `vitest`: 73/73 including 27 new mapping/guardrail/QA tests.
- `npx tsc --noEmit` and `bun run build`: clean.

Awaiting deploy (Adam, via the runbook above):

- `supabase db push` for `20260707000000_mcp_activity.sql`.
- `supabase secrets set HCR_MCP_TOKEN=...`.
- `supabase functions deploy hcr-mcp` and the curl smoke test.
- End-to-end authoring pass from claude.ai / Claude Code against a real
  report, then a visual check in the admin preview.

## Future work (intentionally not in v1)

- **Image upload**: photos keep flowing through the app (Step 5 upload +
  `categorize-photo` auto-routing). An `attach_image` / `upload_image` tool
  pair is designed in the master plan but deferred until the text authoring
  loop proves itself.
- `create_report` / `propose_toc`: reports are still created by the wizard
  (Step 1). The MCP bridge authors into existing reports.
- Per-page publish (publish flips the whole report today, matching the
  wizard's behavior).
