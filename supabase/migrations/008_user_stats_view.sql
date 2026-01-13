-- User Stats Views and Functions
-- Comprehensive statistics for player profiles

-- =============================================
-- User stats view (aggregated from games)
-- =============================================

CREATE OR REPLACE VIEW user_stats AS
SELECT
  g.user_id,
  u.username,

  -- Game counts
  COUNT(*) as total_rounds,
  COUNT(*) / 5 as total_games,
  COUNT(DISTINCT g.location_name) as unique_cities,
  COUNT(DISTINCT
    CASE
      WHEN g.location_name LIKE '%,%'
      THEN TRIM(SPLIT_PART(g.location_name, ',', -1))
      ELSE NULL
    END
  ) as unique_regions,

  -- Efficiency stats
  ROUND(AVG(g.efficiency_percentage)::NUMERIC, 1) as avg_efficiency,
  MAX(g.efficiency_percentage) as best_efficiency,
  MIN(g.efficiency_percentage) as worst_efficiency,
  ROUND(STDDEV(g.efficiency_percentage)::NUMERIC, 2) as efficiency_stddev,

  -- Perfect rounds (95%+)
  COUNT(*) FILTER (WHERE g.efficiency_percentage >= 95) as perfect_rounds,
  COUNT(*) FILTER (WHERE g.efficiency_percentage >= 90) as excellent_rounds,

  -- Activity
  MIN(g.created_at) as first_game_at,
  MAX(g.created_at) as last_game_at,
  COUNT(DISTINCT DATE(g.created_at)) as days_played,

  -- Streaks (simplified - actual streak calc needs window functions)
  CASE
    WHEN MAX(g.created_at) > NOW() - INTERVAL '1 day' THEN TRUE
    ELSE FALSE
  END as played_today

FROM games g
JOIN users u ON u.id = g.user_id
GROUP BY g.user_id, u.username;

-- =============================================
-- Function for detailed user stats
-- =============================================

CREATE OR REPLACE FUNCTION get_user_stats(p_user_id UUID)
RETURNS TABLE (
  total_rounds INTEGER,
  total_games INTEGER,
  unique_cities INTEGER,
  unique_regions INTEGER,
  avg_efficiency DECIMAL(5,2),
  best_efficiency DECIMAL(5,2),
  perfect_rounds INTEGER,
  current_streak INTEGER,
  longest_streak INTEGER,
  total_distance_km INTEGER,
  rank_global INTEGER,
  rank_percentile DECIMAL(5,2)
) AS $$
DECLARE
  stats RECORD;
  global_rank INTEGER;
  total_players INTEGER;
BEGIN
  -- Basic stats
  SELECT
    COUNT(*)::INTEGER as rounds,
    (COUNT(*) / 5)::INTEGER as games,
    COUNT(DISTINCT location_name)::INTEGER as cities,
    ROUND(AVG(efficiency_percentage), 2) as avg_eff,
    MAX(efficiency_percentage) as best_eff,
    COUNT(*) FILTER (WHERE efficiency_percentage >= 95)::INTEGER as perfect
  INTO stats
  FROM games
  WHERE user_id = p_user_id;

  -- Global rank
  SELECT COUNT(*) + 1 INTO global_rank
  FROM leaderboards
  WHERE best_efficiency > COALESCE(stats.best_eff, 0);

  SELECT COUNT(*) INTO total_players FROM leaderboards;

  -- Build return
  total_rounds := stats.rounds;
  total_games := stats.games;
  unique_cities := stats.cities;
  unique_regions := 0;  -- Calculated separately if needed
  avg_efficiency := stats.avg_eff;
  best_efficiency := stats.best_eff;
  perfect_rounds := stats.perfect;
  current_streak := 0;  -- Needs separate calculation
  longest_streak := 0;  -- Needs separate calculation
  total_distance_km := 0;  -- Needs path calculation
  rank_global := global_rank;
  rank_percentile := CASE
    WHEN total_players > 0
    THEN ROUND((1 - (global_rank::DECIMAL / total_players)) * 100, 2)
    ELSE 0
  END;

  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- Streak calculation function
-- =============================================

CREATE OR REPLACE FUNCTION calculate_streak(p_user_id UUID)
RETURNS TABLE (
  current_streak INTEGER,
  longest_streak INTEGER,
  streak_active BOOLEAN
) AS $$
DECLARE
  play_dates DATE[];
  curr_streak INTEGER := 0;
  max_streak INTEGER := 0;
  temp_streak INTEGER := 0;
  prev_date DATE;
  d DATE;
BEGIN
  -- Get distinct play dates ordered
  SELECT ARRAY_AGG(DISTINCT DATE(created_at) ORDER BY DATE(created_at) DESC)
  INTO play_dates
  FROM games
  WHERE user_id = p_user_id;

  IF play_dates IS NULL OR ARRAY_LENGTH(play_dates, 1) = 0 THEN
    current_streak := 0;
    longest_streak := 0;
    streak_active := FALSE;
    RETURN NEXT;
    RETURN;
  END IF;

  -- Check if played today or yesterday (streak still active)
  streak_active := play_dates[1] >= CURRENT_DATE - INTERVAL '1 day';

  -- Calculate streaks
  prev_date := NULL;
  temp_streak := 0;

  FOREACH d IN ARRAY play_dates LOOP
    IF prev_date IS NULL THEN
      temp_streak := 1;
    ELSIF prev_date - d = 1 THEN
      temp_streak := temp_streak + 1;
    ELSE
      -- Streak broken
      IF curr_streak = 0 AND streak_active THEN
        curr_streak := temp_streak;
      END IF;
      max_streak := GREATEST(max_streak, temp_streak);
      temp_streak := 1;
    END IF;
    prev_date := d;
  END LOOP;

  -- Final streak
  IF curr_streak = 0 AND streak_active THEN
    curr_streak := temp_streak;
  END IF;
  max_streak := GREATEST(max_streak, temp_streak);

  current_streak := curr_streak;
  longest_streak := max_streak;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- Leaderboard with stats
-- =============================================

CREATE OR REPLACE VIEW leaderboard_detailed AS
SELECT
  l.user_id,
  l.username,
  l.best_efficiency,
  l.avg_efficiency,
  l.total_games,
  l.updated_at,
  ROW_NUMBER() OVER (ORDER BY l.best_efficiency DESC) as rank,
  us.unique_cities,
  us.perfect_rounds,
  us.days_played
FROM leaderboards l
LEFT JOIN user_stats us ON us.user_id = l.user_id
ORDER BY l.best_efficiency DESC;

-- =============================================
-- Add games table columns for better tracking
-- (Run these if columns don't exist)
-- =============================================

-- Add duration tracking to games
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'games' AND column_name = 'started_at'
  ) THEN
    ALTER TABLE games ADD COLUMN started_at TIMESTAMPTZ;
    ALTER TABLE games ADD COLUMN completed_at TIMESTAMPTZ;
    ALTER TABLE games ADD COLUMN duration_ms INTEGER;
  END IF;
END $$;

-- Add location type tracking
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'games' AND column_name = 'location_type'
  ) THEN
    ALTER TABLE games ADD COLUMN location_type TEXT;  -- 'local', 'us_city', 'global'
  END IF;
END $$;
