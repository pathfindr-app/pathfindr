-- Achievements System
-- Gamification layer for player engagement

-- Achievement definitions
CREATE TABLE IF NOT EXISTS achievements (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT,  -- emoji or icon name
  category TEXT DEFAULT 'general',  -- 'general', 'exploration', 'skill', 'dedication'
  requirement_type TEXT NOT NULL,  -- 'games_played', 'cities_visited', 'efficiency', 'streak', etc.
  requirement_value INTEGER NOT NULL,
  points INTEGER DEFAULT 10,
  rarity TEXT DEFAULT 'common',  -- 'common', 'uncommon', 'rare', 'epic', 'legendary'
  hidden BOOLEAN DEFAULT FALSE,  -- secret achievements
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User achievement progress/unlocks
CREATE TABLE IF NOT EXISTS user_achievements (
  user_id UUID,
  achievement_id TEXT,
  progress INTEGER DEFAULT 0,  -- current progress toward requirement
  unlocked_at TIMESTAMPTZ,  -- null if not yet unlocked
  notified BOOLEAN DEFAULT FALSE,  -- has user been notified?
  PRIMARY KEY (user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);

ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies
DROP POLICY IF EXISTS "Anyone can read achievements" ON achievements;
DROP POLICY IF EXISTS "Users can read own achievements" ON user_achievements;
DROP POLICY IF EXISTS "Users can update own achievements" ON user_achievements;
DROP POLICY IF EXISTS "Service role can manage achievements" ON user_achievements;
DROP POLICY IF EXISTS "Anyone can insert user achievements" ON user_achievements;

CREATE POLICY "Anyone can read achievements" ON achievements
  FOR SELECT USING (true);

CREATE POLICY "Users can read own achievements" ON user_achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own achievements" ON user_achievements
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can insert user achievements" ON user_achievements
  FOR INSERT WITH CHECK (true);

-- =============================================
-- Seed initial achievements (use upsert to avoid duplicates)
-- =============================================

INSERT INTO achievements (id, name, description, icon, category, requirement_type, requirement_value, points, rarity) VALUES
  -- Getting Started
  ('first_steps', 'First Steps', 'Complete your first round', '🚶', 'general', 'rounds_completed', 1, 5, 'common'),
  ('pathfinder', 'Pathfinder', 'Complete your first full game (5 rounds)', '🗺️', 'general', 'games_completed', 1, 10, 'common'),
  ('regular', 'Regular', 'Complete 10 games', '🎮', 'general', 'games_completed', 10, 25, 'uncommon'),
  ('veteran', 'Veteran', 'Complete 50 games', '🎖️', 'general', 'games_completed', 50, 50, 'rare'),
  ('master', 'Master Navigator', 'Complete 100 games', '🏆', 'general', 'games_completed', 100, 100, 'epic'),

  -- Exploration
  ('explorer', 'Explorer', 'Visit 10 unique cities', '🌆', 'exploration', 'cities_visited', 10, 20, 'common'),
  ('globe_trotter', 'Globe Trotter', 'Visit 50 unique cities', '🌍', 'exploration', 'cities_visited', 50, 50, 'rare'),
  ('world_traveler', 'World Traveler', 'Visit 100 unique cities', '✈️', 'exploration', 'cities_visited', 100, 100, 'epic'),
  ('cartographer', 'Cartographer', 'Visit 250 unique cities', '🗺️', 'exploration', 'cities_visited', 250, 200, 'legendary'),

  -- Regional exploration
  ('region_hopper', 'Region Hopper', 'Play in 5 different regions/states', '🏔️', 'exploration', 'regions_visited', 5, 15, 'common'),
  ('continental', 'Continental', 'Play in 15 different regions', '🌎', 'exploration', 'regions_visited', 15, 40, 'uncommon'),
  ('international', 'International', 'Play in 30 different regions/countries', '🌐', 'exploration', 'regions_visited', 30, 75, 'rare'),

  -- Skill-based
  ('sharp', 'Sharp', 'Achieve 90%+ efficiency in a round', '🎯', 'skill', 'best_efficiency', 90, 15, 'common'),
  ('perfectionist', 'Perfectionist', 'Achieve 95%+ efficiency in a round', '💎', 'skill', 'best_efficiency', 95, 30, 'uncommon'),
  ('flawless', 'Flawless', 'Achieve 98%+ efficiency in a round', '⭐', 'skill', 'best_efficiency', 98, 50, 'rare'),
  ('machine', 'The Machine', 'Achieve 99%+ efficiency in a round', '🤖', 'skill', 'best_efficiency', 99, 100, 'epic'),

  -- Consistency
  ('consistent', 'Consistent', 'Maintain 80%+ average efficiency over 20 rounds', '📊', 'skill', 'avg_efficiency_20', 80, 40, 'uncommon'),
  ('reliable', 'Reliable', 'Maintain 85%+ average efficiency over 50 rounds', '📈', 'skill', 'avg_efficiency_50', 85, 75, 'rare'),

  -- Dedication
  ('daily_driver', 'Daily Driver', 'Play 3 days in a row', '📅', 'dedication', 'streak_days', 3, 15, 'common'),
  ('committed', 'Committed', 'Play 7 days in a row', '🔥', 'dedication', 'streak_days', 7, 35, 'uncommon'),
  ('devoted', 'Devoted', 'Play 14 days in a row', '💪', 'dedication', 'streak_days', 14, 60, 'rare'),
  ('legendary_streak', 'Legendary Streak', 'Play 30 days in a row', '👑', 'dedication', 'streak_days', 30, 150, 'legendary'),

  -- Distance
  ('marathon', 'Marathon', 'Draw 100km of routes total', '🏃', 'exploration', 'total_distance_km', 100, 20, 'common'),
  ('ultra', 'Ultra Runner', 'Draw 500km of routes total', '🏅', 'exploration', 'total_distance_km', 500, 50, 'uncommon'),
  ('circumnavigator', 'Circumnavigator', 'Draw 2000km of routes total', '🛰️', 'exploration', 'total_distance_km', 2000, 100, 'rare'),

  -- Special/Hidden
  ('night_owl', 'Night Owl', 'Play a game between 2am and 5am local time', '🦉', 'general', 'special_night', 1, 25, 'uncommon'),
  ('early_bird', 'Early Bird', 'Play a game between 5am and 7am local time', '🐦', 'general', 'special_morning', 1, 25, 'uncommon'),
  ('hometown', 'Home Turf', 'Play 10 games in your local area', '🏠', 'exploration', 'local_games', 10, 30, 'uncommon'),
  ('speed_demon', 'Speed Demon', 'Complete a round in under 30 seconds', '⚡', 'skill', 'special_speed', 1, 35, 'rare')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  category = EXCLUDED.category,
  requirement_type = EXCLUDED.requirement_type,
  requirement_value = EXCLUDED.requirement_value,
  points = EXCLUDED.points,
  rarity = EXCLUDED.rarity;

-- =============================================
-- Function to check and unlock achievements
-- =============================================

CREATE OR REPLACE FUNCTION check_achievements(p_user_id UUID)
RETURNS TABLE (
  achievement_id TEXT,
  achievement_name TEXT,
  newly_unlocked BOOLEAN
) AS $$
DECLARE
  user_stats RECORD;
  ach RECORD;
  current_progress INTEGER;
  was_unlocked BOOLEAN;
BEGIN
  -- Get user stats from games table
  SELECT
    COUNT(*)::INTEGER as total_rounds,
    (COUNT(*) / 5)::INTEGER as total_games,
    COUNT(DISTINCT location_name)::INTEGER as cities,
    COALESCE(MAX(efficiency_percentage), 0)::INTEGER as best_efficiency,
    COALESCE(AVG(efficiency_percentage), 0)::INTEGER as avg_efficiency
  INTO user_stats
  FROM games
  WHERE games.user_id = p_user_id;

  -- Check each achievement
  FOR ach IN SELECT * FROM achievements LOOP
    current_progress := 0;
    was_unlocked := FALSE;

    -- Calculate progress based on requirement type
    CASE ach.requirement_type
      WHEN 'rounds_completed' THEN current_progress := COALESCE(user_stats.total_rounds, 0);
      WHEN 'games_completed' THEN current_progress := COALESCE(user_stats.total_games, 0);
      WHEN 'cities_visited' THEN current_progress := COALESCE(user_stats.cities, 0);
      WHEN 'best_efficiency' THEN current_progress := COALESCE(user_stats.best_efficiency, 0);
      ELSE current_progress := 0;
    END CASE;

    -- Check if already unlocked
    SELECT (ua.unlocked_at IS NOT NULL) INTO was_unlocked
    FROM user_achievements ua
    WHERE ua.user_id = p_user_id
      AND ua.achievement_id = ach.id;

    -- Upsert progress
    INSERT INTO user_achievements (user_id, achievement_id, progress, unlocked_at)
    VALUES (
      p_user_id,
      ach.id,
      current_progress,
      CASE WHEN current_progress >= ach.requirement_value THEN NOW() ELSE NULL END
    )
    ON CONFLICT (user_id, achievement_id) DO UPDATE
    SET progress = EXCLUDED.progress,
        unlocked_at = CASE
          WHEN user_achievements.unlocked_at IS NULL AND EXCLUDED.progress >= ach.requirement_value
          THEN NOW()
          ELSE user_achievements.unlocked_at
        END;

    -- Return if newly unlocked
    IF current_progress >= ach.requirement_value AND NOT COALESCE(was_unlocked, FALSE) THEN
      achievement_id := ach.id;
      achievement_name := ach.name;
      newly_unlocked := TRUE;
      RETURN NEXT;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
