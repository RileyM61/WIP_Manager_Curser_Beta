import React from 'react';

interface JobLimitModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentJobCount: number;
    jobLimit: number;
    onUpgrade: () => void;
}

const JobLimitModal: React.FC<JobLimitModalProps> = ({
    isOpen,
    onClose,
    currentJobCount,
    jobLimit,
    onUpgrade,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
                {/* Header with gradient */}
                <div className="bg-gradient-to-r from-wip-gold to-wip-gold-dark px-6 py-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Job Limit Reached</h2>
                    <p className="text-white/90 text-sm">
                        You've reached your free plan limit
                    </p>
                </div>

                {/* Body */}
                <div className="px-6 py-6">
                    <div className="text-center mb-6">
                        <div className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-full mb-4">
                            <span className="text-2xl font-bold text-slate-800 dark:text-white">{currentJobCount}</span>
                            <span className="text-slate-500 dark:text-slate-400">/</span>
                            <span className="text-2xl font-bold text-slate-800 dark:text-white">{jobLimit}</span>
                            <span className="text-slate-500 dark:text-slate-400 text-sm">jobs</span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300">
                            Free accounts are limited to <strong>{jobLimit} jobs</strong>. Upgrade to Pro for unlimited jobs and premium features.
                        </p>
                    </div>

                    {/* Benefits */}
                    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 mb-6">
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">Pro includes:</p>
                        <ul className="space-y-2">
                            {[
                                'Unlimited jobs',
                                'Advanced reporting & analytics',
                                'Priority support',
                                'Team collaboration features',
                            ].map((benefit, index) => (
                                <li key={index} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                    <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    {benefit}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={onUpgrade}
                            className="w-full py-3 px-4 bg-gradient-to-r from-wip-gold to-wip-gold-dark text-white font-semibold rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all"
                        >
                            Upgrade to Pro
                        </button>
                        <button
                            onClick={onClose}
                            className="w-full py-3 px-4 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                        >
                            Maybe Later
                        </button>
                    </div>
                </div>

                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default JobLimitModal;
