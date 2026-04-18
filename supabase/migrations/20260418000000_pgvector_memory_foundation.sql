-- Memory foundation: pgvector + embedding columns + agent_memory table.
--
-- Before this migration, "memory and learning" was mostly unbuilt:
-- - home_knowledge_base (per-client facts) existed but the agent never queried it
-- - knowledge_templates (report-writing templates) had no semantic search
-- - report_pages were never referenced by future reports
-- - hbc-agent had no persistent memory across sessions
--
-- This migration lays the foundation for retrieval-augmented generation:
-- - pgvector extension enabled
-- - embedding vector(768) added to report_pages, knowledge_templates, home_knowledge_base
--   (768-dim matches Gemini text-embedding-004)
-- - agent_memory table for persistent per-creator / per-property notes the
--   agent can store ("remember") and pull back ("recall") across sessions
-- - match_report_pages() / match_knowledge_templates() / match_home_knowledge() /
--   match_agent_memory() RPCs for cosine-similarity search
--
-- Embeddings are not backfilled by this migration — the embed-content edge
-- function + a scripted backfill handle that separately so this migration
-- stays fast and reversible.

CREATE EXTENSION IF NOT EXISTS vector;

-- ── 1. Add embedding columns to existing content tables ──────────────────

ALTER TABLE public.report_pages
  ADD COLUMN IF NOT EXISTS embedding vector(768);

ALTER TABLE public.knowledge_templates
  ADD COLUMN IF NOT EXISTS embedding vector(768);

ALTER TABLE public.home_knowledge_base
  ADD COLUMN IF NOT EXISTS embedding vector(768);

-- IVFFlat indexes. Lists=100 is fine up to ~50k rows per table; raise later
-- if the corpus grows substantially.
CREATE INDEX IF NOT EXISTS report_pages_embedding_idx
  ON public.report_pages USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX IF NOT EXISTS knowledge_templates_embedding_idx
  ON public.knowledge_templates USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX IF NOT EXISTS home_knowledge_base_embedding_idx
  ON public.home_knowledge_base USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ── 2. Agent memory table (persistent notes the agent can recall) ────────

CREATE TABLE IF NOT EXISTS public.agent_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- WHO this memory belongs to. creator_user_id is the admin who owns the
  -- memory — it's always set. property_id is optional: when present, the
  -- memory is scoped to that specific client (Bobby remembers Sarah's home
  -- separately from the Johnsons). When null, the memory is workspace-wide
  -- (e.g. "I charge $12/sq ft for basic bathroom tile").
  creator_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,

  -- WHAT kind of memory. Examples:
  --   'scope_style'      — "I charge $X/sq ft for tile"
  --   'client_context'   — "Sarah is concerned about basement moisture"
  --   'past_decision'    — "Decided to skip radon testing — unfinished basement"
  --   'system_fact'      — "HVAC is a 2018 Trane XV20i"
  --   'style_preference' — "Adam writes in 2nd person, avoids passive voice"
  --   'template_seed'    — "This is how I usually phrase roof scopes"
  memory_type text NOT NULL,

  content text NOT NULL,
  embedding vector(768),

  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,

  created_at timestamptz NOT NULL DEFAULT now(),
  last_accessed_at timestamptz NOT NULL DEFAULT now(),
  access_count integer NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS agent_memory_creator_idx
  ON public.agent_memory (creator_user_id);

CREATE INDEX IF NOT EXISTS agent_memory_property_idx
  ON public.agent_memory (property_id)
  WHERE property_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS agent_memory_type_idx
  ON public.agent_memory (memory_type);

CREATE INDEX IF NOT EXISTS agent_memory_embedding_idx
  ON public.agent_memory USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- RLS: creators read/write their own memories. Clients never touch this table.
ALTER TABLE public.agent_memory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Creators read own agent_memory" ON public.agent_memory;
CREATE POLICY "Creators read own agent_memory"
  ON public.agent_memory FOR SELECT
  USING (creator_user_id = auth.uid());

DROP POLICY IF EXISTS "Creators write own agent_memory" ON public.agent_memory;
CREATE POLICY "Creators write own agent_memory"
  ON public.agent_memory FOR INSERT
  WITH CHECK (creator_user_id = auth.uid());

DROP POLICY IF EXISTS "Creators update own agent_memory" ON public.agent_memory;
CREATE POLICY "Creators update own agent_memory"
  ON public.agent_memory FOR UPDATE
  USING (creator_user_id = auth.uid());

DROP POLICY IF EXISTS "Creators delete own agent_memory" ON public.agent_memory;
CREATE POLICY "Creators delete own agent_memory"
  ON public.agent_memory FOR DELETE
  USING (creator_user_id = auth.uid());

-- ── 3. Similarity search RPCs ────────────────────────────────────────────
-- All RPCs run as SECURITY INVOKER (the default), so RLS on the underlying
-- tables is still enforced. When called with the service role (from edge
-- functions), RLS is bypassed and the filter_* params scope the search.

