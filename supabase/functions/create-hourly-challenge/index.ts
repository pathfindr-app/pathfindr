// Supabase Edge Function: create-hourly-challenge
// Automatically creates hourly challenges with 36-hour active windows
// Called by external cron job (GitHub Actions) every hour

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// City pools for variety (fallback if database query fails)
const US_CITIES = [
  { name: "New York, NY", lat: 40.7128, lng: -74.0060 },
  { name: "Los Angeles, CA", lat: 34.0522, lng: -118.2437 },
  { name: "Chicago, IL", lat: 41.8781, lng: -87.6298 },
  { name: "Houston, TX", lat: 29.7604, lng: -95.3698 },
  { name: "Phoenix, AZ", lat: 33.4484, lng: -112.0740 },
  { name: "Philadelphia, PA", lat: 39.9526, lng: -75.1652 },
  { name: "San Antonio, TX", lat: 29.4241, lng: -98.4936 },
  { name: "San Diego, CA", lat: 32.7157, lng: -117.1611 },
  { name: "Dallas, TX", lat: 32.7767, lng: -96.7970 },
  { name: "Austin, TX", lat: 30.2672, lng: -97.7431 },
  { name: "San Francisco, CA", lat: 37.7749, lng: -122.4194 },
  { name: "Seattle, WA", lat: 47.6062, lng: -122.3321 },
  { name: "Denver, CO", lat: 39.7392, lng: -104.9903 },
  { name: "Boston, MA", lat: 42.3601, lng: -71.0589 },
  { name: "Miami, FL", lat: 25.7617, lng: -80.1918 },
  { name: "Atlanta, GA", lat: 33.7490, lng: -84.3880 },
  { name: "Portland, OR", lat: 45.5152, lng: -122.6784 },
  { name: "Las Vegas, NV", lat: 36.1699, lng: -115.1398 },
  { name: "Nashville, TN", lat: 36.1627, lng: -86.7816 },
  { name: "New Orleans, LA", lat: 29.9511, lng: -90.0715 },
]

const GLOBAL_CITIES = [
  { name: "London, UK", lat: 51.5074, lng: -0.1278 },
  { name: "Paris, France", lat: 48.8566, lng: 2.3522 },
  { name: "Tokyo, Japan", lat: 35.6762, lng: 139.6503 },
  { name: "Berlin, Germany", lat: 52.5200, lng: 13.4050 },
  { name: "Sydney, Australia", lat: -33.8688, lng: 151.2093 },
  { name: "Toronto, Canada", lat: 43.6532, lng: -79.3832 },
  { name: "Amsterdam, Netherlands", lat: 52.3676, lng: 4.9041 },
  { name: "Rome, Italy", lat: 41.9028, lng: 12.4964 },
  { name: "Barcelona, Spain", lat: 41.3851, lng: 2.1734 },
  { name: "Singapore", lat: 1.3521, lng: 103.8198 },
  { name: "Melbourne, Australia", lat: -37.8136, lng: 144.9631 },
  { name: "Madrid, Spain", lat: 40.4168, lng: -3.7038 },
  { name: "Munich, Germany", lat: 48.1351, lng: 11.5820 },
  { name: "Vienna, Austria", lat: 48.2082, lng: 16.3738 },
  { name: "Stockholm, Sweden", lat: 59.3293, lng: 18.0686 },
]

interface City {
  name: string
  lat: number
  lng: number
}

/**
 * Generate start/end coordinates offset from city center
 * Creates points that are:
 * - At least 0.8km apart from each other
 * - Within 1.5km of the city center
 */
