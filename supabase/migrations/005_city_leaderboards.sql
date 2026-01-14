-- City-Specific Leaderboards
-- Compete for the top spot in specific cities

CREATE TABLE IF NOT EXISTS city_leaderboards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  city_name TEXT NOT NULL,
  normalized_city TEXT NOT NULL,  -- lowercase, no special chars for matching
  user_id UUID,
  username TEXT NOT NULL,
  best_efficiency DECIMAL(5,2) NOT NULL,
  attempts INTEGER DEFAULT 1,
  first_played_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(normalized_city, user_id)
);

CREATE INDEX IF NOT EXISTS idx_city_lb_city ON city_leaderboards(normalized_city);
CREATE INDEX IF NOT EXISTS idx_city_lb_user ON city_leaderboards(user_id);
CREATE INDEX IF NOT EXISTS idx_city_lb_efficiency ON city_leaderboards(normalized_city, best_efficiency DESC);

ALTER TABLE city_leaderboards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read city leaderboards" ON city_leaderboards;
DROP POLICY IF EXISTS "Users can manage own entries" ON city_leaderboards;
DROP POLICY IF EXISTS "Anyone can insert city leaderboards" ON city_leaderboards;

CREATE POLICY "Anyone can read city leaderboards" ON city_leaderboards
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert city leaderboards" ON city_leaderboards
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can manage own entries" ON city_leaderboards
  FOR UPDATE USING (auth.uid() = user_id);

-- =============================================
-- Function to update city leaderboard
-- =============================================

CREATE OR REPLACE FUNCTION update_city_leaderboard(
  p_user_id UUID,
  p_username TEXT,
  p_city_name TEXT,
  p_efficiency DECIMAL(5,2)
)
RETURNS TABLE (
  is_new_record BOOLEAN,
  previous_best DECIMAL(5,2),
  city_rank INTEGER
) AS $$
DECLARE
  normalized TEXT;
  existing_best DECIMAL(5,2);
  new_rank INTEGER;
BEGIN
  -- Normalize city name
  normalized := LOWER(REGEXP_REPLACE(p_city_name, '[^a-zA-Z0-9]', '', 'g'));

  -- Get existing best
  SELECT cl.best_efficiency INTO existing_best
  FROM city_leaderboards cl
  WHERE cl.normalized_city = normalized AND cl.user_id = p_user_id;

  -- Insert or update
  INSERT INTO city_leaderboards (city_name, normalized_city, user_id, username, best_efficiency, attempts)
  VALUES (p_city_name, normalized, p_user_id, p_username, p_efficiency, 1)
  ON CONFLICT (normalized_city, user_id) DO UPDATE
  SET
    best_efficiency = GREATEST(city_leaderboards.best_efficiency, p_efficiency),
    attempts = city_leaderboards.attempts + 1,
    updated_at = NOW(),
    username = p_username;

  -- Get new rank
  SELECT COUNT(*) + 1 INTO new_rank
  FROM city_leaderboards cl
  WHERE cl.normalized_city = normalized
    AND cl.best_efficiency > GREATEST(COALESCE(existing_best, 0), p_efficiency);

  is_new_record := p_efficiency > COALESCE(existing_best, 0);
  previous_best := existing_best;
  city_rank := new_rank;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- Function to get city leaderboard
-- =============================================

CREATE OR REPLACE FUNCTION get_city_leaderboard(
  p_city_name TEXT,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  rank INTEGER,
  username TEXT,
  best_efficiency DECIMAL(5,2),
  attempts INTEGER,
  user_id UUID
) AS $$
DECLARE
  normalized TEXT;
BEGIN
  normalized := LOWER(REGEXP_REPLACE(p_city_name, '[^a-zA-Z0-9]', '', 'g'));

  RETURN QUERY
  SELECT
    ROW_NUMBER() OVER (ORDER BY cl.best_efficiency DESC)::INTEGER as rank,
    cl.username,
    cl.best_efficiency,
    cl.attempts,
    cl.user_id
  FROM city_leaderboards cl
  WHERE cl.normalized_city = normalized
  ORDER BY cl.best_efficiency DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
