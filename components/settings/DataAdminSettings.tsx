import React, { useState } from 'react';
import { Job } from '../../types';
import { useJobFinancialSnapshots } from '../../hooks/useJobFinancialSnapshots';

interface DataAdminSettingsProps {
    companyId: string;
    jobs: Job[];
}

/**
 * Settings section for data administration tasks like creating bulk snapshots.
 */
const DataAdminSettings: React.FC<DataAdminSettingsProps> = ({ companyId, jobs }) => {
    const { createBulkSnapshots, loading, error } = useJobFinancialSnapshots(companyId);
    const [lastResult, setLastResult] = useState<{ count: number; date: string } | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    const activeJobCount = jobs.filter(j => j.status === 'Active').length;

    const handleCreateSnapshots = async () => {
        setIsCreating(true);
        setLastResult(null);

        const count = await createBulkSnapshots(jobs);

        setLastResult({
            count,
            date: new Date().toLocaleString(),
        });
        setIsCreating(false);
    };

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-1">Data Administration</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Manage job financial snapshots and historical data.
                </p>
            </div>

            {/* Snapshot Creation */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                            Job Financial Snapshots
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                            Create a point-in-time snapshot of all active job financials. Use this weekly to build historical trend data.
                        </p>

                        <div className="flex items-center gap-4 mb-4">
                            <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-2 rounded-lg">
                                <p className="text-xs text-gray-500 dark:text-gray-400">Active Jobs</p>
                                <p className="text-lg font-semibold text-gray-900 dark:text-white">{activeJobCount}</p>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-2 rounded-lg">
                                <p className="text-xs text-gray-500 dark:text-gray-400">Total Jobs</p>
                                <p className="text-lg font-semibold text-gray-900 dark:text-white">{jobs.length}</p>
                            </div>
                        </div>

                        <button
                            onClick={handleCreateSnapshots}
                            disabled={isCreating || activeJobCount === 0}
                            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isCreating ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Creating Snapshots...
                                </span>
                            ) : (
                                'Create Snapshots Now'
                            )}
                        </button>

                        {error && (
                            <p className="mt-3 text-sm text-red-600 dark:text-red-400">
                                Error: {error}
                            </p>
                        )}

                        {lastResult && (
                            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                <p className="text-sm text-green-700 dark:text-green-300">
                                    ✓ Created {lastResult.count} snapshot{lastResult.count !== 1 ? 's' : ''} at {lastResult.date}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Automation Info */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-6">
                <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Automatic Snapshots
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            A Supabase Edge Function is available to automatically create weekly snapshots.
                            Contact your administrator to set up scheduled snapshot creation.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DataAdminSettings;
