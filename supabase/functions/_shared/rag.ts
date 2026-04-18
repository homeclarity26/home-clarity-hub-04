// Retrieval helpers for RAG-augmented generation.
//
// Call retrieveContext() at the top of any function that writes long-form
// content (report pages, scopes, proposals, annual reviews). It embeds the
// query, pulls the top-K matches from report_pages / knowledge_templates /
// home_knowledge_base / agent_memory, and formats them into a single prompt
// block that's ready to paste into a Claude/Gemini call's `cacheableContext`
// argument.
//
// Typical usage in an edge function:
//
//   import { retrieveContext } from "../_shared/rag.ts";
//   const ctx = await retrieveContext({
//     query: `${propertyType} ${system} ${notes}`,
//     adminSupabase,
//     creatorUserId: auth.user.id,
//     propertyId: body.property_id,
//     sources: ["report_pages", "knowledge_templates", "agent_memory"],
//     perSource: 3,
//   });
//   const text = await callClaude({
//     system: "You write Home Clarity Hub report pages in Adam's voice.",
//     cacheableContext: ctx,  // ← Claude caches this long block
//     prompt: `Draft the ${system} page from these notes:\n${notes}`,
//   });

import { callGeminiEmbedding } from "./ai-client.ts";

type SourceName = "report_pages" | "knowledge_templates" | "home_knowledge_base" | "agent_memory";

export interface RetrieveContextOptions {
  /** Natural-language query describing what we're about to write. */
  query: string;
  /** Service-role supabase client (from auth helper). */
  adminSupabase: {
    rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown[] | null; error: unknown }>;
  };
  /** Required for agent_memory scoping. */
  creatorUserId: string;
  /** Scope to this client's past writings when provided. */
  propertyId?: string;
  /** Scope home_knowledge_base to this client user. */
  clientUserId?: string;
  /** Which sources to pull from. Defaults to all four. */
  sources?: SourceName[];
  /** Top-K per source. Default 3 keeps the context block from bloating. */
  perSource?: number;
}

/**
 * Retrieve + format past content relevant to `query`.
 * Returns a single prompt-ready string (empty string if no matches).
 */
export async function retrieveContext(opts: RetrieveContextOptions): Promise<string> {
  const sources: SourceName[] = opts.sources ?? [
    "report_pages",
    "knowledge_templates",
    "home_knowledge_base",
    "agent_memory",
  ];
  const perSource = opts.perSource ?? 3;

  // Embed the query once; reuse across all RPCs.
  let queryEmbedding: number[];
  try {
    const [vec] = await callGeminiEmbedding(opts.query);
    queryEmbedding = vec;
  } catch (e) {
    console.error("retrieveContext: embedding failed, returning empty context:", e);
    return "";
  }
  const vecLiteral = `[${queryEmbedding.join(",")}]`;

  const results: Record<string, Array<Record<string, unknown>>> = {};

  await Promise.all(sources.map(async (source) => {
    try {
      switch (source) {
        case "report_pages": {
          const { data } = await opts.adminSupabase.rpc("match_report_pages", {
            query_embedding: vecLiteral,
            match_count: perSource,
            filter_property_id: null,             // null = all pages across all clients
            filter_client_user_id: null,
            published_only: true,
            min_similarity: 0.7,
          });
          results.report_pages = (data as Array<Record<string, unknown>>) || [];
          break;
        }
        case "knowledge_templates": {
          const { data } = await opts.adminSupabase.rpc("match_knowledge_templates", {
            query_embedding: vecLiteral,
            match_count: perSource,
            filter_category: null,
            min_similarity: 0.6,
          });
          results.knowledge_templates = (data as Array<Record<string, unknown>>) || [];
          break;
        }
        case "home_knowledge_base": {
          const { data } = await opts.adminSupabase.rpc("match_home_knowledge", {
            query_embedding: vecLiteral,
            match_count: perSource,
            filter_client_id: opts.clientUserId ?? null,
            filter_current_only: true,
            min_similarity: 0.65,
          });
          results.home_knowledge_base = (data as Array<Record<string, unknown>>) || [];
          break;
        }
        case "agent_memory": {
          const { data } = await opts.adminSupabase.rpc("match_agent_memory", {
            query_embedding: vecLiteral,
            match_count: perSource,
            filter_creator_user_id: opts.creatorUserId,
            filter_property_id: opts.propertyId ?? null,
            filter_memory_type: null,
            min_similarity: 0.65,
          });
          results.agent_memory = (data as Array<Record<string, unknown>>) || [];
          break;
        }
      }
    } catch (e) {
      console.error(`retrieveContext: ${source} failed:`, e);
      results[source] = [];
    }
  }));

  // Format into a prompt-ready block. Empty string if nothing matched — the
  // caller should not paste an empty "HERE IS CONTEXT" header when there's
  // no context, because that confuses the model into fabricating.
  const chunks: string[] = [];

  if (results.agent_memory?.length) {
    chunks.push(
      "## What I know about this client and my own preferences\n" +
      results.agent_memory.map((m) =>
        `- [${m.memory_type}] ${m.content}`
      ).join("\n")
    );
  }

  if (results.home_knowledge_base?.length) {
    chunks.push(
      "## Facts recorded about this home\n" +
      results.home_knowledge_base.map((f) =>
        `- ${f.subject}: ${f.content}` + (f.confidence === "low" ? " (low confidence)" : "")
      ).join("\n")
    );
  }

  if (results.knowledge_templates?.length) {
    chunks.push(
      "## Relevant templates from my library\n" +
      results.knowledge_templates.map((t) => {
        const content = typeof t.content === "object" ? JSON.stringify(t.content) : String(t.content ?? "");
        return `### ${t.title} (${t.category})\n${content.slice(0, 800)}`;
      }).join("\n\n")
    );
  }

  if (results.report_pages?.length) {
    chunks.push(
      "## How I wrote this same topic in past published reports\n" +
      results.report_pages.map((p) => {
        const narr = typeof p.narrative === "object"
          ? JSON.stringify(p.narrative).slice(0, 600)
          : String(p.narrative ?? "").slice(0, 600);
        return `### ${p.title} — condition: ${p.condition_rating ?? "unrated"}\n${narr}`;
      }).join("\n\n")
    );
  }

  if (chunks.length === 0) return "";

  return "═════════════════════════════════════\n" +
    "RETRIEVED CONTEXT (from your own past writings + saved preferences)\n" +
    "═════════════════════════════════════\n\n" +
    chunks.join("\n\n") + "\n\n" +
    "═════════════════════════════════════\n" +
    "END OF RETRIEVED CONTEXT — now complete the task below using your voice, consistent with the above.\n" +
    "═════════════════════════════════════";
}
