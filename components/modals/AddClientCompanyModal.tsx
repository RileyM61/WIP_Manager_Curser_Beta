import React, { useState } from 'react';
import { ModuleId, MODULES } from '../../types';

interface AddClientCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    companyName: string,
    ownerEmail: string,
    grantedModules: ModuleId[]
  ) => Promise<{ success: boolean; error?: string }>;
  practiceName: string;
}

const AddClientCompanyModal: React.FC<AddClientCompanyModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  practiceName,
}) => {
  const [companyName, setCompanyName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [grantedModules, setGrantedModules] = useState<ModuleId[]>(['wip']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Available modules (only show non-coming-soon ones, or all for flexibility)
  const availableModules: { id: ModuleId; name: string; icon: string }[] = [
    { id: 'wip', name: 'WIP Manager', icon: '📊' },
    { id: 'forecasting', name: 'Cash Flow Forecasting', icon: '📈' },
    { id: 'capacity', name: 'Labor Capacity', icon: '👷' },
    { id: 'budget', name: 'Budget vs Actual', icon: '📋' },
    { id: 'jcurve', name: 'J-Curve Analysis', icon: '💰' },
    { id: 'covenant', name: 'Covenant Compliance', icon: '🏦' },
    { id: 'profitability', name: 'Profitability Analytics', icon: '📊' },
    { id: 'bidnobid', name: 'Bid/No-Bid Decisions', icon: '🎯' },
    { id: 'scenarios', name: 'Scenario Planning', icon: '🔮' },
    { id: 'reporting', name: 'Financial Reporting', icon: '📑' },
  ];

  const handleModuleToggle = (moduleId: ModuleId) => {
    setGrantedModules(prev => {
      if (prev.includes(moduleId)) {
        // Don't allow removing WIP (it's the core module)
        if (moduleId === 'wip') return prev;
        return prev.filter(m => m !== moduleId);
      } else {
        return [...prev, moduleId];
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!companyName.trim()) {
      setError('Company name is required');
      return;
    }

    if (!ownerEmail.trim()) {
      setError('Owner email is required');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(ownerEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await onSubmit(companyName.trim(), ownerEmail.trim(), grantedModules);
      
      if (result.success) {
        // Reset form and close
        setCompanyName('');
        setOwnerEmail('');
        setGrantedModules(['wip']);
        onClose();
      } else {
        setError(result.error || 'Failed to create company');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Add Client Company
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Create a new company managed by {practiceName}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="px-6 py-4 space-y-5">
              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              )}

              {/* Company Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Company Name *
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g., ABC Construction"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  disabled={isSubmitting}
                />
              </div>

              {/* Owner Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Owner Email *
                </label>
                <input
                  type="email"
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                  placeholder="owner@company.com"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  disabled={isSubmitting}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  This person will receive an invitation to join as the company owner
                </p>
              </div>

              {/* Module Access */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Module Access
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  Select which modules this client can access
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg p-3">
                  {availableModules.map((module) => {
                    const isEnabled = grantedModules.includes(module.id);
                    const isWip = module.id === 'wip';
                    const moduleConfig = MODULES[module.id];
                    const isComingSoon = moduleConfig?.comingSoon;
                    
                    return (
                      <label
                        key={module.id}
                        className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                          isEnabled 
                            ? 'bg-blue-50 dark:bg-blue-900/20' 
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        } ${isWip ? 'opacity-75' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={isEnabled}
                          onChange={() => handleModuleToggle(module.id)}
                          disabled={isWip || isSubmitting}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-lg">{module.icon}</span>
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {module.name}
                          </span>
                          {isWip && (
                            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                              (Always included)
                            </span>
                          )}
                          {isComingSoon && (
                            <span className="ml-2 text-xs text-amber-600 dark:text-amber-400">
                              Coming Soon
                            </span>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Summary */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Summary
                </h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Company will be managed by <strong>{practiceName}</strong></li>
                  <li>• Owner will receive an email invitation</li>
                  <li>• {grantedModules.length} module{grantedModules.length !== 1 ? 's' : ''} will be enabled</li>
                  <li>• No subscription required (included in your CFO services)</li>
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Creating...
                  </>
                ) : (
                  'Create Company'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddClientCompanyModal;

