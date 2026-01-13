// Supabase Edge Function: get-random-city
// Returns a random city from the cities database
// Supports optional filtering by country and minimum population

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RandomCityRequest {
  country_code?: string    // ISO 3166-1 alpha-2 (e.g., "US", "GB")
  min_population?: number  // Minimum population filter
  count?: number           // Number of cities to return (default 1, max 10)
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request - support both GET query params and POST body
    let params: RandomCityRequest = {}

    if (req.method === 'GET') {
      const url = new URL(req.url)
      params = {
        country_code: url.searchParams.get('country_code') || undefined,
        min_population: url.searchParams.get('min_population')
          ? parseInt(url.searchParams.get('min_population')!)
          : undefined,
        count: url.searchParams.get('count')
          ? parseInt(url.searchParams.get('count')!)
          : 1,
      }
    } else if (req.method === 'POST') {
      params = await req.json()
    }

    // Validate count
    const count = Math.min(Math.max(params.count || 1, 1), 10)

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Build query
    let query = supabase
      .from('cities')
      .select('id, name, country, country_code, region, lat, lng, population')

    // Apply filters
    if (params.country_code) {
      query = query.eq('country_code', params.country_code.toUpperCase())
    }
    if (params.min_population && params.min_population > 0) {
      query = query.gte('population', params.min_population)
    }

    // Get total count for random offset
    const { count: totalCount, error: countError } = await supabase
      .from('cities')
      .select('*', { count: 'exact', head: true })
      .match(params.country_code ? { country_code: params.country_code.toUpperCase() } : {})
      .gte('population', params.min_population || 0)

    if (countError) {
      throw new Error(`Count error: ${countError.message}`)
    }

    if (!totalCount || totalCount === 0) {
      return new Response(
        JSON.stringify({
          error: 'No cities found matching criteria',
          cities: [],
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get random cities using random offset
    const cities = []
    const usedOffsets = new Set<number>()

    for (let i = 0; i < count && usedOffsets.size < totalCount; i++) {
      let offset: number
      do {
        offset = Math.floor(Math.random() * totalCount)
      } while (usedOffsets.has(offset) && usedOffsets.size < totalCount)
      usedOffsets.add(offset)

      // Re-apply filters for each query
      let cityQuery = supabase
        .from('cities')
        .select('id, name, country, country_code, region, lat, lng, population')

      if (params.country_code) {
        cityQuery = cityQuery.eq('country_code', params.country_code.toUpperCase())
      }
      if (params.min_population && params.min_population > 0) {
        cityQuery = cityQuery.gte('population', params.min_population)
      }

      const { data, error } = await cityQuery
        .range(offset, offset)
        .single()

      if (!error && data) {
        cities.push(data)
      }
    }

    // Return single city or array based on count requested
    const response = count === 1 && cities.length === 1
      ? { city: cities[0], total_available: totalCount }
      : { cities, total_available: totalCount }

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
