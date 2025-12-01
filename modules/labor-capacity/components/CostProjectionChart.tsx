// ============================================================================
// COST PROJECTION CHART
// ============================================================================

import React, { useMemo } from 'react';
import { MonthlyProjection } from '../types';
import { CURRENCY_FORMAT, DEPARTMENT_COLORS } from '../constants';

interface CostProjectionChartProps {
  projections: MonthlyProjection[];
  showHours?: boolean;
}

const CostProjectionChart: React.FC<CostProjectionChartProps> = ({
  projections,
  showHours = false,
}) => {
  // Calculate max value for scaling
  const maxValue = useMemo(() => {
    return Math.max(
      ...projections.map(p => showHours ? p.totalHours : p.totalCost),
      1
    );
  }, [projections, showHours]);

  // Format month label
  const formatMonth = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  };

  // Get unique departments across all projections
  const allDepartments = useMemo(() => {
    const depts = new Map<string, string>();
    projections.forEach(p => {
      p.departments.forEach(d => {
        if (!depts.has(d.departmentId)) {
          depts.set(d.departmentId, d.departmentName);
        }
      });
    });
    return Array.from(depts.entries()).map(([id, name]) => ({ id, name }));
  }, [projections]);

  if (projections.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center text-gray-500">
        No projection data available
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {showHours ? 'Monthly Hours Projection' : 'Monthly Cost Projection'}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          12-month rolling forecast by department
        </p>
      </div>

      {/* Chart */}
      <div className="p-4">
        {/* Legend */}
        <div className="flex flex-wrap gap-4 mb-6">
          {allDepartments.map((dept, i) => (
            <div key={dept.id} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: DEPARTMENT_COLORS[i % DEPARTMENT_COLORS.length] }}
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">{dept.name}</span>
            </div>
          ))}
        </div>

        {/* Bar Chart */}
        <div className="flex items-end gap-2 h-64">
          {projections.map((projection, pIndex) => {
            const value = showHours ? projection.totalHours : projection.totalCost;
            const heightPercent = (value / maxValue) * 100;

            return (
              <div
                key={projection.month}
                className="flex-1 flex flex-col items-center group"
              >
                {/* Stacked Bar */}
                <div
                  className="w-full rounded-t-md overflow-hidden flex flex-col-reverse transition-all hover:opacity-80"
                  style={{ height: `${heightPercent}%`, minHeight: value > 0 ? '4px' : '0' }}
                >
                  {projection.departments.map((dept, dIndex) => {
                    const deptValue = showHours ? dept.hours : dept.cost;
                    const deptPercent = value > 0 ? (deptValue / value) * 100 : 0;
                    
                    return (
                      <div
                        key={dept.departmentId}
                        style={{
                          height: `${deptPercent}%`,
                          backgroundColor: DEPARTMENT_COLORS[dIndex % DEPARTMENT_COLORS.length],
                        }}
                        title={`${dept.departmentName}: ${showHours ? `${dept.hours} hrs` : CURRENCY_FORMAT.format(dept.cost)}`}
                      />
                    );
                  })}
                </div>

                {/* Value Label - Always visible */}
                <p className="mt-1 text-xs font-semibold text-gray-900 dark:text-white text-center">
                  {showHours
                    ? `${Math.round(projection.totalHours).toLocaleString()}`
                    : `$${Math.round(projection.totalCost / 1000)}k`
                  }
                </p>

                {/* Month Label */}
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  {formatMonth(projection.month)}
                </p>
              </div>
            );
          })}
        </div>

        {/* Y-axis labels */}
        <div className="flex justify-between mt-4 text-xs text-gray-500">
          <span>{showHours ? '0 hrs' : '$0'}</span>
          <span>
            {showHours
              ? `${Math.round(maxValue).toLocaleString()} hrs`
              : CURRENCY_FORMAT.format(maxValue)
            }
          </span>
        </div>
      </div>

      {/* Summary Table */}
      <div className="border-t border-gray-200 dark:border-gray-700">
        <div className="p-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Summary
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400">Next Month</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {showHours
                  ? `${projections[0]?.totalHours.toLocaleString() || 0}`
                  : CURRENCY_FORMAT.format(projections[0]?.totalCost || 0)
                }
              </p>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400">Q1 Total</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {showHours
                  ? `${projections.slice(0, 3).reduce((s, p) => s + p.totalHours, 0).toLocaleString()}`
                  : CURRENCY_FORMAT.format(projections.slice(0, 3).reduce((s, p) => s + p.totalCost, 0))
                }
              </p>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400">6-Month Total</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {showHours
                  ? `${projections.slice(0, 6).reduce((s, p) => s + p.totalHours, 0).toLocaleString()}`
                  : CURRENCY_FORMAT.format(projections.slice(0, 6).reduce((s, p) => s + p.totalCost, 0))
                }
              </p>
            </div>
            <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <p className="text-xs text-orange-600 dark:text-orange-400">12-Month Total</p>
              <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
                {showHours
                  ? `${projections.reduce((s, p) => s + p.totalHours, 0).toLocaleString()}`
                  : CURRENCY_FORMAT.format(projections.reduce((s, p) => s + p.totalCost, 0))
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CostProjectionChart;

