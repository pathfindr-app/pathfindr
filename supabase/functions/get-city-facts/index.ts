// Supabase Edge Function: get-city-facts
// Fetches interesting facts about a city using Wikipedia + OpenAI
// Results are cached in Supabase for future requests

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// =============================================================================
// RATE LIMITING - Protect against API abuse
// =============================================================================

// In-memory rate limit store (resets on cold start, but prevents sustained abuse)
const rateLimitStore = new Map<string, number[]>()

const RATE_LIMIT = {
  maxRequests: 30,      // Max requests per window
  windowMs: 60 * 1000,  // 1 minute window
}

function isRateLimited(clientId: string): boolean {
  const now = Date.now()
  const windowStart = now - RATE_LIMIT.windowMs

  // Get existing timestamps for this client
  let timestamps = rateLimitStore.get(clientId) || []

  // Remove timestamps outside the window
  timestamps = timestamps.filter(ts => ts > windowStart)

  // Check if over limit
  if (timestamps.length >= RATE_LIMIT.maxRequests) {
    return true
  }

  // Add current timestamp
  timestamps.push(now)
  rateLimitStore.set(clientId, timestamps)

  // Cleanup old entries periodically (every 100 requests)
  if (Math.random() < 0.01) {
    for (const [key, times] of rateLimitStore.entries()) {
      const filtered = times.filter(ts => ts > windowStart)
      if (filtered.length === 0) {
        rateLimitStore.delete(key)
      } else {
        rateLimitStore.set(key, filtered)
      }
    }
  }

  return false
}

function getClientId(req: Request): string {
  // Try to get real IP from various headers (Cloudflare, etc.)
  const cfIp = req.headers.get('cf-connecting-ip')
  const xForwardedFor = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  const xRealIp = req.headers.get('x-real-ip')

  return cfIp || xForwardedFor || xRealIp || 'unknown'
}

// Allowed origins for CORS - production only
const ALLOWED_ORIGINS = [
  'https://pathfindr.world',
  'https://www.pathfindr.world',
  'https://pathfindralpha.vercel.app',
  'capacitor://localhost',
  'http://localhost',
  'http://localhost:3000',
  'ionic://localhost',
]

const getCorsHeaders = (origin: string | null) => {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }
}

interface CityFactsRequest {
  city: string
  lat?: number
  lng?: number
}

interface ParsedLocation {
  parts: string[]
  cityName: string
  region: string
  country: string
}

