
-- =============================================================================
-- MIGRATION: 20240113_001_global_schema
-- LOCATION: alphab (global)
-- FILE: /Users/alphab/Dev/LLM/DEV/alphab.mono.repo/packages/alphab-db-supabase/alphab/20240113_001_global_schema.sql
-- =============================================================================

-- Migration: Global Schema Setup
-- Version: 20240113_001
-- Description: Create global alphab schema with users, audit, and core infrastructure
-- Location: alphab (global)

-- Create the alphab schema for namespace isolation
CREATE SCHEMA IF NOT EXISTS alphab;

-- Grant usage on the schema to authenticated users
GRANT USAGE ON SCHEMA alphab TO authenticated;
GRANT USAGE ON SCHEMA alphab TO anon;

-- Grant create privileges to service role
GRANT CREATE ON SCHEMA alphab TO service_role;

-- Set default privileges for future tables in alphab schema
ALTER DEFAULT PRIVILEGES IN SCHEMA alphab GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA alphab GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA alphab GRANT ALL ON TABLES TO service_role;

-- Set default privileges for sequences
ALTER DEFAULT PRIVILEGES IN SCHEMA alphab GRANT USAGE, SELECT ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA alphab GRANT USAGE, SELECT ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA alphab GRANT ALL ON SEQUENCES TO service_role;

-- Set default privileges for functions
ALTER DEFAULT PRIVILEGES IN SCHEMA alphab GRANT EXECUTE ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA alphab GRANT EXECUTE ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA alphab GRANT ALL ON FUNCTIONS TO service_role;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- UTILITY FUNCTIONS
-- =============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION alphab.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to log audit changes
CREATE OR REPLACE FUNCTION alphab.log_audit_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO alphab.audit_logs (
      user_id, action, table_name, record_id, old_values, metadata
    ) VALUES (
      auth.uid(), 'DELETE', TG_TABLE_NAME, OLD.id, to_jsonb(OLD), '{}'::jsonb
    );
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO alphab.audit_logs (
      user_id, action, table_name, record_id, old_values, new_values, metadata
    ) VALUES (
      auth.uid(), 'UPDATE', TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW), '{}'::jsonb
    );
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO alphab.audit_logs (
      user_id, action, table_name, record_id, new_values, metadata
    ) VALUES (
      auth.uid(), 'INSERT', TG_TABLE_NAME, NEW.id, to_jsonb(NEW), '{}'::jsonb
    );
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get audit history
CREATE OR REPLACE FUNCTION alphab.get_audit_history(
  p_table_name TEXT,
  p_record_id UUID DEFAULT NULL,
  p_action TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  action TEXT,
  table_name TEXT,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    al.id,
    al.user_id,
    al.action,
    al.table_name,
    al.record_id,
    al.old_values,
    al.new_values,
    al.metadata,
    al.created_at
  FROM alphab.audit_logs al
  WHERE al.table_name = p_table_name
    AND (p_record_id IS NULL OR al.record_id = p_record_id)
    AND (p_action IS NULL OR al.action = p_action)
  ORDER BY al.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- GLOBAL TABLES
-- =============================================================================

-- Users table (global user data)
CREATE TABLE alphab.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Audit logs table
CREATE TABLE alphab.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES alphab.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migration log table to track applied migrations
CREATE TABLE alphab.migration_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  applied_by UUID REFERENCES alphab.users(id) ON DELETE SET NULL,
  checksum VARCHAR(64)
);

-- =============================================================================
-- INDEXES FOR GLOBAL TABLES
-- =============================================================================

-- Users indexes
CREATE INDEX idx_alphab_users_email ON alphab.users(email);
CREATE INDEX idx_alphab_users_status ON alphab.users(status) WHERE deleted_at IS NULL;

-- Audit logs indexes
CREATE INDEX idx_alphab_audit_user ON alphab.audit_logs(user_id);
CREATE INDEX idx_alphab_audit_table ON alphab.audit_logs(table_name);
CREATE INDEX idx_alphab_audit_record ON alphab.audit_logs(record_id);
CREATE INDEX idx_alphab_audit_created ON alphab.audit_logs(created_at);

-- =============================================================================
-- ROW LEVEL SECURITY FOR GLOBAL TABLES
-- =============================================================================

