-- Migration: Common Functions and Utilities
-- Version: 20240113_003
-- Description: Common utility functions for semantic search, test data, and shared functionality
-- Location: common (public schema with alphab_ prefix)
-- Depends: alphab global schema, particle0 schema

-- =============================================================================
-- SEMANTIC SEARCH FUNCTIONS (with alphab_ prefix)
-- =============================================================================

-- Function for semantic similarity search
CREATE OR REPLACE FUNCTION alphab_search_similar_artifacts(
  p_vault_id UUID,
  p_query_embedding vector(1536),
  p_similarity_threshold FLOAT DEFAULT 0.8,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  type TEXT,
  similarity FLOAT,
  content_jsonb JSONB,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.name,
    a.type,
    1 - (a.embedding <=> p_query_embedding) as similarity,
    a.content_jsonb,
    a.created_at
  FROM public.alphab_artifacts a
  WHERE a.vault_id = p_vault_id
    AND a.embedding IS NOT NULL
    AND a.deleted_at IS NULL
    AND 1 - (a.embedding <=> p_query_embedding) >= p_similarity_threshold
  ORDER BY a.embedding <=> p_query_embedding
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for fast similarity search using smaller embeddings
CREATE OR REPLACE FUNCTION alphab_search_similar_artifacts_fast(
  p_vault_id UUID,
  p_query_embedding vector(384),
  p_similarity_threshold FLOAT DEFAULT 0.8,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  type TEXT,
  similarity FLOAT,
  content_jsonb JSONB,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.name,
    a.type,
    1 - (a.embedding_small <=> p_query_embedding) as similarity,
    a.content_jsonb,
    a.created_at
  FROM public.alphab_artifacts a
  WHERE a.vault_id = p_vault_id
    AND a.embedding_small IS NOT NULL
    AND a.deleted_at IS NULL
    AND 1 - (a.embedding_small <=> p_query_embedding) >= p_similarity_threshold
  ORDER BY a.embedding_small <=> p_query_embedding
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to find duplicate content using embeddings
CREATE OR REPLACE FUNCTION alphab_find_duplicate_artifacts(
  p_vault_id UUID,
  p_similarity_threshold FLOAT DEFAULT 0.95
)
RETURNS TABLE (
  artifact1_id UUID,
  artifact1_name TEXT,
  artifact2_id UUID,
  artifact2_name TEXT,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a1.id as artifact1_id,
    a1.name as artifact1_name,
    a2.id as artifact2_id,
    a2.name as artifact2_name,
    1 - (a1.embedding <=> a2.embedding) as similarity
  FROM public.alphab_artifacts a1
  JOIN public.alphab_artifacts a2 ON a1.id < a2.id  -- Avoid duplicate pairs
  WHERE a1.vault_id = p_vault_id
    AND a2.vault_id = p_vault_id
    AND a1.embedding IS NOT NULL
    AND a2.embedding IS NOT NULL
    AND a1.deleted_at IS NULL
    AND a2.deleted_at IS NULL
    AND 1 - (a1.embedding <=> a2.embedding) >= p_similarity_threshold
  ORDER BY similarity DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- TEST DATA UTILITIES (with alphab_ prefix)
-- =============================================================================

-- Function to create test user
CREATE OR REPLACE FUNCTION alphab_create_test_user(
  p_email TEXT,
  p_name TEXT DEFAULT 'Test User'
)
RETURNS UUID AS $$
DECLARE
  user_id UUID;
BEGIN
  INSERT INTO public.alphab_users (email, name, status)
  VALUES (p_email, p_name, 'active')
  RETURNING id INTO user_id;

  RETURN user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create test vault
CREATE OR REPLACE FUNCTION alphab_create_test_vault(
  p_owner_id UUID,
  p_name TEXT DEFAULT 'Test Vault',
  p_is_public BOOLEAN DEFAULT false
)
RETURNS UUID AS $$
DECLARE
  vault_id UUID;
BEGIN
  INSERT INTO public.alphab_vaults (owner_id, name, is_public, status)
  VALUES (p_owner_id, p_name, p_is_public, 'active')
  RETURNING id INTO vault_id;

  RETURN vault_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create test artifact
CREATE OR REPLACE FUNCTION alphab_create_test_artifact(
  p_vault_id UUID,
  p_created_by UUID,
  p_name TEXT DEFAULT 'Test Artifact',
  p_content TEXT DEFAULT 'Test content'
)
RETURNS UUID AS $$
DECLARE
  artifact_id UUID;
BEGIN
  INSERT INTO public.alphab_artifacts (vault_id, created_by, name, content, type, processing_status, status)
  VALUES (p_vault_id, p_created_by, p_name, p_content, 'text', 'completed', 'active')
  RETURNING id INTO artifact_id;

  RETURN artifact_id;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up test data
CREATE OR REPLACE FUNCTION alphab_cleanup_test_data()
RETURNS VOID AS $$
BEGIN
  -- Delete test artifacts
  DELETE FROM public.alphab_artifacts WHERE name LIKE 'Test%' OR name LIKE '%test%';

  -- Delete test vaults
  DELETE FROM public.alphab_vaults WHERE name LIKE 'Test%' OR name LIKE '%test%';

  -- Delete test users (be careful with this)
  DELETE FROM public.alphab_users WHERE email LIKE '%test%' OR email LIKE '%example%';

  -- Clean up audit logs for deleted records
  DELETE FROM public.alphab_audit_logs WHERE created_at < NOW() - INTERVAL '1 day' AND table_name LIKE '%test%';
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- UTILITY FUNCTIONS (with alphab_ prefix)
-- =============================================================================

-- Function to get database statistics
CREATE OR REPLACE FUNCTION alphab_get_database_stats()
RETURNS TABLE (
  table_name TEXT,
  row_count BIGINT,
  size_bytes BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    schemaname||'.'||tablename as table_name,
    n_tup_ins - n_tup_del as row_count,
    pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
  FROM pg_stat_user_tables
  WHERE schemaname = 'public' AND tablename LIKE 'alphab_%'
  ORDER BY size_bytes DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to analyze vault content
CREATE OR REPLACE FUNCTION alphab_analyze_vault_content(p_vault_id UUID)
RETURNS TABLE (
  total_artifacts BIGINT,
  total_size_bytes BIGINT,
  content_types JSONB,
  processing_status_counts JSONB,
  created_date_range JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) as total_artifacts,
    COALESCE(SUM(file_size), 0) as total_size_bytes,
    jsonb_object_agg(type, type_count) as content_types,
    jsonb_object_agg(processing_status, status_count) as processing_status_counts,
    jsonb_build_object(
      'earliest', MIN(created_at),
      'latest', MAX(created_at)
    ) as created_date_range
  FROM (
    SELECT
      type,
      processing_status,
      file_size,
      created_at,
      COUNT(*) OVER (PARTITION BY type) as type_count,
      COUNT(*) OVER (PARTITION BY processing_status) as status_count
    FROM public.alphab_artifacts
    WHERE vault_id = p_vault_id
      AND deleted_at IS NULL
  ) stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON FUNCTION alphab_search_similar_artifacts(UUID, vector, FLOAT, INTEGER) IS 'Search for semantically similar artifacts using high-dimensional embeddings';
COMMENT ON FUNCTION alphab_search_similar_artifacts_fast(UUID, vector, FLOAT, INTEGER) IS 'Fast semantic search using smaller embeddings';
COMMENT ON FUNCTION alphab_find_duplicate_artifacts(UUID, FLOAT) IS 'Find potential duplicate artifacts based on embedding similarity';
COMMENT ON FUNCTION alphab_create_test_user(TEXT, TEXT) IS 'Create a test user for development and testing';
COMMENT ON FUNCTION alphab_create_test_vault(UUID, TEXT, BOOLEAN) IS 'Create a test vault for development and testing';
COMMENT ON FUNCTION alphab_create_test_artifact(UUID, UUID, TEXT, TEXT) IS 'Create a test artifact for development and testing';
COMMENT ON FUNCTION alphab_cleanup_test_data() IS 'Clean up all test data from the database';
COMMENT ON FUNCTION alphab_get_database_stats() IS 'Get statistics about database tables and sizes';
COMMENT ON FUNCTION alphab_analyze_vault_content(UUID) IS 'Analyze content statistics for a specific vault';
