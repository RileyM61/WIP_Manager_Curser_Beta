import React from 'react';
import { ChangeOrder, ChangeOrderStatus } from '../types';

interface ChangeOrderListProps {
    changeOrders: ChangeOrder[];
    onEdit: (co: ChangeOrder) => void;
    onAddNew: () => void;
    loading?: boolean;
}

const statusColors: Record<ChangeOrderStatus, string> = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
};

const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

const formatCoNumber = (num: number) => `CO-${String(num).padStart(3, '0')}`;

const ChangeOrderList: React.FC<ChangeOrderListProps> = ({
    changeOrders,
    onEdit,
    onAddNew,
    loading = false,
}) => {
    const sumBreakdown = (breakdown: { labor: number; material: number; other: number }) =>
        breakdown.labor + breakdown.material + breakdown.other;

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Header with Add button */}
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Change Orders ({changeOrders.length})
                </h3>
                <button
                    onClick={onAddNew}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add CO
                </button>
            </div>

            {/* Empty state */}
            {changeOrders.length === 0 ? (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                    <svg className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-sm">No change orders yet</p>
                    <p className="text-xs text-slate-400">Click "Add CO" to create one</p>
                </div>
            ) : (
                /* CO List */
                <div className="space-y-2">
                    {changeOrders.map((co) => {
                        const contractTotal = sumBreakdown(co.contract);
                        const costsTotal = sumBreakdown(co.costs);
                        const ctcTotal = sumBreakdown(co.costToComplete);
                        const invoicedTotal = sumBreakdown(co.invoiced);

                        // Calculate component-level % complete using Costs / (Costs + CTC)
                        const laborTotal = co.costs.labor + co.costToComplete.labor;
                        const materialTotal = co.costs.material + co.costToComplete.material;
                        const otherTotal = co.costs.other + co.costToComplete.other;

                        const laborPct = laborTotal > 0 ? (co.costs.labor / laborTotal) * 100 : 0;
                        const materialPct = materialTotal > 0 ? (co.costs.material / materialTotal) * 100 : 0;
                        const otherPct = otherTotal > 0 ? (co.costs.other / otherTotal) * 100 : 0;

                        // Calculate earned revenue (component-level)
                        const laborEarned = co.contract.labor * (laborPct / 100);
                        const materialEarned = co.contract.material * (materialPct / 100);
                        const otherEarned = co.contract.other * (otherPct / 100);
                        const earnedTotal = laborEarned + materialEarned + otherEarned;

                        // Over/under billed
                        const overUnder = invoicedTotal - earnedTotal;

                        const isTM = co.coType === 'time-material';
                        const hasProgress = costsTotal > 0 && (costsTotal + ctcTotal) > 0;

                        return (
                            <div
                                key={co.id}
                                onClick={() => onEdit(co)}
                                className="p-3 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-500 cursor-pointer transition-colors"
                            >
                                {/* Top row: CO number, type, status, contract value */}
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="text-sm font-mono font-semibold text-slate-700 dark:text-slate-200">
                                            {formatCoNumber(co.coNumber)}
                                        </div>
                                        <span className={`px-2 py-0.5 text-xs font-medium rounded ${isTM
                                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                                            : 'bg-slate-100 text-slate-600 dark:bg-slate-600 dark:text-slate-300'
                                            }`}>
                                            {isTM ? 'T&M' : 'FP'}
                                        </span>
                                        <span className={`px-2 py-0.5 text-xs font-medium rounded ${statusColors[co.status]}`}>
                                            {co.status.charAt(0).toUpperCase() + co.status.slice(1)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                                            {formatCurrency(contractTotal)}
                                        </div>
                                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>

                                {/* Description */}
                                {co.description && (
                                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate mb-2">
                                        {co.description}
                                    </div>
                                )}

                                {/* % Complete breakdown - Fixed Price only */}
                                {!isTM && hasProgress && (
                                    <div className="flex items-center gap-4 text-xs border-t border-slate-100 dark:border-slate-600 pt-2 mt-1">
                                        <div className="flex gap-3">
                                            <span className="text-slate-500 dark:text-slate-400">
                                                L: <span className="font-medium text-slate-700 dark:text-slate-300">{laborPct.toFixed(0)}%</span>
                                            </span>
                                            <span className="text-slate-500 dark:text-slate-400">
                                                M: <span className="font-medium text-slate-700 dark:text-slate-300">{materialPct.toFixed(0)}%</span>
                                            </span>
                                            <span className="text-slate-500 dark:text-slate-400">
                                                O: <span className="font-medium text-slate-700 dark:text-slate-300">{otherPct.toFixed(0)}%</span>
                                            </span>
                                        </div>
                                        <div className="ml-auto">
                                            <span className={`font-medium ${overUnder >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                {overUnder >= 0 ? 'Over' : 'Under'}: {formatCurrency(Math.abs(overUnder))}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ChangeOrderList;
