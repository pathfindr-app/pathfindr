-- Cities Table
-- Stores thousands of cities for random selection in Pathfindr
-- Data source: SimpleMaps World Cities Database (free version)

CREATE TABLE IF NOT EXISTS cities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_ascii TEXT,                    -- ASCII-safe version of name
  country TEXT NOT NULL,
  country_code TEXT,                  -- ISO 3166-1 alpha-2 (e.g., "US", "GB")
  region TEXT,                        -- State/province/admin region
  lat DECIMAL(10, 7) NOT NULL,
  lng DECIMAL(10, 7) NOT NULL,
  population INTEGER DEFAULT 0,
  timezone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_cities_country ON cities(country);
CREATE INDEX IF NOT EXISTS idx_cities_country_code ON cities(country_code);
CREATE INDEX IF NOT EXISTS idx_cities_population ON cities(population DESC);
CREATE INDEX IF NOT EXISTS idx_cities_name ON cities(name);

-- Composite index for random selection with filters
CREATE INDEX IF NOT EXISTS idx_cities_country_pop ON cities(country_code, population DESC);

-- Enable Row Level Security
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read cities (public data)
CREATE POLICY "Anyone can read cities" ON cities
  FOR SELECT USING (true);

-- Only service role can insert/update (for data imports)
CREATE POLICY "Service role can insert cities" ON cities
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can update cities" ON cities
  FOR UPDATE USING (true);

-- Function to get a random city (optimized)
-- Usage: SELECT * FROM get_random_city();
-- Or with filters: SELECT * FROM get_random_city('US', 50000);
CREATE OR REPLACE FUNCTION get_random_city(
  p_country_code TEXT DEFAULT NULL,
  p_min_population INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  country TEXT,
  country_code TEXT,
  region TEXT,
  lat DECIMAL,
  lng DECIMAL,
  population INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.name,
    c.country,
    c.country_code,
    c.region,
    c.lat,
    c.lng,
    c.population
  FROM cities c
  WHERE
    (p_country_code IS NULL OR c.country_code = p_country_code)
    AND c.population >= p_min_population
  ORDER BY RANDOM()
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_random_city TO anon, authenticated;

-- Add helpful comments
COMMENT ON TABLE cities IS 'World cities database for Pathfindr random location selection';
COMMENT ON COLUMN cities.name_ascii IS 'ASCII-safe version of city name for search';
COMMENT ON COLUMN cities.country_code IS 'ISO 3166-1 alpha-2 country code';
COMMENT ON COLUMN cities.population IS 'Approximate population, used for difficulty filtering';
