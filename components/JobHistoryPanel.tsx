import React, { useState } from 'react';
import { Job, JobFinancialSnapshot } from '../types';
import { useJobFinancialSnapshots } from '../hooks/useJobFinancialSnapshots';

interface JobHistoryPanelProps {
    job: Job;
    companyId: string;
    isOpen: boolean;
    onClose: () => void;
}

/**
 * Panel showing historical financial snapshots for a job.
 * Displays trend data over time.
 */
const JobHistoryPanel: React.FC<JobHistoryPanelProps> = ({ job, companyId, isOpen, onClose }) => {
    const { getSnapshotHistory, createSnapshotFromJob, loading, error } = useJobFinancialSnapshots(companyId);
    const [snapshots, setSnapshots] = useState<JobFinancialSnapshot[]>([]);
    const [loaded, setLoaded] = useState(false);

    // Load history when panel opens
    React.useEffect(() => {
        if (isOpen && !loaded) {
            loadHistory();
        }
    }, [isOpen]);

    const loadHistory = async () => {
        const history = await getSnapshotHistory(job.id, 20);
        setSnapshots(history);
        setLoaded(true);
    };

    const handleCreateSnapshot = async () => {
        const snapshot = await createSnapshotFromJob(job);
        if (snapshot) {
            setSnapshots([snapshot, ...snapshots]);
        }
    };

    if (!isOpen) return null;

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    const formatPercent = (value: number | null) => {
        if (value === null) return '-';
        return `${(value * 100).toFixed(1)}%`;
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Panel */}
            <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white dark:bg-gray-900 shadow-2xl overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Job History
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {job.jobNo} - {job.jobName}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleCreateSnapshot}
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                            {loading ? 'Creating...' : 'Take Snapshot'}
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {error && (
                        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
                            {error}
                        </div>
                    )}

                    {loading && !loaded ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : snapshots.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                No History Yet
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                Click "Take Snapshot" to capture the current financial state of this job.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {snapshots.map((snapshot, index) => {
                                const prevSnapshot = snapshots[index + 1];
                                const marginChange = prevSnapshot
                                    ? (snapshot.forecastedMarginFinal || 0) - (prevSnapshot.forecastedMarginFinal || 0)
                                    : 0;

                                return (
                                    <div
                                        key={snapshot.id}
                                        className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700"
                                    >
                                        {/* Date Header */}
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {formatDate(snapshot.snapshotDate)}
                                                </span>
                                                {index === 0 && (
                                                    <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full">
                                                        Latest
                                                    </span>
                                                )}
                                            </div>
                                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${snapshot.billingPositionLabel === 'over-billed'
                                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                                : snapshot.billingPositionLabel === 'under-billed'
                                                    ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                                                }`}>
                                                {snapshot.billingPositionLabel || 'N/A'}
                                            </span>
                                        </div>

                                        {/* Metrics Grid */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Earned</p>
                                                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                                    {formatCurrency(snapshot.earnedToDate)}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Costs</p>
                                                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                                    {formatCurrency(snapshot.totalCostToDate)}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Forecast Profit</p>
                                                <p className={`text-sm font-semibold ${(snapshot.forecastedProfitFinal || 0) >= 0
                                                    ? 'text-green-600 dark:text-green-400'
                                                    : 'text-red-600 dark:text-red-400'
                                                    }`}>
                                                    {formatCurrency(snapshot.forecastedProfitFinal || 0)}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Forecast Margin</p>
                                                <div className="flex items-center gap-1">
                                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                                        {formatPercent(snapshot.forecastedMarginFinal)}
                                                    </p>
                                                    {marginChange !== 0 && (
                                                        <span className={`text-xs ${marginChange > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                            {marginChange > 0 ? '↑' : '↓'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Health Flags */}
                                        {(snapshot.atRiskMargin || snapshot.behindSchedule) && (
                                            <div className="mt-3 flex gap-2">
                                                {snapshot.atRiskMargin && (
                                                    <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs rounded-full">
                                                        ⚠ At Risk Margin
                                                    </span>
                                                )}
                                                {snapshot.behindSchedule && (
                                                    <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs rounded-full">
                                                        📅 Behind Schedule
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default JobHistoryPanel;
