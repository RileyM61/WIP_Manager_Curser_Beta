import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export interface Subscription {
    id: string;
    user_id: string;
    status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'unpaid';
    price_id: string;
    current_period_end: string;
    cancel_at_period_end: boolean;
}

export function useSubscription() {
    const { user } = useAuth();
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setIsLoading(false);
            return;
        }

        const fetchSubscription = async () => {
            try {
                const { data, error } = await supabase
                    .from('subscriptions')
                    .select('*')
                    .eq('user_id', user.id)
                    .in('status', ['active', 'trialing'])
                    .maybeSingle();

                if (error) {
                    console.error('Error fetching subscription:', error);
                }

                setSubscription(data as Subscription);
            } catch (error) {
                console.error('Error in fetchSubscription:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSubscription();

        // Listen for realtime updates
        const channel = supabase
            .channel('public:subscriptions')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'subscriptions',
                    filter: `user_id=eq.${user.id}`,
                },
                (payload) => {
                    if (payload.eventType === 'DELETE') {
                        setSubscription(null);
                    } else {
                        // Check if the new status is valid
                        const sub = payload.new as Subscription;
                        if (['active', 'trialing'].includes(sub.status)) {
                            setSubscription(sub);
                        } else {
                            setSubscription(null);
                        }
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    return {
        subscription,
        isPro: !!subscription,
        isLoading,
    };
}
