-- User Stats Functions
-- Comprehensive statistics for player profiles

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
    COUNT(DISTINCT g.location_name)::INTEGER as cities,
    ROUND(AVG(g.efficiency_percentage), 2) as avg_eff,
    MAX(g.efficiency_percentage) as best_eff,
    COUNT(*) FILTER (WHERE g.efficiency_percentage >= 95)::INTEGER as perfect
  INTO stats
  FROM games g
  WHERE g.user_id = p_user_id;

  -- Global rank
  SELECT COUNT(*) + 1 INTO global_rank
  FROM leaderboards l
  WHERE l.best_efficiency > COALESCE(stats.best_eff, 0);

  SELECT COUNT(*) INTO total_players FROM leaderboards;

  -- Build return
  total_rounds := COALESCE(stats.rounds, 0);
  total_games := COALESCE(stats.games, 0);
  unique_cities := COALESCE(stats.cities, 0);
  unique_regions := 0;
  avg_efficiency := COALESCE(stats.avg_eff, 0);
  best_efficiency := COALESCE(stats.best_eff, 0);
  perfect_rounds := COALESCE(stats.perfect, 0);
  current_streak := 0;
  longest_streak := 0;
  total_distance_km := 0;
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
  is_active BOOLEAN := FALSE;
BEGIN
  -- Get distinct play dates ordered
  SELECT ARRAY_AGG(DISTINCT DATE(g.created_at) ORDER BY DATE(g.created_at) DESC)
  INTO play_dates
  FROM games g
  WHERE g.user_id = p_user_id;

  IF play_dates IS NULL OR ARRAY_LENGTH(play_dates, 1) = 0 THEN
    current_streak := 0;
    longest_streak := 0;
    streak_active := FALSE;
    RETURN NEXT;
    RETURN;
  END IF;

  -- Check if played today or yesterday (streak still active)
  is_active := play_dates[1] >= CURRENT_DATE - INTERVAL '1 day';

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
      IF curr_streak = 0 AND is_active THEN
        curr_streak := temp_streak;
      END IF;
      max_streak := GREATEST(max_streak, temp_streak);
      temp_streak := 1;
    END IF;
    prev_date := d;
  END LOOP;

  -- Final streak
  IF curr_streak = 0 AND is_active THEN
    curr_streak := temp_streak;
  END IF;
  max_streak := GREATEST(max_streak, temp_streak);

  current_streak := curr_streak;
  longest_streak := max_streak;
  streak_active := is_active;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;
