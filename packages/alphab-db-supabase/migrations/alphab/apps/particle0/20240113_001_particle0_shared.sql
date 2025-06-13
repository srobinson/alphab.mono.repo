-- Particle0 App-Specific Shared Schema
-- Tables and functions specific to particle0 but shared across instances
-- Using public schema with alphab_ prefix for Supabase compatibility

-- Add particle0-specific columns to the global users table
ALTER TABLE public.alphab_users
ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Additional RLS policies for particle0 (with alphab_ prefix)
CREATE POLICY IF NOT EXISTS "alphab_particle0_users_can_view_own_profile" ON public.alphab_users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "alphab_particle0_users_can_update_own_profile" ON public.alphab_users
  FOR UPDATE USING (auth.uid() = id);

-- Particle0-specific tables can be added here
-- Example: CREATE TABLE public.alphab_particle0_specific_table (...);
