/**
 * Shared AI client for Home Clarity Hub edge functions.
 * Calls Google Gemini directly — no third-party proxy.
 *
 * Supported models:
 *   "gemini-2.5-flash"      → fast, cheap, great for most tasks
 *   "gemini-2.5-pro"        → slower, smarter, for complex reasoning
 *   "gemini-2.0-flash-lite" → fastest/cheapest, for simple classification
 *
 * Usage:
 *   import { callAI } from "../_shared/ai-client.ts";
 *   const text = await callAI({ system, prompt });
 *   const json = await callAI({ system, prompt, json: true });
 */

/**
 * A single Gemini content part. Gemini messages can contain text, function
 * calls (from the model), or function responses (from the tool runner). All
 * three shapes live side-by-side in a `parts[]` array.
 */
export interface GeminiPart {
  text?: string;
  functionCall?: { name: string; args: Record<string, unknown> };
  functionResponse?: { name: string; response: Record<string, unknown> };
}

export interface AIMessage {
  role: "user" | "model";
  parts: GeminiPart[];
}

/**
 * OpenAI-shape message, accepted by callAI for backward compatibility.
 * At request time it's translated to Gemini-shape (role: "user"|"model",
 * parts: [{text}]) with any "system" messages hoisted to systemInstruction.
 */
export interface OpenAIMessage {
  role: "system" | "user" | "assistant" | "tool" | "model";
  content?: string | Array<{ text: string }>;
  parts?: Array<{ text: string }>;
}

export interface AIOptions {
  system?: string;
  prompt?: string;
  /** Multi-turn messages. Accepts either Gemini-shape or OpenAI-shape. */
  messages?: Array<AIMessage | OpenAIMessage>;
  model?: string;
  json?: boolean;           // wrap prompt in JSON instruction + parse response
  tools?: object[];         // Gemini function calling tools
  tool_choice?: "auto" | "none";
  temperature?: number;
  maxOutputTokens?: number;
}

// Gemini model IDs. We default to Google's *-latest aliases which auto-track
// the newest stable release in each tier — so code doesn't need to be edited
// every time Google ships a new version. Verified via ListModels on
// 2026-04-18: gemini-flash-latest / gemini-pro-latest / gemini-flash-lite-latest
// are live.
//
// Downside of auto-latest: a silent Google version bump can subtly change
// output tone or JSON behavior. If that ever matters for a specific function,
// pin to an explicit version string by bypassing this map.
const MODEL_MAP: Record<string, string> = {
  // Lovable-style gateway names + pinned 2.5 names (legacy; still used by
  // some callers) → resolve to the current *-latest alias.
  "google/gemini-2.5-flash": "gemini-flash-latest",
  "google/gemini-2.5-flash-lite": "gemini-flash-lite-latest",
  "google/gemini-2.5-pro": "gemini-pro-latest",
  "google/gemini-3-flash-preview": "gemini-flash-latest",
  "gemini-2.5-flash": "gemini-flash-latest",
  "gemini-2.5-flash-lite": "gemini-flash-lite-latest",
  "gemini-2.5-pro": "gemini-pro-latest",
  "gemini-2.0-flash": "gemini-flash-latest",
  "gemini-2.0-flash-lite": "gemini-flash-lite-latest",
  // Direct *-latest aliases (pass-through).
  "gemini-flash-latest": "gemini-flash-latest",
  "gemini-pro-latest": "gemini-pro-latest",
  "gemini-flash-lite-latest": "gemini-flash-lite-latest",
};

