import React from 'react';

interface WIPCardProps {
    jobNumber: string;
    jobName: string;
    client: string;
    pm: string;
    startDate: string;
    contractValue: number;
    originalProfit: number;
    forecastedProfit: number;
    variance: number;
    costToDate: number;
    originalBudget: number;
    forecastedBudget: number;
    earned: number;
    invoiced: number;
    underBilled: number;
    laborProgress: number;
    materialProgress: number;
    otherProgress: number;
    delay?: number;
}

export const WIPCard: React.FC<WIPCardProps> = ({
    jobNumber,
    jobName,
    client,
    pm,
    startDate,
    contractValue,
    originalProfit,
    forecastedProfit,
    variance,
    costToDate,
    originalBudget,
    forecastedBudget,
    earned,
    invoiced,
    underBilled,
    laborProgress,
    materialProgress,
    otherProgress,
    delay = 0,
}) => {
    const formatMoney = (val: number) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

    const calculateMargin = (profit: number, revenue: number) => ((profit / revenue) * 100).toFixed(1) + '%';

    return (
        <div
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 text-slate-900 hover:shadow-3xl transition-all duration-500 hover:-translate-y-1 font-sans"
            style={{
                animation: `fadeSlideUp 0.6s ease-out ${delay}ms both`,
            }}
        >
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-xl font-bold text-blue-900">{jobName}</h3>
                        <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full">Active</span>
                        <span className="text-orange-500 text-xs font-semibold bg-orange-50 px-2 py-0.5 rounded-full">Fixed</span>
                    </div>
                    <p className="text-slate-500 text-sm font-medium">#{jobNumber}</p>
                    <p className="text-slate-400 text-sm mt-1">{client}</p>
                </div>
            </div>

            {/* Top Details Grid */}
            <div className="grid grid-cols-[auto_1fr] gap-x-8 gap-y-2 mb-6 text-sm">
                <div className="text-slate-500 font-medium">PM:</div>
                <div className="text-right text-slate-700">{pm}</div>

                <div className="text-slate-500 font-medium">Start Date:</div>
                <div className="text-right text-slate-700">{startDate}</div>

                <div className="text-slate-500 font-medium">Contract:</div>
                <div className="text-right text-slate-900 font-semibold">{formatMoney(contractValue)}</div>
            </div>

            {/* Financial Section Container */}
            <div className="bg-slate-50 rounded-xl p-4 space-y-5 mb-6">

                {/* Profitability */}
                <div>
                    <h4 className="text-blue-900 font-semibold text-sm mb-2">Profitability</h4>
                    <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                            <span className="text-slate-500">Original Profit:</span>
                            <span className="text-slate-700">{formatMoney(originalProfit)} ({calculateMargin(originalProfit, contractValue)})</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">Forecasted Profit:</span>
                            <span className="text-emerald-600 font-bold">{formatMoney(forecastedProfit)} ({calculateMargin(forecastedProfit, contractValue)})</span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-slate-200 mt-1">
                            <span className="text-slate-900 font-medium">Variance:</span>
                            <span className={`${variance >= 0 ? 'text-emerald-600' : 'text-red-500'} font-bold`}>{formatMoney(variance)}</span>
                        </div>
                    </div>
                </div>

                {/* Cost Summary */}
                <div>
                    <h4 className="text-blue-900 font-semibold text-sm mb-2">Cost Summary</h4>
                    <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                            <span className="text-slate-500">Cost to Date:</span>
                            <span className="text-slate-700">{formatMoney(costToDate)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">Original Budget:</span>
                            <span className="text-slate-700">{formatMoney(originalBudget)}</span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-slate-200 mt-1">
                            <span className="text-red-600 font-bold">Forecasted Budget:</span>
                            <span className="text-red-600 font-bold">{formatMoney(forecastedBudget)}</span>
                        </div>
                    </div>
                </div>

                {/* Billing Status */}
                <div>
                    <h4 className="text-blue-900 font-semibold text-sm mb-2">Billing Status</h4>
                    <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                            <span className="text-slate-500">Earned:</span>
                            <span className="text-slate-700">{formatMoney(earned)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">Invoiced:</span>
                            <span className="text-slate-700">{formatMoney(invoiced)}</span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-slate-200 mt-1">
                            <span className="text-red-600 font-bold">Under Billed:</span>
                            <span className="text-red-600 font-bold">{formatMoney(underBilled)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Progress Bars */}
            <div>
                <h4 className="text-blue-900 font-semibold text-sm mb-3">% Complete (vs Forecast)</h4>
                <div className="space-y-3">
                    {[
                        { label: 'Labor', val: laborProgress, color: 'bg-red-500' },
                        { label: 'Material', val: materialProgress, color: 'bg-amber-400' },
                        { label: 'Other', val: otherProgress, color: 'bg-red-500' }
                    ].map((item) => (
                        <div key={item.label}>
                            <div className="flex justify-between text-xs mb-1">
                                <span className="text-slate-500">{item.label}</span>
                                <span className="text-slate-700 font-medium">{item.val}%</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.val}%` }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100 text-xs text-slate-400">
                <div className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Updated: {new Date().toLocaleDateString()}
                </div>
                <div className="flex gap-4 text-blue-500 font-medium">
                    <span className="flex items-center gap-1 cursor-pointer hover:text-blue-600">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                        Notes
                    </span>
                    <span className="flex items-center gap-1 cursor-pointer hover:text-blue-600">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        Edit
                    </span>
                </div>
            </div>
        </div>
    );
};
