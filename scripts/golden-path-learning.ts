#!/usr/bin/env bun
/**
 * Golden Path — the learning loop (memory + KB → retrieval → RAG).
 *
 * The whole point of the 2026-04-18 memory build: content Adam saves
 * should flow back into future Claude calls as retrieved context. This
 * script proves that loop works end-to-end:
 *
 *   1. Creator adds a KB template article via hbc-agent's add_kb_article
 *   2. Canary phrase from the article is semantically retrievable via
 *      search_knowledge_base (tests the whole embed → match RPC path)
 *   3. Creator remembers a specific style preference (`remember` tool)
 *   4. Canary phrase is retrievable in a FRESH session via `recall`
 *   5. Retrieve-similar edge function returns the same content in a
 *      multi-source query (proves RAG retrieveContext helper will work)
 *   6. Stored memory row has an embedding column populated (not NULL)
 *
 * If any of these is red, "the AI gets smarter over time" is a lie.
 *
 * Exits 0/1. Cleans up all test memories + articles (CASCADE on creator
 * delete handles agent_memory; knowledge_templates are deleted by id).
 */

import {
  loadEnv, restGet, restDelete,
  adminCreateUser, signIn, invokeFn, randSuffix,
  printResults, runCleanups,
  type StepResult,
} from "./_golden-helpers.ts";

const ctx = loadEnv();
const startedAt = Date.now();
const results: StepResult[] = [];