function generateStartEnd(centerLat: number, centerLng: number): {
  startLat: number
  startLng: number
  endLat: number
  endLng: number
} {
  // Offset values in degrees (approximately)
  // 0.01 degrees ~ 1.1km at equator (varies by latitude)
  const minOffset = 0.006  // ~0.6km
  const maxOffset = 0.012  // ~1.2km

  // Random angles for start and end
  const angle1 = Math.random() * 2 * Math.PI
  // End point roughly opposite from start (with some randomness)
  const angle2 = angle1 + Math.PI + (Math.random() - 0.5) * (Math.PI * 0.6)

  // Random distances
  const dist1 = minOffset + Math.random() * (maxOffset - minOffset)
  const dist2 = minOffset + Math.random() * (maxOffset - minOffset)

  return {
    startLat: centerLat + Math.sin(angle1) * dist1,
    startLng: centerLng + Math.cos(angle1) * dist1,
    endLat: centerLat + Math.sin(angle2) * dist2,
    endLng: centerLng + Math.cos(angle2) * dist2,
  }
}

/**
 * Get random city from database or fallback pool
 */
async function getRandomCity(supabase: ReturnType<typeof createClient>, useGlobal: boolean): Promise<City> {
  try {
    // Try to get from cities table
    const minPopulation = useGlobal ? 100000 : 50000
    const countryFilter = useGlobal ? undefined : 'US'

    let query = supabase
      .from('cities')
      .select('name, lat, lng, region, country')

    if (countryFilter) {
      query = query.eq('country_code', countryFilter)
    }

    query = query.gte('population', minPopulation)

    // Get count for random offset
    const { count: totalCount } = await supabase
      .from('cities')
      .select('*', { count: 'exact', head: true })
      .match(countryFilter ? { country_code: countryFilter } : {})
      .gte('population', minPopulation)

    if (totalCount && totalCount > 0) {
      const offset = Math.floor(Math.random() * totalCount)

      let cityQuery = supabase
        .from('cities')
        .select('name, lat, lng, region, country')

      if (countryFilter) {
        cityQuery = cityQuery.eq('country_code', countryFilter)
      }

      cityQuery = cityQuery.gte('population', minPopulation)

      const { data, error } = await cityQuery
        .range(offset, offset)
        .single()

      if (!error && data) {
        // Format name with region for US cities
        const cityName = countryFilter === 'US' && data.region
          ? `${data.name}, ${data.region}`
          : `${data.name}, ${data.country || ''}`

        return {
          name: cityName.trim().replace(/, $/, ''),
          lat: data.lat,
          lng: data.lng,
        }
      }
    }
  } catch (e) {
    console.log('Database query failed, using fallback:', e)
  }

  // Fallback to hardcoded cities
  const pool = useGlobal ? GLOBAL_CITIES : US_CITIES
  return pool[Math.floor(Math.random() * pool.length)]
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify cron secret for authentication
    const authHeader = req.headers.get('Authorization')
    const cronSecret = Deno.env.get('CRON_SECRET')

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.log('Unauthorized request - invalid or missing CRON_SECRET')
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Determine if this hour should be global or US city
    // Every 3rd hour (0, 3, 6, 9...) is global
    const hour = new Date().getUTCHours()
    const useGlobal = hour % 3 === 0

    // Get random city
    const city = await getRandomCity(supabase, useGlobal)
    console.log(`Selected city: ${city.name} (${useGlobal ? 'Global' : 'US'})`)

    // Generate start/end coordinates
    const { startLat, startLng, endLat, endLng } = generateStartEnd(city.lat, city.lng)

    // Determine difficulty (weighted toward medium)
    const diffRoll = Math.random()
    const difficulty = diffRoll < 0.2 ? 'easy' : diffRoll < 0.85 ? 'medium' : 'hard'

    // Create challenge via database function
    const { data, error } = await supabase.rpc('create_hourly_challenge', {
      p_city_name: city.name,
      p_center_lat: city.lat,
      p_center_lng: city.lng,
      p_start_lat: startLat,
      p_start_lng: startLng,
      p_end_lat: endLat,
      p_end_lng: endLng,
      p_difficulty: difficulty,
      p_hours_active: 36,
    })

    if (error) {
      throw error
    }

    console.log(`Challenge created: ${data} for ${city.name}`)

    return new Response(
      JSON.stringify({
        success: true,
        challenge_id: data,
        city: city.name,
        difficulty,
        type: useGlobal ? 'global' : 'us',
        active_hours: 36,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error creating hourly challenge:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
