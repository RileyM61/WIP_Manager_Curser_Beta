import React, { useState, useEffect } from 'react';
import { PlusIcon, Cog6ToothIcon, SunIcon, MoonIcon } from '../shared/icons';
import { UserRole } from '../../types';
import DashboardNavButton from './DashboardNavButton';
import { useSubscription } from '../../hooks/useSubscription';
import { supabase } from '../../lib/supabase';

interface HeaderProps {
  companyName: string;
  companyLogo?: string;
  onAddJob: () => void;
  onOpenSettings: () => void;
  onSignOut: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  userRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  projectManagers: string[];
  estimators: string[];
  activeProjectManager: string;
  onActiveProjectManagerChange: (pm: string) => void;
  activeEstimator: string;
  onActiveEstimatorChange: (estimator: string) => void;
  onOpenHelp?: () => void;
  onOpenGlossary?: () => void;
  onOpenWorkflows?: () => void;
  onStartTour?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  companyName,
  companyLogo,
  onAddJob,
  onOpenSettings,
  onSignOut,
  theme,
  onToggleTheme,
  userRole,
  onRoleChange,
  projectManagers,
  estimators,
  activeProjectManager,
  onActiveProjectManagerChange,
  activeEstimator,
  onActiveEstimatorChange,
  onOpenHelp,
  onOpenGlossary,
  onOpenWorkflows,
  onStartTour,
}) => {
  const [imageError, setImageError] = useState(false);
  const [helpMenuOpen, setHelpMenuOpen] = useState(false);
  const { isPro, isLoading: isSubscriptionLoading } = useSubscription();
  const [isUpgrading, setIsUpgrading] = useState(false);

  const handleUpgrade = async () => {
    try {
      setIsUpgrading(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        alert('You must be logged in to upgrade.');
        return;
      }

      // TODO: Replace with your actual Stripe Price ID
      const PRICE_ID = 'price_1QTSqaAs5QaQtz7m6Q5q';

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

  // Reset image error when logo changes
  useEffect(() => {
    setImageError(false);
  }, [companyLogo]);

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Left: Logo & Dashboard Link */}
          <div className="flex items-center gap-4" data-tour="header-logo">
            <DashboardNavButton className="text-gray-500 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-300" />

            {/* Upgrade Button (Visible if not Pro) */}
            {!isSubscriptionLoading && !isPro && (
              <button
                onClick={handleUpgrade}
                disabled={isUpgrading}
                className="hidden sm:inline-flex items-center px-3 py-1 text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-50"
              >
                {isUpgrading ? 'Loading...' : '💎 Upgrade to Pro'}
              </button>
            )}

            <span className="text-gray-300 dark:text-gray-600 text-xl font-light hidden sm:inline">|</span>

            {/* WIP Insights Logo */}
            <div className="flex items-center gap-3">
              <img
                src="/images/wip-insights-logo.png"
                alt="WIP-Insights"
                className="h-24 w-auto"
              />
              {companyLogo && !imageError && (
                <>
                  <span className="text-gray-300 dark:text-gray-600 text-2xl font-light">|</span>
                  <img
                    src={companyLogo}
                    alt={`${companyName} logo`}
                    className="h-10 w-auto max-w-[150px] object-contain"
                    onError={() => setImageError(true)}
                  />
                </>
              )}
            </div>
          </div>

          {/* Center: Primary Action */}
          <div className="hidden md:flex items-center" data-tour="add-job-button">
            <button
              onClick={onAddJob}
              className="inline-flex items-center px-5 py-2.5 text-sm font-semibold rounded-lg shadow-lg text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all hover:scale-105"
            >
              <PlusIcon />
              <span className="ml-2">Add New Job</span>
            </button>
          </div>

          {/* Right: Controls */}
          <div className="flex items-center gap-3">
            {/* Role Selector */}
            <div className="hidden sm:flex items-center gap-2 bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-lg" data-tour="role-selector">
              <label htmlFor="role-select" className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Role</label>
              <select
                id="role-select"
                value={userRole}
                onChange={(e) => onRoleChange(e.target.value as UserRole)}
                className="bg-transparent text-sm font-medium text-gray-700 dark:text-gray-200 focus:outline-none cursor-pointer"
              >
                <option value="owner">Owner</option>
                <option value="projectManager">Project Manager</option>
                <option value="estimator">Estimator</option>
              </select>
            </div>

            {/* PM Selector (only for PM role) */}
            {userRole === 'projectManager' && (
              <div className="hidden lg:flex items-center gap-2 bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-lg">
                <label htmlFor="header-pm-select" className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">PM</label>
                <select
                  id="header-pm-select"
                  value={activeProjectManager}
                  onChange={(e) => onActiveProjectManagerChange(e.target.value)}
                  className="bg-transparent text-sm font-medium text-gray-700 dark:text-gray-200 focus:outline-none cursor-pointer"
                >
                  <option value="">All</option>
                  {projectManagers.map(pm => (
                    <option key={pm} value={pm}>{pm}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Estimator Selector (only for Estimator role) */}
            {userRole === 'estimator' && (
              <div className="hidden lg:flex items-center gap-2 bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-lg">
                <label htmlFor="header-estimator-select" className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Estimator</label>
                <select
                  id="header-estimator-select"
                  value={activeEstimator}
                  onChange={(e) => onActiveEstimatorChange(e.target.value)}
                  className="bg-transparent text-sm font-medium text-gray-700 dark:text-gray-200 focus:outline-none cursor-pointer"
                >
                  <option value="">Select...</option>
                  {estimators.map(est => (
                    <option key={est} value={est}>{est}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Mobile Add Button */}
            <button
              onClick={onAddJob}
              className="md:hidden inline-flex items-center p-2 rounded-lg text-white bg-gradient-to-r from-orange-500 to-amber-500"
              aria-label="Add New Job"
            >
              <PlusIcon />
            </button>

            {/* Utility Buttons */}
            <div className="flex items-center gap-1 border-l border-gray-200 dark:border-gray-600 pl-3">
              {/* Help Button with Dropdown */}
              <div className="relative" data-tour="help-button">
                <button
                  onClick={() => setHelpMenuOpen(!helpMenuOpen)}
                  className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition"
                  aria-label="Help"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>

                {/* Help Dropdown Menu */}
                {helpMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setHelpMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
                      <div className="p-2">
                        <button
                          onClick={() => {
                            setHelpMenuOpen(false);
                            onStartTour?.();
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                        >
                          <span className="text-lg">🎯</span>
                          <div className="text-left">
                            <div className="font-medium">Start Tour</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Interactive walkthrough</div>
                          </div>
                        </button>
                        <button
                          onClick={() => {
                            setHelpMenuOpen(false);
                            onOpenGlossary?.();
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                        >
                          <span className="text-lg">📚</span>
                          <div className="text-left">
                            <div className="font-medium">Glossary</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">WIP terminology explained</div>
                          </div>
                        </button>
                        <button
                          onClick={() => {
                            setHelpMenuOpen(false);
                            onOpenWorkflows?.();
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                        >
                          <span className="text-lg">🔄</span>
                          <div className="text-left">
                            <div className="font-medium">Workflows</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Step-by-step guides</div>
                          </div>
                        </button>
                      </div>
                      <div className="border-t border-gray-100 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-800/50">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          💡 <strong>Tip:</strong> Look for <span className="inline-flex items-center justify-center w-4 h-4 bg-gray-200 dark:bg-gray-600 rounded-full text-[10px] font-bold">i</span> icons for instant help
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={onToggleTheme}
                className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-white transition"
                aria-label="Toggle theme"
              >
                {theme === 'light' ? <MoonIcon /> : <SunIcon />}
              </button>
              <button
                onClick={onOpenSettings}
                className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-white transition"
                aria-label="Settings"
                data-tour="settings-button"
              >
                <Cog6ToothIcon />
              </button>
              <button
                onClick={onSignOut}
                className="hidden sm:inline-flex items-center px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 transition"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