interface WikiLookupResult {
  extract: string
  title: string
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

function parseLocationParts(input: string): ParsedLocation {
  const parts = input
    .split(',')
    .map(part => part.trim())
    .filter(Boolean)

  const cityName = parts[0] || input.trim()
  const country = parts.length >= 2 ? parts[parts.length - 1] : ''
  const region = parts.length > 2 ? parts.slice(1, -1).join(', ') : (parts[1] || '')

  return { parts, cityName, region, country }
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function isLikelyPlaceArticle(title: string, extract: string, location: ParsedLocation): boolean {
  const lowerTitle = title.toLowerCase()
  const lowerExtract = extract.toLowerCase()

  if (!extract || extract.length < 50) return false
  if (lowerTitle.includes('(disambiguation)')) return false
  if (/\bmay refer to\b/.test(lowerExtract)) return false

  const placePattern = /\b(city|town|village|municipality|capital|county|state|province|country|district|metropolitan|river|harbor|port|is a city|is a town|is a municipality)\b/
  const personOrMediaPattern = /\b(actor|actress|singer|rapper|musician|film|movie|album|song|novel|television|tv series|footballer|basketball player|baseball player|politician|poet|model|athlete|surname|given name)\b/
  const personLeadPattern = /^.{0,140}\bis an?\b.{0,90}\b(actor|actress|singer|rapper|musician|footballer|politician|poet|model|athlete)\b/

  const hasPlacePattern = placePattern.test(lowerExtract)
  const hasPersonOrMediaPattern = personOrMediaPattern.test(lowerExtract)
  const hasPersonLeadPattern = personLeadPattern.test(lowerExtract)

  const normalizedTitle = normalizeText(title)
  const normalizedCity = normalizeText(location.cityName)
  const hasCityInTitle = normalizedCity.length > 0 && normalizedTitle.includes(normalizedCity)

  const locationHints = [location.region, location.country]
    .map(normalizeText)
    .filter(value => value.length > 1)
  const hasLocationHint = locationHints.some(hint =>
    lowerTitle.includes(hint) || lowerExtract.includes(hint)
  )

  if ((hasPersonLeadPattern || hasPersonOrMediaPattern) && !hasPlacePattern) {
    return false
  }

  return hasPlacePattern || hasCityInTitle || hasLocationHint
}

function buildGenericFacts(city: string): string[] {
  return [
    `${city} has a street layout shaped by local geography and history.`,
    `${city}'s roads reflect how the area grew over time.`,
    `Major routes in ${city} often connect historic and modern districts.`,
    `${city} combines residential streets with dense urban corridors.`,
    `${city}'s neighborhoods create distinct pathfinding patterns.`,
  ]
}

function sanitizeFacts(rawFacts: unknown, city: string): string[] {
  if (!Array.isArray(rawFacts)) return []

  const cityTokens = parseLocationParts(city).parts
    .map(normalizeText)
    .filter(token => token.length > 2)

  const locationPattern = /\b(city|town|village|municipality|district|county|state|province|country|capital|harbor|port|river|coast|mountain|valley|population|downtown|metro|metropolitan|neighborhood|street|avenue|bridge|park|museum|airport|station)\b/
  const personOrMediaPattern = /\b(actor|actress|singer|rapper|musician|band|album|song|film|movie|television|tv series|novel|poet|athlete|footballer|basketball|baseball|celebrity|influencer|youtube|grammy|oscar|born|died|married)\b/
  const quirkyPattern = /\b(local legend says|rumor has it|some say)\b/

  const seen = new Set<string>()
  const cleaned: string[] = []

  for (const entry of rawFacts) {
    if (typeof entry !== 'string') continue

    const fact = entry
      .trim()
      .replace(/^[-*\d\).\s]+/, '')
      .replace(/^["']+|["']+$/g, '')
      .replace(/\s+/g, ' ')
      .trim()

    if (fact.length < 20 || fact.length > 180) continue

    const lower = fact.toLowerCase()
    if (quirkyPattern.test(lower)) continue
    if (personOrMediaPattern.test(lower)) continue

    const hasCityToken = cityTokens.some(token => token && lower.includes(token))
    const hasLocationSignal = locationPattern.test(lower)
    if (!hasCityToken && !hasLocationSignal) continue

    const dedupeKey = lower.replace(/[^a-z0-9]/g, '')
    if (seen.has(dedupeKey)) continue

    seen.add(dedupeKey)
    cleaned.push(fact)
  }

  return cleaned
}

function fillFacts(facts: string[], city: string, targetCount = 5): string[] {
  const result: string[] = []
  const seen = new Set<string>()

  const pushUnique = (fact: string) => {
    if (result.length >= targetCount) return
    const key = fact.toLowerCase().replace(/[^a-z0-9]/g, '')
    if (!key || seen.has(key)) return
    seen.add(key)
    result.push(fact)
  }

  for (const fact of facts) {
    pushUnique(fact)
  }

  for (const fallback of buildGenericFacts(city)) {
    pushUnique(fallback)
  }

  return result.slice(0, targetCount)
}

serve(async (req) => {
  const origin = req.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Rate limiting check
  const clientId = getClientId(req)
  if (isRateLimited(clientId)) {
    console.log(`Rate limited: ${clientId}`)
    return new Response(
      JSON.stringify({ error: 'Too many requests. Please try again later.' }),
      { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
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

    // Normalize city name for lookup and parsing
    const normalizedCity = city.toLowerCase().trim()
    const parsedLocation = parseLocationParts(city)

    // 1. Check cache first
    const { data: cached } = await supabase
      .from('city_facts')
      .select('facts, display_name')
      .eq('city_name', normalizedCity)
      .single()

    if (cached?.facts?.length > 0) {
      const cachedFacts = sanitizeFacts(cached.facts, city)
      if (cachedFacts.length >= 3) {
        console.log(`Cache hit for: ${city}`)
        return new Response(
          JSON.stringify({
            facts: fillFacts(cachedFacts, city),
            city: cached.display_name || city,
            cached: true
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log(`Cache quality miss for: ${city}, regenerating facts...`)
    }

    console.log(`Cache miss for: ${city}, fetching from Wikipedia...`)

    // 2. Fetch from Wikipedia - try multiple search strategies
    async function tryWikipediaSearch(searchTerm: string): Promise<WikiLookupResult | null> {
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

      if (!isLikelyPlaceArticle(title, extract, parsedLocation)) {
        return null
      }

      return { extract, title }
    }

    // Try Wikipedia search API and return multiple candidates
    async function wikiSearch(query: string, limit = 5): Promise<string[]> {
      const searchUrl = `https://en.wikipedia.org/w/api.php?` + new URLSearchParams({
        action: 'opensearch',
        search: query,
        limit: String(limit),
        format: 'json',
      })

      const response = await fetch(searchUrl, {
        headers: { 'User-Agent': 'Pathfindr/1.0 (pathfindr.world; pathfindr.game@gmail.com)' }
      })

      if (!response.ok) return []
      const data = await response.json()
      return Array.isArray(data?.[1]) ? data[1] : []
    }

    // Use coordinates when available to find nearby place pages
    async function wikiGeoSearch(latitude: number, longitude: number): Promise<string[]> {
      const searchUrl = `https://en.wikipedia.org/w/api.php?` + new URLSearchParams({
        action: 'query',
        list: 'geosearch',
        gscoord: `${latitude}|${longitude}`,
        gsradius: '10000',
        gslimit: '10',
        format: 'json',
      })

      const response = await fetch(searchUrl, {
        headers: { 'User-Agent': 'Pathfindr/1.0 (pathfindr.world; pathfindr.game@gmail.com)' }
      })

      if (!response.ok) return []

      const data = await response.json()
      const geoResults = data?.query?.geosearch || []
      return geoResults
        .map((item: { title?: string }) => item.title)
        .filter((title: string | undefined): title is string => Boolean(title))
    }

    function isBlockedTitle(title: string): boolean {
      const lower = title.toLowerCase()
      return lower.includes('church') ||
        lower.includes('school') ||
        lower.includes('hospital') ||
        lower.includes('album') ||
        lower.includes('song') ||
        lower.includes('film') ||
        lower.includes('tv') ||
        lower.includes('television') ||
        lower.includes('(disambiguation)')
    }

    async function trySearchCandidates(candidates: string[]): Promise<WikiLookupResult | null> {
      for (const candidate of candidates) {
        if (!candidate || isBlockedTitle(candidate)) continue
        const result = await tryWikipediaSearch(candidate)
        if (result) return result
      }
      return null
    }

    const { cityName, region, country } = parsedLocation
    const lowerCountry = country.toLowerCase()

    let result: WikiLookupResult | null = null

    // Strategy 1: direct lookups with full and partial location context
    const directCandidates = [
      city,
      region ? `${cityName}, ${region}` : '',
      country ? `${cityName}, ${country}` : '',
      cityName,
    ]
    result = await trySearchCandidates(directCandidates)

    // Strategy 2: UK-specific disambiguation for frequent naming collisions
    if (!result && (lowerCountry.includes('united kingdom') || lowerCountry === 'uk' || lowerCountry.includes('england'))) {
      result = await trySearchCandidates([
        `${cityName}, England`,
        `${cityName}, Merseyside`,
        `${cityName}, Greater Manchester`,
        `${cityName} (borough)`,
      ])
    }

    // Strategy 3: search by city/town intent
    if (!result) {
      result = await trySearchCandidates(await wikiSearch(`${cityName} city`, 5))
    }
    if (!result) {
      result = await trySearchCandidates(await wikiSearch(`${cityName} town`, 5))
    }

    // Strategy 4: coordinate-biased search for local mode and DB cities
    if (!result && typeof lat === 'number' && typeof lng === 'number') {
      result = await trySearchCandidates(await wikiGeoSearch(lat, lng))
    }

    // Strategy 5: broader search fallback
    if (!result) {
      result = await trySearchCandidates(await wikiSearch(cityName, 8))
    }

    if (!result) {
      return new Response(
        JSON.stringify({ facts: fillFacts([], city), city: city, generated: 'generic' }),
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
            content: `You create concise, factual location facts for a pathfinding game.

Return exactly 5 facts about the city place only.

Rules:
- Use only information grounded in the provided Wikipedia extract.
- No invented details, jokes, rumors, or "some say" phrasing.
- Avoid people-centric trivia (celebrities, births, awards, gossip).
- Keep each fact short and clear (roughly 50-120 characters).
- Focus on geography, history, urban form, landmarks, and culture of the place.

Return ONLY a JSON array of exactly 5 strings, with no extra text.`
          },
          {
            role: 'user',
            content: `Create 5 factual place-based facts about ${wikiTitle} from this extract:\n\n${extract.substring(0, 2500)}`
          }
        ],
        temperature: 0.2,
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

    // Clean and sanitize facts for relevance and safety
    facts = facts.map((fact: string) => {
      return fact
        .trim()
        .replace(/^["'\s]+|["'\s]+$/g, '')
        .replace(/^\\"|\\\"$/g, '')
        .replace(/\\"/g, '"')
        .trim()
    })
    facts = sanitizeFacts(facts, city)
    facts = fillFacts(facts, city)

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
