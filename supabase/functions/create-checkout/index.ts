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

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
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
