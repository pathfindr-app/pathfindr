-- Analytics Events Table
-- Lightweight event logging for analytics and funnel tracking

CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,  -- nullable for anonymous users
  session_id TEXT NOT NULL,
  event_name TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  platform TEXT,  -- 'web', 'ios', 'android'
  app_version TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_events_name ON events(event_name);
CREATE INDEX IF NOT EXISTS idx_events_user ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_session ON events(session_id);
CREATE INDEX IF NOT EXISTS idx_events_created ON events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_name_created ON events(event_name, created_at DESC);

-- Enable Row Level Security
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Users can only read their own events (for debugging)
CREATE POLICY "Users can read own events" ON events
  FOR SELECT USING (auth.uid() = user_id);

-- Anyone can insert events (including anonymous)
CREATE POLICY "Anyone can insert events" ON events
  FOR INSERT WITH CHECK (true);

-- Service role can read all events for analytics
CREATE POLICY "Service role can read all events" ON events
  FOR SELECT USING (true);

-- =============================================
-- Sessions Table
-- Track user sessions for engagement metrics
-- =============================================

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,  -- Client-generated UUID
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  platform TEXT,
  app_version TEXT,
  device_info JSONB DEFAULT '{}',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  games_played INTEGER DEFAULT 0,
  rounds_completed INTEGER DEFAULT 0,
  total_duration_ms INTEGER
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_started ON sessions(started_at DESC);

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own sessions" ON sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can insert sessions" ON sessions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update own session" ON sessions
  FOR UPDATE USING (true);

-- =============================================
-- Funnels Table
-- Track conversion funnel progress
-- =============================================

CREATE TABLE IF NOT EXISTS funnels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id TEXT,
  step TEXT NOT NULL,  -- 'landing', 'first_game', 'completed_game', 'viewed_premium', 'purchased'
  reached_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_funnels_user ON funnels(user_id);
CREATE INDEX IF NOT EXISTS idx_funnels_step ON funnels(step);
CREATE INDEX IF NOT EXISTS idx_funnels_session ON funnels(session_id);

ALTER TABLE funnels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert funnel steps" ON funnels
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can read funnels" ON funnels
  FOR SELECT USING (true);

-- =============================================
-- Helper function for getting funnel metrics
-- =============================================

CREATE OR REPLACE FUNCTION get_funnel_metrics(
  p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  p_end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
  step TEXT,
  count BIGINT,
  conversion_rate NUMERIC
) AS $$
DECLARE
  total_landing BIGINT;
BEGIN
  -- Get total landing count first
  SELECT COUNT(DISTINCT COALESCE(user_id::text, session_id))
  INTO total_landing
  FROM funnels
  WHERE step = 'landing'
    AND reached_at BETWEEN p_start_date AND p_end_date;

  RETURN QUERY
  SELECT
    f.step,
    COUNT(DISTINCT COALESCE(f.user_id::text, f.session_id)) as count,
    CASE
      WHEN total_landing > 0
      THEN ROUND(COUNT(DISTINCT COALESCE(f.user_id::text, f.session_id))::NUMERIC / total_landing * 100, 2)
      ELSE 0
    END as conversion_rate
  FROM funnels f
  WHERE f.reached_at BETWEEN p_start_date AND p_end_date
  GROUP BY f.step
  ORDER BY
    CASE f.step
      WHEN 'landing' THEN 1
      WHEN 'first_game' THEN 2
      WHEN 'completed_game' THEN 3
      WHEN 'viewed_premium' THEN 4
      WHEN 'purchased' THEN 5
      ELSE 6
    END;
END;
$$ LANGUAGE plpgsql;
