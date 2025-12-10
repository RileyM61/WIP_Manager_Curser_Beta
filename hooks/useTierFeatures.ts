/**
 * Tier Features Hook
 * 
 * Centralizes all feature gating logic based on subscription status.
 * Free tier gets limited features, Pro tier gets full access.
 */

import { useMemo } from 'react';
import { useSubscription } from './useSubscription';

// Free tier limits
export const FREE_TIER_LIMITS = {
    maxActiveJobs: 5,           // Max active jobs (excluding Archived/Completed)
    maxUsers: 1,                // Only owner
};

// Feature definitions per tier
export interface TierFeatures {
    // Core limits
    maxActiveJobs: number;
    maxUsers: number;

    // Job features
    canUseTimeAndMaterial: boolean;
    canUseComponentLevelWIP: boolean;
    canUseChangeOrders: boolean;
    canUseMultipleMobilizations: boolean;

    // View features
    canUseTableView: boolean;
    canUseGanttView: boolean;
    canUseCompanyView: boolean;
    canUseForecastView: boolean;
    canUseReportsView: boolean;

    // Reporting & Export
    canExportCSV: boolean;
    canExportPDF: boolean;
    canUseSnapshots: boolean;
    canUseSnapshotComparison: boolean;

    // Team features
    canInviteUsers: boolean;
    canUseRoleBasedAccess: boolean;

    // Customization
    canUseCustomBranding: boolean;
    canUseDarkMode: boolean;

    // Tier info
    tierName: 'Free' | 'Pro';
    isPro: boolean;
}

// Free tier feature set
const FREE_TIER_FEATURES: TierFeatures = {
    maxActiveJobs: FREE_TIER_LIMITS.maxActiveJobs,
    maxUsers: FREE_TIER_LIMITS.maxUsers,

    canUseTimeAndMaterial: false,
    canUseComponentLevelWIP: false,
    canUseChangeOrders: false,
    canUseMultipleMobilizations: false,

    canUseTableView: false,
    canUseGanttView: false,
    canUseCompanyView: true,   // Basic company view allowed
    canUseForecastView: true,  // Basic forecast allowed
    canUseReportsView: false,

    canExportCSV: true,        // Basic CSV allowed
    canExportPDF: false,
    canUseSnapshots: false,
    canUseSnapshotComparison: false,

    canInviteUsers: false,
    canUseRoleBasedAccess: false,

    canUseCustomBranding: false,
    canUseDarkMode: true,      // Theme always available

    tierName: 'Free',
    isPro: false,
};

// Pro tier feature set
const PRO_TIER_FEATURES: TierFeatures = {
    maxActiveJobs: Infinity,
    maxUsers: Infinity,

    canUseTimeAndMaterial: true,
    canUseComponentLevelWIP: true,
    canUseChangeOrders: true,
    canUseMultipleMobilizations: true,

    canUseTableView: true,
    canUseGanttView: true,
    canUseCompanyView: true,
    canUseForecastView: true,
    canUseReportsView: true,

    canExportCSV: true,
    canExportPDF: true,
    canUseSnapshots: true,
    canUseSnapshotComparison: true,

    canInviteUsers: true,
    canUseRoleBasedAccess: true,

    canUseCustomBranding: true,
    canUseDarkMode: true,

    tierName: 'Pro',
    isPro: true,
};

export interface UseTierFeaturesReturn extends TierFeatures {
    isLoading: boolean;
    // Helper functions
    canAddMoreJobs: (currentActiveJobCount: number) => boolean;
    getUpgradeMessage: (feature: keyof TierFeatures) => string;
}

/**
 * Hook to check feature access based on subscription tier
 */
export function useTierFeatures(): UseTierFeaturesReturn {
    const { isPro, isLoading } = useSubscription();

    const features = useMemo<TierFeatures>(() => {
        return isPro ? PRO_TIER_FEATURES : FREE_TIER_FEATURES;
    }, [isPro]);

    const canAddMoreJobs = useMemo(() => {
        return (currentActiveJobCount: number): boolean => {
            if (features.maxActiveJobs === Infinity) return true;
            return currentActiveJobCount < features.maxActiveJobs;
        };
    }, [features.maxActiveJobs]);

    const getUpgradeMessage = useMemo(() => {
        return (feature: keyof TierFeatures): string => {
            const messages: Record<string, string> = {
                canUseTimeAndMaterial: 'Upgrade to Pro to use Time & Material jobs',
                canUseComponentLevelWIP: 'Upgrade to Pro for component-level WIP tracking (Labor/Material/Other)',
                canUseChangeOrders: 'Upgrade to Pro to manage Change Orders',
                canUseMultipleMobilizations: 'Upgrade to Pro for multiple mobilization phases',
                canUseTableView: 'Upgrade to Pro to use Table view',
                canUseGanttView: 'Upgrade to Pro to use Gantt scheduling',
                canUseReportsView: 'Upgrade to Pro for advanced reports',
                canExportPDF: 'Upgrade to Pro to export PDF reports',
                canUseSnapshots: 'Upgrade to Pro for job history snapshots',
                canUseSnapshotComparison: 'Upgrade to Pro to compare snapshots',
                canInviteUsers: 'Upgrade to Pro to invite team members',
                canUseRoleBasedAccess: 'Upgrade to Pro for role-based access (PM/Estimator)',
                canUseCustomBranding: 'Upgrade to Pro to add your company logo',
                maxActiveJobs: `Free tier limited to ${FREE_TIER_LIMITS.maxActiveJobs} active jobs. Upgrade to Pro for unlimited.`,
            };
            return messages[feature] || 'Upgrade to Pro to unlock this feature';
        };
    }, []);

    return {
        ...features,
        isLoading,
        canAddMoreJobs,
        getUpgradeMessage,
    };
}

/**
 * Get feature set without React context (for non-component use)
 */
export function getFreeTierFeatures(): TierFeatures {
    return FREE_TIER_FEATURES;
}

export function getProTierFeatures(): TierFeatures {
    return PRO_TIER_FEATURES;
}
