// Supabase Edge Function: get-city-facts
// Fetches interesting facts about a city using Wikipedia + OpenAI
// Results are cached in Supabase for future requests

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS: Restrict to your domain in production
// Set ALLOWED_ORIGIN env var in Supabase dashboard for production
const allowedOrigin = Deno.env.get('ALLOWED_ORIGIN') || '*'
const corsHeaders = {
  'Access-Control-Allow-Origin': allowedOrigin,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CityFactsRequest {
  city: string
  lat?: number
  lng?: number
}

interface WikipediaResponse {
  query?: {
    pages?: {
      [key: string]: {
        title: string
        extract?: string
      }
    }
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { city, lat, lng }: CityFactsRequest = await req.json()

    if (!city) {
      return new Response(
        JSON.stringify({ error: 'City name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Normalize city name for lookup
    const normalizedCity = city.toLowerCase().trim()

    // 1. Check cache first
    const { data: cached } = await supabase
      .from('city_facts')
      .select('facts, display_name')
      .eq('city_name', normalizedCity)
      .single()

    if (cached?.facts?.length > 0) {
      console.log(`Cache hit for: ${city}`)
      return new Response(
        JSON.stringify({
          facts: cached.facts,
          city: cached.display_name || city,
          cached: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Cache miss for: ${city}, fetching from Wikipedia...`)

    // 2. Fetch from Wikipedia - try multiple search strategies
    async function tryWikipediaSearch(searchTerm: string): Promise<{ extract: string, title: string } | null> {
      const wikiUrl = `https://en.wikipedia.org/w/api.php?` + new URLSearchParams({
        action: 'query',
        prop: 'extracts',
        exintro: 'true',
        explaintext: 'true',
        format: 'json',
        titles: searchTerm,
        redirects: '1',
      })

      const response = await fetch(wikiUrl, {
        headers: { 'User-Agent': 'Pathfindr/1.0 (pathfindr.world; pathfindr.game@gmail.com)' }
      })

      if (!response.ok) return null

      const data: WikipediaResponse = await response.json()
      const pages = data.query?.pages || {}
      const pageId = Object.keys(pages)[0]
      const extract = pages[pageId]?.extract || ''
      const title = pages[pageId]?.title || searchTerm

      if (extract && extract.length >= 50) {
        return { extract, title }
      }
      return null
    }

    // Try Wikipedia search API to find the best match
    async function wikiSearch(query: string): Promise<string | null> {
      const searchUrl = `https://en.wikipedia.org/w/api.php?` + new URLSearchParams({
        action: 'opensearch',
        search: query,
        limit: '1',
        format: 'json',
      })

      const response = await fetch(searchUrl, {
        headers: { 'User-Agent': 'Pathfindr/1.0 (pathfindr.world; pathfindr.game@gmail.com)' }
      })

      if (!response.ok) return null
      const data = await response.json()
      return data[1]?.[0] || null  // First search result title
    }

    // Extract city name and country if available
    const parts = city.split(',').map(p => p.trim())
    const cityName = parts[0]
    const country = parts[1] || ''

    // Strategy 1: Try the exact city name first
    let result = await tryWikipediaSearch(city)

    // Strategy 2: Try "CityName, Country" format for disambiguation
    if (!result && country) {
      result = await tryWikipediaSearch(`${cityName}, ${country}`)
    }

    // Strategy 3: For UK cities, try with common region suffixes
    if (!result && (country.includes('United Kingdom') || country.includes('UK') || country.includes('England'))) {
      // Try common UK disambiguation patterns
      const ukSearches = [
        `${cityName}, England`,
        `${cityName}, Merseyside`,
        `${cityName}, Greater Manchester`,
        `${cityName} (borough)`,
      ]
      for (const search of ukSearches) {
        result = await tryWikipediaSearch(search)
        if (result) break
      }
    }

    // Strategy 4: Search Wikipedia for "cityName city" or "cityName town"
    if (!result) {
      const searchResult = await wikiSearch(`${cityName} city`)
      if (searchResult && !searchResult.toLowerCase().includes('church') && !searchResult.toLowerCase().includes('school')) {
        result = await tryWikipediaSearch(searchResult)
      }
    }

    if (!result) {
      const searchResult = await wikiSearch(`${cityName} town`)
      if (searchResult && !searchResult.toLowerCase().includes('church') && !searchResult.toLowerCase().includes('school')) {
        result = await tryWikipediaSearch(searchResult)
      }
    }

    // Strategy 5: General search but filter out non-geographical results
    if (!result) {
      const searchResult = await wikiSearch(cityName)
      if (searchResult &&
          !searchResult.toLowerCase().includes('church') &&
          !searchResult.toLowerCase().includes('school') &&
          !searchResult.toLowerCase().includes('hospital')) {
        result = await tryWikipediaSearch(searchResult)
      }
    }

    if (!result) {
      // No Wikipedia article found, generate generic + quirky facts
      const genericFacts = [
        `${city} has unique street patterns waiting to be explored.`,
        `Navigate the roads of ${city} and find the optimal path!`,
        `Every city tells a story through its streets. Discover ${city}'s.`,
        `Local legend says the pigeons here give excellent directions.`,
        `Rumor has it the coffee is stronger the closer you get to downtown.`,
      ]

      return new Response(
        JSON.stringify({ facts: genericFacts, city: city, generated: 'generic' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const extract = result.extract
    const wikiTitle = result.title

    // 3. Process with OpenAI
    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiKey) {
      throw new Error('OpenAI API key not configured')
    }

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You create interesting facts about cities for a pathfinding game called Pathfindr.

Your task is to return 5 facts total - a MIX of real and quirky:

REAL FACTS (first 3):
- Extract from the Wikipedia text provided
- Short (under 100 characters each)
- About geography, history, architecture, or culture
- Accurate and informative

QUIRKY/FUNNY FACTS (last 2):
- MAKE THESE UP - be creative and humorous!
- Short (under 100 characters each)
- Slightly outrageous but plausible-sounding
- Use phrases like "Local legend says...", "Rumor has it...", "Some say..."
- Related to the city's vibe, stereotypes, or character
- Should make someone smile or chuckle

Return ONLY a JSON array of exactly 5 strings, no labels or explanations.`
          },
          {
            role: 'user',
            content: `Create 5 facts about ${wikiTitle} (3 real from Wikipedia, 2 quirky/funny you make up):\n\n${extract.substring(0, 2000)}`
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    })

    if (!openaiResponse.ok) {
      const error = await openaiResponse.text()
      throw new Error(`OpenAI API error: ${error}`)
    }

    const openaiData = await openaiResponse.json()
    const factsText = openaiData.choices?.[0]?.message?.content || '[]'

    // Parse the facts array
    let facts: string[]
    try {
      facts = JSON.parse(factsText)
      if (!Array.isArray(facts)) {
        facts = [factsText]
      }
    } catch {
      // If parsing fails, try to extract facts from text
      facts = factsText.split('\n').filter((f: string) => f.trim().length > 10).slice(0, 5)
    }

    // Clean up facts - remove extra quotes, whitespace, and formatting artifacts
    facts = facts.map((fact: string) => {
      return fact
        .trim()
        .replace(/^["'\s]+|["'\s]+$/g, '')  // Remove leading/trailing quotes and whitespace
        .replace(/^\\"|\\\"$/g, '')          // Remove escaped quotes
        .replace(/\\"/g, '"')                // Unescape remaining quotes
        .trim()
    }).filter((fact: string) => fact.length > 10)

    // 4. Cache the results
    const { error: insertError } = await supabase
      .from('city_facts')
      .upsert({
        city_name: normalizedCity,
        display_name: wikiTitle,
        facts: facts,
        wikipedia_extract: extract.substring(0, 5000),
      }, {
        onConflict: 'city_name'
      })

    if (insertError) {
      console.error('Cache insert error:', insertError)
    }

    return new Response(
      JSON.stringify({
        facts,
        city: wikiTitle,
        cached: false
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
        facts: ['Explore the streets and find your path!']  // Fallback
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
