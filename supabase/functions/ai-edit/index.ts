import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callAI } from "../_shared/ai-client.ts";
import { requireRole, corsHeaders, json } from "../_shared/auth.ts";

/**
 * ai-edit — Rewrites selected text based on an instruction.
 *
 * SECURITY: only creators (admin) can invoke this. Clients cannot edit
 * report narrative, so they have no reason to call this endpoint.
 * Previously this was unauthenticated — anyone with the anon key could burn
 * Gemini quota.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const auth = await requireRole(req, ["creator"]);
  if ("error" in auth) return auth.error;

  try {
    const body = await req.json();
    const { currentContent, instruction, contentType } = body ?? {};

    if (typeof currentContent !== "string" || typeof instruction !== "string") {
      return json({ error: "currentContent and instruction must be strings" }, { status: 400 });
    }
    if (currentContent.length > 20_000 || instruction.length > 2_000) {
      return json({ error: "Payload too large" }, { status: 413 });
    }

    const systemPrompt = `You are a professional content editor for home inspection reports. You edit content based on instructions while maintaining a professional, authoritative tone appropriate for homeowners.

Rules:
- Return ONLY the edited content, no explanations or preamble
- Maintain the same format (HTML if HTML was provided, plain text if plain text)
- Keep the professional tone of a home assessment report
- If the content is HTML, preserve valid HTML structure
- Content type: ${contentType || "narrative"}`;

    const aiText = await callAI({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Current content:\n\n${currentContent}\n\nInstruction: ${instruction}` },
      ],
      model: "google/gemini-3-flash-preview",
    });

    return json({ editedContent: aiText });
  } catch (e) {
    console.error("ai-edit error:", e);
    return json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
});
