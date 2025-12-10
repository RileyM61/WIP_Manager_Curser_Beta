/**
 * Upgrade Modal Component
 * 
 * A polished modal that prompts users to upgrade from Free to Pro tier.
 * Supports both monthly and annual billing options.
 */

import React, { useState } from 'react';
import { XIcon } from '../shared/icons';
import { supabase } from '../../lib/supabase';
import { FREE_TIER_LIMITS } from '../../hooks/useTierFeatures';

// Stripe Price IDs
export const STRIPE_PRICES = {
    proMonthly: 'price_1ScpqaAs5QaQtz7mJbECPkB5', // $99/month
    proAnnual: 'price_1Scpr6As5QaQtz7m4PCC3uTI',  // $990/year
};

interface UpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    feature?: string; // Which feature triggered the upgrade prompt
    currentJobCount?: number; // For job limit messaging
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({
    isOpen,
    onClose,
    feature,
    currentJobCount,
}) => {
    const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleUpgrade = async () => {
        try {
            setIsLoading(true);
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                alert('You must be logged in to upgrade.');
                return;
            }

            const priceId = billingPeriod === 'annual' ? STRIPE_PRICES.proAnnual : STRIPE_PRICES.proMonthly;

            const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    price_id: priceId,
                    return_url: window.location.href
                })
            });

            const { url, error } = await response.json();
            if (error) throw new Error(error);
            if (url) window.location.href = url;
        } catch (err: any) {
            console.error('Upgrade failed:', err);
            alert('Failed to start upgrade: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Feature-specific messaging
    const getFeatureMessage = () => {
        if (currentJobCount !== undefined) {
            return `You've reached the ${FREE_TIER_LIMITS.maxActiveJobs} active job limit on the Free plan.`;
        }

        const messages: Record<string, string> = {
            'canUseTimeAndMaterial': 'Time & Material job types',
            'canUseTableView': 'Table view',
            'canUseGanttView': 'Gantt scheduling view',
            'canUseReportsView': 'Advanced reports',
            'canUseChangeOrders': 'Change Order management',
            'canExportPDF': 'PDF export',
            'canUseSnapshots': 'Job history snapshots',
            'canInviteUsers': 'Team member invitations',
            'canUseRoleBasedAccess': 'Role-based access (PM/Estimator)',
            'canUseCustomBranding': 'Custom company branding',
        };

        return feature && messages[feature]
            ? `Unlock ${messages[feature]} with WIP Insights Pro.`
            : 'Unlock all features with WIP Insights Pro.';
    };

    const proFeatures = [
        { icon: '∞', text: 'Unlimited jobs' },
        { icon: '👥', text: 'Unlimited team members' },
        { icon: '📊', text: 'Table & Gantt views' },
        { icon: '🔧', text: 'Time & Material jobs' },
        { icon: '📝', text: 'Change Order management' },
        { icon: '📈', text: 'Advanced WIP reports' },
        { icon: '📸', text: 'Job history snapshots' },
        { icon: '🎨', text: 'Custom company branding' },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
                {/* Gradient Header */}
                <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-8 text-white text-center">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">💎</span>
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Upgrade to Pro</h2>
                    <p className="text-white/90 text-sm">
                        {getFeatureMessage()}
                    </p>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Billing Toggle */}
                    <div className="flex justify-center mb-6">
                        <div className="bg-gray-100 dark:bg-slate-700 p-1 rounded-xl flex">
                            <button
                                onClick={() => setBillingPeriod('monthly')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${billingPeriod === 'monthly'
                                    ? 'bg-white dark:bg-slate-600 text-gray-900 dark:text-white shadow-sm'
                                    : 'text-gray-600 dark:text-gray-400'
                                    }`}
                            >
                                Monthly
                            </button>
                            <button
                                onClick={() => setBillingPeriod('annual')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all relative ${billingPeriod === 'annual'
                                    ? 'bg-white dark:bg-slate-600 text-gray-900 dark:text-white shadow-sm'
                                    : 'text-gray-600 dark:text-gray-400'
                                    }`}
                            >
                                Annual
                                <span className="absolute -top-2 -right-2 bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-semibold">
                                    Save 17%
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* Price Display */}
                    <div className="text-center mb-6">
                        <div className="flex items-baseline justify-center gap-1">
                            <span className="text-4xl font-bold text-gray-900 dark:text-white">
                                ${billingPeriod === 'annual' ? '82.50' : '99'}
                            </span>
                            <span className="text-gray-500 dark:text-gray-400">/month</span>
                        </div>
                        {billingPeriod === 'annual' && (
                            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                                Billed annually at $990/year (2 months free!)
                            </p>
                        )}
                    </div>

                    {/* Features Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        {proFeatures.map((feature, idx) => (
                            <div
                                key={idx}
                                className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
                            >
                                <span className="text-lg">{feature.icon}</span>
                                <span>{feature.text}</span>
                            </div>
                        ))}
                    </div>

                    {/* CTA Button */}
                    <button
                        onClick={handleUpgrade}
                        disabled={isLoading}
                        className="w-full py-4 px-6 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:shadow-orange-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Processing...
                            </span>
                        ) : (
                            `Upgrade to Pro — $${billingPeriod === 'annual' ? '990/year' : '99/month'}`
                        )}
                    </button>

                    {/* Security Note */}
                    <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-4">
                        🔒 Secure checkout powered by Stripe. Cancel anytime.
                    </p>
                </div>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
                >
                    <XIcon />
                </button>
            </div>
        </div>
    );
};

export default UpgradeModal;
