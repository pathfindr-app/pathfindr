/**
 * Create Stripe Checkout Session
 *
 * Creates a checkout session and returns the URL for redirect.
 * Deploy: supabase functions deploy create-checkout
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@13.11.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

// =============================================================================
// RATE LIMITING - Stricter limits for payment endpoint
// =============================================================================

const rateLimitStore = new Map<string, number[]>()

const RATE_LIMIT = {
  maxRequests: 5,       // Only 5 checkout attempts per minute (very strict)
  windowMs: 60 * 1000,
}

function isRateLimited(clientId: string): boolean {
  const now = Date.now()
  const windowStart = now - RATE_LIMIT.windowMs
  let timestamps = rateLimitStore.get(clientId) || []
  timestamps = timestamps.filter(ts => ts > windowStart)

  if (timestamps.length >= RATE_LIMIT.maxRequests) {
    return true
  }

  timestamps.push(now)
  rateLimitStore.set(clientId, timestamps)
  return false
}

function getClientId(req: Request): string {
  const cfIp = req.headers.get('cf-connecting-ip')
  const xForwardedFor = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  const xRealIp = req.headers.get('x-real-ip')
  return cfIp || xForwardedFor || xRealIp || 'unknown'
}

// Allowed origins for CORS - production only
const ALLOWED_ORIGINS = [
  'https://pathfindr.world',
  'https://www.pathfindr.world',
  'https://pathfindralpha.vercel.app', // Legacy/staging
]

const getCorsHeaders = (origin: string | null) => {
  // Check if origin is allowed
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }
}

serve(async (req: Request) => {
  const origin = req.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Rate limiting - strict for payment endpoint
  const clientId = getClientId(req)
  if (isRateLimited(clientId)) {
    console.log(`Rate limited checkout attempt: ${clientId}`)
    return new Response(
      JSON.stringify({ error: 'Too many checkout attempts. Please wait a minute.' }),
      { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const { priceId, customerEmail, successUrl, cancelUrl } = await req.json()

    if (!priceId) {
      return new Response(
        JSON.stringify({ error: 'Missing priceId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Checkout Session
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'payment',
      success_url: successUrl || 'https://pathfindralpha.vercel.app/?purchase=success',
      cancel_url: cancelUrl || 'https://pathfindralpha.vercel.app/?purchase=cancelled',
    }

    // Add customer email if provided
    if (customerEmail) {
      sessionConfig.customer_email = customerEmail
    }

    const session = await stripe.checkout.sessions.create(sessionConfig)

    return new Response(
      JSON.stringify({ url: session.url }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Checkout session error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