-- Match report_pages by semantic similarity. Scope optionally by property
-- (e.g. "pages for THIS client") or globally (no filter).
CREATE OR REPLACE FUNCTION public.match_report_pages(
  query_embedding vector(768),
  match_count int DEFAULT 5,
  filter_property_id uuid DEFAULT NULL,
  filter_client_user_id uuid DEFAULT NULL,
  published_only boolean DEFAULT true,
  min_similarity float DEFAULT 0.7
)
RETURNS TABLE (
  id uuid,
  report_id uuid,
  page_key text,
  title text,
  group_name text,
  narrative jsonb,
  specs jsonb,
  tiers jsonb,
  condition_rating text,
  property_id uuid,
  similarity float
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    rp.id,
    rp.report_id,
    rp.page_key,
    rp.title,
    rp.group_name,
    rp.narrative,
    rp.specs,
    rp.tiers,
    rp.condition_rating,
    p.id AS property_id,
    1 - (rp.embedding <=> query_embedding) AS similarity
  FROM public.report_pages rp
  JOIN public.reports r ON r.id = rp.report_id
  JOIN public.properties p ON p.id = r.property_id
  WHERE rp.embedding IS NOT NULL
    AND (NOT published_only OR rp.status = 'published')
    AND (filter_property_id IS NULL OR p.id = filter_property_id)
    AND (filter_client_user_id IS NULL OR p.client_user_id = filter_client_user_id)
    AND 1 - (rp.embedding <=> query_embedding) >= min_similarity
  ORDER BY rp.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Match knowledge_templates (Adam's own scope / pricing / system templates).
CREATE OR REPLACE FUNCTION public.match_knowledge_templates(
  query_embedding vector(768),
  match_count int DEFAULT 5,
  filter_category text DEFAULT NULL,
  min_similarity float DEFAULT 0.6
)
RETURNS TABLE (
  id uuid,
  category text,
  title text,
  content jsonb,
  region text,
  similarity float
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    kt.id,
    kt.category,
    kt.title,
    kt.content,
    kt.region,
    1 - (kt.embedding <=> query_embedding) AS similarity
  FROM public.knowledge_templates kt
  WHERE kt.embedding IS NOT NULL
    AND (filter_category IS NULL OR kt.category = filter_category)
    AND 1 - (kt.embedding <=> query_embedding) >= min_similarity
  ORDER BY kt.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Match home_knowledge_base (per-client facts captured during intake/walkthroughs).
CREATE OR REPLACE FUNCTION public.match_home_knowledge(
  query_embedding vector(768),
  match_count int DEFAULT 5,
  filter_client_id uuid DEFAULT NULL,
  filter_current_only boolean DEFAULT true,
  min_similarity float DEFAULT 0.65
)
RETURNS TABLE (
  id uuid,
  client_id uuid,
  knowledge_type text,
  subject text,
  content text,
  confidence text,
  similarity float
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    hkb.id,
    hkb.client_id,
    hkb.knowledge_type,
    hkb.subject,
    hkb.content,
    hkb.confidence,
    1 - (hkb.embedding <=> query_embedding) AS similarity
  FROM public.home_knowledge_base hkb
  WHERE hkb.embedding IS NOT NULL
    AND (filter_client_id IS NULL OR hkb.client_id = filter_client_id)
    AND (NOT filter_current_only OR hkb.is_current = true)
    AND 1 - (hkb.embedding <=> query_embedding) >= min_similarity
  ORDER BY hkb.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Match agent_memory by semantic similarity. Bumps access telemetry as a
-- side effect so future work can surface frequently-used memories.
CREATE OR REPLACE FUNCTION public.match_agent_memory(
  query_embedding vector(768),
  match_count int DEFAULT 5,
  filter_creator_user_id uuid DEFAULT NULL,
  filter_property_id uuid DEFAULT NULL,
  filter_memory_type text DEFAULT NULL,
  min_similarity float DEFAULT 0.65
)
RETURNS TABLE (
  id uuid,
  memory_type text,
  content text,
  metadata jsonb,
  created_at timestamptz,
  similarity float
)
LANGUAGE plpgsql
AS $$
DECLARE
  matched_ids uuid[];
BEGIN
  -- Note: aliases `match_id` + `am.` qualifier are required here — plain
  -- `id` is ambiguous inside plpgsql RETURNS TABLE functions because the
  -- RETURNS-TABLE columns shadow am.id.
  SELECT array_agg(t.match_id) INTO matched_ids FROM (
    SELECT am.id AS match_id
    FROM public.agent_memory am
    WHERE am.embedding IS NOT NULL
      AND (filter_creator_user_id IS NULL OR am.creator_user_id = filter_creator_user_id)
      AND (filter_property_id IS NULL OR am.property_id = filter_property_id)
      AND (filter_memory_type IS NULL OR am.memory_type = filter_memory_type)
      AND 1 - (am.embedding <=> query_embedding) >= min_similarity
    ORDER BY am.embedding <=> query_embedding
    LIMIT match_count
  ) t;

  IF matched_ids IS NOT NULL THEN
    UPDATE public.agent_memory am
      SET last_accessed_at = now(), access_count = am.access_count + 1
      WHERE am.id = ANY(matched_ids);
  END IF;

  RETURN QUERY
    SELECT
      am.id,
      am.memory_type,
      am.content,
      am.metadata,
      am.created_at,
      (1 - (am.embedding <=> query_embedding))::float AS similarity
    FROM public.agent_memory am
    WHERE am.id = ANY(matched_ids)
    ORDER BY am.embedding <=> query_embedding;
END;
$$;

GRANT EXECUTE ON FUNCTION public.match_report_pages(vector, int, uuid, uuid, boolean, float) TO authenticated;
GRANT EXECUTE ON FUNCTION public.match_knowledge_templates(vector, int, text, float) TO authenticated;
GRANT EXECUTE ON FUNCTION public.match_home_knowledge(vector, int, uuid, boolean, float) TO authenticated;
GRANT EXECUTE ON FUNCTION public.match_agent_memory(vector, int, uuid, uuid, text, float) TO authenticated;
