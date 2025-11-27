import React from 'react';

interface AppearanceSettingsProps {
  theme: 'light' | 'dark';
  onThemeChange: (theme: 'light' | 'dark') => void;
}

const AppearanceSettings: React.FC<AppearanceSettingsProps> = ({ theme, onThemeChange }) => {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-1">Appearance</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Customize how WIP Manager looks on your device.
        </p>
      </div>

      {/* Theme Selection */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100 mb-4">Theme</h3>
        
        <div className="grid grid-cols-2 gap-4 max-w-md">
          {/* Light Theme */}
          <button
            onClick={() => onThemeChange('light')}
            className={`relative p-4 rounded-xl border-2 transition-all ${
              theme === 'light'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
            }`}
          >
            <div className="flex flex-col items-center gap-3">
              {/* Light theme preview */}
              <div className="w-full h-20 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="h-4 bg-gray-100 border-b border-gray-200" />
                <div className="p-2 space-y-1">
                  <div className="h-2 bg-gray-200 rounded w-3/4" />
                  <div className="h-2 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Light</span>
            </div>
            {theme === 'light' && (
              <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </button>

          {/* Dark Theme */}
          <button
            onClick={() => onThemeChange('dark')}
            className={`relative p-4 rounded-xl border-2 transition-all ${
              theme === 'dark'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
            }`}
          >
            <div className="flex flex-col items-center gap-3">
              {/* Dark theme preview */}
              <div className="w-full h-20 bg-gray-800 rounded-lg border border-gray-700 shadow-sm overflow-hidden">
                <div className="h-4 bg-gray-900 border-b border-gray-700" />
                <div className="p-2 space-y-1">
                  <div className="h-2 bg-gray-700 rounded w-3/4" />
                  <div className="h-2 bg-gray-700 rounded w-1/2" />
                </div>
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Dark</span>
            </div>
            {theme === 'dark' && (
              <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </button>
        </div>

        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          Your theme preference is saved automatically and will persist across sessions.
        </p>
      </div>

      {/* Future: Date Format */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-6">
        <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">Date & Number Format</h3>
        <p className="text-sm text-gray-400 dark:text-gray-500">
          Coming soon: Choose your preferred date format (MM/DD/YYYY, DD/MM/YYYY) and number formatting options.
        </p>
      </div>

      {/* Future: Dashboard Layout */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-6">
        <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">Dashboard Layout</h3>
        <p className="text-sm text-gray-400 dark:text-gray-500">
          Coming soon: Customize your dashboard layout, default view mode, and widget arrangement.
        </p>
      </div>
    </div>
  );
};

export default AppearanceSettings;

