import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';

interface ContextualUpgradePromptProps {
  feature: string;
  description: string;
  variant?: 'inline' | 'card' | 'banner';
  onDismiss?: () => void;
}

/**
 * Contextual Upgrade Prompt
 * Shows upgrade messaging only when users encounter feature limits
 * This replaces the persistent header upgrade button
 */
const ContextualUpgradePrompt: React.FC<ContextualUpgradePromptProps> = ({
  feature,
  description,
  variant = 'inline',
  onDismiss,
}) => {
  const [isUpgrading, setIsUpgrading] = useState(false);

  const handleUpgrade = async () => {
    try {
      setIsUpgrading(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        alert('You must be logged in to upgrade.');
        return;
      }

      // Pro Plan Price ID
      const PRICE_ID = 'price_1ScpqaAs5QaQtz7mJbECPkB5';

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          price_id: PRICE_ID,
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
      setIsUpgrading(false);
    }
  };

  if (variant === 'inline') {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
        <span className="text-xs font-medium text-orange-700 dark:text-orange-300">
          🔒 {feature}
        </span>
        <button
          onClick={handleUpgrade}
          disabled={isUpgrading}
          className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-colors disabled:opacity-50"
        >
          {isUpgrading ? 'Loading...' : 'Upgrade →'}
        </button>
      </div>
    );
  }

  if (variant === 'banner') {
    return (
      <div className="bg-gradient-to-r from-wip-gold to-wip-gold-dark text-white px-4 py-3 rounded-xl shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl">💎</span>
          <div>
            <p className="font-semibold">{feature}</p>
            <p className="text-sm text-orange-100">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="px-3 py-1.5 text-sm font-medium text-orange-100 hover:text-white transition-colors"
            >
              Later
            </button>
          )}
          <button
            onClick={handleUpgrade}
            disabled={isUpgrading}
            className="px-4 py-1.5 bg-white text-orange-600 text-sm font-bold rounded-lg hover:bg-orange-50 transition-colors disabled:opacity-50"
          >
            {isUpgrading ? 'Loading...' : 'Upgrade to Pro'}
          </button>
        </div>
      </div>
    );
  }

  // Card variant (default)
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white text-xl shadow-lg shadow-wip-gold/20">
          💎
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
            Unlock {feature}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {description}
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={handleUpgrade}
              disabled={isUpgrading}
              className="px-4 py-2 bg-gradient-to-r from-wip-gold to-wip-gold-dark text-white text-sm font-semibold rounded-lg hover:shadow-lg hover:shadow-wip-gold/30 transition-all disabled:opacity-50"
            >
              {isUpgrading ? 'Loading...' : 'Upgrade to Pro - $99/mo'}
            </button>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                Maybe later
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContextualUpgradePrompt;

