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

-- Global Schema Foundation
-- Common tables and functions used across all apps

-- Global audit table for all apps
CREATE TABLE IF NOT EXISTS alphab.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  old_data JSONB,
  new_data JSONB,
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Common trigger function for audit logging
CREATE OR REPLACE FUNCTION alphab.audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO alphab.audit_logs (table_name, operation, old_data, new_data, user_id)
  VALUES (TG_TABLE_NAME, TG_OP, to_jsonb(OLD), to_jsonb(NEW), auth.uid());
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
