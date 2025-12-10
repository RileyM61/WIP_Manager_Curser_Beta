import React from 'react';
import { Settings, DateFormatOption, NumberFormatOption, CurrencyLocale } from '../../types';
import { formatDate, formatCurrency, formatNumber, getCurrencyConfig } from '../../lib/formatters';

interface AppearanceSettingsProps {
  theme: 'light' | 'dark';
  onThemeChange: (theme: 'light' | 'dark') => void;
  settings?: Settings;
  onChange?: (settings: Partial<Settings>) => void;
  onSave?: () => void;
}

const DATE_FORMAT_OPTIONS: { value: DateFormatOption; label: string }[] = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (US)' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (International)' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (ISO)' },
];

const NUMBER_FORMAT_OPTIONS: { value: NumberFormatOption; label: string; example: string }[] = [
  { value: 'us', label: 'US Format', example: '1,234.56' },
  { value: 'eu', label: 'European Format', example: '1.234,56' },
];

const CURRENCY_OPTIONS: { value: CurrencyLocale; label: string; symbol: string }[] = [
  { value: 'USD', label: 'US Dollar', symbol: '$' },
  { value: 'EUR', label: 'Euro', symbol: '€' },
  { value: 'GBP', label: 'British Pound', symbol: '£' },
  { value: 'CAD', label: 'Canadian Dollar', symbol: 'CA$' },
];

const AppearanceSettings: React.FC<AppearanceSettingsProps> = ({
  theme,
  onThemeChange,
  settings,
  onChange,
  onSave,
}) => {
  // Current format settings with defaults
  const currentDateFormat = settings?.dateFormat || 'MM/DD/YYYY';
  const currentNumberFormat = settings?.numberFormat || 'us';
  const currentCurrencyLocale = settings?.currencyLocale || 'USD';

  // Sample values for preview
  const sampleDate = new Date();
  const sampleNumber = 1234567.89;
  const sampleCurrency = 45678;

  const handleDateFormatChange = (format: DateFormatOption) => {
    onChange?.({ dateFormat: format });
  };

  const handleNumberFormatChange = (format: NumberFormatOption) => {
    onChange?.({ numberFormat: format });
  };

  const handleCurrencyChange = (locale: CurrencyLocale) => {
    onChange?.({ currencyLocale: locale });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-1">Appearance</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Customize how WIP Manager looks and displays data on your device.
        </p>
      </div>

      {/* Theme Selection */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100 mb-4">Theme</h3>

        <div className="grid grid-cols-2 gap-4 max-w-md">
          {/* Light Theme */}
          <button
            onClick={() => onThemeChange('light')}
            className={`relative p-4 rounded-xl border-2 transition-all ${theme === 'light'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
              }`}
          >
            <div className="flex flex-col items-center gap-3">
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
            className={`relative p-4 rounded-xl border-2 transition-all ${theme === 'dark'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
              }`}
          >
            <div className="flex flex-col items-center gap-3">
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
      </div>

      {/* Date Format */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100 mb-2">Date Format</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Choose how dates are displayed throughout the application.
        </p>

        <div className="space-y-3 max-w-md">
          {DATE_FORMAT_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all ${currentDateFormat === option.value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="dateFormat"
                  value={option.value}
                  checked={currentDateFormat === option.value}
                  onChange={() => handleDateFormatChange(option.value)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {option.label}
                </span>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                {formatDate(sampleDate, option.value)}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Number Format */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100 mb-2">Number Format</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Choose how numbers are formatted (decimal and thousands separators).
        </p>

        <div className="grid grid-cols-2 gap-4 max-w-md">
          {NUMBER_FORMAT_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => handleNumberFormatChange(option.value)}
              className={`p-4 rounded-xl border-2 text-center transition-all ${currentNumberFormat === option.value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
            >
              <div className="text-lg font-mono font-semibold text-gray-900 dark:text-white mb-1">
                {option.example}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {option.label}
              </div>
            </button>
          ))}
        </div>

        {/* Live Preview */}
        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Preview</p>
          <p className="text-sm font-mono text-gray-700 dark:text-gray-300">
            {formatNumber(sampleNumber, currentNumberFormat, 2)}
          </p>
        </div>
      </div>

      {/* Currency */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100 mb-2">Currency</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Choose your default currency for financial displays.
        </p>

        <div className="grid grid-cols-2 gap-3 max-w-md">
          {CURRENCY_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => handleCurrencyChange(option.value)}
              className={`p-3 rounded-xl border-2 text-left transition-all ${currentCurrencyLocale === option.value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl font-semibold text-gray-900 dark:text-white">
                  {option.symbol}
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {option.label}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Live Preview */}
        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Preview</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {formatCurrency(sampleCurrency, currentCurrencyLocale, currentNumberFormat)}
          </p>
        </div>
      </div>

      {/* Save Button */}
      {onChange && onSave && (
        <div className="flex justify-end">
          <button
            onClick={onSave}
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Save Changes
          </button>
        </div>
      )}
    </div>
  );
};

export default AppearanceSettings;
