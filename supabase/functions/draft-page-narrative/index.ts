import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireRole, corsHeaders, json } from "../_shared/auth.ts";
import { callClaude, parseJSON, type ClaudeInlineDocument } from "../_shared/ai-client.ts";
import { retrieveContext } from "../_shared/rag.ts";

// Fetch a photo URL and encode as a Claude image document (base64 +
// detected MIME). Used by redraft mode so Claude can SEE the new photo
// when re-writing the page narrative — e.g. read a serial plate it
// hasn't seen before. Skips silently on fetch failure so one bad URL
// doesn't kill the whole redraft.
async function loadPhotoAsDocument(url: string): Promise<ClaudeInlineDocument | null> {
  try {
    const resp = await fetch(url);
    if (!resp.ok) return null;
    const bytes = new Uint8Array(await resp.arrayBuffer());
    let binary = "";
    const CHUNK = 0x8000;
    for (let i = 0; i < bytes.length; i += CHUNK) {
      binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
    }
    const data = btoa(binary);
    const mediaType = resp.headers.get("content-type") || "image/jpeg";
    return { data, media_type: mediaType };
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const auth = await requireRole(req, ["creator"]);
  if ("error" in auth) return auth.error;

  try {
    const {
      pageSlug,
      pageName,
      propertyAddress,
      yearBuilt,
      sqft,
      bedrooms,
      bathrooms,
      propertyType,
      relationshipType,
      clientIntelligenceSummary,
      clientGoals,
      clientPriorities,
      existingConditionRating,
      existingSpecs,
      // Re-draft mode: when true, AI rewrites the existing narrative
      // taking the supplied photos into account. Used by PhotoManager
      // when the consultant edits or replaces a photo on a system page
      // (a new serial plate, a different angle, an after photo, etc.).
      redraft_mode,
      existing_narrative_text,
      photo_urls,
    }: {
      pageSlug: string;
      pageName: string;
      propertyAddress?: string;
      yearBuilt?: string | number;
      sqft?: string | number;
      bedrooms?: string | number;
      bathrooms?: string | number;
      propertyType?: string;
      relationshipType?: string;
      clientIntelligenceSummary?: string;
      clientGoals?: string[];
      clientPriorities?: string[];
      existingConditionRating?: string;
      existingSpecs?: Record<string, unknown>;
      redraft_mode?: boolean;
      existing_narrative_text?: string;
      photo_urls?: string[];
    } = await req.json();

    if (!pageSlug || !pageName) {
      return new Response(
        JSON.stringify({ error: "pageSlug and pageName are required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ─── Redraft mode ─────────────────────────────────────────────────
    // Caller supplied an existing narrative + a list of photo URLs (the
    // photos linked to this page in property_photos, post-edit). Read
    // each photo as an image, then ask Claude to update the narrative
    // to reflect what's now visible. Returns the same {narrative,
    // key_observations} shape as default mode.
    if (redraft_mode === true) {
      const urls = Array.isArray(photo_urls) ? photo_urls.filter(Boolean) : [];
      if (urls.length === 0) {
        return new Response(
          JSON.stringify({ error: "redraft_mode requires at least one photo_url." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const photoDocs: ClaudeInlineDocument[] = [];
      for (const url of urls.slice(0, 10)) {
        // Cap at 10 photos per call to keep the request body sane and
        // protect Claude's vision context budget.
        const doc = await loadPhotoAsDocument(url);
        if (doc) photoDocs.push(doc);
      }
      if (photoDocs.length === 0) {
        return new Response(
          JSON.stringify({ error: "Could not fetch any of the provided photo URLs." }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const redraftSystem = `You are an expert home consultant updating a Home Clarity Hub report page.

The "${pageName}" page already has a narrative. You are given that narrative AND ${photoDocs.length} photo${photoDocs.length === 1 ? "" : "s"} attached to this page. Look at every photo carefully — read serial plates, model numbers, install dates, visible damage, age clues. Then rewrite the narrative to reflect what the photos show.

Constraints:
- Keep the consultant's voice and structure where the existing narrative still holds. Only change what the photos contradict or add to.
- 2-3 paragraphs in the narrative array, same as the original page.
- 3-5 key observations highlighting what the photos revealed (especially anything model/age/condition specific).
- Plain spoken English. Never use em-dashes. Use commas, semicolons, or short sentences.

Return ONLY a JSON object with this exact shape (no preamble, no markdown):
{
  "narrative": ["paragraph 1", "paragraph 2", "paragraph 3"],
  "key_observations": ["observation 1", "observation 2", "observation 3"]
}`;

      const userMessage = `Existing narrative:\n${existing_narrative_text || "(empty — write fresh based on the photos)"}\n\nPhotos attached to this page: ${photoDocs.length}. Read each one and update the narrative.`;

      const aiText = await callClaude({
        system: redraftSystem,
        prompt: userMessage,
        documents: photoDocs,
        json: true,
        temperature: 0.4,
        maxOutputTokens: 1500,
      });

      let parsed: { narrative?: string[]; key_observations?: string[] };
      try {
        parsed = parseJSON<typeof parsed>(aiText);
      } catch {
        parsed = { narrative: [aiText], key_observations: [] };
      }

      return new Response(
        JSON.stringify({
          mode: "redraft",
          narrative: Array.isArray(parsed.narrative) ? parsed.narrative : [parsed.narrative || ""],
          key_observations: Array.isArray(parsed.key_observations) ? parsed.key_observations : [],
          photos_read: photoDocs.length,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Note: we no longer directly call Gemini here — callClaude handles the
    // model call (with graceful Gemini fallback). The legacy GEMINI_API_KEY
    // check was removed when this function switched to the Claude hybrid
    // in the 2026-04-18 memory/Claude rollout.

    // --- Knowledge Base Context Injection (legacy keyword KB) ---
    // Kept as a secondary belt-and-suspenders signal alongside the semantic
    // RAG retrieval above. Safe to remove once embeddings cover 100% of KB.
    let kbContext = "";
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, serviceKey);

      // Derive category from page slug (e.g. "roof-system" → "roof", "hvac" → "hvac")
      const slugCategory = pageSlug.split("-")[0].toLowerCase();

      const { data: kbArticles } = await supabase
        .from("knowledge_templates")
        .select("title, content, category, region")
        .or(`category.ilike.%${slugCategory}%,title.ilike.%${pageName}%`)
        .limit(5);

      if (kbArticles && kbArticles.length > 0) {
        kbContext = "\n\nKNOWLEDGE BASE ARTICLES (use these for regional/property-specific context):\n" +
          kbArticles.map((a) => {
            const contentStr = typeof a.content === "string" ? a.content : JSON.stringify(a.content);
            return `--- ${a.title} (${a.category}${a.region ? `, ${a.region}` : ""}) ---\n${contentStr}`;
          }).join("\n\n");
      }

      // --- Advisor Pattern Injection (Self-Learning Layer) ---
      const { data: patterns } = await supabase
        .from("advisor_patterns")
        .select("pattern_data, confidence_score")
        .eq("pattern_type", "report_structure")
        .gte("confidence_score", 0.3)
        .order("confidence_score", { ascending: false })
        .limit(3);

      if (patterns && patterns.length > 0) {
        kbContext += "\n\nADVISOR WRITING PREFERENCES (learned from past reports):\n";
        for (const p of patterns) {
          if (p.pattern_data?.avg_narrative_paragraphs) {
            kbContext += `- Preferred narrative length: ~${p.pattern_data.avg_narrative_paragraphs} paragraphs\n`;
          }
          if (p.pattern_data?.recent_condition_ratings?.length > 0) {
            const ratings = p.pattern_data.recent_condition_ratings;
            kbContext += `- Recent rating tendency: ${ratings.slice(-5).join(", ")}\n`;
          }
        }
      }
    } catch (kbErr) {
      console.warn("KB lookup failed (non-fatal):", kbErr);
    }

    const specsStr = existingSpecs && Object.keys(existingSpecs).length > 0
      ? Object.entries(existingSpecs).map(([k, v]) => `${k}: ${v}`).join(", ")
      : "none provided";

    const systemInstruction = `You are an expert home consultant writing professional report content for Home Clarity Hub. Your writing is clear, authoritative, and client-friendly — no jargon, plain English, but with the confidence of a knowledgeable advisor.

Write a narrative section for the "${pageName}" page of a home assessment report. The narrative should:
1. Describe the current state of this system/space based on available context
2. Note any relevant concerns, age factors, or maintenance considerations
3. Reference the client's specific situation and goals where relevant
4. Be 2-3 short paragraphs, each as a separate string in the array

Also generate 3-5 key observations — concise bullet points highlighting the most important findings.

Property context:
- Address: ${propertyAddress || "unknown"}
- Year built: ${yearBuilt || "unknown"}
- Sq ft: ${sqft || "unknown"}
- Bedrooms: ${bedrooms || "unknown"}, Bathrooms: ${bathrooms || "unknown"}
- Property type: ${propertyType || "unknown"}
- Client relationship: ${relationshipType || "unknown"}

Page being written: ${pageName} (${pageSlug})
Condition rating: ${existingConditionRating || "not yet assessed"}
Known specs: ${specsStr}

${clientIntelligenceSummary ? `Client intelligence summary:\n${clientIntelligenceSummary}` : ""}
${clientGoals?.length ? `Client goals: ${clientGoals.join("; ")}` : ""}
${clientPriorities?.length ? `Flagged priorities: ${clientPriorities.join("; ")}` : ""}
${kbContext}

Return a JSON object with:
- "narrative": array of 2-3 paragraph strings
- "key_observations": array of 3-5 concise observation strings (no bullet symbols, just the text)`;

    // RAG: pull past narratives on the same page/system + relevant memories.
    // This is where Claude + retrieval is most valuable — the narrative
    // should match the voice Adam used on the same page type in past reports.
    const ragContext = await retrieveContext({
      query: `${pageName} ${pageSlug} ${propertyType || ""} ${existingConditionRating || ""}`.slice(0, 3000),
      adminSupabase: auth.adminSupabase as unknown as { rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown[] | null; error: unknown }> },
      creatorUserId: auth.user.id,
      sources: ["report_pages", "knowledge_templates", "agent_memory"],
      perSource: 3,
    });

    const rawContent = await callClaude({
      system: systemInstruction,
      cacheableContext: ragContext || undefined,
      prompt: `Write the narrative and key observations for the "${pageName}" page.`,
      json: true,
      temperature: 0.4,
      maxOutputTokens: 1500,
    });

    let parsed: { narrative?: string[]; key_observations?: string[] };
    try {
      parsed = parseJSON<{ narrative?: string[]; key_observations?: string[] }>(rawContent);
    } catch {
      parsed = {
        narrative: [rawContent],
        key_observations: [],
      };
    }

    return new Response(
      JSON.stringify({
        narrative: Array.isArray(parsed.narrative) ? parsed.narrative : [parsed.narrative || ""],
        key_observations: Array.isArray(parsed.key_observations) ? parsed.key_observations : [],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("draft-page-narrative error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
