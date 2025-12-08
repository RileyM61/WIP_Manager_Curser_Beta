import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // 1. Get the authenticated user
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        const {
            data: { user },
        } = await supabaseClient.auth.getUser()

        if (!user) {
            throw new Error('User not authenticated')
        }

        const email = user.email
        if (!email) {
            throw new Error('User has no email')
        }

        // 2. Initialize Stripe
        const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
            httpClient: Stripe.createFetchHttpClient(),
            apiVersion: '2022-11-15',
        })

        const { price_id, return_url } = await req.json()

        // 3. Find or Create Customer
        const customers = await stripe.customers.list({
            email: email,
            limit: 1,
        })

        let customerId
        if (customers.data.length === 0) {
            const customer = await stripe.customers.create({
                email: email,
                metadata: {
                    supabase_user_id: user.id,
                },
            })
            customerId = customer.id
        } else {
            customerId = customers.data[0].id
            // Ensure metadata is linked (in case it existed before without our ID)
            if (customers.data[0].metadata.supabase_user_id !== user.id) {
                await stripe.customers.update(customerId, {
                    metadata: { supabase_user_id: user.id }
                });
            }
        }

        // 4. Create Checkout Session
        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            line_items: [
                {
                    price: price_id,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${return_url}?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${return_url}`,
            client_reference_id: user.id,
        })

        return new Response(JSON.stringify({ url: session.url }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
