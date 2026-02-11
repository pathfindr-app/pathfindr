import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    if (req.method === 'POST') {
      const payload = await req.json()
      const cityName = payload?.city?.name || payload?.current_city || null
      const requestedBy = payload?.city?.requestedBy || payload?.requestedBy || null
      const requestId = payload?.city?.requestId || payload?.requestId || null
      const queueDepth = Number(payload?.queueDepth)

      const { error } = await supabase
        .from('stream_state')
        .upsert({
          id: 1,
          event_type: payload?.event || null,
          current_city: cityName,
          requested_by: requestedBy,
          current_request_id: requestId,
          queue_depth_paid: Number.isFinite(queueDepth) ? queueDepth : 0,
          queue_depth_free: 0,
          metadata: payload || {},
        })

      if (error) throw new Error(error.message)

      return new Response(
        JSON.stringify({ ok: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (req.method === 'GET') {
      const [{ data: stateData, error: stateError }, { data: queueData, error: queueError }] = await Promise.all([
        supabase
          .from('stream_state')
          .select('*')
          .eq('id', 1)
          .single(),
        supabase
          .from('stream_queue_public')
          .select('*')
          .single(),
      ])

      if (stateError) throw new Error(stateError.message)
      if (queueError) throw new Error(queueError.message)

      return new Response(
        JSON.stringify({
          ok: true,
          state: stateData,
          queue: queueData,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('stream-state error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

