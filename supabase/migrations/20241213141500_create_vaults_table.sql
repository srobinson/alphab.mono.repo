-- Migration: Create vaults table
-- Created: 2024-12-13T14:15:00.000Z

-- Create vaults table for storing user vaults
CREATE TABLE alphab.vaults (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES alphab.users(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT FALSE,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE alphab.vaults ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own vaults" ON alphab.vaults
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can create vaults" ON alphab.vaults
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own vaults" ON alphab.vaults
  FOR UPDATE USING (auth.uid() = owner_id);

-- Create index for performance
CREATE INDEX idx_vaults_owner_id ON alphab.vaults(owner_id);
CREATE INDEX idx_vaults_public ON alphab.vaults(is_public) WHERE is_public = TRUE;
