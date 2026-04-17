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

export interface AIMessage {
  role: "user" | "model";
  parts: Array<{ text: string }>;
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

const MODEL_MAP: Record<string, string> = {
  // Lovable gateway names → real Gemini model IDs
  "google/gemini-2.5-flash": "gemini-2.5-flash-preview-04-17",
  "google/gemini-2.5-flash-lite": "gemini-2.0-flash-lite",
  "google/gemini-3-flash-preview": "gemini-2.5-flash-preview-04-17",
  // Direct names (pass-through)
  "gemini-2.5-flash": "gemini-2.5-flash-preview-04-17",
  "gemini-2.5-pro": "gemini-2.5-pro-preview-03-25",
  "gemini-2.0-flash-lite": "gemini-2.0-flash-lite",
};

export async function callAI(opts: AIOptions): Promise<string> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured in Supabase Vault");

  const rawModel = opts.model ?? "google/gemini-2.5-flash";
  const model = MODEL_MAP[rawModel] ?? "gemini-2.5-flash-preview-04-17";

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

/** Parse JSON from AI response, stripping any markdown fences */
export function parseJSON<T = unknown>(text: string): T {
  const cleaned = text.replace(/^```json?\n?/i, "").replace(/\n?```$/i, "").trim();
  return JSON.parse(cleaned) as T;
}
