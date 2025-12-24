import React from 'react';

interface ErrorFallbackProps {
    error: Error;
    resetError: () => void;
    componentStack: string | null;
    eventId: string | null;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetError, eventId }) => {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center border border-gray-100 dark:border-gray-700">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>

                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Something went wrong
                </h2>

                <p className="text-gray-600 dark:text-gray-300 mb-6">
                    We've tracked this error and our engineering team has been notified.
                    {eventId && <span className="block mt-2 text-xs text-gray-500 font-mono">Error ID: {eventId}</span>}
                </p>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={resetError} // Helps recover from the error
                        className="w-full px-6 py-3 bg-gradient-to-r from-wip-gold to-wip-gold-dark text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-wip-gold/30 transition-all active:scale-95"
                    >
                        Try Again
                    </button>

                    <button
                        onClick={() => window.location.href = '/'}
                        className="w-full px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all border border-transparent"
                    >
                        Go Home
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ErrorFallback;
