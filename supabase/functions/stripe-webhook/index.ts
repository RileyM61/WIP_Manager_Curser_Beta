import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno'

console.log('Stripe Webhook Function Loaded')

serve(async (req) => {
    const cryptoProvider = Stripe.createSubtleCryptoProvider()
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
        httpClient: Stripe.createFetchHttpClient(),
        apiVersion: '2022-11-15', // Use a pinned version for stability
    })

    const signature = req.headers.get('Stripe-Signature')
    const body = await req.text()
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

    let event
    try {
        if (!signature || !webhookSecret) {
            throw new Error("Missing signature or webhook secret");
        }
        event = await stripe.webhooks.constructEventAsync(
            body,
            signature,
            webhookSecret,
            undefined,
            cryptoProvider
        )
    } catch (err) {
        console.error(`Webhook signature verification failed: ${err.message}`)
        return new Response(err.message, { status: 400 })
    }

    const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Handle the event
    switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
            const subscription = event.data.object
            await manageSubscriptionStatusChange(
                subscription.id,
                subscription.customer as string,
                event.type === 'customer.subscription.created',
                supabase
            )
            break
        case 'checkout.session.completed':
            const session = event.data.object
            if (session.mode === 'subscription') {
                const data = session
                const customerId = data.customer as string
                const userId = data.client_reference_id as string // We pass this in checkout creation

                // Mapping customer ID to user in a separate table or profile could be done here
                // For now, relying on subscription update to match by customer if needed, 
                // but typically we should map customer_id to user_id. 
                // Simplification: We'll assume the subscription handler picks it up.
            }
            break
        default:
            console.log(`Unhandled event type ${event.type}`)
    }

    return new Response(JSON.stringify({ received: true }), {
        headers: { 'Content-Type': 'application/json' },
    })
})

const manageSubscriptionStatusChange = async (
    subscriptionId: string,
    customerId: string,
    createAction = false,
    supabase: any
) => {
    // We need to look up the user by customer ID if we don't store it on the subscription object directly from Stripe (which we don't usually).
    // Strategy: In 'create-checkout-session', we update a 'customers' table or similar. 
    // OR: We query Supabase to find which user has this customer_id. 
    // SIMPLIFICATION FOR V1: We'll fetch the subscription from Stripe with expansion to get metadata if we saved user_id there.

    // Better approach for Supabase + Stripe:
    // 1. When creating checkout session, we pass `client_reference_id` = user.id.
    // 2. We can trust `checkout.session.completed` to link user.id -> customer.id in a `customers` table.
    // 3. Here, if we don't have a `customers` table yet, we might struggle.

    // Let's create a Helper: Update subscription directly. 
    // We need the User ID. 
    // On 'create', we don't easily have it unless we query the Customer from Stripe or relying on metadata.

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
        httpClient: Stripe.createFetchHttpClient(),
        apiVersion: '2022-11-15',
    })

    // Get fresh subscription data with expansion
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
        expand: ['default_payment_method']
    })

    // Retrieve the customer to find the user_id (if we stored it in metadata)
    const customer = await stripe.customers.retrieve(subscription.customer as string);
    const userId = (customer as any).metadata?.supabase_user_id;

    if (!userId) {
        console.error(`User ID not found in customer metadata for customer: ${subscription.customer}`);
        return;
    }

    const subscriptionData = {
        id: subscription.id,
        user_id: userId,
        status: subscription.status,
        price_id: subscription.items.data[0].price.id,
        quantity: 1,
        cancel_at_period_end: subscription.cancel_at_period_end,
        cancel_at: subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : null,
        canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        created: new Date(subscription.created * 1000).toISOString(),
        ended_at: subscription.ended_at ? new Date(subscription.ended_at * 1000).toISOString() : null,
        trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
        trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
    }

    const { error } = await supabase
        .from('subscriptions')
        .upsert(subscriptionData)

    if (error) {
        console.error('Error upserting subscription:', error)
    } else {
        console.log(`Subscription updated: ${subscription.id} for user ${userId}`);
    }
}
