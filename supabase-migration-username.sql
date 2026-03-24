-- ============================================================
-- Migration: Add username column for login by username
-- Run this in Supabase SQL Editor (Dashboard > SQL)
-- ============================================================

-- 1. Add username column (unique, nullable for now)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- 2. Index for fast username lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- 3. Set usernames for existing accounts
UPDATE public.profiles SET username = 'admin' WHERE email = 'admin@dealer-school.com';
UPDATE public.profiles SET username = 'dealer01' WHERE email = 'dealer01@dealer-school.com';
UPDATE public.profiles SET username = 'dealer02' WHERE email = 'dealer02@dealer-school.com';
UPDATE public.profiles SET username = 'dealer03' WHERE email = 'dealer03@dealer-school.com';
UPDATE public.profiles SET username = 'dealer04' WHERE email = 'dealer04@dealer-school.com';
UPDATE public.profiles SET username = 'dealer05' WHERE email = 'dealer05@dealer-school.com';
UPDATE public.profiles SET username = 'dealer06' WHERE email = 'dealer06@dealer-school.com';
UPDATE public.profiles SET username = 'dealer07' WHERE email = 'dealer07@dealer-school.com';
UPDATE public.profiles SET username = 'dealer08' WHERE email = 'dealer08@dealer-school.com';
UPDATE public.profiles SET username = 'dealer09' WHERE email = 'dealer09@dealer-school.com';
UPDATE public.profiles SET username = 'dealer10' WHERE email = 'dealer10@dealer-school.com';

-- 4. For other existing users, set username = part before @ in email
UPDATE public.profiles SET username = split_part(email, '@', 1)
  WHERE username IS NULL;

-- 5. Update trigger to set username on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  );

  INSERT INTO public.game_progress (user_id, game_id, unlocked) VALUES
    (NEW.id, 'roulette', TRUE),
    (NEW.id, 'blackjack', TRUE),
    (NEW.id, 'baccarat', TRUE),
    (NEW.id, 'three-card-poker', FALSE),
    (NEW.id, 'ultimate-texas', FALSE),
    (NEW.id, 'caribbean-stud', FALSE),
    (NEW.id, 'casino-holdem', FALSE),
    (NEW.id, 'let-it-ride', FALSE);

  INSERT INTO public.user_skills (user_id, skill_name, score) VALUES
    (NEW.id, 'rules_knowledge', 0),
    (NEW.id, 'sequencing', 0),
    (NEW.id, 'voice_clarity', 0),
    (NEW.id, 'payout_calculation', 0),
    (NEW.id, 'incident_handling', 0),
    (NEW.id, 'speed', 0),
    (NEW.id, 'procedure_compliance', 0),
    (NEW.id, 'professional_presence', 0);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Allow public to lookup username -> email (for login)
-- This policy lets unauthenticated users query email by username
DROP POLICY IF EXISTS "Public can lookup username" ON public.profiles;
CREATE POLICY "Public can lookup username"
  ON public.profiles FOR SELECT
  USING (true)
  WITH CHECK (true);

-- Actually, we need a more targeted approach. Drop the broad policy
-- and create a secure function instead.
DROP POLICY IF EXISTS "Public can lookup username" ON public.profiles;

-- Secure function: returns email for a given username (callable without auth)
CREATE OR REPLACE FUNCTION public.get_email_by_username(lookup_username TEXT)
RETURNS TEXT AS $$
  SELECT email FROM public.profiles WHERE username = lookup_username LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

SELECT 'Username migration applied successfully!' AS status;
