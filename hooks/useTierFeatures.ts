import { useMemo } from 'react';
import { useModuleAccess } from './useModuleAccess';
import { useSupabaseSettings } from './useSupabaseSettings';
import { useAuth } from '../context/AuthContext';
import { SubscriptionTier } from '../types';

export const FREE_TIER_LIMITS = {
    maxActiveJobs: 5,
};

// Helper functions for tier features
export function getFreeTierFeatures(): Omit<TierFeatures, 'getUpgradeMessage'> {
    return {
        canUseTimeAndMaterial: false,
        canUseMobilization: false,
        canUseAIInsights: false,
        canUseTableView: true,
        canUseGanttView: true,
        canUseReportsView: false,
        canUseChangeOrders: false,
        isPro: false,
        canAddMoreJobs: (currentCount: number) => currentCount < FREE_TIER_LIMITS.maxActiveJobs,
    };
}

export function getProTierFeatures(): Omit<TierFeatures, 'getUpgradeMessage'> {
    return {
        canUseTimeAndMaterial: true,
        canUseMobilization: true,
        canUseAIInsights: true,
        canUseTableView: true,
        canUseGanttView: true,
        canUseReportsView: true,
        canUseChangeOrders: true,
        isPro: true,
        canAddMoreJobs: () => true,
    };
}

export interface TierFeatures {
    canUseTimeAndMaterial: boolean;
    canUseMobilization: boolean;
    canUseAIInsights: boolean;
    canUseTableView: boolean;
    canUseGanttView: boolean;
    canUseReportsView: boolean;
    canUseChangeOrders: boolean;
    getUpgradeMessage: (feature: string) => string;
    isPro: boolean;
    canAddMoreJobs: (currentCount: number) => boolean;
}

export function useTierFeatures(): TierFeatures & { isLoading: boolean } {
    const { companyId } = useAuth();
    const { settings, loading: settingsLoading } = useSupabaseSettings(companyId);
    const { tier, isBetaTester } = useModuleAccess(settings);

    const features = useMemo(() => {
        // Feature flags
        let canUseTimeAndMaterial = false;
        let canUseMobilization = false;
        let canUseAIInsights = false;
        let canUseTableView = true; // Available to all tiers
        let canUseGanttView = true; // Available to all tiers
        let canUseReportsView = false; // Professional+
        let canUseChangeOrders = false; // Professional+

        // Helper to generate upgrade messages
        const getUpgradeMessage = (feature: string): string => {
            switch (feature) {
                case 'canUseReportsView':
                    return 'Upgrade to Professional to access advanced reports';
                case 'canUseAIInsights':
                    return 'Upgrade to Enterprise to uncover AI insights';
                case 'canUseTimeAndMaterial':
                    return 'Upgrade to Professional to unlock T&M billing';
                case 'canUseMobilization':
                    return 'Upgrade to Professional to track mobilization phases';
                case 'canUseChangeOrders':
                    return 'Upgrade to Professional to manage Change Orders';
                default:
                    return 'Upgrade to unlock this feature';
            }
        };

        // Beta testers get everything
        if (isBetaTester) {
            return {
                canUseTimeAndMaterial: true,
                canUseMobilization: true,
                canUseAIInsights: true,
                canUseTableView: true,
                canUseGanttView: true,
                canUseReportsView: true,
                canUseChangeOrders: true,
                getUpgradeMessage,
                isPro: true,
                canAddMoreJobs: () => true,
            };
        }

        // Logic based on tier
        switch (tier) {
            case 'cfo-suite':
            case 'enterprise':
                canUseTimeAndMaterial = true;
                canUseMobilization = true;
                canUseAIInsights = true;
                canUseReportsView = true;
                canUseChangeOrders = true;
                break;
            case 'professional':
                canUseTimeAndMaterial = true;
                canUseMobilization = true;
                canUseAIInsights = false;
                canUseReportsView = true;
                canUseChangeOrders = true;
                break;
            case 'starter':
            case 'trial':
            default:
                canUseTimeAndMaterial = false;
                canUseMobilization = false;
                canUseAIInsights = false;
                canUseReportsView = false;
                canUseChangeOrders = false;
                break;
        }

        return {
            canUseTimeAndMaterial,
            canUseMobilization,
            canUseAIInsights,
            canUseTableView,
            canUseGanttView,
            canUseReportsView,
            canUseChangeOrders,
            getUpgradeMessage,
            isPro: tier !== 'starter' && tier !== 'trial',
            canAddMoreJobs: (currentCount: number) => {
                if (tier !== 'starter' && tier !== 'trial') return true;
                return currentCount < FREE_TIER_LIMITS.maxActiveJobs;
            },
        };
    }, [tier, isBetaTester]);

    return {
        ...features,
        isLoading: settingsLoading,
    };
}
