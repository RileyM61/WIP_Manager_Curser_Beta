import React, { useMemo } from 'react';
import { Job, MobilizationPhase, JobStatus } from '../../types';

interface BondExposureChartProps {
  jobs: Job[];
  zoomLevel?: 'week' | 'month' | 'quarter';
}

type ZoomLevel = 'week' | 'month' | 'quarter';

// Helper to get active mobilization phases for a job
const getActiveMobilizations = (job: Job): MobilizationPhase[] => {
  if (job.mobilizations && job.mobilizations.length > 0) {
    const validPhases = job.mobilizations.filter(m =>
      m.enabled &&
      m.mobilizeDate &&
      m.mobilizeDate !== 'TBD' &&
      m.demobilizeDate &&
      m.demobilizeDate !== 'TBD'
    );
    if (validPhases.length > 0) {
      return validPhases;
    }
  }

  // Fallback: if no valid mobilizations, create one from start/end dates
  if (job.startDate && job.startDate !== 'TBD' && job.endDate && job.endDate !== 'TBD') {
    return [{
      id: 1,
      enabled: true,
      mobilizeDate: job.startDate,
      demobilizeDate: job.endDate,
      description: '',
    }];
  }

  return [];
};

// Check if a date falls within a date range
const isDateInRange = (date: Date, start: Date, end: Date): boolean => {
  return date >= start && date <= end;
};

// Check if a job phase overlaps with a period
const phaseOverlapsPeriod = (
  phase: MobilizationPhase,
  periodStart: Date,
  periodEnd: Date
): boolean => {
  const phaseStart = new Date(phase.mobilizeDate);
  const phaseEnd = new Date(phase.demobilizeDate);
  
  // Check if phase overlaps with period (any intersection)
  return phaseStart <= periodEnd && phaseEnd >= periodStart;
};

