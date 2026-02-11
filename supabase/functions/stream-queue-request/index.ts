import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface QueueRequestPayload {
  city?: string
  name?: string
  location?: string
  lat?: number
  lng?: number
  lon?: number
  zoom?: number
  requestedBy?: string
  priorityTier?: 'free' | 'paid'
  priorityScore?: number
  sourceType?: string
  messageId?: string
  userId?: string
  displayName?: string
  amountMicros?: number
  currency?: string
  metadata?: Record<string, unknown>
}

function normalizePayload(payload: QueueRequestPayload) {
  const cityText = (payload.city || payload.name || payload.location || '').trim()
  const lat = Number(payload.lat)
  const lng = Number(payload.lng ?? payload.lon)
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng)

  if (!cityText && !hasCoords) {
    return null
  }

  const priorityTier = payload.priorityTier === 'paid' ? 'paid' : 'free'
  const priorityScore = Number.isFinite(Number(payload.priorityScore))
    ? Number(payload.priorityScore)
    : (priorityTier === 'paid' ? 100 : 0)

  return {
    normalized_city: cityText || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
    center_lat: hasCoords ? lat : null,
    center_lng: hasCoords ? lng : null,
    zoom_level: Number.isFinite(Number(payload.zoom)) ? Number(payload.zoom) : 15,
    requested_by: payload.requestedBy || null,
    source_type: payload.sourceType || 'api',
    priority_tier: priorityTier,
    priority_score: priorityScore,
    message_id: payload.messageId || null,
    user_id: payload.userId || null,
    display_name: payload.displayName || null,
    request_text: cityText || null,
    source_amount_micros: Number.isFinite(Number(payload.amountMicros)) ? Number(payload.amountMicros) : null,
    source_currency: payload.currency || null,
    metadata: payload.metadata || {},
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const body: QueueRequestPayload = await req.json()
    const normalized = normalizePayload(body)

    if (!normalized) {
      return new Response(
        JSON.stringify({ error: 'Missing city name or coordinates' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    const { data, error } = await supabase
      .from('stream_requests')
      .insert(normalized)
      .select('id, normalized_city, priority_tier, priority_score, requested_by, created_at')
      .single()

    if (error) {
      throw new Error(error.message)
    }

    const { count: queueDepth, error: countError } = await supabase
      .from('stream_requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'queued')

    if (countError) {
      throw new Error(countError.message)
    }

    return new Response(
      JSON.stringify({
        ok: true,
        request: data,
        queueDepth: queueDepth || 0,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('stream-queue-request error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

