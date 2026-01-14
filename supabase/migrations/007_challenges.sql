-- Daily/Weekly Challenges System
-- Everyone plays the same route - creates community competition

CREATE TABLE IF NOT EXISTS challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_type TEXT NOT NULL,  -- 'daily', 'weekly', 'special'
  title TEXT,  -- Optional custom title for special challenges

  -- Location (fixed for everyone)
  city_name TEXT NOT NULL,
  center_lat DECIMAL(10,7) NOT NULL,
  center_lng DECIMAL(10,7) NOT NULL,
  zoom_level INTEGER DEFAULT 16,

  -- Fixed start/end points
  start_lat DECIMAL(10,7) NOT NULL,
  start_lng DECIMAL(10,7) NOT NULL,
  end_lat DECIMAL(10,7) NOT NULL,
  end_lng DECIMAL(10,7) NOT NULL,

  -- Timing
  active_from TIMESTAMPTZ NOT NULL,
  active_until TIMESTAMPTZ NOT NULL,

  -- Metadata
  difficulty TEXT DEFAULT 'medium',
  featured BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_challenges_type ON challenges(challenge_type);
CREATE INDEX IF NOT EXISTS idx_challenges_active ON challenges(active_from, active_until);

ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read challenges" ON challenges;
CREATE POLICY "Anyone can read challenges" ON challenges
  FOR SELECT USING (true);

-- =============================================
-- Challenge Entries (player submissions)
-- =============================================

CREATE TABLE IF NOT EXISTS challenge_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID,
  user_id UUID,
  username TEXT NOT NULL,

  efficiency DECIMAL(5,2) NOT NULL,
  path_data JSONB,
  duration_ms INTEGER,

  submitted_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(challenge_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_challenge_entries_challenge ON challenge_entries(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_entries_user ON challenge_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_entries_efficiency ON challenge_entries(challenge_id, efficiency DESC);

ALTER TABLE challenge_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read challenge entries" ON challenge_entries;
DROP POLICY IF EXISTS "Users can manage own challenge entries" ON challenge_entries;
DROP POLICY IF EXISTS "Anyone can insert challenge entries" ON challenge_entries;

CREATE POLICY "Anyone can read challenge entries" ON challenge_entries
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert challenge entries" ON challenge_entries
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can manage own challenge entries" ON challenge_entries
  FOR UPDATE USING (auth.uid() = user_id);

-- =============================================
-- Get current active challenge
-- =============================================

CREATE OR REPLACE FUNCTION get_active_challenge(
  p_type TEXT DEFAULT 'daily'
)
RETURNS TABLE (
  id UUID,
  challenge_type TEXT,
  title TEXT,
  city_name TEXT,
  center_lat DECIMAL(10,7),
  center_lng DECIMAL(10,7),
  zoom_level INTEGER,
  start_lat DECIMAL(10,7),
  start_lng DECIMAL(10,7),
  end_lat DECIMAL(10,7),
  end_lng DECIMAL(10,7),
  active_until TIMESTAMPTZ,
  difficulty TEXT,
  participant_count BIGINT,
  top_score DECIMAL(5,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.challenge_type,
    c.title,
    c.city_name,
    c.center_lat,
    c.center_lng,
    c.zoom_level,
    c.start_lat,
    c.start_lng,
    c.end_lat,
    c.end_lng,
    c.active_until,
    c.difficulty,
    COUNT(ce.id) as participant_count,
    MAX(ce.efficiency) as top_score
  FROM challenges c
  LEFT JOIN challenge_entries ce ON ce.challenge_id = c.id
  WHERE c.challenge_type = p_type
    AND NOW() BETWEEN c.active_from AND c.active_until
  GROUP BY c.id
  ORDER BY c.active_from DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- Get challenge leaderboard
-- =============================================

CREATE OR REPLACE FUNCTION get_challenge_leaderboard(
  p_challenge_id UUID,
  p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
  rank INTEGER,
  user_id UUID,
  username TEXT,
  efficiency DECIMAL(5,2),
  duration_ms INTEGER,
  submitted_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ROW_NUMBER() OVER (ORDER BY ce.efficiency DESC, ce.duration_ms ASC)::INTEGER as rank,
    ce.user_id,
    ce.username,
    ce.efficiency,
    ce.duration_ms,
    ce.submitted_at
  FROM challenge_entries ce
  WHERE ce.challenge_id = p_challenge_id
  ORDER BY ce.efficiency DESC, ce.duration_ms ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- Submit challenge entry
-- =============================================

CREATE OR REPLACE FUNCTION submit_challenge_entry(
  p_challenge_id UUID,
  p_user_id UUID,
  p_username TEXT,
  p_efficiency DECIMAL(5,2),
  p_path_data JSONB,
  p_duration_ms INTEGER
)
RETURNS TABLE (
  is_improvement BOOLEAN,
  previous_efficiency DECIMAL(5,2),
  new_rank INTEGER
) AS $$
DECLARE
  old_efficiency DECIMAL(5,2);
  result_rank INTEGER;
BEGIN
  -- Get existing entry
  SELECT ce.efficiency INTO old_efficiency
  FROM challenge_entries ce
  WHERE ce.challenge_id = p_challenge_id AND ce.user_id = p_user_id;

  -- Only update if better (or new)
  IF old_efficiency IS NULL OR p_efficiency > old_efficiency THEN
    INSERT INTO challenge_entries (challenge_id, user_id, username, efficiency, path_data, duration_ms)
    VALUES (p_challenge_id, p_user_id, p_username, p_efficiency, p_path_data, p_duration_ms)
    ON CONFLICT (challenge_id, user_id) DO UPDATE
    SET efficiency = p_efficiency,
        path_data = p_path_data,
        duration_ms = p_duration_ms,
        submitted_at = NOW();
  END IF;

  -- Get new rank
  SELECT COUNT(*) + 1 INTO result_rank
  FROM challenge_entries ce
  WHERE ce.challenge_id = p_challenge_id
    AND ce.efficiency > GREATEST(p_efficiency, COALESCE(old_efficiency, 0));

  is_improvement := old_efficiency IS NULL OR p_efficiency > old_efficiency;
  previous_efficiency := old_efficiency;
  new_rank := result_rank;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;
