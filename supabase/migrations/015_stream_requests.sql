-- Interactive stream request queue for 24/7 visualizer mode
-- Supports free + paid priority and renderer state telemetry

CREATE TABLE IF NOT EXISTS stream_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  platform TEXT NOT NULL DEFAULT 'youtube',
  message_id TEXT,
  user_id TEXT,
  display_name TEXT,
  request_text TEXT,
  normalized_city TEXT NOT NULL,
  center_lat DECIMAL(10,7),
  center_lng DECIMAL(10,7),
  zoom_level INTEGER DEFAULT 15,
  requested_by TEXT,
  source_type TEXT, -- chat, super_chat, api, manual
  priority_tier TEXT NOT NULL DEFAULT 'free', -- free | paid
  priority_score INTEGER NOT NULL DEFAULT 0, -- larger = sooner
  source_amount_micros BIGINT,
  source_currency TEXT,
  status TEXT NOT NULL DEFAULT 'queued', -- queued | claimed | played | rejected | expired
  claimed_at TIMESTAMPTZ,
  played_at TIMESTAMPTZ,
  rejected_reason TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT stream_requests_status_check CHECK (status IN ('queued', 'claimed', 'played', 'rejected', 'expired')),
  CONSTRAINT stream_requests_priority_tier_check CHECK (priority_tier IN ('free', 'paid')),
  CONSTRAINT stream_requests_zoom_check CHECK (zoom_level BETWEEN 0 AND 22)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_stream_requests_message_id_unique
  ON stream_requests(message_id)
  WHERE message_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_stream_requests_queue_order
  ON stream_requests(status, priority_score DESC, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_stream_requests_created
  ON stream_requests(created_at DESC);

-- Store renderer heartbeat and currently playing city
CREATE TABLE IF NOT EXISTS stream_state (
  id INTEGER PRIMARY KEY DEFAULT 1,
  event_type TEXT,
  current_city TEXT,
  requested_by TEXT,
  current_request_id UUID REFERENCES stream_requests(id),
  queue_depth_paid INTEGER DEFAULT 0,
  queue_depth_free INTEGER DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT stream_state_singleton CHECK (id = 1)
);

-- Ensure singleton row exists
INSERT INTO stream_state (id, event_type, current_city)
VALUES (1, 'init', NULL)
ON CONFLICT (id) DO NOTHING;

-- Keep updated_at timestamps fresh
CREATE TRIGGER update_stream_requests_updated_at
  BEFORE UPDATE ON stream_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stream_state_updated_at
  BEFORE UPDATE ON stream_state
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Atomic dequeue for workers/controllers.
-- Uses SKIP LOCKED so multiple workers can run without collisions.
CREATE OR REPLACE FUNCTION dequeue_stream_request()
RETURNS TABLE (
  id UUID,
  normalized_city TEXT,
  center_lat DECIMAL(10,7),
  center_lng DECIMAL(10,7),
  zoom_level INTEGER,
  requested_by TEXT,
  priority_tier TEXT,
  priority_score INTEGER
) AS $$
DECLARE
  v_request stream_requests%ROWTYPE;
BEGIN
  SELECT *
  INTO v_request
  FROM stream_requests
  WHERE status = 'queued'
  ORDER BY priority_score DESC, created_at ASC
  FOR UPDATE SKIP LOCKED
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  UPDATE stream_requests
  SET status = 'claimed',
      claimed_at = NOW(),
      updated_at = NOW()
  WHERE stream_requests.id = v_request.id;

  RETURN QUERY
  SELECT
    v_request.id,
    v_request.normalized_city,
    v_request.center_lat,
    v_request.center_lng,
    v_request.zoom_level,
    v_request.requested_by,
    v_request.priority_tier,
    v_request.priority_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Public-safe queue/status view for overlays (no sensitive IDs)
CREATE OR REPLACE VIEW stream_queue_public AS
SELECT
  COUNT(*) FILTER (WHERE status = 'queued' AND priority_tier = 'paid')::INTEGER AS queue_depth_paid,
  COUNT(*) FILTER (WHERE status = 'queued' AND priority_tier = 'free')::INTEGER AS queue_depth_free,
  MAX(created_at) FILTER (WHERE status = 'queued') AS latest_request_at
FROM stream_requests;

-- RLS
ALTER TABLE stream_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_state ENABLE ROW LEVEL SECURITY;

-- Read-only access for dashboards/overlays
CREATE POLICY "Anyone can read stream state"
  ON stream_state
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can read stream requests"
  ON stream_requests
  FOR SELECT
  USING (true);

-- Service role can mutate stream queue/state.
-- Supabase service role bypasses RLS, but explicit policies keep intent clear.
CREATE POLICY "Service can insert stream requests"
  ON stream_requests
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service can update stream requests"
  ON stream_requests
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service can update stream state"
  ON stream_state
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Grants
GRANT SELECT ON stream_queue_public TO anon, authenticated;
GRANT SELECT ON stream_requests TO anon, authenticated;
GRANT SELECT ON stream_state TO anon, authenticated;
GRANT EXECUTE ON FUNCTION dequeue_stream_request TO service_role;

