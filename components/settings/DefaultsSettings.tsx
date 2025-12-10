import React, { useState } from 'react';
import { Settings, WeekDay, JobStatus, UserRole } from '../../types';
import { DEFAULT_CAPACITY_PLAN } from '../../hooks/useSupabaseSettings';

interface DefaultsSettingsProps {
  settings: Settings;
  onChange: (settings: Partial<Settings>) => void;
  onSave: () => void;
}

const DefaultsSettings: React.FC<DefaultsSettingsProps> = ({ settings, onChange, onSave }) => {
  const [hasChanges, setHasChanges] = useState(false);

  const weekDays: WeekDay[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === 'defaultRole') {
      onChange({ defaultRole: value as UserRole });
    } else if (name === 'weekEndDay') {
      onChange({ weekEndDay: value as WeekDay });
    } else if (name === 'defaultStatus') {
      onChange({ defaultStatus: value as JobStatus });
    } else {
      onChange({ [name]: value });
    }
    setHasChanges(true);
  };

  const handleToggleCapacity = () => {
    const nextEnabled = !settings.capacityEnabled;
    onChange({
      capacityEnabled: nextEnabled,
      // Use existing plan if available, otherwise use default plan when enabling
      capacityPlan: nextEnabled ? (settings.capacityPlan ?? DEFAULT_CAPACITY_PLAN) : undefined,
    });
    setHasChanges(true);
  };

  const handleSave = () => {
    onSave();
    setHasChanges(false);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-1">Job Defaults</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Configure default values for new jobs and WIP reporting.
        </p>
      </div>

      {/* Default Status & Role */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100 mb-4">New Job Defaults</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="defaultStatus" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Default Job Status
            </label>
            <select
              name="defaultStatus"
              id="defaultStatus"
              value={settings.defaultStatus}
              onChange={handleChange}
              className="block w-full border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-200"
            >
              {Object.values(JobStatus).map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Status assigned to newly created jobs
            </p>
          </div>

          <div>
            <label htmlFor="defaultRole" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Default User Role
            </label>
            <select
              name="defaultRole"
              id="defaultRole"
              value={settings.defaultRole}
              onChange={handleChange}
              className="block w-full border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-200"
            >
              <option value="owner">Owner</option>
              <option value="projectManager">Project Manager</option>
              <option value="estimator">Estimator</option>
            </select>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Role assigned to new team members
            </p>
          </div>
        </div>
      </div>

      {/* WIP Reporting */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100 mb-4">WIP Reporting</h3>

        <div>
          <label htmlFor="weekEndDay" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            WIP Week End Day
          </label>
          <select
            name="weekEndDay"
            id="weekEndDay"
            value={settings.weekEndDay}
            onChange={handleChange}
            className="block w-full max-w-xs border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-200"
          >
            {weekDays.map(day => (
              <option key={day} value={day}>{day}</option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            The day your WIP reporting week ends (typically matches your payroll cycle)
          </p>
        </div>
      </div>

      {/* Staffing Capacity */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100">Staffing Capacity Tracking</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Enable to plan headcount and hours per discipline for resource management.
            </p>
          </div>
          <button
            type="button"
            onClick={handleToggleCapacity}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${settings.capacityEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
          >
            <span
              className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition ${settings.capacityEnabled ? 'translate-x-5' : 'translate-x-1'
                }`}
            />
          </button>
        </div>
        {settings.capacityEnabled && (
          <p className="mt-3 text-sm text-blue-600 dark:text-blue-400">
            ✓ Capacity tracking is enabled. Access the Capacity Planner from the main dashboard.
          </p>
        )}
      </div>

      {/* Default T&M Markup Rates */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100 mb-2">Default T&M Markup Rates</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Set default markups for new Time & Material jobs. These will be pre-filled when creating T&M jobs.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Labor Bill Rate */}
          <div>
            <label htmlFor="defaultLaborBillRate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Labor Bill Rate
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">$</span>
              <input
                type="number"
                name="defaultLaborBillRate"
                id="defaultLaborBillRate"
                value={settings.defaultLaborBillRate || ''}
                onChange={(e) => {
                  const value = e.target.value ? parseFloat(e.target.value) : undefined;
                  onChange({ defaultLaborBillRate: value });
                  setHasChanges(true);
                }}
                placeholder="85.00"
                step="0.01"
                min="0"
                className="block w-full border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm py-2.5 pl-7 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-200"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm">/hr</span>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Default hourly rate for labor billing
            </p>
          </div>

          {/* Materials Markup */}
          <div>
            <label htmlFor="defaultMaterialMarkup" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Materials Markup
            </label>
            <div className="relative">
              <input
                type="number"
                name="defaultMaterialMarkup"
                id="defaultMaterialMarkup"
                value={settings.defaultMaterialMarkup ? Math.round((settings.defaultMaterialMarkup - 1) * 100) : ''}
                onChange={(e) => {
                  const percent = e.target.value ? parseFloat(e.target.value) : undefined;
                  const multiplier = percent !== undefined ? 1 + (percent / 100) : undefined;
                  onChange({ defaultMaterialMarkup: multiplier });
                  setHasChanges(true);
                }}
                placeholder="15"
                step="1"
                min="0"
                className="block w-full border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm py-2.5 px-3 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-200"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm">%</span>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Markup percentage on material costs
            </p>
          </div>

          {/* Other Markup */}
          <div>
            <label htmlFor="defaultOtherMarkup" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Other Markup
            </label>
            <div className="relative">
              <input
                type="number"
                name="defaultOtherMarkup"
                id="defaultOtherMarkup"
                value={settings.defaultOtherMarkup ? Math.round((settings.defaultOtherMarkup - 1) * 100) : ''}
                onChange={(e) => {
                  const percent = e.target.value ? parseFloat(e.target.value) : undefined;
                  const multiplier = percent !== undefined ? 1 + (percent / 100) : undefined;
                  onChange({ defaultOtherMarkup: multiplier });
                  setHasChanges(true);
                }}
                placeholder="10"
                step="1"
                min="0"
                className="block w-full border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm py-2.5 px-3 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-200"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm">%</span>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Markup percentage on other costs
            </p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      {hasChanges && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
          >
            Save Changes
          </button>
        </div>
      )}
    </div>
  );
};

export default DefaultsSettings;

