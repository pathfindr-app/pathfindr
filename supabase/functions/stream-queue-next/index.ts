import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

interface DequeuedRow {
  id: string
  normalized_city: string
  center_lat: number | null
  center_lng: number | null
  zoom_level: number | null
  requested_by: string | null
  priority_tier: string
  priority_score: number
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    const { data, error } = await supabase.rpc('dequeue_stream_request')
    if (error) {
      throw new Error(error.message)
    }

    const dequeued = (data as DequeuedRow[] | null)?.[0]
    if (!dequeued) {
      return new Response(null, { status: 204, headers: corsHeaders })
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
        requestId: dequeued.id,
        requestedBy: dequeued.requested_by,
        queueDepth: queueDepth || 0,
        city: {
          name: dequeued.normalized_city,
          lat: dequeued.center_lat,
          lng: dequeued.center_lng,
          zoom: dequeued.zoom_level ?? 15,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('stream-queue-next error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

