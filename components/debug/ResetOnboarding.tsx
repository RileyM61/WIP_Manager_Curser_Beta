import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const ResetOnboarding: React.FC = () => {
    const { user, signOut, refreshProfile } = useAuth();
    const navigate = useNavigate();
    const [status, setStatus] = useState('Initializing reset...');

    useEffect(() => {
        const resetUser = async () => {
            if (!user) {
                setStatus('Please log in to reset your account state.');
                return;
            }

            try {
                setStatus('Resetting profile data...');

                // 1. Reset Profile State (Onboarding & Company Link)
                const { error } = await supabase
                    .from('profiles')
                    .update({
                        company_id: null,
                        onboarding_state: {
                            is_onboarding_completed: false,
                            checklist_dismissed: false,
                            user_level: 'undecided',
                            checklist_progress: {},
                            gamification: {
                                wip_streak_weeks: 0,
                                badges_earned: []
                            }
                        }
                    })
                    .eq('user_id', user.id);

                if (error) throw error;

                // 2. Clear Local Storage
                setStatus('Clearing local storage...');
                localStorage.removeItem('wip-tour-completed');
                localStorage.removeItem('wip-jobs-snapshot');
                localStorage.removeItem('wip-user-role');
                localStorage.removeItem('wip-active-pm');
                localStorage.removeItem('wip-active-estimator');
                localStorage.removeItem('wip-filter');

                setStatus('Success! Redirecting...');

                // 3. Force refresh profile to update context
                await refreshProfile();

                // 4. Navigate to home (which should trigger OnboardingWizard or Company Setup)
                // We might need to reload the page to ensure all states are clean
                window.location.href = '/';

            } catch (err: any) {
                console.error('Reset failed:', err);
                setStatus(`Error: ${err.message}`);
            }
        };

        resetUser();
    }, [user, navigate, refreshProfile]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 flex-col gap-4">
            <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-600 font-medium">{status}</p>
        </div>
    );
};

export default ResetOnboarding;
