-- ============================================================================
-- AI CFO Chat Tables
-- 
-- Tables for Coach Martin AI assistant feature:
-- 1. ai_chat_usage - Track usage per user for rate limiting
-- 2. knowledge_embeddings - Vector store for RAG (requires pgvector)
-- ============================================================================

-- Enable pgvector extension for embeddings (if not already enabled)
-- Note: This requires the pgvector extension to be available on the database
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- AI Chat Usage Tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_chat_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Usage counters (reset monthly)
  question_count INTEGER NOT NULL DEFAULT 0,
  token_count INTEGER NOT NULL DEFAULT 0,
  
  -- Billing period
  period_start TIMESTAMPTZ NOT NULL DEFAULT date_trunc('month', NOW()),
  period_end TIMESTAMPTZ NOT NULL DEFAULT date_trunc('month', NOW()) + INTERVAL '1 month',
  
  -- Timestamps
  last_question_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- One record per user per billing period
  UNIQUE(user_id, period_start)
);

-- Index for quick lookups
CREATE INDEX idx_ai_chat_usage_user_period ON ai_chat_usage(user_id, period_start);
CREATE INDEX idx_ai_chat_usage_company ON ai_chat_usage(company_id);

-- RLS Policies
ALTER TABLE ai_chat_usage ENABLE ROW LEVEL SECURITY;

-- Users can read their own usage
CREATE POLICY "Users can view own AI usage"
  ON ai_chat_usage FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert/update their own usage (via edge function)
CREATE POLICY "Users can update own AI usage"
  ON ai_chat_usage FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================================
-- Knowledge Embeddings (for RAG)
-- ============================================================================

CREATE TABLE IF NOT EXISTS knowledge_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Document reference
  document_id TEXT NOT NULL,  -- e.g., 'warning-signs', 'underbilling'
  document_title TEXT NOT NULL,
  document_section TEXT NOT NULL,  -- e.g., 'Reading the WIP'
  
  -- Chunk info
  chunk_index INTEGER NOT NULL DEFAULT 0,
  content TEXT NOT NULL,
  
  -- Vector embedding (1536 dimensions for OpenAI, adjust for other providers)
  embedding vector(1536),
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(document_id, chunk_index)
);

-- Index for vector similarity search
CREATE INDEX idx_knowledge_embeddings_embedding ON knowledge_embeddings 
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Index for document lookups
CREATE INDEX idx_knowledge_embeddings_document ON knowledge_embeddings(document_id);

-- RLS Policies (knowledge is public read, admin write)
ALTER TABLE knowledge_embeddings ENABLE ROW LEVEL SECURITY;

-- Anyone can read knowledge (it's educational content)
CREATE POLICY "Knowledge is publicly readable"
  ON knowledge_embeddings FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- Helper function to search knowledge by similarity
-- ============================================================================

CREATE OR REPLACE FUNCTION search_knowledge(
  query_embedding vector(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  document_id TEXT,
  document_title TEXT,
  document_section TEXT,
  content TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ke.id,
    ke.document_id,
    ke.document_title,
    ke.document_section,
    ke.content,
    1 - (ke.embedding <=> query_embedding) AS similarity
  FROM knowledge_embeddings ke
  WHERE 1 - (ke.embedding <=> query_embedding) > match_threshold
  ORDER BY ke.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ============================================================================
-- Updated_at trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ai_chat_usage_updated_at
  BEFORE UPDATE ON ai_chat_usage
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_knowledge_embeddings_updated_at
  BEFORE UPDATE ON knowledge_embeddings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE ai_chat_usage IS 'Tracks AI CFO chat usage per user for rate limiting and billing';
COMMENT ON TABLE knowledge_embeddings IS 'Vector embeddings of WIP CFO knowledge base for RAG retrieval';
COMMENT ON FUNCTION search_knowledge IS 'Semantic search for relevant knowledge chunks using cosine similarity';
