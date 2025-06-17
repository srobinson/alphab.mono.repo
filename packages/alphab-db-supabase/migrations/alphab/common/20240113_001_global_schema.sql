-- Migration: Global Schema Setup
-- Version: 20240113_001
-- Description: Create global alphab tables in public schema with alphab_ prefix
-- Location: public (compatible with Supabase PostgREST)

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- UTILITY FUNCTIONS (with alphab_ prefix)
-- =============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION alphab_update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to log audit changes
CREATE OR REPLACE FUNCTION alphab_log_audit_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.alphab_audit_logs (
      user_id, action, table_name, record_id, old_values, metadata
    ) VALUES (
      auth.uid(), 'DELETE', TG_TABLE_NAME, OLD.id, to_jsonb(OLD), '{}'::jsonb
    );
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.alphab_audit_logs (
      user_id, action, table_name, record_id, old_values, new_values, metadata
    ) VALUES (
      auth.uid(), 'UPDATE', TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW), '{}'::jsonb
    );
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public.alphab_audit_logs (
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
CREATE OR REPLACE FUNCTION alphab_get_audit_history(
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
  FROM public.alphab_audit_logs al
  WHERE al.table_name = p_table_name
    AND (p_record_id IS NULL OR al.record_id = p_record_id)
    AND (p_action IS NULL OR al.action = p_action)
  ORDER BY al.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- GLOBAL TABLES (with alphab_ prefix in public schema)
-- =============================================================================

-- Users table (global user data)
CREATE TABLE public.alphab_users (
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
CREATE TABLE public.alphab_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.alphab_users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migration log table to track applied migrations
CREATE TABLE public.alphab_migration_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  applied_by UUID REFERENCES public.alphab_users(id) ON DELETE SET NULL,
  checksum VARCHAR(64)
);

-- =============================================================================
-- INDEXES FOR GLOBAL TABLES (with alphab_ prefix)
-- =============================================================================

-- Users indexes
CREATE INDEX alphab_idx_users_email ON public.alphab_users(email);
CREATE INDEX alphab_idx_users_status ON public.alphab_users(status) WHERE deleted_at IS NULL;

-- Audit logs indexes
CREATE INDEX alphab_idx_audit_user ON public.alphab_audit_logs(user_id);
CREATE INDEX alphab_idx_audit_table ON public.alphab_audit_logs(table_name);
CREATE INDEX alphab_idx_audit_record ON public.alphab_audit_logs(record_id);
CREATE INDEX alphab_idx_audit_created ON public.alphab_audit_logs(created_at);

-- =============================================================================
-- ROW LEVEL SECURITY FOR GLOBAL TABLES (with alphab_ prefix)
-- =============================================================================

-- Enable RLS on global tables
ALTER TABLE public.alphab_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alphab_audit_logs ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "alphab_users_read_own_data" ON public.alphab_users FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY "alphab_users_update_own_data" ON public.alphab_users FOR UPDATE USING (auth.uid()::text = id::text);

-- =============================================================================
-- TRIGGERS FOR GLOBAL TABLES (with alphab_ prefix)
-- =============================================================================

-- Updated_at triggers
CREATE TRIGGER alphab_users_updated_at_trigger
  BEFORE UPDATE ON public.alphab_users
  FOR EACH ROW
  EXECUTE FUNCTION alphab_update_updated_at_column();

-- Audit triggers
CREATE TRIGGER alphab_audit_trigger_users
  AFTER INSERT OR UPDATE OR DELETE ON public.alphab_users
  FOR EACH ROW EXECUTE FUNCTION alphab_log_audit_changes();

-- =============================================================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON TABLE public.alphab_users IS 'Global user accounts for the Alphab platform';
COMMENT ON TABLE public.alphab_audit_logs IS 'Audit trail of all data changes';
COMMENT ON TABLE public.alphab_migration_log IS 'Track applied database migrations';
