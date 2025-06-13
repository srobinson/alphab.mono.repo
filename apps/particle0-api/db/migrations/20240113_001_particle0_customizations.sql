-- Particle0 API Project-Specific Customizations
-- Custom tables and modifications for this specific deployment
-- Using public schema with alphab_ prefix for Supabase compatibility

-- Add project-specific columns to users
ALTER TABLE public.alphab_users
ADD COLUMN IF NOT EXISTS api_key TEXT,
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS api_rate_limit INTEGER DEFAULT 1000;

-- Project-specific settings table
CREATE TABLE IF NOT EXISTS public.alphab_project_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert project-specific settings
INSERT INTO public.alphab_project_settings (setting_key, setting_value)
VALUES
  ('project_name', '"particle0-api"'),
  ('version', '"1.0.0"'),
  ('features', '["api", "webhooks", "analytics"]')
ON CONFLICT (setting_key) DO NOTHING;
