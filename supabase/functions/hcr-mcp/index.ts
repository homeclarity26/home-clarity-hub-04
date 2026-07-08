// hcr-mcp — MCP authoring bridge (Master UX Rebuild Phase 6a).
//
// Streamable-HTTP MCP server, stateless mode: JSON-RPC 2.0 over POST, no
// SSE, no sessions. Claude (claude.ai custom connector or Claude Code)
// authors structured Home Clarity Report pages through the tools in
// tools.ts; every write validates against the shared zod schemas and maps
// through the same pure logic as the wizard's Step 5 publish.
//
// NO AUTH via Supabase JWT: MCP clients cannot mint Supabase user JWTs.
// Instead the function requires `Authorization: Bearer <HCR_MCP_TOKEN>`
// where HCR_MCP_TOKEN is an edge-function secret, compared in constant
// time. All DB access uses the service-role client. Every tools/call is
// audited to mcp_activity BEFORE the response is returned.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  handleMessage,
  parseBody,
  type ToolCallResult,
} from "./protocol.ts";
import {
  createServiceRoleClient,
  findTool,
  McpToolError,
  TOOLS,
} from "./tools.ts";

type Db = ReturnType<typeof createServiceRoleClient>;

const JSON_HEADERS = {
  "Content-Type": "application/json",
  // MCP clients are server-side; CORS is a courtesy for browser inspectors.
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, mcp-protocol-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ─── Constant-time bearer check ───────────────────────────────────────────
// Both values are SHA-256 hashed first so the comparison is fixed-length
// and byte-for-byte, leaking neither token length nor prefix timing.

async function sha256(value: string): Promise<Uint8Array> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return new Uint8Array(digest);
}

async function bearerMatches(req: Request, secret: string): Promise<boolean> {
  const header = req.headers.get("authorization") ?? "";
  const provided = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (provided.length === 0) return false;
  const [a, b] = await Promise.all([sha256(provided), sha256(secret)]);
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

// ─── Audit trail ──────────────────────────────────────────────────────────
// Awaited (not fire-and-forget): the edge runtime kills pending work when
// the handler returns, so the insert must land before we respond.

async function writeAudit(
  db: Db,
  toolName: string,
  args: unknown,
  resultSummary: string,
  success: boolean,
): Promise<void> {
  const { error } = await db.from("mcp_activity").insert({
    tool_name: toolName,
    args_json: args ?? {},
    result_summary: resultSummary.slice(0, 500),
    success,
  });
  if (error) {
    // Audit failure must not mask the tool result, but it must be loud.
    console.error("[hcr-mcp] mcp_activity insert failed:", error.message);
  }
}

// ─── Tool executor (validation + execution + audit) ───────────────────────

function makeExecutor(db: Db) {
  return async (name: string, args: unknown): Promise<ToolCallResult> => {
    const tool = findTool(name);
    if (!tool) {
      const message = `Unknown tool: ${name}`;
      await writeAudit(db, name, args, message, false);
      return { value: { error: message }, isError: true };
    }
    try {
      const outcome = await tool.handler(db, args);
      await writeAudit(db, name, args, outcome.summary, true);
      return { value: outcome.result, isError: false };
    } catch (err) {
      const message =
        err instanceof McpToolError
          ? err.message
          : `Tool ${name} failed: ${err instanceof Error ? err.message : "unknown error"}`;
      if (!(err instanceof McpToolError)) {
        console.error(`[hcr-mcp] ${name} error:`, err);
      }
      await writeAudit(db, name, args, message, false);
      return { value: { error: message }, isError: true };
    }
  };
}

// ─── HTTP entrypoint ──────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: JSON_HEADERS });
  }
  if (req.method !== "POST") {
    // Stateless mode: no SSE stream to GET, no session to DELETE.
    return new Response(
      JSON.stringify({ error: "Method not allowed. MCP messages go via POST." }),
      { status: 405, headers: { ...JSON_HEADERS, Allow: "POST, OPTIONS" } },
    );
  }

  const secret = Deno.env.get("HCR_MCP_TOKEN") ?? "";
  if (!secret) {
    console.error("[hcr-mcp] HCR_MCP_TOKEN is not set");
    return new Response(
      JSON.stringify({ error: "Server misconfigured: HCR_MCP_TOKEN not set" }),
      { status: 500, headers: JSON_HEADERS },
    );
  }
  if (!(await bearerMatches(req, secret))) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: JSON_HEADERS,
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(
      JSON.stringify({ error: "Server misconfigured: missing Supabase env" }),
      { status: 500, headers: JSON_HEADERS },
    );
  }
  const db = createServiceRoleClient(supabaseUrl, serviceRoleKey);
  const execute = makeExecutor(db);

  const messages = parseBody(await req.text());
  if (!messages || messages.length === 0) {
    return new Response(
      JSON.stringify({
        jsonrpc: "2.0",
        id: null,
        error: { code: -32700, message: "Parse error" },
      }),
      { status: 400, headers: JSON_HEADERS },
    );
  }

  const responses = [];
  for (const msg of messages) {
    const response = await handleMessage(msg, TOOLS, execute);
    if (response) responses.push(response);
  }

  // All notifications: acknowledge with 202 and no body per streamable HTTP.
  if (responses.length === 0) {
    return new Response(null, { status: 202, headers: JSON_HEADERS });
  }

  const body = responses.length === 1 ? responses[0] : responses;
  return new Response(JSON.stringify(body), { status: 200, headers: JSON_HEADERS });
});