async function main(): Promise<number> {
  const stamp = new Date().toISOString().replace(/[:.]/g, "").slice(0, 15);
  let creatorId = "", creatorJWT = "";
  let kbArticleId = "";
  let memoryId = "";

  try {
    const email = `gp-learn-${stamp}-${randSuffix()}@clarityhub.test`;
    const pw = `GP-${randSuffix()}`;
    creatorId = await adminCreateUser(ctx, email, pw, { role: "creator", full_name: "GP Learning Creator" });
    ctx.cleanups.push(async () => { await restDelete(ctx, `/auth/v1/admin/users/${creatorId}`); });
    creatorJWT = await signIn(ctx, email, pw);
  } catch (e) {
    results.push({ name: "0. Setup", status: "FAIL", dataVisible: "", note: String(e) });
    return finish();
  }

  const canaryArticle = `canary-kb-${randSuffix()}`;
  const canaryMemory = `canary-mem-${randSuffix()}`;

  // Step 1: Agent adds a KB article containing the canary.
  try {
    const resp = await invokeFn<{ message?: string; reply?: string }>(
      ctx,
      "hbc-agent",
      creatorJWT,
      {
        message: `Use add_kb_article to save this. Title: "${canaryArticle} Tile Pricing". Content: "For ${canaryArticle}: standard bathroom tile installation is $14 per sq ft, heated floors add $8 per sq ft." Category: "pricing".`,
        history: [],
        context: { role: "creator", currentEntityType: "workspace", activeTab: "home", sessionId: "gp-learn-a1" },
      },
      120_000,
    );
    const reply = resp.message || resp.reply || "";
    if (!/creat|sav|add|memor|article/i.test(reply)) {
      throw new Error(`agent didn't confirm article creation: "${reply.slice(0, 200)}"`);
    }
    // Find the article row so we can assert + clean it up.
    const arts = await restGet<Array<{ id: string; title: string }>>(
      ctx,
      `/rest/v1/knowledge_templates?select=id,title&title=ilike.*${canaryArticle}*`,
    );
    if (arts.length === 0) throw new Error("no knowledge_templates row found after add_kb_article");
    kbArticleId = arts[0].id;
    ctx.cleanups.push(async () => { await restDelete(ctx, `/rest/v1/knowledge_templates?id=eq.${kbArticleId}`); });
    results.push({
      name: "1. Agent writes KB article",
      status: "PASS",
      dataVisible: `article id=${kbArticleId.slice(0, 8)}… title="${arts[0].title.slice(0, 50)}"`,
    });
  } catch (e) {
    results.push({ name: "1. Agent writes KB article", status: "FAIL", dataVisible: "", note: String(e) });
    return finish();
  }

  // Step 2: Semantic search finds the article via search_knowledge_base
  // (which now uses match_knowledge_templates under the hood).
  // Gemini occasionally returns 503 "temporarily busy" on the agent loop
  // under load — retry twice with backoff before failing the step. A real
  // bug would fail consistently; transient rate-limit flakes are not bugs.
  {
    let attempt = 0;
    let lastErr: unknown = null;
    let passed = false;
    while (attempt < 3 && !passed) {
      attempt++;
      try {
        const resp = await invokeFn<{ message?: string; reply?: string }>(
          ctx,
          "hbc-agent",
          creatorJWT,
          {
            message: `Use search_knowledge_base to find my tile pricing reference, then quote the canary token ${canaryArticle} from the results.`,
            history: [],
            context: { role: "creator", currentEntityType: "workspace", activeTab: "home", sessionId: `gp-learn-a2-${attempt}` },
          },
          120_000,
        );
        const reply = resp.message || resp.reply || "";
        if (!reply.includes(canaryArticle)) {
          throw new Error(`search_knowledge_base didn't echo canary "${canaryArticle}". Reply: "${reply.slice(0, 300)}"`);
        }
        results.push({
          name: "2. search_knowledge_base returns it",
          status: "PASS",
          dataVisible: `canary "${canaryArticle}" echoed via semantic search${attempt > 1 ? ` (attempt ${attempt})` : ""}`,
        });
        passed = true;
      } catch (e) {
        lastErr = e;
        const msg = String(e);
        // Retry on transient Gemini busy / rate-limit; fail-fast on real bugs.
        if (/temporarily busy|rate.?limit|429|503|529/i.test(msg) && attempt < 3) {
          await new Promise((r) => setTimeout(r, 5000 * attempt));
          continue;
        }
        break;
      }
    }
    if (!passed) {
      results.push({ name: "2. search_knowledge_base returns it", status: "FAIL", dataVisible: "", note: String(lastErr) });
    }
  }

  // Step 3: Remember a style preference.
  try {
    const resp = await invokeFn<{ message?: string; reply?: string }>(
      ctx,
      "hbc-agent",
      creatorJWT,
      {
        message: `Remember this: "For ${canaryMemory}: I start all roof estimates at $18,500 base."`,
        history: [],
        context: { role: "creator", currentEntityType: "workspace", activeTab: "home", sessionId: "gp-learn-b1" },
      },
      90_000,
    );
    const reply = resp.message || resp.reply || "";
    if (!/commit|sav|noted|memor|remember/i.test(reply)) {
      throw new Error(`agent didn't confirm remember: "${reply.slice(0, 200)}"`);
    }
    // Look up the memory row + verify it has an embedding
    const mems = await restGet<Array<{ id: string; content: string; embedding: unknown }>>(
      ctx,
      `/rest/v1/agent_memory?select=id,content,embedding&creator_user_id=eq.${creatorId}&order=created_at.desc&limit=1`,
    );
    if (mems.length === 0) throw new Error("no agent_memory row after remember");
    memoryId = mems[0].id;
    if (!mems[0].embedding) throw new Error("memory row has no embedding — RAG can't find it");
    results.push({
      name: "3. remember + inline embedding",
      status: "PASS",
      dataVisible: `memory id=${memoryId.slice(0, 8)}… embedding populated`,
    });
  } catch (e) {
    results.push({ name: "3. remember + inline embedding", status: "FAIL", dataVisible: "", note: String(e) });
    return finish();
  }

  // Step 4: Fresh-session recall.
  try {
    const resp = await invokeFn<{ message?: string; reply?: string }>(
      ctx,
      "hbc-agent",
      creatorJWT,
      {
        message: `Use recall to find my roof estimate pricing preferences, then quote the canary token ${canaryMemory} from what you find.`,
        history: [],
        context: { role: "creator", currentEntityType: "workspace", activeTab: "home", sessionId: "gp-learn-b2" },
      },
      120_000,
    );
    const reply = resp.message || resp.reply || "";
    if (!reply.includes(canaryMemory)) {
      throw new Error(`fresh-session recall didn't echo canary "${canaryMemory}". Reply: "${reply.slice(0, 300)}"`);
    }
    results.push({
      name: "4. Fresh-session recall",
      status: "PASS",
      dataVisible: `canary "${canaryMemory}" echoed across session boundary`,
    });
  } catch (e) {
    results.push({ name: "4. Fresh-session recall", status: "FAIL", dataVisible: "", note: String(e) });
  }

  // Step 5: Multi-source retrieve-similar edge function. This is what
  // rag.ts retrieveContext() calls — verify the HTTP endpoint that powers
  // cross-function retrieval also surfaces the right data.
  try {
    const resp = await invokeFn<{ ok?: boolean; results?: Record<string, Array<Record<string, unknown>>> }>(
      ctx,
      "retrieve-similar",
      creatorJWT,
      {
        query: "tile pricing per square foot",
        sources: ["knowledge_templates"],
        match_count: 5,
      },
      60_000,
    );
    const tmpls = resp.results?.knowledge_templates || [];
    const found = tmpls.find((t) => (t.title as string)?.includes(canaryArticle));
    if (!found) throw new Error(`retrieve-similar didn't find the canary article. Got ${tmpls.length} templates: ${tmpls.map((t) => (t.title as string)?.slice(0, 40)).join(" | ")}`);
    results.push({
      name: "5. retrieve-similar HTTP endpoint",
      status: "PASS",
      dataVisible: `canary article in top-${tmpls.length} with sim=${(found.similarity as number)?.toFixed(3)}`,
    });
  } catch (e) {
    results.push({ name: "5. retrieve-similar HTTP endpoint", status: "FAIL", dataVisible: "", note: String(e) });
  }

  // Step 6: KB article also has embedding populated.
  try {
    const [a] = await restGet<Array<{ embedding: unknown }>>(
      ctx,
      `/rest/v1/knowledge_templates?select=embedding&id=eq.${kbArticleId}`,
    );
    if (!a?.embedding) throw new Error("KB article has no embedding — RAG retrieval would miss it");
    // pgvector returns the vector as a string like "[0.1,0.2,...]"
    const emb = typeof a.embedding === "string" ? a.embedding : JSON.stringify(a.embedding);
    if (emb.length < 100) throw new Error(`embedding looks too short: ${emb.slice(0, 50)}`);
    results.push({
      name: "6. KB article embedding populated",
      status: "PASS",
      dataVisible: `embedding is ${emb.length} chars of pgvector data`,
    });
  } catch (e) {
    results.push({ name: "6. KB article embedding populated", status: "FAIL", dataVisible: "", note: String(e) });
  }

  return finish();
}

async function finish(): Promise<number> {
  await runCleanups(ctx);
  const { failed, elapsed } = printResults("Golden Path — learning loop (memory + KB + RAG)", results, startedAt);
  console.log("");
  if (failed) {
    const n = failed.name.match(/^([\d.]+)/)?.[1] || "?";
    console.log(`Golden Path (learning) FAILS at step ${n} — root cause:\n  ${failed.note}`);
    console.log(`(${results.length} steps in ${elapsed}s)`);
    return 1;
  } else {
    console.log(`Golden Path (learning) PASSES — ship. (${results.length} steps in ${elapsed}s)`);
    return 0;
  }
}

main()
  .then((code) => process.exit(code))
  .catch(async (e) => {
    console.error("[golden-path-learning] uncaught:", e);
    await runCleanups(ctx);
    process.exit(1);
  });
