import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callAI, callClaude, isGeminiRetryable } from "../_shared/ai-client.ts";
import { requireRole, corsHeaders, json } from "../_shared/auth.ts";

/**
 * ai-edit — Rewrites selected text.
 *
 * Two call shapes:
 *
 * 1. **Mode-driven** (E3 / Master Spec 5.4.3 / B14 AIExpandTightenField):
 *    `{ mode: "expand" | "tighten" | "match_brand_voice", text: string }`
 *    → `{ text: string }`
 *
 *    Each mode has a fixed prompt; the caller does not supply an
 *    instruction. Input is truncated at 5000 tokens (~20k chars).
 *
 * 2. **Instruction-driven** (legacy: AIEditPanel, PageAIChat):
 *    `{ currentContent: string, instruction: string, contentType?: string }`
 *    → `{ editedContent: string }`
 *
 *    The caller writes the instruction inline. Strict input cap
 *    (errors at 20k currentContent / 2k instruction).
 *
 * SECURITY: creator role only.
 */

type Mode = "expand" | "tighten" | "match_brand_voice";

const MODE_PROMPTS: Record<Mode, string> = {
  expand: `You are an editor extending text for a Home Clarity Report. Expand the user's text with more depth, examples, or context. Keep the existing voice and tone.

Rules:
- Return ONLY the edited content. No explanations, no preamble, no quotation marks wrapping the result.
- Preserve format: HTML stays HTML with valid structure; plain text stays plain text.
- Do NOT introduce new facts, brand names, model numbers, dates, or specifications not present in the source.
- No em-dashes (—). Use commas, periods, or colons instead.`,

  tighten: `You are an editor tightening text for a Home Clarity Report. Shorten the user's text by 30-50% while keeping the meaning.

Rules:
- Return ONLY the edited content. No explanations, no preamble, no quotation marks wrapping the result.
- Preserve format: HTML stays HTML with valid structure; plain text stays plain text.
- Drop redundancy and filler. Keep all numbers, dates, brand names, and other concrete specifics.
- Maintain the existing voice and tone.
- No em-dashes (—). Use commas, periods, or colons instead.`,

  match_brand_voice: `You are an editor rewriting text to match Home Clarity (HBC) voice: warm, direct, locally grounded, expert-neighbor tone.

Rules:
- Return ONLY the edited content. No explanations, no preamble, no quotation marks wrapping the result.
- Preserve format: HTML stays HTML with valid structure; plain text stays plain text.
- No em-dashes (—). Use commas, periods, or colons instead.
- No comparison anchors. Do not write "up to", "as low as", "starting at", "save up to".
- No salesy language. Do not write "transform your home", "luxury experience", "elevate your space", "best-in-class", "world-class".
- No corporate jargon. Do not write "leverage", "synergy", "stakeholders", "deliverables", "robust solution".
- No second-person scolding. Do not write "you should have", "you need to", "you must".
- No "saves money" framing. HBC saves time, not money.`,
};

const INPUT_CHAR_CAP = 20_000; // ~5000 tokens, per Master Spec 5.4.3

const isMode = (v: unknown): v is Mode =>
  v === "expand" || v === "tighten" || v === "match_brand_voice";

async function callWithFallback(geminiOpts: Parameters<typeof callAI>[0], claudeSystem: string, claudePrompt: string): Promise<string> {
  try {
    return await callAI(geminiOpts);
  } catch (geminiErr) {
    console.warn("Gemini failed in ai-edit, falling back to Claude:", geminiErr instanceof Error ? geminiErr.message : geminiErr);
    try {
      return await callClaude({ system: claudeSystem, prompt: claudePrompt, geminiFallback: false });
    } catch {
      throw geminiErr;
    }
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const auth = await requireRole(req, ["creator"]);
  if ("error" in auth) return auth.error;

  try {
    const body = await req.json();

    if (isMode(body?.mode)) {
      const text = body.text;
      if (typeof text !== "string") {
        return json({ error: "text must be a string when mode is set" }, { status: 400 });
      }
      const truncated = text.length > INPUT_CHAR_CAP ? text.slice(0, INPUT_CHAR_CAP) : text;

      const aiText = await callWithFallback(
        {
          messages: [
            { role: "system", content: MODE_PROMPTS[body.mode] },
            { role: "user", content: truncated },
          ],
          model: "google/gemini-3-flash-preview",
        },
        MODE_PROMPTS[body.mode],
        truncated,
      );

      return json({ text: aiText });
    }

    // Legacy instruction-driven path.
    const { currentContent, instruction, contentType } = body ?? {};

    if (typeof currentContent !== "string" || typeof instruction !== "string") {
      return json({ error: "currentContent and instruction must be strings" }, { status: 400 });
    }
    if (currentContent.length > INPUT_CHAR_CAP || instruction.length > 2_000) {
      return json({ error: "Payload too large" }, { status: 413 });
    }

    const systemPrompt = `You are a professional content editor for home inspection reports. You edit content based on instructions while maintaining a professional, authoritative tone appropriate for homeowners.

Rules:
- Return ONLY the edited content, no explanations or preamble
- Maintain the same format (HTML if HTML was provided, plain text if plain text)
- Keep the professional tone of a home assessment report
- If the content is HTML, preserve valid HTML structure
- Content type: ${contentType || "narrative"}`;

    const aiText = await callWithFallback(
      {
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Current content:\n\n${currentContent}\n\nInstruction: ${instruction}` },
        ],
        model: "google/gemini-3-flash-preview",
      },
      systemPrompt,
      `Current content:\n\n${currentContent}\n\nInstruction: ${instruction}`,
    );

    return json({ editedContent: aiText });
  } catch (e) {
    console.error("ai-edit error:", e);
    return json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
});
