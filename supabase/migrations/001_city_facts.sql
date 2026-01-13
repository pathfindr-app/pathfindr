-- City Facts Table
-- Caches LLM-generated facts about cities for the Pathfindr game

CREATE TABLE IF NOT EXISTS city_facts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  city_name TEXT NOT NULL UNIQUE,
  display_name TEXT,  -- Formatted name for display
  country TEXT,
  facts JSONB NOT NULL DEFAULT '[]',  -- Array of fact strings
  wikipedia_extract TEXT,  -- Raw Wikipedia text (for debugging/regeneration)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups by city name
CREATE INDEX IF NOT EXISTS idx_city_facts_name ON city_facts(city_name);

-- Enable Row Level Security
ALTER TABLE city_facts ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read facts (public data)
CREATE POLICY "Anyone can read city facts" ON city_facts
  FOR SELECT USING (true);

-- Only service role can insert/update (edge functions)
CREATE POLICY "Service role can insert facts" ON city_facts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can update facts" ON city_facts
  FOR UPDATE USING (true);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
CREATE TRIGGER update_city_facts_updated_at
  BEFORE UPDATE ON city_facts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
