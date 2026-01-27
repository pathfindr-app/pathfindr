-- Hourly Challenges System
-- Automated challenge creation with 36-hour active windows
-- Supports multiple concurrent active challenges

-- =============================================
-- Get multiple active challenges
-- =============================================

CREATE OR REPLACE FUNCTION get_active_challenges(
  p_type TEXT DEFAULT 'hourly',
  p_limit INTEGER DEFAULT 50
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
  difficulty TEXT,
  active_from TIMESTAMPTZ,
  active_until TIMESTAMPTZ,
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
    c.difficulty,
    c.active_from,
    c.active_until,
    COUNT(DISTINCT ce.user_id) as participant_count,
    MAX(ce.efficiency) as top_score
  FROM challenges c
  LEFT JOIN challenge_entries ce ON c.id = ce.challenge_id
  WHERE c.challenge_type = p_type
    AND NOW() BETWEEN c.active_from AND c.active_until
  GROUP BY c.id
  ORDER BY c.active_from DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- Create hourly challenge (for Edge Function)
-- =============================================

CREATE OR REPLACE FUNCTION create_hourly_challenge(
  p_city_name TEXT,
  p_center_lat DECIMAL(10,7),
  p_center_lng DECIMAL(10,7),
  p_start_lat DECIMAL(10,7),
  p_start_lng DECIMAL(10,7),
  p_end_lat DECIMAL(10,7),
  p_end_lng DECIMAL(10,7),
  p_difficulty TEXT DEFAULT 'medium',
  p_hours_active INTEGER DEFAULT 36
)
RETURNS UUID AS $$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO challenges (
    challenge_type, city_name, center_lat, center_lng, zoom_level,
    start_lat, start_lng, end_lat, end_lng,
    difficulty, active_from, active_until
  ) VALUES (
    'hourly', p_city_name, p_center_lat, p_center_lng, 15,
    p_start_lat, p_start_lng, p_end_lat, p_end_lng,
    p_difficulty, NOW(), NOW() + (p_hours_active || ' hours')::INTERVAL
  )
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- Get user's entries for multiple challenges
-- =============================================

CREATE OR REPLACE FUNCTION get_user_challenge_entries(
  p_user_id UUID,
  p_challenge_ids UUID[]
)
RETURNS TABLE (
  challenge_id UUID,
  efficiency DECIMAL(5,2),
  duration_ms INTEGER,
  submitted_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ce.challenge_id,
    ce.efficiency,
    ce.duration_ms,
    ce.submitted_at
  FROM challenge_entries ce
  WHERE ce.user_id = p_user_id
    AND ce.challenge_id = ANY(p_challenge_ids);
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- Grant permissions
-- =============================================

GRANT EXECUTE ON FUNCTION get_active_challenges TO anon, authenticated;
GRANT EXECUTE ON FUNCTION create_hourly_challenge TO service_role;
GRANT EXECUTE ON FUNCTION get_user_challenge_entries TO anon, authenticated;