export async function callAI(opts: AIOptions): Promise<string> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured in Supabase Vault");

  const rawModel = opts.model ?? "google/gemini-2.5-flash";
  const model = MODEL_MAP[rawModel] ?? "gemini-2.5-flash";

  // Build contents array.
  //
  // We accept two message shapes here:
  //   A) Gemini native:  { role: "user" | "model", parts: [{ text }] }
  //   B) OpenAI-style:   { role: "system" | "user" | "assistant" | "tool",
  //                        content: string | [{text}] }
  //
  // Every edge function in this repo (hbc-agent, ai-invoice-assistant,
  // generate-exec-summary, and ~15 others) passes shape B. Gemini rejects B
  // (unknown fields, role "system"/"assistant"/"tool" not supported), which
  // used to surface as "Oops, something went wrong" in the Home Assistant.
  // We adapt shape B → A here so callers don't have to change.
  let contents: AIMessage[];
  let systemFromMessages: string | undefined;
  if (opts.messages) {
    const systemChunks: string[] = [];
    contents = [];
    for (const m of opts.messages as Array<Record<string, unknown>>) {
      // Already Gemini-shape — pass through.
      if (Array.isArray((m as { parts?: unknown }).parts)) {
        contents.push(m as unknown as AIMessage);
        continue;
      }
      const rawContent = (m as { content?: unknown }).content;
      const text =
        typeof rawContent === "string"
          ? rawContent
          : Array.isArray(rawContent)
            ? (rawContent as Array<{ text?: string }>).map((c) => c.text ?? "").join("\n")
            : "";
      const role = m.role as string | undefined;
      if (role === "system") {
        // Gemini uses a separate systemInstruction field; collect and hoist.
        if (text) systemChunks.push(text);
        continue;
      }
      if (role === "tool") {
        // Gemini's proper tool-result shape requires pairing with the
        // originating functionCall id. hbc-agent doesn't track that today,
        // so inline the tool output as a user-visible note — best-effort
        // until the ReAct loop is rebuilt around Gemini's functionCall API.
        contents.push({ role: "user", parts: [{ text: `[tool result] ${text}` }] });
        continue;
      }
      const mappedRole: "user" | "model" = role === "assistant" || role === "model" ? "model" : "user";
      contents.push({ role: mappedRole, parts: [{ text }] });
    }
    if (systemChunks.length > 0) systemFromMessages = systemChunks.join("\n\n");

    // Gemini requires contents[0].role === "user". If the first message ended
    // up as "model" (shouldn't happen with normal flows, but guard anyway),
    // prepend an empty user turn to keep the API happy.
    if (contents.length > 0 && contents[0].role !== "user") {
      contents.unshift({ role: "user", parts: [{ text: " " }] });
    }
  } else {
    const userText = opts.json
      ? `${opts.prompt ?? ""}\n\nRespond with valid JSON only. No markdown, no explanation.`
      : (opts.prompt ?? "");
    contents = [{ role: "user", parts: [{ text: userText }] }];
  }

  const body: Record<string, unknown> = {
    contents,
    generationConfig: {
      temperature: opts.temperature ?? 0.3,
      maxOutputTokens: opts.maxOutputTokens ?? 8192,
      ...(opts.json ? { responseMimeType: "application/json" } : {}),
    },
  };

  // Prefer an explicit opts.system; fall back to any system messages we
  // extracted from OpenAI-shape input above.
  const systemText = opts.system ?? systemFromMessages;
  if (systemText) {
    body.systemInstruction = { parts: [{ text: systemText }] };
  }

  if (opts.tools && opts.tools.length > 0) {
    body.tools = [{ functionDeclarations: opts.tools }];
    body.toolConfig = { functionCallingConfig: { mode: opts.tool_choice === "none" ? "NONE" : "AUTO" } };
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    // Map Gemini's own error statuses to crisper end-user messages. Previously
    // the raw error JSON (stringified Gemini response) was bubbling straight
    // into the chat UI — users saw "Gemini API error 503: { ... }" when the
    // model was temporarily unavailable. Translate the common ones.
    if (res.status === 503) {
      throw new Error("AI is temporarily busy — please try again in a minute.");
    }
    if (res.status === 429) {
      throw new Error("AI is rate-limited right now — please wait a moment and retry.");
    }
    if (res.status === 401 || res.status === 403) {
      throw new Error("AI authentication failed — check GEMINI_API_KEY configuration.");
    }
    throw new Error(`Gemini API error ${res.status}: ${err}`);
  }

  const data = await res.json();

  // Handle function call response (for hbc-agent tool use)
  const candidate = data.candidates?.[0];
  if (!candidate) throw new Error("No candidates in Gemini response");

  const part = candidate.content?.parts?.[0];
  if (!part) throw new Error("Empty response from Gemini");

  // If it's a function call, return as JSON string for the caller to handle
  if (part.functionCall) {
    return JSON.stringify({ functionCall: part.functionCall });
  }

  return part.text ?? "";
}

