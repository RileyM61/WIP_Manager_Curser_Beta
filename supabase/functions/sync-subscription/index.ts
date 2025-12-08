import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        const {
            data: { user },
        } = await supabaseClient.auth.getUser()

        if (!user || !user.email) {
            throw new Error('User not authenticated or missing email')
        }

        const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
            httpClient: Stripe.createFetchHttpClient(),
            apiVersion: '2022-11-15',
        })

        // 1. Find Customer by Email
        const customers = await stripe.customers.list({
            email: user.email,
            limit: 1,
            expand: ['data.subscriptions']
        })

        if (customers.data.length === 0) {
            return new Response(JSON.stringify({ message: 'No Stripe customer found' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            })
        }

        const customer = customers.data[0];
        const subscriptions = customer.subscriptions?.data || [];

        const adminSupabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 2. Sync all subscriptions found
        const results = [];
        for (const sub of subscriptions) {
            const subscriptionData = {
                id: sub.id,
                user_id: user.id, // Link to the authenticated user
                status: sub.status,
                price_id: sub.items.data[0].price.id,
                quantity: 1,
                cancel_at_period_end: sub.cancel_at_period_end,
                cancel_at: sub.cancel_at ? new Date(sub.cancel_at * 1000).toISOString() : null,
                canceled_at: sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null,
                current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
                current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
                created: new Date(sub.created * 1000).toISOString(),
                ended_at: sub.ended_at ? new Date(sub.ended_at * 1000).toISOString() : null,
                trial_start: sub.trial_start ? new Date(sub.trial_start * 1000).toISOString() : null,
                trial_end: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
            }

            const { error } = await adminSupabase
                .from('subscriptions')
                .upsert(subscriptionData)

            if (error) {
                console.error('Upsert error:', error);
                results.push({ id: sub.id, status: 'error', error });
            } else {
                results.push({ id: sub.id, status: 'synced' });
            }
        }

        return new Response(JSON.stringify({ results }), {
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
