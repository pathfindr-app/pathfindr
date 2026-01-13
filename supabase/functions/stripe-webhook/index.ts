/**
 * Stripe Webhook Handler
 *
 * Verifies Stripe payment events and updates user purchase status.
 * Deploy: supabase functions deploy stripe-webhook
 *
 * Required secrets (set via Supabase dashboard):
 * - STRIPE_WEBHOOK_SECRET: Your Stripe webhook signing secret (whsec_...)
 * - STRIPE_SECRET_KEY: Your Stripe secret key (sk_live_... or sk_test_...)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@13.11.0'

// Initialize Stripe
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

if (!stripeSecretKey || !webhookSecret) {
  console.error('Missing Stripe configuration')
}

const stripe = new Stripe(stripeSecretKey || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

serve(async (req: Request) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    // Get the raw body and signature
    const body = await req.text()
    const signature = req.headers.get('stripe-signature')

    if (!signature) {
      console.error('Missing Stripe signature')
      return new Response('Missing signature', { status: 400 })
    }

    // Verify webhook signature
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret!)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return new Response(`Webhook Error: ${err.message}`, { status: 400 })
    }

    console.log('Received Stripe event:', event.type)

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        // Get customer email from session
        const customerEmail = session.customer_details?.email
        const customerId = session.customer as string

        if (!customerEmail) {
          console.error('No customer email in session')
          return new Response('Missing customer email', { status: 400 })
        }

        console.log('Payment completed for:', customerEmail)

        // Update user's has_purchased status in Supabase
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('email', customerEmail.toLowerCase())
          .single()

        if (userError || !user) {
          console.log('User not found, creating record...')

          // User might not exist yet - create a purchase record
          // They'll be linked when they sign in
          const { error: txError } = await supabase
            .from('transactions')
            .insert({
              email: customerEmail.toLowerCase(),
              stripe_customer_id: customerId,
              stripe_session_id: session.id,
              amount: session.amount_total,
              currency: session.currency,
              status: 'completed',
              product_id: 'pathfindr_premium',
              created_at: new Date().toISOString(),
            })

          if (txError) {
            console.error('Failed to create transaction:', txError)
          }
        } else {
          // Update existing user
          const { error: updateError } = await supabase
            .from('users')
            .update({
              has_purchased: true,
              purchase_date: new Date().toISOString(),
            })
            .eq('id', user.id)

          if (updateError) {
            console.error('Failed to update user:', updateError)
          } else {
            console.log('User updated successfully:', user.id)
          }

          // Also record the transaction
          await supabase.from('transactions').insert({
            user_id: user.id,
            email: customerEmail.toLowerCase(),
            stripe_customer_id: customerId,
            stripe_session_id: session.id,
            amount: session.amount_total,
            currency: session.currency,
            status: 'completed',
            product_id: 'pathfindr_premium',
            created_at: new Date().toISOString(),
          })
        }

        break
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log('PaymentIntent succeeded:', paymentIntent.id)
        // Additional handling if needed
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log('Payment failed:', paymentIntent.id)
        // Could notify user or log for debugging
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return new Response(`Server error: ${error.message}`, { status: 500 })
  }
})
