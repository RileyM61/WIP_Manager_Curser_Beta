import React, { useState, useEffect } from 'react';
import { PlusIcon, Cog6ToothIcon, SunIcon, MoonIcon } from '../shared/icons';
import { UserRole } from '../../types';
import { APP_PAGES } from '@/constants';

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
  activeProjectManager: string;
  onActiveProjectManagerChange: (pm: string) => void;
  activeEstimator: string;
  onActiveEstimatorChange: (estimator: string) => void;
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
  activeProjectManager,
  onActiveProjectManagerChange,
  activeEstimator,
  onActiveEstimatorChange,
}) => {
  const [imageError, setImageError] = useState(false);

  // Reset image error when logo changes
  useEffect(() => {
    setImageError(false);
  }, [companyLogo]);

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Left: Logo */}
          <div className="flex-shrink-0">
            <a
              href={APP_PAGES.home}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3"
            >
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
            </a>
          </div>

          {/* Center: Primary Action */}
          <div className="hidden md:flex items-center">
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
            <div className="hidden sm:flex items-center gap-2 bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-lg">
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
                  {projectManagers.map(pm => (
                    <option key={pm} value={pm}>{pm}</option>
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