// deno test supabase/functions/hcr-mcp/protocol.test.ts
//
// Pure protocol-layer tests: JSON-RPC dispatch, version negotiation,
// notification handling, and tools/call wiring with a stubbed executor.
// DB-bound handler logic is covered by the vitest suite against the
// shared mapping module (src/lib/mcpPageMapping.test.ts).

import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  DEFAULT_PROTOCOL_VERSION,
  handleMessage,
  parseBody,
  type ToolCallResult,
  type ToolListing,
} from "./protocol.ts";

const STUB_TOOLS: ToolListing[] = [
  {
    name: "echo",
    description: "Echo a value",
    inputSchema: { type: "object", properties: {} },
  },
];

function stubExecutor(
  fn?: (name: string, args: unknown) => ToolCallResult,
): (name: string, args: unknown) => Promise<ToolCallResult> {
  return (name, args) =>
    Promise.resolve(
      fn ? fn(name, args) : { value: { name, args }, isError: false },
    );
}

Deno.test("parseBody handles single messages, batches, and garbage", () => {
  assertEquals(parseBody("not json"), null);
  assertEquals(parseBody('"a string"'), null);
  assertEquals(parseBody('{"jsonrpc":"2.0","id":1,"method":"ping"}')?.length, 1);
  assertEquals(
    parseBody('[{"jsonrpc":"2.0","id":1,"method":"ping"},{"jsonrpc":"2.0","method":"notifications/initialized"}]')
      ?.length,
    2,
  );
});

Deno.test("initialize echoes a supported protocol version", async () => {
  const res = await handleMessage(
    {
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: { protocolVersion: "2025-06-18" },
    },
    STUB_TOOLS,
    stubExecutor(),
  );
  assert(res);
  const result = res.result as { protocolVersion: string; capabilities: unknown };
  assertEquals(result.protocolVersion, "2025-06-18");
});

Deno.test("initialize falls back to the default version for unknown requests", async () => {
  const res = await handleMessage(
    {
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: { protocolVersion: "1999-01-01" },
    },
    STUB_TOOLS,
    stubExecutor(),
  );
  const result = res?.result as { protocolVersion: string };
  assertEquals(result.protocolVersion, DEFAULT_PROTOCOL_VERSION);
});

Deno.test("notifications return null (HTTP layer sends 202)", async () => {
  const res = await handleMessage(
    { jsonrpc: "2.0", method: "notifications/initialized" },
    STUB_TOOLS,
    stubExecutor(),
  );
  assertEquals(res, null);
});

Deno.test("unknown method returns -32601", async () => {
  const res = await handleMessage(
    { jsonrpc: "2.0", id: 7, method: "resources/list" },
    STUB_TOOLS,
    stubExecutor(),
  );
  assertEquals(res?.error?.code, -32601);
});

Deno.test("invalid request returns -32600", async () => {
  const res = await handleMessage(
    { id: 8 },
    STUB_TOOLS,
    stubExecutor(),
  );
  assertEquals(res?.error?.code, -32600);
});

Deno.test("tools/list returns registered tools", async () => {
  const res = await handleMessage(
    { jsonrpc: "2.0", id: 2, method: "tools/list" },
    STUB_TOOLS,
    stubExecutor(),
  );
  const result = res?.result as { tools: Array<{ name: string }> };
  assertEquals(result.tools.length, 1);
  assertEquals(result.tools[0].name, "echo");
});

Deno.test("tools/call wires name + arguments into the executor", async () => {
  let seen: { name?: string; args?: unknown } = {};
  const res = await handleMessage(
    {
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: { name: "echo", arguments: { a: 1 } },
    },
    STUB_TOOLS,
    stubExecutor((name, args) => {
      seen = { name, args };
      return { value: { ok: true }, isError: false };
    }),
  );
  assertEquals(seen.name, "echo");
  assertEquals(seen.args, { a: 1 });
  const result = res?.result as {
    content: Array<{ type: string; text: string }>;
    isError: boolean;
  };
  assertEquals(result.isError, false);
  assertEquals(JSON.parse(result.content[0].text), { ok: true });
});

Deno.test("tools/call surfaces executor errors as isError results", async () => {
  const res = await handleMessage(
    {
      jsonrpc: "2.0",
      id: 4,
      method: "tools/call",
      params: { name: "echo", arguments: {} },
    },
    STUB_TOOLS,
    stubExecutor(() => ({ value: { error: "bad input" }, isError: true })),
  );
  const result = res?.result as { isError: boolean };
  assertEquals(result.isError, true);
});

Deno.test("tools/call without a name returns -32602", async () => {
  const res = await handleMessage(
    { jsonrpc: "2.0", id: 5, method: "tools/call", params: {} },
    STUB_TOOLS,
    stubExecutor(),
  );
  assertEquals(res?.error?.code, -32602);
});
