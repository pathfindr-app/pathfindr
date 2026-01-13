-- Replays / Ghost Routes System
-- Store path data for replay and ghost racing

CREATE TABLE IF NOT EXISTS replays (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID,  -- Reference to games table if it exists
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,

  -- Location data
  location_name TEXT NOT NULL,
  center_lat DECIMAL(10,7) NOT NULL,
  center_lng DECIMAL(10,7) NOT NULL,
  zoom_level INTEGER,

  -- Path data - timestamped for replay
  path_data JSONB NOT NULL,  -- Array of {lat, lng, timestamp_ms}
  optimal_path JSONB,  -- A* path for comparison

  -- Performance
  efficiency DECIMAL(5,2) NOT NULL,
  duration_ms INTEGER,  -- Time to complete

  -- Flags
  is_featured BOOLEAN DEFAULT FALSE,  -- Staff picks
  is_personal_best BOOLEAN DEFAULT FALSE,  -- User's best for this location

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_replays_user ON replays(user_id);
CREATE INDEX IF NOT EXISTS idx_replays_location ON replays(location_name);
CREATE INDEX IF NOT EXISTS idx_replays_efficiency ON replays(efficiency DESC);
CREATE INDEX IF NOT EXISTS idx_replays_featured ON replays(is_featured) WHERE is_featured = TRUE;

ALTER TABLE replays ENABLE ROW LEVEL SECURITY;

-- Anyone can read replays
CREATE POLICY "Anyone can read replays" ON replays
  FOR SELECT USING (true);

-- Users can insert their own replays
CREATE POLICY "Users can insert own replays" ON replays
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own replays
CREATE POLICY "Users can delete own replays" ON replays
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- Function to save a replay
-- =============================================

CREATE OR REPLACE FUNCTION save_replay(
  p_user_id UUID,
  p_username TEXT,
  p_location_name TEXT,
  p_center_lat DECIMAL(10,7),
  p_center_lng DECIMAL(10,7),
  p_zoom_level INTEGER,
  p_path_data JSONB,
  p_optimal_path JSONB,
  p_efficiency DECIMAL(5,2),
  p_duration_ms INTEGER
)
RETURNS UUID AS $$
DECLARE
  new_id UUID;
  is_pb BOOLEAN;
BEGIN
  -- Check if this is a personal best for this location
  SELECT p_efficiency > COALESCE(MAX(efficiency), 0) INTO is_pb
  FROM replays
  WHERE user_id = p_user_id
    AND location_name = p_location_name;

  -- If it's a new PB, mark old PBs as not PB
  IF is_pb THEN
    UPDATE replays
    SET is_personal_best = FALSE
    WHERE user_id = p_user_id
      AND location_name = p_location_name
      AND is_personal_best = TRUE;
  END IF;

  -- Insert new replay
  INSERT INTO replays (
    user_id, username, location_name, center_lat, center_lng, zoom_level,
    path_data, optimal_path, efficiency, duration_ms, is_personal_best
  )
  VALUES (
    p_user_id, p_username, p_location_name, p_center_lat, p_center_lng, p_zoom_level,
    p_path_data, p_optimal_path, p_efficiency, p_duration_ms, is_pb
  )
  RETURNING id INTO new_id;

  -- Cleanup: keep only top 5 replays per user per location (plus any PBs)
  DELETE FROM replays
  WHERE id IN (
    SELECT id FROM (
      SELECT id,
        ROW_NUMBER() OVER (PARTITION BY user_id, location_name ORDER BY efficiency DESC) as rn
      FROM replays
      WHERE user_id = p_user_id
        AND location_name = p_location_name
        AND is_personal_best = FALSE
    ) ranked
    WHERE rn > 5
  );

  RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- Function to get ghost for a location
-- =============================================

CREATE OR REPLACE FUNCTION get_ghost(
  p_location_name TEXT,
  p_ghost_type TEXT DEFAULT 'best'  -- 'best', 'featured', 'random'
)
RETURNS TABLE (
  replay_id UUID,
  username TEXT,
  path_data JSONB,
  efficiency DECIMAL(5,2),
  duration_ms INTEGER
) AS $$
BEGIN
  IF p_ghost_type = 'best' THEN
    RETURN QUERY
    SELECT r.id, r.username, r.path_data, r.efficiency, r.duration_ms
    FROM replays r
    WHERE r.location_name = p_location_name
    ORDER BY r.efficiency DESC
    LIMIT 1;
  ELSIF p_ghost_type = 'featured' THEN
    RETURN QUERY
    SELECT r.id, r.username, r.path_data, r.efficiency, r.duration_ms
    FROM replays r
    WHERE r.location_name = p_location_name AND r.is_featured = TRUE
    ORDER BY RANDOM()
    LIMIT 1;
  ELSE  -- random
    RETURN QUERY
    SELECT r.id, r.username, r.path_data, r.efficiency, r.duration_ms
    FROM replays r
    WHERE r.location_name = p_location_name
    ORDER BY RANDOM()
    LIMIT 1;
  END IF;
END;
$$ LANGUAGE plpgsql;
