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
