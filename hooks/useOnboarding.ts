import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { OnboardingState, UserLevel } from '../types';

export const useOnboarding = () => {
    const { user, refreshProfile, profile } = useAuth();
    const [loading, setLoading] = useState(false);

    // Default state if none exists
    const defaultState: OnboardingState = {
        is_onboarding_completed: false,
        checklist_dismissed: false,
        user_level: 'undecided',
        checklist_progress: {},
        gamification: {
            wip_streak_weeks: 0,
            badges_earned: []
        }
    };

    const getOnboardingState = useCallback((): OnboardingState => {
        return (profile as any)?.onboarding_state || defaultState;
    }, [profile]);

    const updateOnboardingState = async (updates: Partial<OnboardingState>) => {
        if (!user) return;
        setLoading(true);

        try {
            const currentState = getOnboardingState();
            const newState = {
                ...currentState,
                ...updates,
                // Ensure nesting is preserved if partial updates are sent
                checklist_progress: {
                    ...currentState.checklist_progress,
                    ...updates.checklist_progress
                },
                gamification: {
                    ...currentState.gamification,
                    ...updates.gamification
                }
            };

            const { error } = await supabase
                .from('profiles')
                .update({ onboarding_state: newState })
                .eq('user_id', user.id);

            if (error) throw error;

            await refreshProfile();
        } catch (err) {
            console.error('Error updating onboarding state:', err);
        } finally {
            setLoading(false);
        }
    };

    const setLevel = async (level: UserLevel) => {
        await updateOnboardingState({
            user_level: level,
            is_onboarding_completed: true // Wizard is done once level is picked (or quiz finished)
        });
    };

    const dismissChecklist = async () => {
        await updateOnboardingState({ checklist_dismissed: true });
    };

    const updateChecklist = async (key: string, checked: boolean) => {
        const currentState = getOnboardingState();
        await updateOnboardingState({
            checklist_progress: {
                ...currentState.checklist_progress,
                [key]: checked
            }
        });
    };

    const incrementStreak = async () => {
        // Logic for streak calculation would go here (checking last_wip_date)
        // For now, simple incrementer for the "Delight Engine" POC
        const currentState = getOnboardingState();
        const currentStreak = currentState.gamification?.wip_streak_weeks || 0;

        await updateOnboardingState({
            gamification: {
                ...currentState.gamification,
                last_wip_date: new Date().toISOString(),
                wip_streak_weeks: currentStreak + 1,
                badges_earned: currentState.gamification?.badges_earned || []
            }
        });
    };

    return {
        state: getOnboardingState(),
        updateOnboardingState,
        setLevel,
        dismissChecklist,
        updateChecklist,
        incrementStreak,
        loading
    };
};
