import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireRole, corsHeaders, json } from "../_shared/auth.ts";
import { callClaude, parseJSON } from "../_shared/ai-client.ts";
import { retrieveContext } from "../_shared/rag.ts";

/**
 * seed-report-from-notes — The AI report creation entry point.
 *
 * Takes Adam's raw meeting notes (and optional photo descriptions) from a
 * client discovery session and returns:
 *   1. Which report pages to include
 *   2. Per-page seed data: condition guess, observations, narrative seed, specs
 *
 * This powers the "AI-first" report creation flow: meeting notes → seed all
 * pages → Adam reviews/edits with AI assist → publish.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const auth = await requireRole(req, ["creator"]);
  if ("error" in auth) return auth.error;

  try {
    const { property_id, meeting_notes, photo_descriptions, property_context } = await req.json();
    if (!meeting_notes || typeof meeting_notes !== "string") {
      return json({ error: "meeting_notes (string) is required" }, { status: 400 });
    }

    const systemPrompt = `You are an expert home consultant assistant for Hometown Builders Club. Based on the consultant's raw meeting notes (and optional photo descriptions), generate a focused report seed for a Home Clarity Report.

**Scope:** only generate page seeds for areas that are DIRECTLY MENTIONED or clearly implied in the notes. Do not speculate about untouched areas of the home — the consultant will add those pages manually. Typical output is 5-20 page seeds, not 65.

Possible page categories (pick only those relevant): exterior (roof, siding, windows, doors, gutters, deck/patio, driveway, landscaping), interior (rooms explicitly discussed: living, dining, bedrooms, bathrooms, kitchen, basement, attic, garage), appliances (discussed items only), systems (furnace, AC, water heater, electrical, plumbing if mentioned), safety (only if brought up).

Respond in JSON:
{
  "summary": "2-3 sentence overall assessment of the home",
  "recommended_pages": ["page-key-1", "page-key-2", ...],
  "page_seeds": [
    {
      "page_key": "slug-like-this",
      "title": "Human Readable Title",
      "group": "one of: exterior, interior-living, interior-bedrooms, interior-bathrooms, interior-utility, interior-unfinished, systems-hvac, systems-mechanical, appliances, exterior-structures, interior-additional, systems-additional, safety-detection, strategy, information",
      "suggested_condition": "Excellent | Good | Fair | Poor | Critical",
      "key_observations": ["observation 1", "observation 2"],
      "narrative_seed": "A 2-3 sentence starting narrative for this page based on the notes.",
      "specs_seed": [{"label": "spec name", "value": "spec value"}],
      "priority": false
    }
  ]
}

Be focused — only include pages directly supported by the notes. When in doubt, omit; the consultant will add more later. Aim for 5-20 pages, not more. Keep each narrative_seed concise (2-3 sentences) to stay under token budget.`;

    const contextStr = property_context
      ? `\nProperty context: ${JSON.stringify(property_context)}`
      : "";

    const userMessage = `Meeting notes:\n${meeting_notes}${photo_descriptions ? `\n\nPhoto observations:\n${photo_descriptions}` : ""}${contextStr}`;

    // RAG: pull Adam's past published pages + saved templates + per-client
    // facts + agent memories that are semantically similar to these notes.
    // First report run returns an empty string (no corpus yet); every
    // subsequent report pulls from accumulated past work.
    const ragContext = await retrieveContext({
      query: `${property_context ? JSON.stringify(property_context) + " " : ""}${meeting_notes}`.slice(0, 3000),
      adminSupabase: auth.adminSupabase as unknown as { rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown[] | null; error: unknown }> },
      creatorUserId: auth.user.id,
      propertyId: property_id,
      sources: ["report_pages", "knowledge_templates", "home_knowledge_base", "agent_memory"],
      perSource: 3,
    });

    // maxOutputTokens: 16k — the system prompt tells Claude to seed 65+
    // pages across the entire home, which generates a JSON response that
    // comfortably exceeds the 8k default and truncates mid-object. A
    // truncated JSON can't be recovered by any parser. Sonnet 4.6 supports
    // up to 64k output; 16k is a comfortable cap for this task.
    const aiText = await callClaude({
      system: systemPrompt,
      cacheableContext: ragContext || undefined,
      prompt: userMessage,
      json: true,
      temperature: 0.4,
      maxOutputTokens: 16384,
    });

    // Use parseJSON (strips markdown fences + handles leading/trailing
    // narration). Claude occasionally wraps JSON output in ```json ... ```
    // or prepends "Here's the JSON:" despite the "no markdown" instruction.
    let result: { summary?: string; recommended_pages?: string[]; page_seeds?: unknown[] };
    try {
      result = parseJSON<typeof result>(aiText);
    } catch (parseErr) {
      // If parseJSON truly can't extract an object/array from the text,
      // log the first chunk so we can see what Claude returned. Fall back
      // to treating the whole text as a summary so the caller sees *some*
      // output instead of a silent 0-page response.
      console.error("seed-report-from-notes: parseJSON failed; Claude raw output (first 800 chars):", aiText.slice(0, 800));
      console.error("parseJSON error was:", parseErr);
      result = { summary: aiText, recommended_pages: [], page_seeds: [] };
    }

    return json({
      ok: true,
      summary: result.summary || "",
      recommended_pages: result.recommended_pages || [],
      page_seeds: result.page_seeds || [],
      page_count: (result.page_seeds || []).length,
    });
  } catch (e) {
    console.error("seed-report-from-notes error:", e);
    return json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
});
