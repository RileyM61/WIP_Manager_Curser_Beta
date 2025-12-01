// ============================================================================
// EMPLOYEE FORM MODAL
// ============================================================================

import React, { useState, useEffect } from 'react';
import { Employee, EmployeeFormData } from '../types';
import {
  DEFAULT_BURDEN_MULTIPLIER,
  DEFAULT_UTILIZATION_TARGET,
  DEFAULT_ANNUAL_PTO_HOURS,
  DEFAULT_FTE,
  CURRENCY_FORMAT_DECIMAL,
} from '../constants';
import { calculateLoadedCostPerHour, calculateAnnualLoadedCost } from '../lib/calculations';

interface EmployeeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: EmployeeFormData) => Promise<boolean>;
  employee?: Employee | null;
}

const initialFormData: EmployeeFormData = {
  name: '',
  role: '',
  fte: DEFAULT_FTE,
  hourlyRate: 25,
  burdenMultiplier: DEFAULT_BURDEN_MULTIPLIER,
  annualPtoHours: DEFAULT_ANNUAL_PTO_HOURS,
  hireDate: '',
  utilizationTarget: DEFAULT_UTILIZATION_TARGET,
  isActive: true,
  notes: '',
};

const EmployeeFormModal: React.FC<EmployeeFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  employee,
}) => {
  const [formData, setFormData] = useState<EmployeeFormData>(initialFormData);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Populate form when editing
  useEffect(() => {
    if (employee) {
      setFormData({
        name: employee.name,
        role: employee.role || '',
        fte: employee.fte,
        hourlyRate: employee.hourlyRate,
        burdenMultiplier: employee.burdenMultiplier,
        annualPtoHours: employee.annualPtoHours,
        hireDate: employee.hireDate || '',
        utilizationTarget: employee.utilizationTarget,
        isActive: employee.isActive,
        notes: employee.notes || '',
      });
    } else {
      setFormData(initialFormData);
    }
    setError(null);
  }, [employee, isOpen]);

  // Calculate preview values
  const loadedRate = calculateLoadedCostPerHour(formData.hourlyRate, formData.burdenMultiplier);
  const annualCost = calculateAnnualLoadedCost(
    formData.hourlyRate,
    formData.burdenMultiplier,
    formData.fte,
    formData.annualPtoHours
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Employee name is required');
      return;
    }

    setSaving(true);
    setError(null);

    const success = await onSave(formData);
    
    setSaving(false);
    if (success) {
      onClose();
    } else {
      setError('Failed to save employee');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {employee ? 'Edit Employee' : 'Add Employee'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="grid grid-cols-2 gap-6">
            {/* Name */}
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="John Smith"
                required
              />
            </div>

            {/* Role */}
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Role / Title
              </label>
              <input
                type="text"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Field Laborer"
              />
            </div>

            {/* FTE */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                FTE
              </label>
              <select
                value={formData.fte}
                onChange={(e) => setFormData({ ...formData, fte: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value={0.25}>0.25 (10 hrs/week)</option>
                <option value={0.5}>0.50 (20 hrs/week)</option>
                <option value={0.75}>0.75 (30 hrs/week)</option>
                <option value={1.0}>1.00 (40 hrs/week)</option>
                <option value={1.25}>1.25 (50 hrs/week)</option>
                <option value={1.5}>1.50 (60 hrs/week)</option>
              </select>
            </div>

            {/* Hourly Rate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Hourly Rate
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.hourlyRate}
                  onChange={(e) => setFormData({ ...formData, hourlyRate: parseFloat(e.target.value) || 0 })}
                  className="w-full pl-7 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>

            {/* Burden Multiplier */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Burden Multiplier
              </label>
              <select
                value={formData.burdenMultiplier}
                onChange={(e) => setFormData({ ...formData, burdenMultiplier: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value={1.10}>1.10 (10% burden)</option>
                <option value={1.12}>1.12 (12% burden)</option>
                <option value={1.14}>1.14 (14% burden)</option>
                <option value={1.16}>1.16 (16% burden)</option>
                <option value={1.18}>1.18 (18% burden)</option>
                <option value={1.20}>1.20 (20% burden)</option>
                <option value={1.25}>1.25 (25% burden)</option>
                <option value={1.30}>1.30 (30% burden)</option>
                <option value={1.35}>1.35 (35% burden)</option>
              </select>
            </div>

            {/* Annual PTO */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Annual PTO Hours
              </label>
              <input
                type="number"
                min="0"
                max="500"
                value={formData.annualPtoHours}
                onChange={(e) => setFormData({ ...formData, annualPtoHours: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            {/* Hire Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Hire Date
              </label>
              <input
                type="date"
                value={formData.hireDate}
                onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            {/* Utilization Target */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Utilization Target
              </label>
              <select
                value={formData.utilizationTarget}
                onChange={(e) => setFormData({ ...formData, utilizationTarget: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value={0.70}>70%</option>
                <option value={0.75}>75%</option>
                <option value={0.80}>80%</option>
                <option value={0.85}>85%</option>
                <option value={0.90}>90%</option>
                <option value={0.95}>95%</option>
              </select>
            </div>

            {/* Active Status */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Active Employee
              </label>
            </div>

            {/* Notes */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Optional notes..."
              />
            </div>
          </div>

          {/* Cost Preview */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Cost Preview
            </h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Loaded Rate</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {CURRENCY_FORMAT_DECIMAL.format(loadedRate)}/hr
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Annual Cost</p>
                <p className="text-lg font-bold text-orange-600">
                  {CURRENCY_FORMAT_DECIMAL.format(annualCost)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Monthly Cost</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {CURRENCY_FORMAT_DECIMAL.format(annualCost / 12)}
                </p>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-6 py-2 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {saving ? 'Saving...' : employee ? 'Update Employee' : 'Add Employee'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeFormModal;

