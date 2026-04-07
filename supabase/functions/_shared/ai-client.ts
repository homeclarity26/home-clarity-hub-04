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

export interface AIOptions {
  system?: string;
  prompt?: string;
  messages?: AIMessage[];   // for multi-turn (hbc-agent)
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

  // Build contents array
  let contents: AIMessage[];
  if (opts.messages) {
    contents = opts.messages;
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

  if (opts.system) {
    body.systemInstruction = { parts: [{ text: opts.system }] };
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