-- Enable RLS on global tables
ALTER TABLE alphab.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE alphab.audit_logs ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "users_read_own_data" ON alphab.users FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY "users_update_own_data" ON alphab.users FOR UPDATE USING (auth.uid()::text = id::text);

-- =============================================================================
-- TRIGGERS FOR GLOBAL TABLES
-- =============================================================================

-- Updated_at triggers
CREATE TRIGGER users_updated_at_trigger
  BEFORE UPDATE ON alphab.users
  FOR EACH ROW
  EXECUTE FUNCTION alphab.update_updated_at_column();

-- Audit triggers
CREATE TRIGGER audit_trigger_users
  AFTER INSERT OR UPDATE OR DELETE ON alphab.users
  FOR EACH ROW EXECUTE FUNCTION alphab.log_audit_changes();

-- =============================================================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON SCHEMA alphab IS 'Main schema for Alphab platform containing all core tables and functions';
COMMENT ON TABLE alphab.users IS 'Global user accounts for the Alphab platform';
COMMENT ON TABLE alphab.audit_logs IS 'Audit trail of all data changes';
COMMENT ON TABLE alphab.migration_log IS 'Track applied database migrations';




-- =============================================================================
-- MIGRATION: 20240113_002_particle0_schema
-- LOCATION: app/particle0
-- FILE: /Users/alphab/Dev/LLM/DEV/alphab.mono.repo/packages/alphab-db-supabase/app/particle0/20240113_002_particle0_schema.sql
-- =============================================================================

-- Migration: Particle0 Schema
-- Version: 20240113_002
-- Description: Create particle0-specific tables for vaults, artifacts, content products, analytics, and permissions
-- Location: app/particle0
-- Depends: alphab global schema

-- =============================================================================
-- PARTICLE0 TABLES
-- =============================================================================