/**
 * Parse JSON from AI response, tolerant to:
 *   - markdown fences (```json ... ``` or ``` ... ```)
 *   - leading narration ("Here's the JSON: { ... }")
 *   - trailing narration ("{ ... } Let me know if you need anything else.")
 *
 * Claude + Gemini both sometimes ignore "respond with JSON only" instructions.
 * This parser extracts the outermost balanced {...} or [...] and parses that,
 * so a single verbose sentence doesn't nuke a whole edge-function response.
 */
export function parseJSON<T = unknown>(text: string): T {
  // Strip markdown fences first (both ```json and plain ``` variants).
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```(?:json|JSON)?\s*\n?/, "").replace(/\n?```\s*$/, "").trim();

  // Try a direct parse. Fast path if the model was well-behaved.
  try {
    return JSON.parse(cleaned) as T;
  } catch { /* fall through to balanced-brace extraction */ }

  // Find the first `{` or `[` and the matching closing brace. Quick balanced
  // scan that ignores braces inside string literals (with escaping).
  const first = cleaned.search(/[\{\[]/);
  if (first === -1) throw new Error("No JSON object/array found in response");
  const openChar = cleaned[first];
  const closeChar = openChar === "{" ? "}" : "]";
  let depth = 0;
  let inString = false;
  let escape = false;
  let end = -1;
  for (let i = first; i < cleaned.length; i++) {
    const c = cleaned[i];
    if (escape) { escape = false; continue; }
    if (c === "\\") { escape = true; continue; }
    if (c === '"' && !escape) { inString = !inString; continue; }
    if (inString) continue;
    if (c === openChar) depth++;
    else if (c === closeChar) {
      depth--;
      if (depth === 0) { end = i; break; }
    }
  }
  if (end === -1) throw new Error("Unbalanced JSON in response");
  return JSON.parse(cleaned.slice(first, end + 1)) as T;
}

// ─────────────────────────────────────────────────────────────────────────
// Retryability check for Gemini errors.
//
// Returns true for transient failures where Claude is a useful fallback:
//   429 (rate-limited), 503 (overloaded), 5xx server errors, network errors.
// Returns false for client errors (400, 401, 403, 422) where Claude won't help.
// ─────────────────────────────────────────────────────────────────────────

export function isGeminiRetryable(err: unknown): boolean {
  if (err instanceof TypeError) return true; // network-level fetch failure
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes("rate-limited") ||      // 429 from callAI / callAIAgent
    msg.includes("temporarily busy") ||   // 503 from callAI / callAIAgent
    /Gemini API error[:\s]*5\d\d/.test(msg) // 5xx from callAI or raw fetch
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Gemini embeddings. 768-dim text-embedding-004 matches the pgvector columns
// we added in 20260418000000_pgvector_memory_foundation.sql.
// ─────────────────────────────────────────────────────────────────────────

export async function callGeminiEmbedding(input: string | string[]): Promise<number[][]> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

  const texts = Array.isArray(input) ? input : [input];

  // Model: gemini-embedding-001 (verified live via ListModels on 2026-04-18).
  // Output dim forced to 768 to match the pgvector columns in
  // 20260418000000_pgvector_memory_foundation.sql. gemini-embedding-001's
  // native dim is 3072 but the model is trained to degrade gracefully when
  // truncated — 768 keeps index size + query cost reasonable.
  //
  // Endpoint: :embedContent (single input per call). batchEmbedContents
  // was removed from this model family; we loop with modest concurrency.
  const model = "gemini-embedding-001";
  const OUTPUT_DIM = 768;
  const TASK_TYPE = "RETRIEVAL_DOCUMENT";
  const CONCURRENCY = 5;

  async function embedOne(text: string): Promise<number[]> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent?key=${apiKey}`;
    const body = {
      content: { parts: [{ text: text.slice(0, 20000) }] },
      taskType: TASK_TYPE,
      outputDimensionality: OUTPUT_DIM,
    };
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Gemini embedding error ${res.status}: ${err}`);
    }
    const data = await res.json();
    const values = data.embedding?.values;
    if (!Array.isArray(values)) throw new Error("embedding response missing values");
    return values;
  }

  // Bounded parallelism — run up to CONCURRENCY embeddings at once to keep
  // wall clock low without hammering the API.
  const out: number[][] = new Array(texts.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(CONCURRENCY, texts.length) }, async () => {
    while (true) {
      const i = next++;
      if (i >= texts.length) return;
      out[i] = await embedOne(texts[i]);
    }
  });
  await Promise.all(workers);
  return out;
}

