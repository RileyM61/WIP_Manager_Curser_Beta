import React, { useState } from 'react';
import { Settings } from '../../types';

interface LegalSettingsProps {
  settings: Settings;
  onChange: (settings: Partial<Settings>) => void;
  onSave: () => void;
  isOwner: boolean;
}

const LegalSettings: React.FC<LegalSettingsProps> = ({ settings, onChange, onSave, isOwner }) => {
  const [hasChanges, setHasChanges] = useState(false);

  const aiEnabled = Boolean(settings.aiEnabled);
  const aiDataSharing = settings.aiDataSharing || {
    includeJobFinancialTotals: true,
    includeCostBreakdownDetail: false,
    includeNotes: false,
    includeClientIdentifiers: false,
    includeAttachments: false,
  };

  const setAiEnabled = (enabled: boolean) => {
    onChange({
      aiEnabled: enabled,
      aiDataSharing: {
        includeJobFinancialTotals: aiDataSharing.includeJobFinancialTotals ?? true,
        includeCostBreakdownDetail: aiDataSharing.includeCostBreakdownDetail ?? false,
        includeNotes: aiDataSharing.includeNotes ?? false,
        includeClientIdentifiers: aiDataSharing.includeClientIdentifiers ?? false,
        includeAttachments: aiDataSharing.includeAttachments ?? false,
      },
    });
    setHasChanges(true);
  };

  const setAiDataSharing = (partial: Partial<typeof aiDataSharing>) => {
    onChange({
      aiDataSharing: {
        ...aiDataSharing,
        ...partial,
      },
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
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-1">Legal</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Review our terms of service and privacy policy.
        </p>
      </div>

      {/* Terms of Service */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">📋</span>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100">Terms of Service</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-4">
              Our terms of service outline the rules and regulations for using WIP Manager, including user responsibilities, acceptable use policies, and service limitations.
            </p>
            <a
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
            >
              Read Terms of Service
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* Privacy Policy */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">🔒</span>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100">Privacy Policy</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-4">
              Learn how we collect, use, and protect your data. We're committed to maintaining the privacy and security of your company's financial information.
            </p>
            <a
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
            >
              Read Privacy Policy
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* Data Handling */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100 mb-4">Data Handling</h3>
        
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Encrypted Storage</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">All data is encrypted at rest and in transit using industry-standard encryption.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">No Data Selling</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">We never sell your data to third parties. Your financial data belongs to you.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Data Export</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Export your data at any time in standard formats (CSV, PDF).</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Account Deletion</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Request complete deletion of your account and all associated data at any time.</p>
            </div>
          </div>
        </div>
      </div>

      {/* AI Data Sharing Controls (Admin) */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100 mb-2">AI Data Sharing Controls (Admin)</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          These workspace-wide settings control whether optional AI features are enabled and what categories of data may be used as context.
        </p>

        {!isOwner && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-amber-800 dark:text-amber-200 text-sm mb-4">
            Only workspace owners can change AI data sharing settings.
          </div>
        )}

        <div className="space-y-5">
          {/* Master Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">Enable AI Features</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                When enabled, certain features may use third-party AI service providers (per the Privacy Policy).
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAiEnabled(!aiEnabled)}
              disabled={!isOwner}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${aiEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'} ${!isOwner ? 'opacity-60 cursor-not-allowed' : ''}`}
              aria-label="Toggle AI features"
            >
              <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition ${aiEnabled ? 'translate-x-5' : 'translate-x-1'}`} />
            </button>
          </div>

          {/* Category toggles */}
          <div className={`${!aiEnabled ? 'opacity-60' : ''}`}>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2">Allowed data categories</p>
            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={aiDataSharing.includeJobFinancialTotals}
                  disabled={!isOwner || !aiEnabled}
                  onChange={(e) => setAiDataSharing({ includeJobFinancialTotals: e.target.checked })}
                  className="mt-1 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="text-sm font-medium text-gray-800 dark:text-gray-200">Job financial totals</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Totals like contract, earned, invoiced, costs, and cost-to-complete.</div>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={aiDataSharing.includeCostBreakdownDetail}
                  disabled={!isOwner || !aiEnabled}
                  onChange={(e) => setAiDataSharing({ includeCostBreakdownDetail: e.target.checked })}
                  className="mt-1 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="text-sm font-medium text-gray-800 dark:text-gray-200">Cost breakdown detail</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Labor/material/other components (more context, more sensitivity).</div>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={aiDataSharing.includeNotes}
                  disabled={!isOwner || !aiEnabled}
                  onChange={(e) => setAiDataSharing({ includeNotes: e.target.checked })}
                  className="mt-1 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="text-sm font-medium text-gray-800 dark:text-gray-200">Notes</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Internal notes can contain sensitive details. Default off is recommended.</div>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={aiDataSharing.includeClientIdentifiers}
                  disabled={!isOwner || !aiEnabled}
                  onChange={(e) => setAiDataSharing({ includeClientIdentifiers: e.target.checked })}
                  className="mt-1 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="text-sm font-medium text-gray-800 dark:text-gray-200">Client identifiers</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Client/company names and identifiers.</div>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={aiDataSharing.includeAttachments}
                  disabled={!isOwner || !aiEnabled}
                  onChange={(e) => setAiDataSharing({ includeAttachments: e.target.checked })}
                  className="mt-1 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="text-sm font-medium text-gray-800 dark:text-gray-200">Attachments / images</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Off by default. Enable only if you later add attachment-based AI features.</div>
                </div>
              </label>
            </div>

            {!aiEnabled && (
              <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                Enable AI Features to configure allowed data categories.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-6">
        <h3 className="text-lg font-medium text-blue-800 dark:text-blue-200 mb-2">Questions?</h3>
        <p className="text-sm text-blue-700 dark:text-blue-300">
          If you have any questions about our terms or privacy practices, please contact us at{' '}
          <a href="mailto:support@wipmanager.com" className="underline hover:no-underline">
            support@wipmanager.com
          </a>
        </p>
      </div>

      {/* Save Button */}
      {hasChanges && isOwner && (
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

export default LegalSettings;