-- Vaults table (data containers)
CREATE TABLE alphab.vaults (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES alphab.users(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT FALSE,
  settings JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Artifacts table (content items)
CREATE TABLE alphab.artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_id UUID REFERENCES alphab.vaults(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  title TEXT,
  type TEXT NOT NULL,
  content TEXT,
  content_type TEXT DEFAULT 'text',
  content_jsonb JSONB,
  metadata JSONB DEFAULT '{}',
  content_hash VARCHAR(64),
  file_size BIGINT,
  file_url TEXT,
  processing_status TEXT DEFAULT 'pending' CHECK (
    processing_status IN ('pending', 'processing', 'completed', 'failed')
  ),
  -- Vector embeddings for semantic search
  embedding vector(1536), -- OpenAI text-embedding-ada-002
  embedding_small vector(384), -- Supabase/gte-small
  created_by UUID REFERENCES alphab.users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Content products table
CREATE TABLE alphab.content_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_id UUID REFERENCES alphab.vaults(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  content JSONB DEFAULT '{}',
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Analytics events table
CREATE TABLE alphab.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES alphab.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  session_id TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Permissions table
CREATE TABLE alphab.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES alphab.users(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  permission_type TEXT NOT NULL CHECK (permission_type IN ('read', 'write', 'admin', 'owner')),
  granted_by UUID REFERENCES alphab.users(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, resource_type, resource_id, permission_type)
);

-- =============================================================================
-- INDEXES FOR PARTICLE0 TABLES
-- =============================================================================

-- Vaults indexes
CREATE INDEX idx_alphab_vaults_owner ON alphab.vaults(owner_id);
CREATE INDEX idx_alphab_vaults_status ON alphab.vaults(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_alphab_vaults_is_public ON alphab.vaults(is_public);
CREATE INDEX idx_alphab_vaults_owner_active ON alphab.vaults(owner_id, id) WHERE deleted_at IS NULL;

-- Artifacts indexes
CREATE INDEX idx_alphab_artifacts_vault ON alphab.artifacts(vault_id);
CREATE INDEX idx_alphab_artifacts_status ON alphab.artifacts(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_alphab_artifacts_content_type ON alphab.artifacts(content_type);
CREATE INDEX idx_alphab_artifacts_type ON alphab.artifacts(type);
CREATE INDEX idx_alphab_artifacts_processing_status ON alphab.artifacts(processing_status);
CREATE INDEX idx_alphab_artifacts_content_hash ON alphab.artifacts(content_hash);
CREATE INDEX idx_alphab_artifacts_created_by ON alphab.artifacts(created_by);
CREATE INDEX idx_alphab_artifacts_vault_active ON alphab.artifacts(vault_id, id) WHERE deleted_at IS NULL;
CREATE INDEX idx_alphab_artifacts_vault_status ON alphab.artifacts(vault_id, processing_status);

-- JSONB indexes for content search
CREATE INDEX idx_alphab_artifacts_content_gin ON alphab.artifacts USING GIN (content_jsonb);
CREATE INDEX idx_alphab_artifacts_metadata_gin ON alphab.artifacts USING GIN (metadata);

-- Vector similarity indexes for embeddings
CREATE INDEX idx_alphab_artifacts_embedding_hnsw ON alphab.artifacts
  USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);
CREATE INDEX idx_alphab_artifacts_embedding_small_ivfflat ON alphab.artifacts
  USING ivfflat (embedding_small vector_cosine_ops) WITH (lists = 100);

-- Content products indexes
CREATE INDEX idx_alphab_content_products_vault ON alphab.content_products(vault_id);
CREATE INDEX idx_alphab_content_products_status ON alphab.content_products(status);

-- Analytics indexes
CREATE INDEX idx_alphab_analytics_user ON alphab.analytics_events(user_id);
CREATE INDEX idx_alphab_analytics_type ON alphab.analytics_events(event_type);
CREATE INDEX idx_alphab_analytics_created ON alphab.analytics_events(created_at);

-- Permissions indexes
CREATE INDEX idx_alphab_permissions_user ON alphab.permissions(user_id);
CREATE INDEX idx_alphab_permissions_resource ON alphab.permissions(resource_type, resource_id);

-- =============================================================================
-- CONSTRAINTS FOR PARTICLE0 TABLES
-- =============================================================================

-- Vaults constraints
ALTER TABLE alphab.vaults ADD CONSTRAINT vaults_name_not_empty_check
  CHECK (length(trim(name)) > 0);

-- Artifacts constraints
ALTER TABLE alphab.artifacts ADD CONSTRAINT artifacts_name_not_empty_check
  CHECK (length(trim(name)) > 0);
ALTER TABLE alphab.artifacts ADD CONSTRAINT artifacts_file_size_positive_check
  CHECK (file_size IS NULL OR file_size >= 0);

-- =============================================================================
-- ROW LEVEL SECURITY FOR PARTICLE0 TABLES
-- =============================================================================

-- Enable RLS on all particle0 tables
ALTER TABLE alphab.vaults ENABLE ROW LEVEL SECURITY;
ALTER TABLE alphab.artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE alphab.content_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE alphab.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE alphab.permissions ENABLE ROW LEVEL SECURITY;

-- Vaults policies
CREATE POLICY "vaults_read_policy" ON alphab.vaults
  FOR SELECT
  USING (
    owner_id = auth.uid() OR
    (is_public = true AND deleted_at IS NULL)
  );

CREATE POLICY "vaults_update_policy" ON alphab.vaults
  FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "vaults_insert_policy" ON alphab.vaults
  FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "vaults_no_delete_policy" ON alphab.vaults
  FOR DELETE
  USING (false);

-- Artifacts policies
CREATE POLICY "artifacts_read_policy" ON alphab.artifacts
  FOR SELECT
  USING (
    vault_id IN (
      SELECT id FROM alphab.vaults
      WHERE owner_id = auth.uid() OR is_public = true
    )
    AND deleted_at IS NULL
  );

CREATE POLICY "artifacts_update_policy" ON alphab.artifacts
  FOR UPDATE
  USING (
    vault_id IN (
      SELECT id FROM alphab.vaults WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    vault_id IN (
      SELECT id FROM alphab.vaults WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "artifacts_insert_policy" ON alphab.artifacts
  FOR INSERT
  WITH CHECK (
    vault_id IN (
      SELECT id FROM alphab.vaults WHERE owner_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "artifacts_no_delete_policy" ON alphab.artifacts
  FOR DELETE
  USING (false);

-- Content products policies
CREATE POLICY "content_products_vault_access" ON alphab.content_products
  FOR ALL USING (
    vault_id IN (
      SELECT id FROM alphab.vaults WHERE owner_id = auth.uid()
    )
  );

-- =============================================================================
-- TRIGGERS FOR PARTICLE0 TABLES
-- =============================================================================

-- Updated_at triggers
CREATE TRIGGER vaults_updated_at_trigger
  BEFORE UPDATE ON alphab.vaults
  FOR EACH ROW
  EXECUTE FUNCTION alphab.update_updated_at_column();

CREATE TRIGGER artifacts_updated_at_trigger
  BEFORE UPDATE ON alphab.artifacts
  FOR EACH ROW
  EXECUTE FUNCTION alphab.update_updated_at_column();

CREATE TRIGGER content_products_updated_at_trigger
  BEFORE UPDATE ON alphab.content_products
  FOR EACH ROW
  EXECUTE FUNCTION alphab.update_updated_at_column();

CREATE TRIGGER permissions_updated_at_trigger
  BEFORE UPDATE ON alphab.permissions
  FOR EACH ROW
  EXECUTE FUNCTION alphab.update_updated_at_column();

-- Audit triggers
CREATE TRIGGER audit_trigger_vaults
  AFTER INSERT OR UPDATE OR DELETE ON alphab.vaults
  FOR EACH ROW EXECUTE FUNCTION alphab.log_audit_changes();

CREATE TRIGGER audit_trigger_artifacts
  AFTER INSERT OR UPDATE OR DELETE ON alphab.artifacts
  FOR EACH ROW EXECUTE FUNCTION alphab.log_audit_changes();

CREATE TRIGGER audit_trigger_content_products
  AFTER INSERT OR UPDATE OR DELETE ON alphab.content_products
  FOR EACH ROW EXECUTE FUNCTION alphab.log_audit_changes();

CREATE TRIGGER audit_trigger_permissions
  AFTER INSERT OR UPDATE OR DELETE ON alphab.permissions
  FOR EACH ROW EXECUTE FUNCTION alphab.log_audit_changes();

-- =============================================================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON TABLE alphab.vaults IS 'Knowledge containers for organizing artifacts and content';
COMMENT ON TABLE alphab.artifacts IS 'Uploaded files and content artifacts within vaults';
COMMENT ON TABLE alphab.content_products IS 'Generated content products from vault artifacts';
COMMENT ON TABLE alphab.analytics_events IS 'User interaction and system events for analytics';
COMMENT ON TABLE alphab.permissions IS 'Access control permissions for resources';




-- =============================================================================
-- MIGRATION: 20240113_003_common_functions
-- LOCATION: common
-- FILE: /Users/alphab/Dev/LLM/DEV/alphab.mono.repo/packages/alphab-db-supabase/common/20240113_003_common_functions.sql
-- =============================================================================

-- Migration: Common Functions and Utilities
-- Version: 20240113_003
-- Description: Common utility functions for semantic search, test data, and shared functionality
-- Location: common
-- Depends: alphab global schema, particle0 schema

-- =============================================================================
-- SEMANTIC SEARCH FUNCTIONS
-- =============================================================================

-- Function for semantic similarity search
CREATE OR REPLACE FUNCTION alphab.search_similar_artifacts(
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
  FROM alphab.artifacts a
  WHERE a.vault_id = p_vault_id
    AND a.embedding IS NOT NULL
    AND a.deleted_at IS NULL
    AND 1 - (a.embedding <=> p_query_embedding) >= p_similarity_threshold
  ORDER BY a.embedding <=> p_query_embedding
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for fast similarity search using smaller embeddings
CREATE OR REPLACE FUNCTION alphab.search_similar_artifacts_fast(
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
  FROM alphab.artifacts a
  WHERE a.vault_id = p_vault_id
    AND a.embedding_small IS NOT NULL
    AND a.deleted_at IS NULL
    AND 1 - (a.embedding_small <=> p_query_embedding) >= p_similarity_threshold
  ORDER BY a.embedding_small <=> p_query_embedding
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to find duplicate content using embeddings
CREATE OR REPLACE FUNCTION alphab.find_duplicate_artifacts(
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
  FROM alphab.artifacts a1
  JOIN alphab.artifacts a2 ON a1.id < a2.id  -- Avoid duplicate pairs
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
-- TEST DATA UTILITIES
-- =============================================================================

-- Function to create test user
CREATE OR REPLACE FUNCTION alphab.create_test_user(
  p_email TEXT,
  p_name TEXT DEFAULT 'Test User'
)
RETURNS UUID AS $$
DECLARE
  user_id UUID;
BEGIN
  INSERT INTO alphab.users (email, name, status)
  VALUES (p_email, p_name, 'active')
  RETURNING id INTO user_id;

  RETURN user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create test vault
CREATE OR REPLACE FUNCTION alphab.create_test_vault(
  p_owner_id UUID,
  p_name TEXT DEFAULT 'Test Vault',
  p_is_public BOOLEAN DEFAULT false
)
RETURNS UUID AS $$
DECLARE
  vault_id UUID;
BEGIN
  INSERT INTO alphab.vaults (owner_id, name, is_public, status)
  VALUES (p_owner_id, p_name, p_is_public, 'active')
  RETURNING id INTO vault_id;

  RETURN vault_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create test artifact
CREATE OR REPLACE FUNCTION alphab.create_test_artifact(
  p_vault_id UUID,
  p_created_by UUID,
  p_name TEXT DEFAULT 'Test Artifact',
  p_content TEXT DEFAULT 'Test content'
)
RETURNS UUID AS $$
DECLARE
  artifact_id UUID;
BEGIN
  INSERT INTO alphab.artifacts (vault_id, created_by, name, content, type, processing_status, status)
  VALUES (p_vault_id, p_created_by, p_name, p_content, 'text', 'completed', 'active')
  RETURNING id INTO artifact_id;

  RETURN artifact_id;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up test data
CREATE OR REPLACE FUNCTION alphab.cleanup_test_data()
RETURNS VOID AS $$
BEGIN
  -- Delete test artifacts
  DELETE FROM alphab.artifacts WHERE name LIKE 'Test%' OR name LIKE '%test%';

  -- Delete test vaults
  DELETE FROM alphab.vaults WHERE name LIKE 'Test%' OR name LIKE '%test%';

  -- Delete test users (be careful with this)
  DELETE FROM alphab.users WHERE email LIKE '%test%' OR email LIKE '%example%';

  -- Clean up audit logs for deleted records
  DELETE FROM alphab.audit_logs WHERE created_at < NOW() - INTERVAL '1 day' AND table_name LIKE '%test%';
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- UTILITY FUNCTIONS
-- =============================================================================

-- Function to get database statistics
CREATE OR REPLACE FUNCTION alphab.get_database_stats()
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
  WHERE schemaname = 'alphab'
  ORDER BY size_bytes DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to analyze vault content
CREATE OR REPLACE FUNCTION alphab.analyze_vault_content(p_vault_id UUID)
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
    FROM alphab.artifacts
    WHERE vault_id = p_vault_id
      AND deleted_at IS NULL
  ) stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON FUNCTION alphab.search_similar_artifacts(UUID, vector, FLOAT, INTEGER) IS 'Search for semantically similar artifacts using high-dimensional embeddings';
COMMENT ON FUNCTION alphab.search_similar_artifacts_fast(UUID, vector, FLOAT, INTEGER) IS 'Fast semantic search using smaller embeddings';
COMMENT ON FUNCTION alphab.find_duplicate_artifacts(UUID, FLOAT) IS 'Find potential duplicate artifacts based on embedding similarity';
COMMENT ON FUNCTION alphab.create_test_user(TEXT, TEXT) IS 'Create a test user for development and testing';
COMMENT ON FUNCTION alphab.create_test_vault(UUID, TEXT, BOOLEAN) IS 'Create a test vault for development and testing';
COMMENT ON FUNCTION alphab.create_test_artifact(UUID, UUID, TEXT, TEXT) IS 'Create a test artifact for development and testing';
COMMENT ON FUNCTION alphab.cleanup_test_data() IS 'Clean up all test data from the database';
COMMENT ON FUNCTION alphab.get_database_stats() IS 'Get statistics about database tables and sizes';
COMMENT ON FUNCTION alphab.analyze_vault_content(UUID) IS 'Analyze content statistics for a specific vault';