// Generate period key for grouping (matches Gantt chart logic)
const getPeriodKey = (date: Date, zoomLevel: ZoomLevel): string => {
  if (zoomLevel === 'week') {
    // Get start of week (Sunday)
    const dayOfWeek = date.getDay();
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - dayOfWeek);
    return `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;
  } else if (zoomLevel === 'month') {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  } else {
    // Quarter
    const quarter = Math.floor(date.getMonth() / 3);
    return `${date.getFullYear()}-Q${quarter + 1}`;
  }
};

const BondExposureChart: React.FC<BondExposureChartProps> = ({
  jobs,
  zoomLevel = 'month',
}) => {
  // Filter jobs: only show Future, Active, On Hold (not Completed/Archived/Draft)
  // Same filtering logic as GanttView
  const activeJobs = useMemo(() =>
    jobs.filter(j => {
      if (j.status === JobStatus.Draft || j.status === JobStatus.Completed || j.status === JobStatus.Archived) {
        return false;
      }
      const activeMobs = getActiveMobilizations(j);
      return activeMobs.length > 0;
    }),
    [jobs]
  );

  // Calculate timeline from jobs (matching Gantt chart logic)
  const { timelineStart, timelineEnd } = useMemo(() => {

    if (activeJobs.length === 0) {
      const today = new Date();
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth() + 2, 0);
      return { timelineStart: start, timelineEnd: end };
    }

    // Find min start date and max end date from all mobilizations and job dates
    let minDate: Date | null = null;
    let maxDate: Date | null = null;

    activeJobs.forEach(job => {
      const activeMobs = getActiveMobilizations(job);
      if (activeMobs.length > 0) {
        activeMobs.forEach(mob => {
          const start = new Date(mob.mobilizeDate);
          const end = new Date(mob.demobilizeDate);
          if (!minDate || start < minDate) minDate = start;
          if (!maxDate || end > maxDate) maxDate = end;
        });
      }
    });

    // Fallback to today if no dates found
    if (!minDate || !maxDate) {
      const today = new Date();
      minDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      maxDate = new Date(today.getFullYear(), today.getMonth() + 2, 0);
    }

    // Add buffer: start 1 month earlier, end 2 months later
    const start = new Date(minDate);
    start.setMonth(start.getMonth() - 1);
    const end = new Date(maxDate);
    end.setMonth(end.getMonth() + 2);

    return { timelineStart: start, timelineEnd: end };
  }, [activeJobs]);

  // Generate timeline headers (matching Gantt chart)
  const timelineHeaders = useMemo(() => {
    const headers: { label: string; width: number; date: Date; periodKey: string }[] = [];
    const current = new Date(timelineStart);

    while (current <= timelineEnd) {
      if (zoomLevel === 'week') {
        const weekStart = new Date(current);
        const periodKey = getPeriodKey(weekStart, zoomLevel);
        headers.push({
          label: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          width: 7,
          date: new Date(weekStart),
          periodKey,
        });
        current.setDate(current.getDate() + 7);
      } else if (zoomLevel === 'month') {
        const monthStart = new Date(current.getFullYear(), current.getMonth(), 1);
        const daysInMonth = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate();
        const periodKey = getPeriodKey(monthStart, zoomLevel);
        headers.push({
          label: monthStart.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          width: daysInMonth,
          date: new Date(monthStart),
          periodKey,
        });
        current.setMonth(current.getMonth() + 1);
        current.setDate(1);
      } else {
        const quarterStart = new Date(current.getFullYear(), Math.floor(current.getMonth() / 3) * 3, 1);
        const quarterEnd = new Date(current.getFullYear(), Math.floor(current.getMonth() / 3) * 3 + 3, 0);
        const daysInQuarter = Math.ceil((quarterEnd.getTime() - quarterStart.getTime()) / (1000 * 60 * 60 * 24));
        const periodKey = getPeriodKey(quarterStart, zoomLevel);
        headers.push({
          label: `Q${Math.floor(current.getMonth() / 3) + 1} ${current.getFullYear()}`,
          width: daysInQuarter,
          date: new Date(quarterStart),
          periodKey,
        });
        current.setMonth(current.getMonth() + 3);
      }
    }
    return headers;
  }, [timelineStart, timelineEnd, zoomLevel]);

  // Calculate bond exposure per period
  const bondExposureByPeriod = useMemo(() => {
    const exposure = new Map<string, {
      total: number;
      jobs: Array<{ jobId: string; jobNo: string; jobName: string; bondAmount: number }>;
    }>();

    // Get all bonded jobs with active mobilizations
    const bondedJobs = activeJobs.filter(job => job.hasBond && job.bondAmount && job.bondAmount > 0);

    bondedJobs.forEach(job => {
      const activePhases = getActiveMobilizations(job);
      if (activePhases.length === 0) return;

      activePhases.forEach(phase => {
        const phaseStart = new Date(phase.mobilizeDate);
        const phaseEnd = new Date(phase.demobilizeDate);

        // Find which periods this phase overlaps with
        timelineHeaders.forEach(header => {
          // Calculate period end date
          let periodEnd: Date;
          if (zoomLevel === 'week') {
            periodEnd = new Date(header.date);
            periodEnd.setDate(periodEnd.getDate() + 6);
          } else if (zoomLevel === 'month') {
            periodEnd = new Date(header.date.getFullYear(), header.date.getMonth() + 1, 0);
          } else {
            // Quarter
            periodEnd = new Date(header.date.getFullYear(), Math.floor(header.date.getMonth() / 3) * 3 + 3, 0);
          }

          // Check if phase overlaps with this period
          if (phaseOverlapsPeriod(phase, header.date, periodEnd)) {
            const existing = exposure.get(header.periodKey);
            const bondAmount = job.bondAmount || 0;
            
            if (existing) {
              // Check if this job is already counted for this period
              const jobAlreadyCounted = existing.jobs.some(j => j.jobId === job.id);
              if (!jobAlreadyCounted) {
                existing.total += bondAmount;
                existing.jobs.push({
                  jobId: job.id,
                  jobNo: job.jobNo,
                  jobName: job.jobName,
                  bondAmount,
                });
              }
            } else {
              exposure.set(header.periodKey, {
                total: bondAmount,
                jobs: [{
                  jobId: job.id,
                  jobNo: job.jobNo,
                  jobName: job.jobName,
                  bondAmount,
                }],
              });
            }
          }
        });
      });
    });

    return exposure;
  }, [activeJobs, timelineHeaders, zoomLevel]);

  // Find max exposure for scaling
  const maxExposure = useMemo(() => {
    if (bondExposureByPeriod.size === 0) return 1;
    return Math.max(...Array.from(bondExposureByPeriod.values()).map(v => v.total), 1);
  }, [bondExposureByPeriod]);

  // Format currency
  const formatCurrency = (amount: number): string => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount.toLocaleString()}`;
  };

  // Pixels per day (matching Gantt chart)
  const pxPerDay = useMemo(() => {
    switch (zoomLevel) {
      case 'week': return 20;
      case 'month': return 8;
      case 'quarter': return 3;
    }
  }, [zoomLevel]);

  const totalDays = Math.ceil((timelineEnd.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24));
  const timelineWidth = totalDays * pxPerDay;
  const chartHeight = 120;

  // Check if there are any bonded jobs
  const hasBondedJobs = activeJobs.some(job => job.hasBond && job.bondAmount && job.bondAmount > 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden mt-4">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <h3 className="font-semibold text-gray-800 dark:text-gray-200">
          Bond Exposure Over Time
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Total bond commitments across all active jobs per time period
        </p>
      </div>

      {/* Chart Area */}
      <div className="relative overflow-x-auto">
        <div style={{ width: timelineWidth, minWidth: '100%' }}>
          {/* Timeline Header */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            {timelineHeaders.map((header, idx) => (
              <div
                key={idx}
                className="flex-shrink-0 flex items-center justify-center border-r border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-600 dark:text-gray-400"
                style={{ width: header.width * pxPerDay }}
              >
                {header.label}
              </div>
            ))}
          </div>

          {/* Chart Bars */}
          <div
            className="relative border-b border-gray-200 dark:border-gray-700"
            style={{ height: chartHeight }}
          >
            {!hasBondedJobs ? (
              <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400 dark:text-gray-500">
                No bonded jobs found. Enable bonds on jobs to see exposure.
              </div>
            ) : (
              <>
                {/* Y-axis labels */}
                <div className="absolute left-0 top-0 bottom-0 w-12 border-r border-gray-200 dark:border-gray-700 flex flex-col justify-between text-xs text-gray-500 dark:text-gray-400 px-1">
                  <div className="text-right">{formatCurrency(maxExposure)}</div>
                  <div className="text-right">{formatCurrency(maxExposure / 2)}</div>
                  <div className="text-right">$0</div>
                </div>

                {/* Bars */}
                <div className="absolute inset-0 flex items-end" style={{ left: '48px' }}>
                  {timelineHeaders.map((header, idx) => {
                    const periodData = bondExposureByPeriod.get(header.periodKey);
                    const exposure = periodData?.total || 0;
                    const barHeight = maxExposure > 0 ? (exposure / maxExposure) * (chartHeight - 20) : 0;

                    return (
                      <div
                        key={idx}
                        className="flex-shrink-0 border-r border-gray-200 dark:border-gray-700 relative group"
                        style={{ width: header.width * pxPerDay }}
                      >
                        {exposure > 0 && (
                          <>
                            {/* Bar */}
                            <div
                              className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t transition-all hover:from-blue-700 hover:to-blue-500"
                              style={{ height: `${Math.max(barHeight, 4)}px` }}
                              title={`${formatCurrency(exposure)}\n${periodData?.jobs.length || 0} job(s)`}
                            />
                            
                            {/* Value label on bar */}
                            {barHeight > 25 && (
                              <div className="absolute bottom-0 left-0 right-0 text-center text-xs font-semibold text-white px-1 pb-1">
                                {formatCurrency(exposure)}
                              </div>
                            )}

                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10 bg-gray-900 text-white text-xs rounded-lg shadow-lg p-2 min-w-[200px]">
                              <div className="font-semibold mb-1">{formatCurrency(exposure)}</div>
                              <div className="text-gray-300">
                                {periodData?.jobs.map((job, i) => (
                                  <div key={i} className="mt-1">
                                    {job.jobNo} - {job.jobName}: {formatCurrency(job.bondAmount)}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BondExposureChart;

