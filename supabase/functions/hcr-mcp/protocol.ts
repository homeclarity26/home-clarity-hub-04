// Minimal MCP streamable-HTTP protocol layer (stateless mode).
//
// Hand-rolled JSON-RPC 2.0 instead of the npm MCP SDK: the surface we need
// (initialize / notifications/initialized / ping / tools/list / tools/call)
// is tiny, the repo vendors no MCP SDK, and a ~150-line implementation is
// easier to audit than a dependency. No SSE: every response is a single
// JSON body, which the streamable-HTTP spec permits for stateless servers.
//
// This module is pure (no Deno.*, no Supabase) so `deno test` can exercise
// it with a stubbed tool executor.

export const SUPPORTED_PROTOCOL_VERSIONS = [
  "2024-11-05",
  "2025-03-26",
  "2025-06-18",
];
export const DEFAULT_PROTOCOL_VERSION = "2025-03-26";

export const SERVER_INFO = { name: "hcr-mcp", version: "1.0.0" };

export const SERVER_INSTRUCTIONS =
  "Home Clarity Report authoring bridge. Author structured report pages for Home Clarity Hub: " +
  "start with list_properties to find a report_id, get_report for the page inventory, then the " +
  "upsert_* tools to write pages. Every write is validated server-side (length caps, no em-dashes, " +
  "word-based condition ratings, no partial tier pricing). Omit anything you do not know; it renders " +
  'as "Not yet documented". Run run_publish_qa before publish_report, and only publish when Adam ' +
  "explicitly confirms.";

interface JsonRpcRequest {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: Record<string, unknown>;
}

export interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: string | number | null;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

export interface ToolCallResult {
  /** JSON-serializable value returned by the tool. */
  value: unknown;
  isError: boolean;
}

/** Executes one named tool. Injected so the protocol layer stays pure. */
export type ToolExecutor = (
  name: string,
  args: unknown,
) => Promise<ToolCallResult>;

export interface ToolListing {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

function rpcResult(id: string | number | null, result: unknown): JsonRpcResponse {
  return { jsonrpc: "2.0", id, result };
}

function rpcError(
  id: string | number | null,
  code: number,
  message: string,
): JsonRpcResponse {
  return { jsonrpc: "2.0", id, error: { code, message } };
}

export function parseBody(raw: string): JsonRpcRequest[] | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (Array.isArray(parsed)) {
    return parsed.filter(
      (m): m is JsonRpcRequest => m != null && typeof m === "object",
    );
  }
  if (parsed != null && typeof parsed === "object") {
    return [parsed as JsonRpcRequest];
  }
  return null;
}

/**
 * Handles one JSON-RPC message. Returns null for notifications (the HTTP
 * layer answers those with 202 Accepted and no body).
 */
export async function handleMessage(
  msg: JsonRpcRequest,
  tools: ToolListing[],
  execute: ToolExecutor,
): Promise<JsonRpcResponse | null> {
  const id = msg.id ?? null;
  const isNotification = msg.id === undefined;

  if (msg.jsonrpc !== "2.0" || typeof msg.method !== "string") {
    return isNotification ? null : rpcError(id, -32600, "Invalid JSON-RPC request");
  }

  // Notifications (initialized, cancelled, ...) are acknowledged silently.
  if (isNotification) return null;

  switch (msg.method) {
    case "initialize": {
      const requested =
        typeof msg.params?.protocolVersion === "string"
          ? msg.params.protocolVersion
          : "";
      const protocolVersion = SUPPORTED_PROTOCOL_VERSIONS.includes(requested)
        ? requested
        : DEFAULT_PROTOCOL_VERSION;
      return rpcResult(id, {
        protocolVersion,
        capabilities: { tools: {} },
        serverInfo: SERVER_INFO,
        instructions: SERVER_INSTRUCTIONS,
      });
    }
    case "ping":
      return rpcResult(id, {});
    case "tools/list":
      return rpcResult(id, {
        tools: tools.map((t) => ({
          name: t.name,
          description: t.description,
          inputSchema: t.inputSchema,
        })),
      });
    case "tools/call": {
      const name = typeof msg.params?.name === "string" ? msg.params.name : "";
      const args = msg.params?.arguments;
      if (!name) {
        return rpcError(id, -32602, "tools/call requires params.name");
      }
      const outcome = await execute(name, args);
      const text =
        typeof outcome.value === "string"
          ? outcome.value
          : JSON.stringify(outcome.value, null, 2);
      return rpcResult(id, {
        content: [{ type: "text", text }],
        isError: outcome.isError,
      });
    }
    default:
      return rpcError(id, -32601, `Method not found: ${msg.method}`);
  }
}
