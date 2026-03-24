-- ============================================================
-- Migration: Add admin role system + hardened RLS
-- Run this in Supabase SQL Editor (Dashboard > SQL)
-- ============================================================

-- 1. Add role column to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user'
  CHECK (role IN ('user', 'admin'));

-- 2. Create index on role for fast admin lookups
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- ============================================================
-- UPDATED RLS POLICIES — Admin can read/manage all data
-- ============================================================

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users own game_progress" ON public.game_progress;
DROP POLICY IF EXISTS "Users own training_sessions" ON public.training_sessions;
DROP POLICY IF EXISTS "Users own user_skills" ON public.user_skills;
DROP POLICY IF EXISTS "Users own certifications" ON public.certifications;

-- Helper: check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- PROFILES
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admin can delete profiles"
  ON public.profiles FOR DELETE
  USING (public.is_admin());

-- GAME PROGRESS
CREATE POLICY "Users own game_progress"
  ON public.game_progress FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users insert own game_progress"
  ON public.game_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own game_progress"
  ON public.game_progress FOR UPDATE
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Admin can delete game_progress"
  ON public.game_progress FOR DELETE
  USING (public.is_admin());

-- TRAINING SESSIONS
CREATE POLICY "Users own training_sessions"
  ON public.training_sessions FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users insert own training_sessions"
  ON public.training_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own training_sessions"
  ON public.training_sessions FOR UPDATE
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Admin can delete training_sessions"
  ON public.training_sessions FOR DELETE
  USING (public.is_admin());

-- USER SKILLS
CREATE POLICY "Users own user_skills"
  ON public.user_skills FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users insert own user_skills"
  ON public.user_skills FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own user_skills"
  ON public.user_skills FOR UPDATE
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Admin can delete user_skills"
  ON public.user_skills FOR DELETE
  USING (public.is_admin());

-- CERTIFICATIONS
CREATE POLICY "Users own certifications"
  ON public.certifications FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users insert own certifications"
  ON public.certifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own certifications"
  ON public.certifications FOR UPDATE
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Admin can delete certifications"
  ON public.certifications FOR DELETE
  USING (public.is_admin());

SELECT 'Admin migration applied successfully!' AS status;