// ─────────────────────────────────────────────────────────────────────────
// Claude client (Anthropic API). Used for the long-form writing jobs where
// consistency + voice matter more than cost — report generation, scope
// writing, proposals, annual reviews, invoices. Falls back to Gemini Flash
// if ANTHROPIC_API_KEY isn't set, so the app never breaks when the key is
// missing.
//
// Prompt caching is wired by default via `cache: true` on system blocks.
// Anthropic caches any message block ≥1024 tokens for ~5 minutes, so reusing
// long system prompts (report templates, style guides, retrieved context)
// across multiple calls drops repeated-input cost to ~10%.
// ─────────────────────────────────────────────────────────────────────────

export interface ClaudeOptions {
  /** Always required. Short, cheap task-scoped instruction. */
  system: string;
  /** Optional long-form context that should be cached (style guide, retrieved past writings). */
  cacheableContext?: string;
  /** The user's prompt — the actual task for this call. */
  prompt?: string;
  /** Multi-turn conversation (alternative to prompt). */
  messages?: Array<{ role: "user" | "assistant"; content: string }>;
  model?: string;
  json?: boolean;
  temperature?: number;
  maxOutputTokens?: number;
  /** If true and ANTHROPIC_API_KEY is missing, silently fall back to Gemini flash. */
  geminiFallback?: boolean;
}

const DEFAULT_CLAUDE_MODEL = "claude-sonnet-4-6";

