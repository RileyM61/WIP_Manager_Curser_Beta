// ============================================================================
// COST PROJECTION CHART
// ============================================================================

import React, { useMemo } from 'react';
import { MonthlyProjection, Department } from '../types';
import { CURRENCY_FORMAT, DEPARTMENT_COLORS } from '../constants';

interface CostProjectionChartProps {
  projections: MonthlyProjection[];
  departments: Department[];
  showHours?: boolean;
}

const CostProjectionChart: React.FC<CostProjectionChartProps> = ({
  projections,
  departments,
  showHours = false,
}) => {
  // Create a lookup for department productivity
  const deptProductivityMap = useMemo(() => {
    const map = new Map<string, boolean>();
    departments.forEach(d => map.set(d.id, d.isProductive));
    return map;
  }, [departments]);

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

  // Get unique departments across all projections, sorted with productive at bottom
  const allDepartments = useMemo(() => {
    const depts = new Map<string, { name: string; isProductive: boolean }>();
    projections.forEach(p => {
      p.departments.forEach(d => {
        if (!depts.has(d.departmentId)) {
          depts.set(d.departmentId, {
            name: d.departmentName,
            isProductive: deptProductivityMap.get(d.departmentId) ?? false,
          });
        }
      });
    });
    // Sort: non-productive first, productive last (so productive is at bottom of stacked bar)
    return Array.from(depts.entries())
      .map(([id, data]) => ({ id, name: data.name, isProductive: data.isProductive }))
      .sort((a, b) => {
        if (a.isProductive === b.isProductive) return a.name.localeCompare(b.name);
        return a.isProductive ? 1 : -1; // Productive goes to end (bottom of bar)
      });
  }, [projections, deptProductivityMap]);

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
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {dept.name}
                {dept.isProductive && (
                  <span className="ml-1 text-xs text-green-600 dark:text-green-400">(P)</span>
                )}
              </span>
            </div>
          ))}
        </div>

        {/* Bar Chart */}
        <div className="flex items-end gap-1 sm:gap-2 h-64 px-2">
          {projections.map((projection, pIndex) => {
            const value = showHours ? projection.totalHours : projection.totalCost;
            const heightPercent = maxValue > 0 ? (value / maxValue) * 100 : 0;
            
            // Determine if this month is higher or lower than previous
            const prevValue = pIndex > 0 
              ? (showHours ? projections[pIndex - 1].totalHours : projections[pIndex - 1].totalCost)
              : value;
            const isUp = value > prevValue;
            const isDown = value < prevValue;

            return (
              <div
                key={projection.month}
                className="flex-1 flex flex-col items-center group relative"
              >
                {/* Bar Container */}
                <div className="w-full h-48 flex items-end justify-center">
                  {/* The Bar */}
                  <div
                    className={`w-full max-w-[48px] rounded-t-md transition-all duration-300 hover:opacity-80 cursor-pointer ${
                      value === 0 
                        ? 'bg-gray-200 dark:bg-gray-700' 
                        : projection.departments.length > 0 
                          ? '' 
                          : 'bg-gradient-to-t from-orange-500 to-amber-400'
                    }`}
                    style={{ 
                      height: `${Math.max(heightPercent, value > 0 ? 8 : 2)}%`,
                      minHeight: '4px'
                    }}
                  >
                    {/* Stacked colors if departments exist - sorted with productive at bottom */}
                    {projection.departments.length > 0 && (
                      <div className="w-full h-full rounded-t-md overflow-hidden flex flex-col">
                        {/* Sort departments: productive at bottom (rendered first in normal flex) */}
                        {[...projection.departments]
                          .sort((a, b) => {
                            const aProductive = deptProductivityMap.get(a.departmentId) ?? false;
                            const bProductive = deptProductivityMap.get(b.departmentId) ?? false;
                            if (aProductive === bProductive) return a.departmentName.localeCompare(b.departmentName);
                            return aProductive ? -1 : 1; // Productive first (goes to bottom in flex-col)
                          })
                          .map((dept) => {
                            const deptValue = showHours ? dept.hours : dept.cost;
                            const deptPercent = value > 0 ? (deptValue / value) * 100 : 0;
                            const isProductive = deptProductivityMap.get(dept.departmentId) ?? false;
                            
                            // Find the color index based on allDepartments order
                            const colorIndex = allDepartments.findIndex(d => d.id === dept.departmentId);
                            
                            // Only show label if segment is tall enough (> 15% of bar)
                            const showLabel = deptPercent > 15;
                            
                            return (
                              <div
                                key={dept.departmentId}
                                className="w-full transition-all relative flex items-center justify-center overflow-hidden"
                                style={{
                                  height: `${deptPercent}%`,
                                  backgroundColor: DEPARTMENT_COLORS[colorIndex % DEPARTMENT_COLORS.length],
                                  minHeight: deptValue > 0 ? '2px' : '0',
                                }}
                                title={`${dept.departmentName}${isProductive ? ' (Productive)' : ''}: ${showHours ? `${dept.hours} hrs` : CURRENCY_FORMAT.format(dept.cost)}`}
                              >
                                {/* Value inside bar */}
                                {showLabel && (
                                  <span className="text-[8px] font-bold text-white drop-shadow-sm leading-none text-center px-0.5 truncate">
                                    {showHours 
                                      ? dept.hours.toLocaleString()
                                      : dept.cost >= 1000 
                                        ? `$${Math.round(dept.cost / 1000)}k`
                                        : `$${dept.cost}`
                                    }
                                  </span>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Trend Indicator */}
                {pIndex > 0 && value !== prevValue && (
                  <div className={`absolute top-0 right-0 text-xs ${isUp ? 'text-green-500' : 'text-red-500'}`}>
                    {isUp ? '↑' : '↓'}
                  </div>
                )}

                {/* Value Label */}
                <p className="mt-2 text-xs font-bold text-gray-900 dark:text-white text-center whitespace-nowrap">
                  {showHours
                    ? `${Math.round(projection.totalHours).toLocaleString()}`
                    : value >= 1000 
                      ? `$${Math.round(projection.totalCost / 1000)}k`
                      : CURRENCY_FORMAT.format(projection.totalCost)
                  }
                </p>

                {/* Month Label */}
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 text-center">
                  {formatMonth(projection.month)}
                </p>

                {/* Hover Tooltip */}
                <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap z-20 pointer-events-none transition-opacity shadow-lg">
                  <p className="font-semibold">{formatMonth(projection.month)}</p>
                  <p>{showHours ? `${projection.totalHours.toLocaleString()} hours` : CURRENCY_FORMAT.format(projection.totalCost)}</p>
                  {projection.departments.length > 0 && (
                    <div className="mt-1 pt-1 border-t border-gray-700 text-[10px]">
                      {/* Sort tooltip: productive at bottom to match bar */}
                      {[...projection.departments]
                        .sort((a, b) => {
                          const aProductive = deptProductivityMap.get(a.departmentId) ?? false;
                          const bProductive = deptProductivityMap.get(b.departmentId) ?? false;
                          if (aProductive === bProductive) return a.departmentName.localeCompare(b.departmentName);
                          return aProductive ? 1 : -1; // Productive at end of list (bottom of bar)
                        })
                        .map((d) => {
                          const colorIndex = allDepartments.findIndex(dept => dept.id === d.departmentId);
                          const isProductive = deptProductivityMap.get(d.departmentId) ?? false;
                          return (
                            <p key={d.departmentId} className="flex items-center gap-1">
                              <span 
                                className="w-2 h-2 rounded-full inline-block"
                                style={{ backgroundColor: DEPARTMENT_COLORS[colorIndex % DEPARTMENT_COLORS.length] }}
                              />
                              {d.departmentName}
                              {isProductive && <span className="text-green-400">(P)</span>}
                              : {showHours ? `${d.hours} hrs` : CURRENCY_FORMAT.format(d.cost)}
                            </p>
                          );
                        })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Scale & Trend Legend */}
        <div className="flex flex-wrap justify-center gap-4 sm:gap-8 mt-4 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <span>Scale: {showHours ? '0' : '$0'} — {showHours ? `${Math.round(maxValue).toLocaleString()} hrs` : CURRENCY_FORMAT.format(maxValue)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-500 font-bold">↑</span>
            <span>Increase</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-red-500 font-bold">↓</span>
            <span>Decrease</span>
          </div>
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

