-- Clean up challenges from non-curated cities that may have Overpass API issues
-- Delete hourly challenges not from our curated city pools

DELETE FROM challenges
WHERE challenge_type = 'hourly'
AND city_name NOT IN (
  -- US Cities (curated pool)
  'New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX', 'Phoenix, AZ',
  'Philadelphia, PA', 'San Antonio, TX', 'San Diego, CA', 'Dallas, TX', 'Austin, TX',
  'San Francisco, CA', 'Seattle, WA', 'Denver, CO', 'Boston, MA', 'Miami, FL',
  'Atlanta, GA', 'Portland, OR', 'Las Vegas, NV', 'Nashville, TN', 'New Orleans, LA',
  -- Global Cities (curated pool)
  'London, UK', 'Paris, France', 'Tokyo, Japan', 'Berlin, Germany', 'Sydney, Australia',
  'Toronto, Canada', 'Amsterdam, Netherlands', 'Rome, Italy', 'Barcelona, Spain',
  'Singapore', 'Melbourne, Australia', 'Madrid, Spain', 'Munich, Germany',
  'Vienna, Austria', 'Stockholm, Sweden'
);
