-- =============================================================================
-- PATHFINDR DATABASE SETUP
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/wxlglepsypmpnupxexoc/sql
-- =============================================================================

-- =============================================================================
-- USERS TABLE
-- Extends Supabase auth.users with game-specific profile data
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE,
  username TEXT UNIQUE,
  country TEXT,
  platform TEXT,
  has_purchased BOOLEAN DEFAULT FALSE,
  purchased_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_played_at TIMESTAMPTZ
);

-- =============================================================================
-- GAMES TABLE
-- Stores every game played with full route data for replay
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.games (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  efficiency_percentage FLOAT,
  location_name TEXT,
  center_lat FLOAT,
  center_lng FLOAT,
  zoom_level INT,
  round_number INT,
  user_path JSONB,
  optimal_path JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- SESSIONS TABLE
-- Tracks play sessions for analytics
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  platform TEXT,
  device_info JSONB,
  start_time TIMESTAMPTZ DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  rounds_completed INT DEFAULT 0,
  total_score INT DEFAULT 0,
  country TEXT
);

-- =============================================================================
-- LEADERBOARDS TABLE
-- Aggregated player rankings (updated after each game)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.leaderboards (
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT,
  best_efficiency FLOAT DEFAULT 0,
  avg_efficiency FLOAT DEFAULT 0,
  total_games INT DEFAULT 0,
  countries_visited INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- TRANSACTIONS TABLE
-- Payment/purchase tracking
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  platform TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_games_user_id ON public.games(user_id);
CREATE INDEX IF NOT EXISTS idx_games_created_at ON public.games(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboards_best_efficiency ON public.leaderboards(best_efficiency DESC);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- USERS POLICIES
-- =============================================================================
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- =============================================================================
-- GAMES POLICIES
-- =============================================================================
CREATE POLICY "Users can view own games"
  ON public.games FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own games"
  ON public.games FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- SESSIONS POLICIES
-- =============================================================================
CREATE POLICY "Users can view own sessions"
  ON public.sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON public.sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON public.sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- =============================================================================
-- LEADERBOARDS POLICIES
-- Public read, authenticated write for own entry
-- =============================================================================
CREATE POLICY "Anyone can view leaderboard"
  ON public.leaderboards FOR SELECT
  TO PUBLIC
  USING (true);

CREATE POLICY "Users can insert own leaderboard entry"
  ON public.leaderboards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own leaderboard entry"
  ON public.leaderboards FOR UPDATE
  USING (auth.uid() = user_id);

-- =============================================================================
-- TRANSACTIONS POLICIES
-- =============================================================================
CREATE POLICY "Users can view own transactions"
  ON public.transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- DONE!
-- =============================================================================
-- Tables created:
--   - users (profile data)
--   - games (game history with routes)
--   - sessions (play session tracking)
--   - leaderboards (rankings)
--   - transactions (purchases)
--
-- All tables have Row Level Security enabled.
-- Users can only access their own data (except leaderboards which are public read).
