import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireRole, corsHeaders, json } from "../_shared/auth.ts";
import { callClaude, parseJSON, type ClaudeInlineDocument } from "../_shared/ai-client.ts";
import { retrieveContext } from "../_shared/rag.ts";

interface IntakeFile {
  name?: string;
  storage_path?: string;
  bucket?: string;
  mime?: string;
}

const INLINE_DOC_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
]);
const TEXT_DOC_TYPES = new Set([
  "text/plain",
  "text/markdown",
  "text/csv",
]);

// Hard cap so a runaway upload never balloons the Anthropic request body.
// Claude accepts up to 32MB per document inline; we cap aggregate input
// well below that to leave headroom for the prompt + cache headers.
const MAX_INLINE_BYTES = 20 * 1024 * 1024;

async function bytesToBase64(bytes: Uint8Array): Promise<string> {
  // Deno doesn't ship a streaming base64 helper; chunk to avoid call-stack
  // limits on multi-MB files. 0x8000 is the conservative safe slice size.
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

async function loadIntakeFiles(
  storage: { from: (bucket: string) => { download: (path: string) => Promise<{ data: Blob | null; error: unknown }> } },
  files: IntakeFile[],
): Promise<{ docs: ClaudeInlineDocument[]; texts: string[]; skipped: string[] }> {
  const docs: ClaudeInlineDocument[] = [];
  const texts: string[] = [];
  const skipped: string[] = [];
  let bytesAccum = 0;

  for (const f of files) {
    if (!f.bucket || !f.storage_path) {
      skipped.push(`${f.name ?? "unnamed"}: missing storage path`);
      continue;
    }
    const mime = (f.mime || "").toLowerCase();
    try {
      const { data, error } = await storage.from(f.bucket).download(f.storage_path);
      if (error || !data) {
        skipped.push(`${f.name ?? f.storage_path}: download failed`);
        continue;
      }
      const buf = new Uint8Array(await data.arrayBuffer());
      if (bytesAccum + buf.byteLength > MAX_INLINE_BYTES) {
        skipped.push(`${f.name ?? f.storage_path}: would exceed ${MAX_INLINE_BYTES} bytes cap`);
        continue;
      }
      bytesAccum += buf.byteLength;

      if (TEXT_DOC_TYPES.has(mime)) {
        const text = new TextDecoder("utf-8").decode(buf);
        texts.push(`--- ${f.name ?? f.storage_path} ---\n${text}`);
      } else if (INLINE_DOC_TYPES.has(mime)) {
        const b64 = await bytesToBase64(buf);
        docs.push({ data: b64, media_type: mime, name: f.name });
      } else {
        skipped.push(`${f.name ?? f.storage_path}: unsupported mime ${mime || "(unknown)"}`);
      }
    } catch (e) {
      skipped.push(`${f.name ?? f.storage_path}: ${e instanceof Error ? e.message : "unknown"}`);
    }
  }
  return { docs, texts, skipped };
}

/**
 * seed-report-from-notes — The AI report creation entry point.
 *
 * Two stages, controlled by `request_clarifying_questions`:
 *
 * 1. **Clarifying questions** (E7 / Master Spec 5.4.1, when
 *    `request_clarifying_questions: true`):
 *    Return 3-5 multiple-choice questions about the highest-leverage
 *    decisions in the notes. The wizard collects answers and re-calls
 *    with `request_clarifying_questions: false` and `clarifying_answers`.
 *
 * 2. **Page seeds** (default behavior):
 *    Return per-page seed data plus, per E7 / Master Spec 5.4.1:
 *      - `sequence_risk_flags` for system pages approaching EOL
 *      - `replacement_briefing_stub` per page on system pages with the
 *        replacement_briefing capability
 *
 * Existing callers (without the new flags) get the same shape they used to.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const auth = await requireRole(req, ["creator"]);
  if ("error" in auth) return auth.error;

  try {
    const {
      property_id,
      meeting_notes,
      photo_descriptions,
      property_context,
      request_clarifying_questions,
      clarifying_answers,
      intake_files,
    } = await req.json();
    if (!meeting_notes || typeof meeting_notes !== "string") {
      return json({ error: "meeting_notes (string) is required" }, { status: 400 });
    }

    // Pull uploaded files from storage so Claude reads contents, not names.
    // Text files inline into the user message; PDFs/images attach as Claude
    // document/image blocks. Skipped files are surfaced in the response so
    // the wizard can show the consultant which uploads couldn't be read.
    let intakeDocs: ClaudeInlineDocument[] = [];
    let intakeTexts: string[] = [];
    const intakeSkipped: string[] = [];
    if (Array.isArray(intake_files) && intake_files.length > 0) {
      const result = await loadIntakeFiles(
        auth.adminSupabase.storage as unknown as Parameters<typeof loadIntakeFiles>[0],
        intake_files as IntakeFile[],
      );
      intakeDocs = result.docs;
      intakeTexts = result.texts;
      intakeSkipped.push(...result.skipped);
      if (intakeSkipped.length > 0) {
        console.warn("seed-report-from-notes: skipped intake files:", intakeSkipped);
      }
    }
    const inlineTextBlock = intakeTexts.length > 0
      ? `\n\nUploaded text intake (verbatim):\n${intakeTexts.join("\n\n")}`
      : "";
    const docHint = intakeDocs.length > 0
      ? `\n\n${intakeDocs.length} attached document${intakeDocs.length > 1 ? "s" : ""} (PDF/image): read each one in full and use its contents directly. Do NOT ask for transcript text — the documents ARE the transcript.`
      : "";

    // ─── Stage 1: clarifying questions (E7) ────────────────────────────
    if (request_clarifying_questions === true) {
      const questionsSystemPrompt = `You are an expert home consultant assistant for Hometown Builders Club. Read the consultant's raw meeting notes and identify the 3-5 highest-leverage decisions that need clarifying before seeding the report.

Each question must be a discrete multiple-choice question with 3-4 options. Focus on:
- Which areas are renovation/vision-priority vs maintain-as-is
- Whether named systems (HVAC, water heater, roof) are urgent vs ride-it-out
- Budget posture for any large vision (kitchen, primary bath, addition)
- Sequence preferences when two big items overlap

Return ONLY a JSON object with this exact shape (no preamble, no markdown):
{
  "stage": "clarifying_questions",
  "questions": [
    {
      "id": "stable-snake-case-id",
      "question": "Single-sentence question.",
      "options": [
        {"id": "option_id_a", "label": "Short answer label"},
        {"id": "option_id_b", "label": "Short answer label"},
        {"id": "option_id_c", "label": "Short answer label"}
      ]
    }
  ]
}

Constraint: 3-5 questions total. Keep ids stable and snake_case so the caller can store answers reliably.

Tone: never use em-dashes. Use commas, semicolons, or short sentences. Plain spoken English.`;

      const userMessage = `Meeting notes:\n${meeting_notes}${
        photo_descriptions ? `\n\nPhoto observations:\n${photo_descriptions}` : ""
      }${property_context ? `\n\nProperty context: ${JSON.stringify(property_context)}` : ""}${inlineTextBlock}${docHint}`;

      const aiText = await callClaude({
        system: questionsSystemPrompt,
        prompt: userMessage,
        documents: intakeDocs,
        json: true,
        temperature: 0.3,
        maxOutputTokens: 4096,
      });

      let parsed: { stage?: string; questions?: unknown[] };
      try {
        parsed = parseJSON<typeof parsed>(aiText);
      } catch (parseErr) {
        console.error("seed-report-from-notes (questions stage): parseJSON failed; raw (first 800):", aiText.slice(0, 800));
        console.error("parseJSON error was:", parseErr);
        return json({ error: "Failed to parse clarifying questions from AI" }, { status: 502 });
      }

      return json({
        stage: "clarifying_questions",
        questions: Array.isArray(parsed.questions) ? parsed.questions : [],
        intake: {
          documents_attached: intakeDocs.length,
          texts_inlined: intakeTexts.length,
          skipped: intakeSkipped,
        },
      });
    }

    // ─── Stage 2: page seeds (with E7 additions) ──────────────────────
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
      "priority": false,
      "replacement_briefing_stub": null
    }
  ],
  "sequence_risk_flags": [
    {
      "page_key": "furnace",
      "risk_type": "approaching_eol",
      "severity": "high",
      "summary": "Furnace install year 2009. Recommend addressing before basement gym buildout to avoid disruption.",
      "linked_pages": ["vision_basement_gym"]
    }
  ]
}

E7 rules:

1. **replacement_briefing_stub** — On any SYSTEM page (group starts with "systems-") that has a discoverable unit make, install year, or model, populate replacement_briefing_stub:
{ "system_type": "furnace" | "ac" | "water_heater" | "electrical_panel" | "roof" | "...", "unit_make": "string or null", "unit_model": "string or null", "install_year": <number or null>, "needs_briefing": true }

   The needs_briefing:true flag tells the wizard to offer the admin a "Generate Replacement Briefing" action in Step 3. If no unit identifying info is in the notes, set replacement_briefing_stub to null.

2. **sequence_risk_flags** — A separate top-level array. Add a flag for any SYSTEM page that is approaching end-of-life AND would be disrupted by a Vision page also in the seeds. Common examples:
   - Furnace install year ≥15y old AND a basement Vision page exists → flag furnace EOL with linked_pages: [the basement vision page key].
   - Roof install year ≥20y old AND any exterior Vision page exists → flag roof EOL.
   - Water heater install year ≥10y old AND a primary-bath Vision page exists → flag water heater EOL.

   risk_type can be: "approaching_eol", "during_renovation_disruption", "shared_infrastructure". severity: "high" | "medium" | "low". linked_pages must reference page_keys actually present in page_seeds.

   If no risks are present, return an empty array.

Be focused — only include pages directly supported by the notes. When in doubt, omit; the consultant will add more later. Aim for 5-20 pages, not more. Keep each narrative_seed concise (2-3 sentences) to stay under token budget.`;

    const contextStr = property_context
      ? `\nProperty context: ${JSON.stringify(property_context)}`
      : "";

    const answersStr = Array.isArray(clarifying_answers) && clarifying_answers.length > 0
      ? `\n\nConsultant answered the following clarifying questions:\n${JSON.stringify(clarifying_answers, null, 2)}`
      : "";

    const userMessage = `Meeting notes:\n${meeting_notes}${
      photo_descriptions ? `\n\nPhoto observations:\n${photo_descriptions}` : ""
    }${contextStr}${answersStr}${inlineTextBlock}${docHint}`;

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
      documents: intakeDocs,
      json: true,
      temperature: 0.4,
      maxOutputTokens: 16384,
    });

    // Use parseJSON (strips markdown fences + handles leading/trailing
    // narration). Claude occasionally wraps JSON output in ```json ... ```
    // or prepends "Here's the JSON:" despite the "no markdown" instruction.
    let result: {
      summary?: string;
      recommended_pages?: string[];
      page_seeds?: unknown[];
      sequence_risk_flags?: unknown[];
    };
    try {
      result = parseJSON<typeof result>(aiText);
    } catch (parseErr) {
      // If parseJSON truly can't extract an object/array from the text,
      // log the first chunk so we can see what Claude returned. Fall back
      // to treating the whole text as a summary so the caller sees *some*
      // output instead of a silent 0-page response.
      console.error("seed-report-from-notes: parseJSON failed; Claude raw output (first 800 chars):", aiText.slice(0, 800));
      console.error("parseJSON error was:", parseErr);
      result = { summary: aiText, recommended_pages: [], page_seeds: [], sequence_risk_flags: [] };
    }

    return json({
      ok: true,
      summary: result.summary || "",
      recommended_pages: result.recommended_pages || [],
      page_seeds: result.page_seeds || [],
      page_count: (result.page_seeds || []).length,
      sequence_risk_flags: result.sequence_risk_flags || [],
      intake: {
        documents_attached: intakeDocs.length,
        texts_inlined: intakeTexts.length,
        skipped: intakeSkipped,
      },
    });
  } catch (e) {
    console.error("seed-report-from-notes error:", e);
    return json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
});
