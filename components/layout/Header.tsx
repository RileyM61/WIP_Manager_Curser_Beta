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
  cashOnHand: number;
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

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
  cashOnHand,
}) => {
  const [imageError, setImageError] = useState(false);

  // Reset image error when logo changes
  useEffect(() => {
    setImageError(false);
  }, [companyLogo]);

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            <a
              href={APP_PAGES.home}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2"
            >
              {companyLogo && !imageError ? (
                <img 
                  src={companyLogo} 
                  alt={`${companyName} logo`} 
                  className="h-9 w-auto max-w-[200px] object-contain"
                  onError={() => setImageError(true)}
                />
              ) : (
                <span className="text-2xl font-bold text-brand-blue dark:text-brand-light-blue">{companyName}</span>
              )}
            </a>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md">
              <label htmlFor="role-select" className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Role</label>
              <select
                id="role-select"
                value={userRole}
                onChange={(e) => onRoleChange(e.target.value as UserRole)}
                className="bg-transparent text-sm font-medium text-gray-700 dark:text-gray-200 focus:outline-none"
              >
                <option value="owner">Owner</option>
                <option value="projectManager">Project Manager</option>
              </select>
            </div>
            {userRole === 'projectManager' && (
              <div className="hidden lg:flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md">
                <label htmlFor="header-pm-select" className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">PM</label>
                <select
                  id="header-pm-select"
                  value={activeProjectManager}
                  onChange={(e) => onActiveProjectManagerChange(e.target.value)}
                  className="bg-transparent text-sm font-medium text-gray-700 dark:text-gray-200 focus:outline-none"
                >
                  <option value="">All</option>
                  {projectManagers.map(pm => (
                    <option key={pm} value={pm}>{pm}</option>
                  ))}
                </select>
              </div>
            )}
            {userRole === 'owner' && (
              <div className="hidden md:flex items-center space-x-2 bg-green-50 dark:bg-green-900/30 px-3 py-1 rounded-md border border-green-200 dark:border-green-700">
                <span className="text-xs font-semibold uppercase text-green-700 dark:text-green-300">Cash</span>
                <span className="text-sm font-bold text-green-700 dark:text-green-300">{currencyFormatter.format(cashOnHand)}</span>
              </div>
            )}
            <button
              onClick={onAddJob}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-brand-light-blue hover:bg-brand-blue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue transition"
            >
              <PlusIcon />
              <span className="ml-2 hidden sm:inline">Add New Job</span>
            </button>
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-brand-blue dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue transition"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <MoonIcon /> : <SunIcon />}
            </button>
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-brand-blue dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue transition"
              aria-label="Settings"
            >
              <Cog6ToothIcon />
            </button>
            <button
              onClick={onSignOut}
              className="hidden sm:inline-flex items-center px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-md hover:border-orange-400 hover:text-orange-500 transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;