export async function callClaude(opts: ClaudeOptions): Promise<string> {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");

  if (!apiKey) {
    if (opts.geminiFallback !== false) {
      console.warn("callClaude: ANTHROPIC_API_KEY missing — falling back to Gemini flash");
      const fallbackSystem = [opts.system, opts.cacheableContext].filter(Boolean).join("\n\n");
      return callAI({
        system: fallbackSystem,
        prompt: opts.prompt,
        messages: opts.messages?.map((m) => ({
          role: m.role === "assistant" ? "model" : m.role,
          content: m.content,
        })),
        model: "google/gemini-2.5-flash",
        json: opts.json,
        temperature: opts.temperature,
        maxOutputTokens: opts.maxOutputTokens,
      });
    }
    throw new Error("ANTHROPIC_API_KEY not configured");
  }

  const model = opts.model ?? DEFAULT_CLAUDE_MODEL;

  // Build the system array. Short system goes first (ephemeral, not cached);
  // cacheableContext goes in a second block with cache_control set — that's
  // where the bulk of long templates and retrieved context should live so
  // Anthropic caches it across the ~5-minute TTL. A single request costs
  // extra on the first use (the "cache_creation_input_tokens" counter),
  // then subsequent calls read at ~10% cost.
  const systemBlocks: Array<Record<string, unknown>> = [
    { type: "text", text: opts.system },
  ];
  if (opts.cacheableContext && opts.cacheableContext.length > 0) {
    systemBlocks.push({
      type: "text",
      text: opts.cacheableContext,
      cache_control: { type: "ephemeral" },
    });
  }

  // Build messages. Either a single user prompt or a multi-turn thread.
  let msgs: Array<{ role: "user" | "assistant"; content: string }>;
  if (opts.messages && opts.messages.length > 0) {
    msgs = opts.messages;
  } else {
    const userText = opts.json
      ? `${opts.prompt ?? ""}\n\nRespond with valid JSON only. No markdown, no explanation.`
      : (opts.prompt ?? "");
    msgs = [{ role: "user", content: userText }];
  }

  const body: Record<string, unknown> = {
    model,
    max_tokens: opts.maxOutputTokens ?? 8192,
    system: systemBlocks,
    messages: msgs,
    temperature: opts.temperature ?? 0.3,
  };

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    if (res.status === 529 || res.status === 503) {
      throw new Error("Claude is temporarily busy — please try again in a minute.");
    }
    if (res.status === 429) {
      throw new Error("Claude is rate-limited right now — please wait a moment and retry.");
    }
    if (res.status === 401 || res.status === 403) {
      // Auth failures can be transient (Anthropic infrastructure hiccup) or
      // permanent (key revoked). Log at error level so key problems surface in
      // edge-function logs, then fall back to Gemini so CI and production stay
      // functional — same strategy as the 402 fallback shipped in PR #124.
      console.error(`callClaude: Anthropic ${res.status} auth failure — falling back to Gemini flash. Raw: ${err.slice(0, 200)}`);
      const fallbackSystem401 = [opts.system, opts.cacheableContext].filter(Boolean).join("\n\n");
      return callAI({
        system: fallbackSystem401,
        prompt: opts.prompt,
        messages: opts.messages?.map((m) => ({
          role: m.role === "assistant" ? "model" : m.role,
          content: m.content,
        })) as AIOptions["messages"],
        model: "google/gemini-2.5-flash",
        json: opts.json,
        temperature: opts.temperature,
        maxOutputTokens: opts.maxOutputTokens,
      });
    }
    if (res.status === 402) {
      // Credit balance exhausted. Fall back to Gemini flash so production
      // stays functional and Golden Path CI stays green. Log so the condition
      // surfaces in edge-function logs without breaking the user request.
      console.warn("callClaude: Anthropic 402 (credit exhausted) — falling back to Gemini flash");
      const fallbackSystem = [opts.system, opts.cacheableContext].filter(Boolean).join("\n\n");
      return callAI({
        system: fallbackSystem,
        prompt: opts.prompt,
        messages: opts.messages?.map((m) => ({
          role: m.role === "assistant" ? "model" : m.role,
          content: m.content,
        })) as AIOptions["messages"],
        model: "google/gemini-2.5-flash",
        json: opts.json,
        temperature: opts.temperature,
        maxOutputTokens: opts.maxOutputTokens,
      });
    }
    throw new Error(`Anthropic API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  // Log cache usage at debug level so we can see it in edge-function logs.
  if (data.usage) {
    console.log(
      `claude usage: in=${data.usage.input_tokens} out=${data.usage.output_tokens} ` +
      `cache_create=${data.usage.cache_creation_input_tokens ?? 0} ` +
      `cache_read=${data.usage.cache_read_input_tokens ?? 0}`,
    );
  }

  const text = (data.content || [])
    .filter((c: { type: string }) => c.type === "text")
    .map((c: { text: string }) => c.text)
    .join("");

  return text;
}

// ─────────────────────────────────────────────────────────────────────────
// Agent-native call: Gemini function calling done properly.
//
// `callAI` above returns a plain string and flattens function calls into an
// opaque JSON string. That was never usable by a ReAct loop — hbc-agent's
// tool-calling loop had been dead since day one. `callAIAgent` returns the
// structured response (text + functionCalls[]) so a loop can actually drive
// tool execution and feed results back to the model.
//
// Callers build Gemini-shape `contents` directly and manage the loop.
// ─────────────────────────────────────────────────────────────────────────

export interface AgentToolDef {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface AgentCall {
  /** Concatenated text parts from the model turn (may be empty on a pure tool call). */
  text: string;
  /** Function calls the model wants the runner to execute. */
  functionCalls: Array<{ name: string; args: Record<string, unknown>; thoughtSignature?: string }>;
  /** `STOP`, `MAX_TOKENS`, `SAFETY`, etc. Mirrors Gemini's finishReason. */
  finish: string;
}

export interface AgentOptions {
  system?: string;
  /** Full conversation in Gemini-native shape. Caller owns the list. */
  contents: AIMessage[];
  /** Function declarations exposed to the model this turn. */
  tools?: AgentToolDef[];
  /** "auto" (default) lets the model decide; "none" forces text-only. */
  toolChoice?: "auto" | "none";
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
}

export async function callAIAgent(opts: AgentOptions): Promise<AgentCall> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured in Supabase Vault");

  const rawModel = opts.model ?? "google/gemini-2.5-flash";
  const model = MODEL_MAP[rawModel] ?? "gemini-2.5-flash";

  const body: Record<string, unknown> = {
    contents: opts.contents,
    generationConfig: {
      temperature: opts.temperature ?? 0.3,
      maxOutputTokens: opts.maxOutputTokens ?? 8192,
    },
  };

  if (opts.system) {
    body.systemInstruction = { parts: [{ text: opts.system }] };
  }

  if (opts.tools && opts.tools.length > 0) {
    body.tools = [{
      functionDeclarations: opts.tools.map((t) => ({
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      })),
    }];
    body.toolConfig = {
      functionCallingConfig: { mode: opts.toolChoice === "none" ? "NONE" : "AUTO" },
    };
  }

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    // Same mapping as callAI above — surface the common transient Gemini
    // states as friendly messages instead of pasting raw JSON into the chat.
    if (res.status === 503) {
      throw new Error("AI is temporarily busy — please try again in a minute.");
    }
    if (res.status === 429) {
      throw new Error("AI is rate-limited right now — please wait a moment and retry.");
    }
    if (res.status === 401 || res.status === 403) {
      throw new Error("AI authentication failed — check GEMINI_API_KEY configuration.");
    }
    throw new Error(`Gemini API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const candidate = data.candidates?.[0];
  if (!candidate) return { text: "", functionCalls: [], finish: "EMPTY" };

  const parts: GeminiPart[] = candidate.content?.parts ?? [];
  const textChunks: string[] = [];
  const functionCalls: Array<{ name: string; args: Record<string, unknown>; thoughtSignature?: string }> = [];
  for (const p of parts) {
    if (typeof p.text === "string" && p.text.length > 0) textChunks.push(p.text);
    if (p.functionCall) {
      // Gemini 2.5+ requires thought_signature to be round-tripped on
      // subsequent turns when function calling is active. Capture it here
      // so the runner can put it back on the reconstructed model turn.
      const thoughtSignature = (p as unknown as { thoughtSignature?: string }).thoughtSignature
        ?? (p as unknown as { thought_signature?: string }).thought_signature;
      functionCalls.push({
        name: p.functionCall.name,
        args: (p.functionCall.args ?? {}) as Record<string, unknown>,
        thoughtSignature,
      });
    }
  }

  return {
    text: textChunks.join(""),
    functionCalls,
    finish: candidate.finishReason ?? "STOP",
  };
}
