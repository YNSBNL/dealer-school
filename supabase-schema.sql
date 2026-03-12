-- ============================================================
-- CroupierPro — Supabase Database Schema
-- Run this in your Supabase SQL Editor (Dashboard > SQL)
-- ============================================================

-- 1. PROFILES (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  rank TEXT DEFAULT 'Bronze' CHECK (rank IN ('Bronze', 'Silver', 'Gold', 'Platinum', 'Elite')),
  preferred_language TEXT DEFAULT 'fr',
  streak_days INTEGER DEFAULT 0,
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. GAME PROGRESS (per user, per game)
CREATE TABLE IF NOT EXISTS public.game_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  game_id TEXT NOT NULL, -- 'roulette', 'blackjack', 'baccarat', etc.
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  accuracy REAL DEFAULT 0,
  sessions_count INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  total_score INTEGER DEFAULT 0,
  certified BOOLEAN DEFAULT FALSE,
  cert_level TEXT CHECK (cert_level IN ('Bronze', 'Silver', 'Gold', 'Platinum', 'Elite')),
  unlocked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, game_id)
);

-- 3. TRAINING SESSIONS (each practice session)
CREATE TABLE IF NOT EXISTS public.training_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  game_id TEXT NOT NULL,
  mode TEXT DEFAULT 'simulation' CHECK (mode IN ('decouverte', 'guidee', 'simulation', 'examen', 'incidents', 'custom')),
  score INTEGER DEFAULT 0,
  accuracy REAL DEFAULT 0,
  duration_seconds INTEGER DEFAULT 0,
  rounds_played INTEGER DEFAULT 0,
  rounds_correct INTEGER DEFAULT 0,
  errors JSONB DEFAULT '[]'::JSONB,
  details JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. SKILLS (competency scores per user)
CREATE TABLE IF NOT EXISTS public.user_skills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  skill_name TEXT NOT NULL, -- 'rules_knowledge', 'payout_calculation', 'voice_clarity', etc.
  score INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  game_id TEXT, -- NULL = global skill, or specific to a game
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, skill_name, game_id)
);

-- 5. CERTIFICATIONS (earned certs)
CREATE TABLE IF NOT EXISTS public.certifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  cert_level TEXT NOT NULL CHECK (cert_level IN ('Bronze', 'Silver', 'Gold', 'Platinum', 'Elite')),
  game_id TEXT, -- NULL = global cert, or per game
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  exam_score INTEGER,
  UNIQUE(user_id, cert_level, game_id)
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_game_progress_user ON public.game_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_user ON public.training_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_game ON public.training_sessions(user_id, game_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_user ON public.user_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_certifications_user ON public.certifications(user_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) - Users can only access their own data
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update their own profile
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Game progress: users can CRUD their own
CREATE POLICY "Users own game_progress" ON public.game_progress FOR ALL USING (auth.uid() = user_id);

-- Training sessions: users can CRUD their own
CREATE POLICY "Users own training_sessions" ON public.training_sessions FOR ALL USING (auth.uid() = user_id);

-- Skills: users can CRUD their own
CREATE POLICY "Users own user_skills" ON public.user_skills FOR ALL USING (auth.uid() = user_id);

-- Certifications: users can read their own, insert their own
CREATE POLICY "Users own certifications" ON public.certifications FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- TRIGGER: Auto-create profile on signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );

  -- Create default game progress aligned with the application registry
  INSERT INTO public.game_progress (user_id, game_id, unlocked) VALUES
    (NEW.id, 'roulette', TRUE),
    (NEW.id, 'blackjack', TRUE),
    (NEW.id, 'baccarat', TRUE),
    (NEW.id, 'three-card-poker', FALSE),
    (NEW.id, 'ultimate-texas', FALSE),
    (NEW.id, 'caribbean-stud', FALSE),
    (NEW.id, 'casino-holdem', FALSE),
    (NEW.id, 'let-it-ride', FALSE);

  -- Create default skills
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

-- Drop trigger if exists, then create
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- SEED DATA: Default unlocked games for existing users (run once)
-- ============================================================
-- No seed needed, trigger handles it for new users.

SELECT 'Schema created successfully!' AS status;
