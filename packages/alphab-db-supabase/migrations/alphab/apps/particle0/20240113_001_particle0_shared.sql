-- Particle0 App-Specific Shared Schema
-- Tables and functions specific to particle0 but shared across instances

-- Users table for particle0
CREATE TABLE IF NOT EXISTS alphab.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS and audit
ALTER TABLE alphab.users ENABLE ROW LEVEL SECURITY;

-- Add audit trigger
CREATE TRIGGER users_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON alphab.users
  FOR EACH ROW EXECUTE FUNCTION alphab.audit_trigger();

-- Basic RLS policies
CREATE POLICY "Users can view own profile" ON alphab.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON alphab.users
  FOR UPDATE USING (auth.uid() = id);
