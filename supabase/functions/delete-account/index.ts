import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  }
}

async function deleteRowsByUserId(supabaseAdmin, table: string, userId: string) {
  const { error } = await supabaseAdmin
    .from(table)
    .delete()
    .eq('user_id', userId)

  if (error && !error.message.toLowerCase().includes('could not find the table')) {
    throw new Error(`${table}: ${error.message}`)
  }
}

serve(async (req) => {
  const origin = req.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: corsHeaders,
    })
  }

  try {
    const authorization = req.headers.get('authorization')
    if (!authorization) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: corsHeaders,
      })
    }

    const body = await req.json().catch(() => ({}))
    if (body.confirm !== 'DELETE') {
      return new Response(JSON.stringify({ error: 'Deletion confirmation missing' }), {
        status: 400,
        headers: corsHeaders,
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authorization,
        },
      },
    })

    const {
      data: { user },
      error: userError,
    } = await supabaseAuth.auth.getUser()

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unable to verify user' }), {
        status: 401,
        headers: corsHeaders,
      })
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)

    const deletionTables = [
      'games',
      'leaderboards',
      'city_leaderboards',
      'replays',
      'achievements',
      'events',
      'analytics_sessions',
      'funnels',
      'sessions',
    ]

    for (const table of deletionTables) {
      await deleteRowsByUserId(supabaseAdmin, table, user.id)
    }

    const { error: transactionsError } = await supabaseAdmin
      .from('transactions')
      .update({
        user_id: null,
        email: null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)

    if (transactionsError && transactionsError.message.toLowerCase().includes('updated_at')) {
      const { error: fallbackTransactionsError } = await supabaseAdmin
        .from('transactions')
        .update({
          user_id: null,
          email: null,
        })
        .eq('user_id', user.id)

      if (fallbackTransactionsError &&
          !fallbackTransactionsError.message.toLowerCase().includes('could not find the table')) {
        throw new Error(`transactions: ${fallbackTransactionsError.message}`)
      }
    } else if (transactionsError &&
               !transactionsError.message.toLowerCase().includes('could not find the table')) {
      throw new Error(`transactions: ${transactionsError.message}`)
    }

    const { error: profileError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', user.id)

    if (profileError) {
      throw new Error(`users: ${profileError.message}`)
    }

    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(user.id)
    if (deleteUserError) {
      throw new Error(`auth.users: ${deleteUserError.message}`)
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: corsHeaders,
    })
  } catch (error) {
    console.error('delete-account error:', error)
    return new Response(JSON.stringify({ error: error.message || 'Unexpected error' }), {
      status: 500,
      headers: corsHeaders,
    })
  }
})
