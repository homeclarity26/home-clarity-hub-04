// Semantic retrieval across the memory corpus. Takes a natural-language
// query, embeds it, and returns the top-K matches from one or more of:
// report_pages, knowledge_templates, home_knowledge_base, agent_memory.
//
// POST body:
//   { query: string,
//     sources?: Array<"report_pages" | "knowledge_templates" | "home_knowledge_base" | "agent_memory">,
//     filter?: {
//       property_id?: string,      // scope to one client
//       client_user_id?: string,   // scope to one client by user
//       category?: string,         // knowledge_templates category filter
//       memory_type?: string,      // agent_memory type filter
//     },
//     match_count?: number         // per-source limit, default 5
//   }
//
// Returns: { ok: true, query, results: { [source]: [{ id, ..., similarity }] } }
//
// Used by: hbc-agent tools (retrieve_similar_*), seed-report-from-notes,
// generate-scope, draft-page-narrative for RAG augmentation.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireRole, corsHeaders, json } from "../_shared/auth.ts";
import { callGeminiEmbedding } from "../_shared/ai-client.ts";

const DEFAULT_SOURCES = ["report_pages", "knowledge_templates", "home_knowledge_base", "agent_memory"] as const;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const auth = await requireRole(req, ["creator"]);
  if ("error" in auth) return auth.error;

  try {
    const {
      query,
      sources = DEFAULT_SOURCES,
      filter = {},
      match_count = 5,
    } = await req.json();

    if (!query || typeof query !== "string" || query.length < 3) {
      return json({ error: "query must be a string ≥3 chars" }, { status: 400 });
    }

    // Embed the query. Note: we use the default RETRIEVAL_DOCUMENT task type
    // from callGeminiEmbedding — Gemini's docs recommend RETRIEVAL_QUERY for
    // the query side, but in practice the embeddings interoperate well and
    // keeping one task type simplifies the client. Swap if we see quality loss.
    const [queryEmbedding] = await callGeminiEmbedding(query);
    const vecLiteral = `[${queryEmbedding.join(",")}]`;

    const results: Record<string, unknown[]> = {};

    // Run each source in parallel. Service role client bypasses RLS so we
    // can filter by property_id / client_user_id ourselves.
    await Promise.all(
      sources.map(async (source: string) => {
        try {
          switch (source) {
            case "report_pages": {
              const { data, error } = await (auth.adminSupabase as any).rpc("match_report_pages", {
                query_embedding: vecLiteral,
                match_count,
                filter_property_id: filter.property_id ?? null,
                filter_client_user_id: filter.client_user_id ?? null,
                published_only: true,
                min_similarity: 0.7,
              });
              if (error) throw error;
              results.report_pages = data || [];
              break;
            }
            case "knowledge_templates": {
              const { data, error } = await (auth.adminSupabase as any).rpc("match_knowledge_templates", {
                query_embedding: vecLiteral,
                match_count,
                filter_category: filter.category ?? null,
                min_similarity: 0.6,
              });
              if (error) throw error;
              results.knowledge_templates = data || [];
              break;
            }
            case "home_knowledge_base": {
              const { data, error } = await (auth.adminSupabase as any).rpc("match_home_knowledge", {
                query_embedding: vecLiteral,
                match_count,
                filter_client_id: filter.client_user_id ?? null,
                filter_current_only: true,
                min_similarity: 0.65,
              });
              if (error) throw error;
              results.home_knowledge_base = data || [];
              break;
            }
            case "agent_memory": {
              const { data, error } = await (auth.adminSupabase as any).rpc("match_agent_memory", {
                query_embedding: vecLiteral,
                match_count,
                filter_creator_user_id: auth.user.id,
                filter_property_id: filter.property_id ?? null,
                filter_memory_type: filter.memory_type ?? null,
                min_similarity: 0.65,
              });
              if (error) throw error;
              results.agent_memory = data || [];
              break;
            }
            default:
              results[source] = [];
          }
        } catch (e) {
          // Per-source failure should degrade gracefully — other sources
          // still return. Log, return empty array, keep going.
          console.error(`retrieve-similar: ${source} failed:`, e);
          results[source] = [];
        }
      }),
    );

    return json({ ok: true, query, results });
  } catch (e) {
    console.error("retrieve-similar error:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown" }, { status: 500 });
  }
});
