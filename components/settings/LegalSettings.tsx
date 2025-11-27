import React from 'react';

const LegalSettings: React.FC = () => {
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
    </div>
  );
};

export default LegalSettings;

