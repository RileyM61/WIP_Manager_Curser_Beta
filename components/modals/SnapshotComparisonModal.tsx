import React from 'react';
import { JobFinancialSnapshot } from '../../types';

interface SnapshotComparisonModalProps {
    isOpen: boolean;
    onClose: () => void;
    jobName: string;
    previousSnapshot: JobFinancialSnapshot | null;
    currentSnapshot: JobFinancialSnapshot;
}

interface ComparisonRow {
    label: string;
    prevValue: number;
    currentValue: number;
    formatAsCurrency?: boolean;
    invertDelta?: boolean; // For costs, lower is better
}

/**
 * Modal that displays a comparison between previous and current snapshot values.
 * Shows Prev, Now, and Δ (delta) columns for key metrics.
 */
const SnapshotComparisonModal: React.FC<SnapshotComparisonModalProps> = ({
    isOpen,
    onClose,
    jobName,
    previousSnapshot,
    currentSnapshot,
}) => {
    if (!isOpen) return null;

    const formatCurrency = (value: number): string => {
        const absValue = Math.abs(value);
        if (absValue >= 1000000) {
            return `$${(value / 1000000).toFixed(1)}M`;
        } else if (absValue >= 1000) {
            return `$${(value / 1000).toFixed(0)}k`;
        }
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    const formatDelta = (delta: number, invertDelta: boolean = false): { text: string; className: string } => {
        const effectiveDelta = invertDelta ? -delta : delta;
        const sign = delta > 0 ? '+' : '';
        const text = `${sign}${formatCurrency(delta)}`;

        if (effectiveDelta > 0) {
            return { text, className: 'text-green-600 dark:text-green-400 font-semibold' };
        } else if (effectiveDelta < 0) {
            return { text, className: 'text-red-600 dark:text-red-400 font-semibold' };
        }
        return { text: '$0', className: 'text-gray-500 dark:text-gray-400' };
    };

    // Build comparison rows
    const rows: ComparisonRow[] = [
        {
            label: 'Forecasted Profit',
            prevValue: previousSnapshot?.forecastedProfitFinal ?? 0,
            currentValue: currentSnapshot.forecastedProfitFinal ?? 0,
            formatAsCurrency: true,
        },
        {
            label: 'Cost to Date',
            prevValue: previousSnapshot?.totalCostToDate ?? 0,
            currentValue: currentSnapshot.totalCostToDate,
            formatAsCurrency: true,
            invertDelta: true, // Lower costs are better
        },
        {
            label: 'Earned',
            prevValue: previousSnapshot?.earnedToDate ?? 0,
            currentValue: currentSnapshot.earnedToDate,
            formatAsCurrency: true,
        },
        {
            label: 'Under Billed',
            prevValue: previousSnapshot?.billingPositionNumeric ?? 0,
            currentValue: currentSnapshot.billingPositionNumeric ?? 0,
            formatAsCurrency: true,
            invertDelta: true, // Lower under-billed is better (closer to 0 or over-billed)
        },
    ];

    const hasPreviousSnapshot = previousSnapshot !== null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden transform transition-all">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                                    <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        Snapshot Created
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {jobName}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="px-6 py-5">
                        {hasPreviousSnapshot ? (
                            <>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                    Change Summary vs Previous Snapshot
                                </p>

                                {/* Comparison Table */}
                                <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-gray-50 dark:bg-gray-700/50">
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                    Metric
                                                </th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                    Prev
                                                </th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                    Now
                                                </th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                    Δ
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                            {rows.map((row, index) => {
                                                const delta = row.currentValue - row.prevValue;
                                                const deltaFormatted = formatDelta(delta, row.invertDelta);

                                                return (
                                                    <tr key={index} className="bg-white dark:bg-gray-800">
                                                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                                                            {row.label}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-right text-gray-600 dark:text-gray-400">
                                                            {formatCurrency(row.prevValue)}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white font-medium">
                                                            {formatCurrency(row.currentValue)}
                                                        </td>
                                                        <td className={`px-4 py-3 text-sm text-right ${deltaFormatted.className}`}>
                                                            {deltaFormatted.text}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                <p className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
                                    This comparison helps track job financial progression over time.
                                </p>
                            </>
                        ) : (
                            <div className="text-center py-4">
                                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                    First Snapshot Recorded
                                </h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    This is the first snapshot for this job. Future snapshots will show a comparison to this baseline.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
                        <button
                            onClick={onClose}
                            className="w-full px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Got it
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SnapshotComparisonModal;
