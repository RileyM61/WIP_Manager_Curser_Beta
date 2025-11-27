import React from 'react';

interface ComingSoonSectionProps {
  title: string;
  description: string;
  features: string[];
}

const ComingSoonSection: React.FC<ComingSoonSectionProps> = ({ title, description, features }) => {
  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{title}</h2>
          <span className="px-2.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-medium rounded-full">
            Coming Soon
          </span>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {description}
        </p>
      </div>

      {/* Feature Preview */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100 mb-4">Planned Features</h3>
        
        <div className="space-y-3">
          {features.map((feature, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="w-6 h-6 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-300">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Notify Me */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">🔔</span>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100">Want to be notified?</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 mb-4">
              We'll let you know when this feature becomes available. As a beta user, you'll get early access!
            </p>
            <button
              disabled
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium opacity-50 cursor-not-allowed"
            >
              Notifications Coming Soon
            </button>
          </div>
        </div>
      </div>

      {/* Feedback */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100 mb-2">Have Feedback?</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          We're actively developing these features. Your input helps us prioritize what matters most to you.
        </p>
        <a
          href="mailto:feedback@wipmanager.com?subject=Feature Request: {title}"
          className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
        >
          Send Feedback
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </a>
      </div>
    </div>
  );
};

export default ComingSoonSection;

