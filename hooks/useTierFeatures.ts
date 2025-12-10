import { useMemo } from 'react';
import { useModuleAccess } from './useModuleAccess';
import { useSupabaseSettings } from './useSupabaseSettings';
import { useAuth } from '../context/AuthContext';

export const FREE_TIER_LIMITS = {
    maxActiveJobs: 5,
};

export interface TierFeatures {
    canUseTimeAndMaterial: boolean;
    canUseMobilization: boolean;
    canUseAIInsights: boolean;
}

export function useTierFeatures(): TierFeatures & { isLoading: boolean } {
    const { companyId } = useAuth();
    const { settings, loading: settingsLoading } = useSupabaseSettings(companyId);
    const { tier, isBetaTester } = useModuleAccess(settings);

    const features = useMemo(() => {
        // defaults
        let canUseTimeAndMaterial = false;
        let canUseMobilization = false;
        let canUseAIInsights = false;

        // Beta testers get everything
        if (isBetaTester) {
            return {
                canUseTimeAndMaterial: true,
                canUseMobilization: true,
                canUseAIInsights: true,
            };
        }

        // Logic based on tier
        switch (tier) {
            case 'cfo-suite':
                canUseTimeAndMaterial = true;
                canUseMobilization = true;
                canUseAIInsights = true;
                break;
            case 'growth':
                canUseTimeAndMaterial = true;
                canUseMobilization = true;
                canUseAIInsights = false;
                break;
            case 'starter':
            default:
                canUseTimeAndMaterial = false;
                canUseMobilization = false;
                canUseAIInsights = false;
                break;
        }

        return {
            canUseTimeAndMaterial,
            canUseMobilization,
            canUseAIInsights,
        };
    }, [tier, isBetaTester]);

    return {
        ...features,
        isLoading: settingsLoading,
    };
}
