// Generate + store Gemini text-embedding-004 vectors for content rows.
//
// POST body:
//   { table: "report_pages" | "knowledge_templates" | "home_knowledge_base" | "agent_memory",
//     ids?: string[],           // specific row IDs to embed
//     all_missing?: boolean,    // re-embed every row whose embedding column is NULL
//     batch_size?: number       // default 50
//   }
//
// Returns: { ok: true, embedded: N, skipped: N, errors: [...] }
//
// This is the single chokepoint for the "learn over time" loop. Everything
// that writes to embeddable tables should call this (directly or via a
// trigger) so new content is immediately retrievable via the match_*() RPCs.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireRole, corsHeaders, json } from "../_shared/auth.ts";
import { callGeminiEmbedding } from "../_shared/ai-client.ts";

// text extractors: each table's "what to embed" differs a bit. We keep the
// extractor local here so the DB schema doesn't need stored generated columns.
const EXTRACTORS: Record<string, (row: Record<string, unknown>) => string> = {
  report_pages: (row) => {
    const narrative = typeof row.narrative === "object" ? JSON.stringify(row.narrative) : String(row.narrative ?? "");
    const specs = typeof row.specs === "object" ? JSON.stringify(row.specs) : String(row.specs ?? "");
    const tiers = typeof row.tiers === "object" ? JSON.stringify(row.tiers) : String(row.tiers ?? "");
    return [
      row.title,
      row.group_name,
      row.condition_rating,
      narrative,
      specs,
      tiers,
    ].filter(Boolean).join("\n\n");
  },
  knowledge_templates: (row) => {
    const content = typeof row.content === "object" ? JSON.stringify(row.content) : String(row.content ?? "");
    return [row.title, row.category, row.region, content].filter(Boolean).join("\n\n");
  },
  home_knowledge_base: (row) => {
    return [row.subject, row.knowledge_type, row.content].filter(Boolean).join("\n\n");
  },
  agent_memory: (row) => {
    return [row.memory_type, row.content].filter(Boolean).join("\n\n");
  },
};

const ALLOWED_TABLES = Object.keys(EXTRACTORS);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const auth = await requireRole(req, ["creator"]);
  if ("error" in auth) return auth.error;

  try {
    const { table, ids, all_missing, batch_size = 50 } = await req.json();

    if (!ALLOWED_TABLES.includes(table)) {
      return json({ error: `table must be one of: ${ALLOWED_TABLES.join(", ")}` }, { status: 400 });
    }

    // Pull rows to embed. Service role — we trust the auth check above.
    let query = (auth.adminSupabase.from(table) as any).select("*").is("embedding", null);
    if (ids && Array.isArray(ids) && ids.length > 0) {
      query = (auth.adminSupabase.from(table) as any).select("*").in("id", ids);
    } else if (!all_missing) {
      return json({ error: "either 'ids' or 'all_missing: true' must be provided" }, { status: 400 });
    }
    query = query.limit(batch_size);

    const { data: rows, error } = await query;
    if (error) throw error;
    if (!rows || rows.length === 0) {
      return json({ ok: true, embedded: 0, skipped: 0, errors: [] });
    }

    const extract = EXTRACTORS[table];
    const texts: string[] = [];
    const textIds: string[] = [];
    for (const row of rows) {
      const text = extract(row).trim();
      if (!text) continue;
      texts.push(text);
      textIds.push(row.id as string);
    }

    if (texts.length === 0) {
      return json({ ok: true, embedded: 0, skipped: rows.length, errors: [] });
    }

    // Gemini's batch endpoint handles up to 100 inputs per call; we're already
    // capped by batch_size (default 50).
    const embeddings = await callGeminiEmbedding(texts);

    // Write embeddings back. We do this one row at a time — pgvector literal
    // format is just a JSON-array string cast to vector, which Supabase's
    // JSON API handles cleanly when the column type is vector.
    const errors: Array<{ id: string; error: string }> = [];
    let embedded = 0;
    for (let i = 0; i < textIds.length; i++) {
      const id = textIds[i];
      const vec = embeddings[i];
      // pgvector accepts the array JSON literal as text → cast via the column type.
      const vecLiteral = `[${vec.join(",")}]`;
      const { error: updateErr } = await (auth.adminSupabase.from(table) as any)
        .update({ embedding: vecLiteral })
        .eq("id", id);
      if (updateErr) {
        errors.push({ id, error: updateErr.message });
      } else {
        embedded++;
      }
    }

    return json({
      ok: true,
      table,
      embedded,
      skipped: rows.length - texts.length,
      errors,
      has_more: rows.length === batch_size,
    });
  } catch (e) {
    console.error("embed-content error:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown" }, { status: 500 });
  }
});
