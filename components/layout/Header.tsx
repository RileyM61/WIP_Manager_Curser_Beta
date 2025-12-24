import React, { useState, useEffect, useRef } from 'react';
import { SunIcon, MoonIcon } from '../shared/icons';
import { UserRole } from '../../types';
import DashboardNavButton from './DashboardNavButton';
import { hasUnread } from '../../lib/changelog';

interface HeaderProps {
  companyName: string;
  companyLogo?: string;
  aiEnabled?: boolean;
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
  onStartTour?: () => void;
  onOpenGlossary?: () => void;
  onOpenWorkflows?: () => void;
  onOpenWhatsNew?: () => void;
  onOpenActivityLog?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  companyName,
  companyLogo,
  aiEnabled = false,
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
  onStartTour,
  onOpenGlossary,
  onOpenWorkflows,
  onOpenWhatsNew,
  onOpenActivityLog,
}) => {
  const [imageError, setImageError] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [showUnreadBadge, setShowUnreadBadge] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Check for unread changelog entries
  useEffect(() => {
    setShowUnreadBadge(hasUnread());
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset image error when logo changes
  useEffect(() => {
    setImageError(false);
  }, [companyLogo]);

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'owner': return '👑';
      case 'projectManager': return '🎯';
      case 'estimator': return '📐';
      default: return '👤';
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'owner': return 'Owner';
      case 'projectManager': return 'PM';
      case 'estimator': return 'Estimator';
      default: return 'User';
    }
  };

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo & Navigation */}
          <div className="flex items-center gap-4" data-tour="header-logo">
            <DashboardNavButton className="text-gray-500 dark:text-gray-400 hover:text-wip-gold dark:hover:text-wip-gold transition-colors" />

            <span className="text-gray-200 dark:text-gray-700 text-xl font-light">|</span>

            {/* WIP Insights Logo */}
            <div className="flex items-center gap-3">
              <img
                src="/images/wip-insights-logo.png"
                alt="WIP-Insights"
                className="h-10 w-auto"
              />
              {companyLogo && !imageError && (
                <>
                  <span className="text-gray-200 dark:text-gray-700 text-xl font-light hidden sm:inline">|</span>
                  <img
                    src={companyLogo}
                    alt={`${companyName} logo`}
                    className="h-8 w-auto max-w-[120px] object-contain hidden sm:block"
                    onError={() => setImageError(true)}
                  />
                </>
              )}
              {!companyLogo && companyName && companyName !== 'WIP Insights' && (
                <span className="hidden sm:inline text-sm font-medium text-gray-600 dark:text-gray-400 max-w-[150px] truncate">
                  {companyName}
                </span>
              )}
            </div>

            {/* AI Enabled Badge - subtle indicator */}
            {aiEnabled && (
              <span
                className="hidden md:inline-flex items-center px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 rounded-full"
                title="AI features are enabled"
              >
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1 animate-pulse" />
                AI
              </span>
            )}
          </div>

          {/* Right: Role Selector & Profile Menu */}
          <div className="flex items-center gap-2">
            {/* Role Selector - Compact */}
            <div className="hidden sm:flex items-center" data-tour="role-selector">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                <span className="text-sm">{getRoleIcon(userRole)}</span>
                <select
                  id="role-select"
                  value={userRole}
                  onChange={(e) => onRoleChange(e.target.value as UserRole)}
                  className="bg-transparent text-sm font-medium text-gray-700 dark:text-gray-200 focus:outline-none cursor-pointer pr-1"
                >
                  <option value="owner">Owner</option>
                  <option value="projectManager">PM</option>
                  <option value="estimator">Estimator</option>
                </select>
              </div>
            </div>

            {/* PM Selector (only for PM role) */}
            {userRole === 'projectManager' && projectManagers.length > 0 && (
              <div className="hidden lg:flex items-center">
                <select
                  id="header-pm-select"
                  value={activeProjectManager}
                  onChange={(e) => onActiveProjectManagerChange(e.target.value)}
                  className="text-sm font-medium text-gray-600 dark:text-gray-300 bg-transparent focus:outline-none cursor-pointer hover:text-wip-gold-dark dark:hover:text-wip-gold transition-colors"
                >
                  <option value="">All PMs</option>
                  {projectManagers.map(pm => (
                    <option key={pm} value={pm}>{pm}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Estimator Selector (only for Estimator role) */}
            {userRole === 'estimator' && estimators.length > 0 && (
              <div className="hidden lg:flex items-center">
                <select
                  id="header-estimator-select"
                  value={activeEstimator}
                  onChange={(e) => onActiveEstimatorChange(e.target.value)}
                  className="text-sm font-medium text-gray-600 dark:text-gray-300 bg-transparent focus:outline-none cursor-pointer hover:text-wip-gold-dark dark:hover:text-wip-gold transition-colors"
                >
                  <option value="">Select...</option>
                  {estimators.map(est => (
                    <option key={est} value={est}>{est}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Divider */}
            <div className="hidden sm:block w-px h-6 bg-gray-200 dark:bg-gray-600 mx-1" />

            {/* Theme Toggle */}
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <MoonIcon /> : <SunIcon />}
            </button>

            {/* Consolidated Profile/Settings Menu */}
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center gap-2 p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all group"
                aria-label="Menu"
                data-tour="settings-button"
              >
                {/* User Avatar/Icon */}
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-wip-gold to-wip-gold-dark flex items-center justify-center text-white text-sm font-bold shadow-sm">
                  {companyName?.charAt(0).toUpperCase() || 'W'}
                </div>
                {/* Notification dot for unread items */}
                {showUnreadBadge && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-wip-gold rounded-full border-2 border-white dark:border-gray-800" />
                )}
                <svg className={`w-4 h-4 text-gray-400 transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  {/* User Info Section */}
                  <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-wip-gold to-wip-gold-dark flex items-center justify-center text-white font-bold shadow-sm">
                        {companyName?.charAt(0).toUpperCase() || 'W'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {companyName || 'WIP Insights'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <span>{getRoleIcon(userRole)}</span>
                          <span>{getRoleLabel(userRole)} View</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Mobile Role Selector */}
                  <div className="sm:hidden px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2 block">
                      Switch Role
                    </label>
                    <select
                      value={userRole}
                      onChange={(e) => {
                        onRoleChange(e.target.value as UserRole);
                        setProfileMenuOpen(false);
                      }}
                      className="w-full text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-wip-gold"
                    >
                      <option value="owner">👑 Owner</option>
                      <option value="projectManager">🎯 Project Manager</option>
                      <option value="estimator">📐 Estimator</option>
                    </select>
                  </div>

                  {/* Menu Items */}
                  <div className="py-2">
                    {/* What's New */}
                    <button
                      onClick={() => {
                        setProfileMenuOpen(false);
                        setShowUnreadBadge(false);
                        onOpenWhatsNew?.();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-wip-card dark:hover:bg-wip-gold/20 transition-colors"
                    >
                      <span className="text-lg">📢</span>
                      <div className="text-left flex-1">
                        <div className="font-medium flex items-center gap-2">
                          What's New
                          {showUnreadBadge && (
                            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-wip-gold text-white rounded-full">NEW</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Latest updates & features</div>
                      </div>
                    </button>

                    {/* Settings */}
                    <button
                      onClick={() => {
                        setProfileMenuOpen(false);
                        onOpenSettings();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <span className="text-lg">⚙️</span>
                      <div className="text-left">
                        <div className="font-medium">Settings</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Company, users & preferences</div>
                      </div>
                    </button>

                    <div className="my-2 border-t border-gray-100 dark:border-gray-700" />

                    {/* Help Section */}
                    <div className="px-4 py-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Help & Learning</p>
                    </div>

                    <button
                      onClick={() => {
                        setProfileMenuOpen(false);
                        onStartTour?.();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                    >
                      <span className="text-base">🎯</span>
                      <span>Start Tour</span>
                    </button>

                    <button
                      onClick={() => {
                        setProfileMenuOpen(false);
                        onOpenGlossary?.();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                    >
                      <span className="text-base">📚</span>
                      <span>Glossary</span>
                    </button>

                    <button
                      onClick={() => {
                        setProfileMenuOpen(false);
                        onOpenWorkflows?.();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                    >
                      <span className="text-base">🔄</span>
                      <span>Workflows</span>
                    </button>

                    <button
                      onClick={() => {
                        setProfileMenuOpen(false);
                        onOpenActivityLog?.();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                    >
                      <span className="text-base">📋</span>
                      <span>Activity Log</span>
                    </button>

                    <div className="my-2 border-t border-gray-100 dark:border-gray-700" />

                    {/* Sign Out */}
                    <button
                      onClick={() => {
                        setProfileMenuOpen(false);
                        onSignOut();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span className="font-medium">Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
