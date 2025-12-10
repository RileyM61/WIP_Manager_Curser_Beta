import React from 'react';
import { ChangeOrder, CostBreakdown, Job } from '../types';
import {
    sumBreakdown,
    getJobTotalsWithCOs,
    calculateForecastedProfitWithCOs,
    calculateForecastedProfit
} from '../modules/wip/lib/jobCalculations';
import { countCOsByStatus, getPendingCOsContractTotal } from '../hooks/useSupabaseChangeOrders';

interface ChangeOrderSummaryCardProps {
    job: Job;
    changeOrders: ChangeOrder[];
}

const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

const ChangeOrderSummaryCard: React.FC<ChangeOrderSummaryCardProps> = ({
    job,
    changeOrders,
}) => {
    const totals = getJobTotalsWithCOs(job, changeOrders);
    const statusCounts = countCOsByStatus(changeOrders);
    const pendingContractTotal = getPendingCOsContractTotal(changeOrders);

    // Calculate profits
    const originalProfit = calculateForecastedProfit(job);
    const totalProfit = calculateForecastedProfitWithCOs(job, changeOrders);
    const coProfit = totalProfit - originalProfit;

    // Totals
    const originalContractTotal = sumBreakdown(job.contract);
    const coContractTotal = sumBreakdown(totals.coContract);
    const totalContractValue = sumBreakdown(totals.contract);

    const originalCostsTotal = sumBreakdown(job.costs);
    const coCostsTotal = sumBreakdown(totals.coCosts);
    const totalCosts = sumBreakdown(totals.costs);

    const hasChangeOrders = changeOrders.length > 0;
    const hasApprovedCOs = totals.hasApprovedCOs;

    if (!hasChangeOrders) {
        return null;
    }

    return (
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Job + COs Summary
                </h3>
                <div className="flex items-center gap-1">
                    {statusCounts.pending > 0 && (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                            {statusCounts.pending} pending
                        </span>
                    )}
                    {(statusCounts.approved + statusCounts.completed) > 0 && (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                            {statusCounts.approved + statusCounts.completed} approved
                        </span>
                    )}
                </div>
            </div>

            <div className="space-y-3">
                {/* Contract Summary */}
                <div className="space-y-1">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-600 dark:text-slate-400">Original Contract</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">{formatCurrency(originalContractTotal)}</span>
                    </div>
                    {hasApprovedCOs && (
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-green-600 dark:text-green-400">+ Approved COs</span>
                            <span className="font-medium text-green-600 dark:text-green-400">{formatCurrency(coContractTotal)}</span>
                        </div>
                    )}
                    <div className="flex justify-between items-center pt-1 border-t border-slate-300 dark:border-slate-600">
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Total Contract</span>
                        <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{formatCurrency(totalContractValue)}</span>
                    </div>
                </div>

                {/* Costs Summary (if there are CO costs) */}
                {hasApprovedCOs && coCostsTotal > 0 && (
                    <div className="space-y-1 pt-2 border-t border-dashed border-slate-300 dark:border-slate-600">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-600 dark:text-slate-400">Original Costs</span>
                            <span className="font-medium text-slate-700 dark:text-slate-300">{formatCurrency(originalCostsTotal)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-red-600 dark:text-red-400">+ CO Costs</span>
                            <span className="font-medium text-red-600 dark:text-red-400">{formatCurrency(coCostsTotal)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Total Costs</span>
                            <span className="font-bold text-slate-700 dark:text-slate-300">{formatCurrency(totalCosts)}</span>
                        </div>
                    </div>
                )}

                {/* Profit Summary */}
                {hasApprovedCOs && (
                    <div className="space-y-1 pt-2 border-t border-dashed border-slate-300 dark:border-slate-600">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-600 dark:text-slate-400">Original Profit</span>
                            <span className={`font-medium ${originalProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {formatCurrency(originalProfit)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className={coProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                                {coProfit >= 0 ? '+ CO Profit' : '- CO Loss'}
                            </span>
                            <span className={`font-medium ${coProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {formatCurrency(Math.abs(coProfit))}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Total Profit</span>
                            <span className={`text-lg font-bold ${totalProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {formatCurrency(totalProfit)}
                            </span>
                        </div>
                    </div>
                )}

                {/* Pending COs (not included) */}
                {pendingContractTotal > 0 && (
                    <div className="flex justify-between items-center text-sm pt-2 border-t border-dashed border-slate-300 dark:border-slate-600">
                        <span className="text-yellow-600 dark:text-yellow-400 italic">Pending COs (not included)</span>
                        <span className="font-medium text-yellow-600 dark:text-yellow-400">{formatCurrency(pendingContractTotal)}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChangeOrderSummaryCard;

