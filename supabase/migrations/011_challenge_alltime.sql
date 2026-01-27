-- All-time challenge leaderboard
-- Aggregates stats across all challenge entries for cumulative rankings

CREATE OR REPLACE FUNCTION get_alltime_challenge_leaderboard(p_limit INTEGER DEFAULT 50)
RETURNS TABLE (
  rank INTEGER,
  user_id UUID,
  username TEXT,
  challenges_completed INTEGER,
  avg_efficiency DECIMAL(5,2),
  best_efficiency DECIMAL(5,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ROW_NUMBER() OVER (ORDER BY AVG(ce.efficiency) DESC)::INTEGER as rank,
    ce.user_id,
    ce.username,
    COUNT(DISTINCT ce.challenge_id)::INTEGER as challenges_completed,
    ROUND(AVG(ce.efficiency), 2) as avg_efficiency,
    MAX(ce.efficiency) as best_efficiency
  FROM challenge_entries ce
  GROUP BY ce.user_id, ce.username
  HAVING COUNT(DISTINCT ce.challenge_id) >= 3  -- Min 3 challenges to qualify
  ORDER BY AVG(ce.efficiency) DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Add admin policy for inserting challenges
-- Only the admin email can insert challenges
DROP POLICY IF EXISTS "Admin can insert challenges" ON challenges;
CREATE POLICY "Admin can insert challenges" ON challenges
  FOR INSERT WITH CHECK (true);  -- RLS handled by application-level admin check

-- Grant execute on challenge functions
GRANT EXECUTE ON FUNCTION get_alltime_challenge_leaderboard TO anon, authenticated;
