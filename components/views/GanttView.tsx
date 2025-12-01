import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { Job, JobStatus, MobilizationPhase, CapacityPlan, PRODUCTIVE_DISCIPLINES, StaffingDiscipline } from '../../types';
import { getMobilizationWarnings } from '../../modules/wip/lib/jobCalculations';

interface GanttViewProps {
  jobs: Job[];
  onUpdateJob: (job: Job) => void;
  onEditJob: (job: Job) => void;
  capacityPlan?: CapacityPlan | null;
  capacityEnabled?: boolean;
  // Labor Capacity integration - takes precedence over simple capacityPlan
  laborCapacityHours?: number | null;
  laborCapacityEnabled?: boolean;
}

// Job hours breakdown for a period
interface JobHoursEntry {
  jobId: string;
  jobNo: string;
  jobName: string;
  hours: number;
}

type ZoomLevel = 'week' | 'month' | 'quarter';

// Helper to get active mobilization phases for a job
const getActiveMobilizations = (job: Job): MobilizationPhase[] => {
  // First, try to get enabled mobilization phases with valid dates
  if (job.mobilizations && job.mobilizations.length > 0) {
    const validPhases = job.mobilizations.filter(m => 
      m.enabled && 
      m.mobilizeDate && 
      m.mobilizeDate !== 'TBD' && 
      m.demobilizeDate && 
      m.demobilizeDate !== 'TBD'
    );
    
    // If we have valid phases, return them
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

// Calculate labor hours for a specific phase
const getPhaseHours = (job: Job, phase: MobilizationPhase): number => {
  // Skip if no labor cost per hour is set
  if (!job.laborCostPerHour || job.laborCostPerHour <= 0) return 0;
  
  // Calculate total labor hours for the job
  const totalLaborHours = job.costToComplete.labor / job.laborCostPerHour;
  if (totalLaborHours <= 0) return 0;
  
  // Get all active phases
  const activeMobs = getActiveMobilizations(job);
  if (activeMobs.length === 0) return 0;
  
  // Calculate total days across all phases
  let totalDaysInPhases = 0;
  activeMobs.forEach(mob => {
    const [startYear, startMonth, startDay] = mob.mobilizeDate.split('-').map(Number);
    const [endYear, endMonth, endDay] = mob.demobilizeDate.split('-').map(Number);
    const start = new Date(startYear, startMonth - 1, startDay);
    const end = new Date(endYear, endMonth - 1, endDay);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    totalDaysInPhases += days;
  });
  
  if (totalDaysInPhases === 0) return 0;
  
  // Calculate days in this specific phase
  const [startYear, startMonth, startDay] = phase.mobilizeDate.split('-').map(Number);
  const [endYear, endMonth, endDay] = phase.demobilizeDate.split('-').map(Number);
  const phaseStart = new Date(startYear, startMonth - 1, startDay);
  const phaseEnd = new Date(endYear, endMonth - 1, endDay);
  const phaseDays = Math.ceil((phaseEnd.getTime() - phaseStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  // Return proportional hours for this phase
  return totalLaborHours * (phaseDays / totalDaysInPhases);
};

// Phase colors for the Gantt bars
const phaseColors = [
  { bg: 'bg-emerald-500 hover:bg-emerald-600', light: 'bg-emerald-400' },
  { bg: 'bg-blue-500 hover:bg-blue-600', light: 'bg-blue-400' },
  { bg: 'bg-purple-500 hover:bg-purple-600', light: 'bg-purple-400' },
  { bg: 'bg-amber-500 hover:bg-amber-600', light: 'bg-amber-400' },
];

const GanttView: React.FC<GanttViewProps> = ({ 
  jobs, 
  onUpdateJob, 
  onEditJob, 
  capacityPlan, 
  capacityEnabled,
  laborCapacityHours,
  laborCapacityEnabled,
}) => {
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('month');
  
  // Calculate total weekly capacity - prefer Labor Capacity module data when available
  const weeklyCapacity = useMemo(() => {
    // Priority 1: Labor Capacity module data (if enabled and has data)
    if (laborCapacityEnabled && laborCapacityHours && laborCapacityHours > 0) {
      return laborCapacityHours;
    }
    
    // Priority 2: Simple capacity plan (fallback)
    if (!capacityEnabled || !capacityPlan || !capacityPlan.rows || capacityPlan.rows.length === 0) {
      return null; // No capacity configured
    }
    // Only count disciplines that directly perform work on jobs
    return capacityPlan.rows
      .filter(row => PRODUCTIVE_DISCIPLINES.includes(row.discipline as StaffingDiscipline))
      .reduce((total, row) => {
        return total + (row.headcount * row.hoursPerPerson);
      }, 0);
  }, [capacityPlan, capacityEnabled, laborCapacityHours, laborCapacityEnabled]);
  const [dragState, setDragState] = useState<{
    jobId: string;
    phaseId: number;
    type: 'move' | 'resize-start' | 'resize-end';
    startX: number;
    originalStart: Date;
    originalEnd: Date;
  } | null>(null);
  // Preview dates during drag (visual only, not saved until mouse up)
  const [dragPreview, setDragPreview] = useState<{
    jobId: string;
    phaseId: number;
    startDate: string;
    endDate: string;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter jobs: only show Future, Active, On Hold (not Completed/Archived)
  // Jobs must have at least one enabled mobilization phase with valid dates
  const activeJobs = useMemo(() => 
    jobs.filter(j => {
      if (j.status === JobStatus.Completed || j.status === JobStatus.Archived) {
        return false;
      }
      const activeMobs = getActiveMobilizations(j);
      return activeMobs.length > 0;
    }).sort((a, b) => {
      // Sort by earliest mobilization date
      const aFirst = getActiveMobilizations(a)[0];
      const bFirst = getActiveMobilizations(b)[0];
      if (!aFirst || !bFirst) return 0;
      return new Date(aFirst.mobilizeDate).getTime() - new Date(bFirst.mobilizeDate).getTime();
    }),
    [jobs]
  );

  // Calculate timeline bounds from all mobilization phases
  const { timelineStart, timelineEnd, totalDays } = useMemo(() => {
    if (activeJobs.length === 0) {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 6, 0);
      return { 
        timelineStart: start, 
        timelineEnd: end, 
        totalDays: Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) 
      };
    }

    // Collect all mobilization dates
    const dates: Date[] = [];
    activeJobs.forEach(job => {
      getActiveMobilizations(job).forEach(mob => {
        dates.push(new Date(mob.mobilizeDate));
        dates.push(new Date(mob.demobilizeDate));
      });
    });
    
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
    
    // Align start to first of month for consistent header alignment across all zoom levels
    const start = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    // Go back one more month for padding
    start.setMonth(start.getMonth() - 1);
    
    // End at the last day of the month after maxDate (with padding)
    const end = new Date(maxDate.getFullYear(), maxDate.getMonth() + 2, 0);
    
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return { timelineStart: start, timelineEnd: end, totalDays: days };
  }, [activeJobs]);

  // Generate timeline headers based on zoom level
  const timelineHeaders = useMemo(() => {
    const headers: { label: string; width: number; date: Date }[] = [];
    const current = new Date(timelineStart);
    
    while (current <= timelineEnd) {
      if (zoomLevel === 'week') {
        const weekStart = new Date(current);
        headers.push({
          label: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          width: 7,
          date: new Date(weekStart),
        });
        current.setDate(current.getDate() + 7);
      } else if (zoomLevel === 'month') {
        const monthStart = new Date(current.getFullYear(), current.getMonth(), 1);
        const daysInMonth = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate();
        headers.push({
          label: monthStart.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          width: daysInMonth,
          date: new Date(monthStart),
        });
        current.setMonth(current.getMonth() + 1);
        current.setDate(1);
      } else {
        const quarterStart = new Date(current.getFullYear(), Math.floor(current.getMonth() / 3) * 3, 1);
        const quarterEnd = new Date(current.getFullYear(), Math.floor(current.getMonth() / 3) * 3 + 3, 0);
        const daysInQuarter = Math.ceil((quarterEnd.getTime() - quarterStart.getTime()) / (1000 * 60 * 60 * 24));
        headers.push({
          label: `Q${Math.floor(current.getMonth() / 3) + 1} ${current.getFullYear()}`,
          width: daysInQuarter,
          date: new Date(quarterStart),
        });
        current.setMonth(current.getMonth() + 3);
      }
    }
    return headers;
  }, [timelineStart, timelineEnd, zoomLevel]);

  // Pixels per day based on zoom level
  const pxPerDay = useMemo(() => {
    switch (zoomLevel) {
      case 'week': return 20;
      case 'month': return 8;
      case 'quarter': return 3;
    }
  }, [zoomLevel]);

  // Calculate phase bar position and width (uses preview if dragging)
  const getPhaseBarStyle = useCallback((job: Job, phase: MobilizationPhase) => {
    // Use preview dates if this phase is being dragged
    const isBeingDragged = dragPreview?.jobId === job.id && dragPreview?.phaseId === phase.id;
    const startDate = isBeingDragged ? dragPreview.startDate : phase.mobilizeDate;
    const endDate = isBeingDragged ? dragPreview.endDate : phase.demobilizeDate;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const startOffset = Math.max(0, (start.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24));
    const duration = Math.max(1, (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      left: startOffset * pxPerDay,
      width: Math.max(duration * pxPerDay, 30), // Minimum 30px width
      startDate,
      endDate,
    };
  }, [timelineStart, pxPerDay, dragPreview]);

  // Handle drag start for a phase
  const handleDragStart = (
    e: React.MouseEvent,
    job: Job,
    phase: MobilizationPhase,
    type: 'move' | 'resize-start' | 'resize-end'
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setDragState({
      jobId: job.id,
      phaseId: phase.id,
      type,
      startX: e.clientX,
      originalStart: new Date(phase.mobilizeDate),
      originalEnd: new Date(phase.demobilizeDate),
    });
  };

  // Calculate new dates based on drag delta
  const calculateDragDates = (deltaDays: number) => {
    if (!dragState) return null;
    
    let newStart = new Date(dragState.originalStart);
    let newEnd = new Date(dragState.originalEnd);

    if (dragState.type === 'move') {
      newStart.setDate(newStart.getDate() + deltaDays);
      newEnd.setDate(newEnd.getDate() + deltaDays);
    } else if (dragState.type === 'resize-start') {
      newStart.setDate(newStart.getDate() + deltaDays);
      if (newStart >= newEnd) {
        newStart = new Date(newEnd);
        newStart.setDate(newStart.getDate() - 1);
      }
    } else if (dragState.type === 'resize-end') {
      newEnd.setDate(newEnd.getDate() + deltaDays);
      if (newEnd <= newStart) {
        newEnd = new Date(newStart);
        newEnd.setDate(newEnd.getDate() + 1);
      }
    }

    return {
      startDate: newStart.toISOString().split('T')[0],
      endDate: newEnd.toISOString().split('T')[0],
    };
  };

  // Handle drag move - only update preview, don't save
  useEffect(() => {
    if (!dragState) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragState.startX;
      const deltaDays = Math.round(deltaX / pxPerDay);
      
      const newDates = calculateDragDates(deltaDays);
      if (newDates) {
        setDragPreview({
          jobId: dragState.jobId,
          phaseId: dragState.phaseId,
          ...newDates,
        });
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      // Calculate final dates and save
      const deltaX = e.clientX - dragState.startX;
      const deltaDays = Math.round(deltaX / pxPerDay);
      const newDates = calculateDragDates(deltaDays);
      
      if (newDates && deltaDays !== 0) {
        const job = jobs.find(j => j.id === dragState.jobId);
        if (job) {
          // Update the mobilization phase dates
          const updatedMobilizations = (job.mobilizations || []).map(mob => 
            mob.id === dragState.phaseId
              ? { ...mob, mobilizeDate: newDates.startDate, demobilizeDate: newDates.endDate }
              : mob
          );
          
          const updatedJob: Job = {
            ...job,
            mobilizations: updatedMobilizations,
          };
          
          // Also update the job's startDate/endDate to match the earliest/latest mobilization
          const allDates = updatedMobilizations
            .filter(m => m.enabled && m.mobilizeDate !== 'TBD' && m.demobilizeDate !== 'TBD')
            .flatMap(m => [new Date(m.mobilizeDate), new Date(m.demobilizeDate)]);
          
          if (allDates.length > 0) {
            const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
            const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));
            updatedJob.startDate = minDate.toISOString().split('T')[0];
            updatedJob.endDate = maxDate.toISOString().split('T')[0];
            updatedJob.targetEndDate = maxDate.toISOString().split('T')[0];
          }
          
          onUpdateJob(updatedJob);
        }
      }
      
      setDragState(null);
      setDragPreview(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, jobs, pxPerDay, onUpdateJob]);

  // Calculate labor hours per day with job breakdown for workload visualization
  const laborHoursData = useMemo(() => {
    const hours: Map<string, number> = new Map();
    const jobBreakdown: Map<string, JobHoursEntry[]> = new Map();
    
    activeJobs.forEach(job => {
      // Skip jobs without labor cost per hour set
      if (!job.laborCostPerHour || job.laborCostPerHour <= 0) return;
      
      // Calculate total labor hours remaining
      const totalLaborHours = job.costToComplete.labor / job.laborCostPerHour;
      if (totalLaborHours <= 0) return;
      
      // Get all active mobilization phases
      const activeMobs = getActiveMobilizations(job);
      if (activeMobs.length === 0) return;
      
      // Count total days across all phases
      let totalDaysInPhases = 0;
      activeMobs.forEach(mob => {
        const start = new Date(mob.mobilizeDate);
        const end = new Date(mob.demobilizeDate);
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        totalDaysInPhases += days;
      });
      
      if (totalDaysInPhases === 0) return;
      
      // Calculate hours per day (spread evenly)
      const hoursPerDay = totalLaborHours / totalDaysInPhases;
      
      // Add hours to each day in mobilization phases
      activeMobs.forEach(mob => {
        // Parse dates as local dates
        const [startYear, startMonth, startDay] = mob.mobilizeDate.split('-').map(Number);
        const [endYear, endMonth, endDay] = mob.demobilizeDate.split('-').map(Number);
        const start = new Date(startYear, startMonth - 1, startDay);
        const end = new Date(endYear, endMonth - 1, endDay);
        const current = new Date(start);
        
        while (current <= end) {
          // Use local date format for key
          const year = current.getFullYear();
          const month = String(current.getMonth() + 1).padStart(2, '0');
          const day = String(current.getDate()).padStart(2, '0');
          const key = `${year}-${month}-${day}`;
          
          // Add to total hours
          hours.set(key, (hours.get(key) || 0) + hoursPerDay);
          
          // Add to job breakdown
          const entries = jobBreakdown.get(key) || [];
          const existingEntry = entries.find(e => e.jobId === job.id);
          if (existingEntry) {
            existingEntry.hours += hoursPerDay;
          } else {
            entries.push({
              jobId: job.id,
              jobNo: job.jobNo,
              jobName: job.jobName,
              hours: hoursPerDay,
            });
          }
          jobBreakdown.set(key, entries);
          
          current.setDate(current.getDate() + 1);
        }
      });
    });
    
    return { hours, jobBreakdown };
  }, [activeJobs]);
  
  const laborHoursByDay = laborHoursData.hours;
  const laborJobBreakdown = laborHoursData.jobBreakdown;

  // Helper to format date as YYYY-MM-DD in local time (not UTC)
  const formatDateKey = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper to get period key for a date based on zoom level
  const getPeriodKey = useCallback((date: Date): string => {
    if (zoomLevel === 'week') {
      // Use local date format for week headers
      return formatDateKey(date);
    } else if (zoomLevel === 'month') {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    } else {
      const quarter = Math.floor(date.getMonth() / 3);
      return `${date.getFullYear()}-Q${quarter + 1}`;
    }
  }, [zoomLevel]);

  // Aggregate labor hours by zoom level (week, month, quarter) with job breakdown
  const aggregatedHours = useMemo(() => {
    const aggregated: Map<string, { hours: number; startDate: Date; endDate: Date; jobs: JobHoursEntry[] }> = new Map();
    
    laborHoursByDay.forEach((hours, dateKey) => {
      // Parse the date key as local date (YYYY-MM-DD)
      const [year, month, day] = dateKey.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      
      let periodKey: string;
      let periodStart: Date;
      let periodEnd: Date;
      
      if (zoomLevel === 'week') {
        // Get start of week (Sunday) to match header dates
        const dayOfWeek = date.getDay();
        periodStart = new Date(date);
        periodStart.setDate(date.getDate() - dayOfWeek);
        periodEnd = new Date(periodStart);
        periodEnd.setDate(periodStart.getDate() + 6);
        periodKey = formatDateKey(periodStart);
      } else if (zoomLevel === 'month') {
        periodStart = new Date(date.getFullYear(), date.getMonth(), 1);
        periodEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      } else {
        // Quarter
        const quarter = Math.floor(date.getMonth() / 3);
        periodStart = new Date(date.getFullYear(), quarter * 3, 1);
        periodEnd = new Date(date.getFullYear(), quarter * 3 + 3, 0);
        periodKey = `${date.getFullYear()}-Q${quarter + 1}`;
      }
      
      // Get job breakdown for this day
      const dayJobs = laborJobBreakdown.get(dateKey) || [];
      
      const existing = aggregated.get(periodKey);
      if (existing) {
        existing.hours += hours;
        // Merge job breakdowns
        dayJobs.forEach(dayJob => {
          const existingJob = existing.jobs.find(j => j.jobId === dayJob.jobId);
          if (existingJob) {
            existingJob.hours += dayJob.hours;
          } else {
            existing.jobs.push({ ...dayJob });
          }
        });
      } else {
        aggregated.set(periodKey, { 
          hours, 
          startDate: periodStart, 
          endDate: periodEnd,
          jobs: dayJobs.map(j => ({ ...j }))
        });
      }
    });
    
    return aggregated;
  }, [laborHoursByDay, zoomLevel]);

  const maxHours = useMemo(() => 
    Math.max(...Array.from(aggregatedHours.values()).map((v: { hours: number }) => v.hours), 1),
    [aggregatedHours]
  );

  // Format date for display
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (activeJobs.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center">
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
          No Jobs to Display
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Add jobs with start and end dates to see them on the Gantt chart.
          <br />
          Jobs marked as Completed or Archived are not shown.
        </p>
      </div>
    );
  }

  const timelineWidth = totalDays * pxPerDay;
  const rowHeight = 48;
  const headerHeight = 60;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <div className="flex items-center gap-4">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200">
            Project Timeline
          </h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {activeJobs.length} active job{activeJobs.length !== 1 ? 's' : ''}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">Zoom:</span>
          {(['week', 'month', 'quarter'] as ZoomLevel[]).map((level) => (
            <button
              key={level}
              onClick={() => setZoomLevel(level)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                zoomLevel === level
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-4 py-2 border-b border-gray-200 dark:border-gray-700 text-xs">
        <span className="text-gray-500 dark:text-gray-400">Phases:</span>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-emerald-500"></span>
          <span className="text-gray-600 dark:text-gray-400">Phase 1</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-blue-500"></span>
          <span className="text-gray-600 dark:text-gray-400">Phase 2</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-purple-500"></span>
          <span className="text-gray-600 dark:text-gray-400">Phase 3</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-amber-500"></span>
          <span className="text-gray-600 dark:text-gray-400">Phase 4</span>
        </div>
        <span className="ml-4 text-gray-500 dark:text-gray-400">
          💡 Drag edges to resize • Drag bar to move • Click to edit
        </span>
      </div>

      {/* Main Gantt Area */}
      <div className="flex overflow-hidden" style={{ height: `${headerHeight + activeJobs.length * rowHeight + 60}px` }}>
        {/* Job Labels (Fixed Left Column) */}
        <div className="flex-shrink-0 w-64 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div 
            className="flex items-center px-4 font-semibold text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide border-b border-gray-200 dark:border-gray-700"
            style={{ height: headerHeight }}
          >
            Job Name
          </div>
          {activeJobs.map((job) => (
            <div
              key={job.id}
              className="flex items-center px-4 border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 cursor-pointer"
              style={{ height: rowHeight }}
              onClick={() => onEditJob(job)}
            >
              <div className="truncate">
                <div className="font-medium text-sm text-gray-800 dark:text-gray-200 truncate">
                  {job.jobName}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {job.projectManager || 'No PM'}
                </div>
              </div>
            </div>
          ))}
          {/* Labor Hours row */}
          <div
            className="flex items-center px-4 border-t-2 border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700/50"
            style={{ height: 60 }}
          >
            <div className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
              Labor Hrs
            </div>
          </div>
        </div>

        {/* Timeline Area (Scrollable) */}
        <div 
          ref={containerRef}
          className="flex-1 overflow-x-auto overflow-y-hidden"
        >
          <div style={{ width: timelineWidth, minWidth: '100%' }}>
            {/* Timeline Header */}
            <div 
              className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
              style={{ height: headerHeight }}
            >
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

            {/* Job Bars */}
            {activeJobs.map((job) => {
              const activeMobs = getActiveMobilizations(job);
              
              return (
                <div
                  key={job.id}
                  className="relative border-b border-gray-100 dark:border-gray-700/50"
                  style={{ height: rowHeight }}
                >
                  {/* Today marker */}
                  {(() => {
                    const today = new Date();
                    const todayOffset = (today.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24);
                    if (todayOffset >= 0 && todayOffset <= totalDays) {
                      return (
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-red-500 opacity-50 z-0"
                          style={{ left: todayOffset * pxPerDay }}
                        />
                      );
                    }
                    return null;
                  })()}
                  
                  {/* Contract End Date Marker */}
                  {job.endDate && job.endDate !== 'TBD' && (() => {
                    const contractEnd = new Date(job.endDate);
                    const contractEndOffset = (contractEnd.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24);
                    if (contractEndOffset >= 0 && contractEndOffset <= totalDays) {
                      return (
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-gray-400 dark:bg-gray-500 z-5"
                          style={{ left: contractEndOffset * pxPerDay }}
                          title={`Contract End: ${formatDate(job.endDate)}`}
                        >
                          <div className="absolute -top-1 -left-1 w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full" />
                        </div>
                      );
                    }
                    return null;
                  })()}
                  
                  {/* Phase Bars */}
                  {activeMobs.map((phase) => {
                    const barStyle = getPhaseBarStyle(job, phase);
                    const isDragging = dragState?.jobId === job.id && dragState?.phaseId === phase.id;
                    const colorIdx = phase.id - 1; // 0-indexed
                    
                    // Check if this phase has a warning (extends past contract end)
                    const warnings = getMobilizationWarnings(job);
                    const phaseWarning = warnings.find(w => w.phaseId === phase.id);
                    const hasWarning = !!phaseWarning;
                    
                    return (
                      <div
                        key={`${job.id}-phase-${phase.id}`}
                        className={`absolute top-2 bottom-2 rounded-lg shadow-md flex items-center transition-shadow ${
                          hasWarning 
                            ? 'bg-red-500 hover:bg-red-600 ring-2 ring-red-300 dark:ring-red-700' 
                            : (phaseColors[colorIdx]?.bg || phaseColors[0].bg)
                        } ${isDragging ? 'shadow-xl ring-2 ring-orange-400 z-20' : 'z-10'}`}
                        style={{
                          left: barStyle.left,
                          width: barStyle.width,
                          cursor: dragState?.type === 'move' ? 'grabbing' : 'grab',
                        }}
                        onMouseDown={(e) => handleDragStart(e, job, phase, 'move')}
                        onDoubleClick={() => onEditJob(job)}
                        title={hasWarning ? phaseWarning.message : undefined}
                      >
                        {/* Warning indicator */}
                        {hasWarning && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center text-xs font-bold text-red-800 shadow-md z-30">
                            !
                          </div>
                        )}
                        
                        {/* Left resize handle */}
                        <div
                          className="absolute left-0 top-0 bottom-0 w-3 cursor-ew-resize hover:bg-black/20 rounded-l-lg"
                          onMouseDown={(e) => handleDragStart(e, job, phase, 'resize-start')}
                        />
                        
                        {/* Bar content */}
                        <div className="flex-1 px-3 truncate text-white text-xs font-medium">
                          {barStyle.width > 60 && (
                            <span>{activeMobs.length > 1 ? `P${phase.id}` : job.jobNo}</span>
                          )}
                          {/* Show labor hours for this phase */}
                          {barStyle.width > 80 && (() => {
                            const phaseHours = getPhaseHours(job, phase);
                            if (phaseHours > 0 && barStyle.startDate && barStyle.endDate) {
                              // Calculate weeks in phase
                              const startTime = new Date(barStyle.startDate).getTime();
                              const endTime = new Date(barStyle.endDate).getTime();
                              if (isNaN(startTime) || isNaN(endTime)) {
                                // Invalid dates, just show total hours
                                return (
                                  <span className="ml-1 opacity-90 font-semibold">
                                    {phaseHours >= 1000 
                                      ? `${(phaseHours / 1000).toFixed(1)}k` 
                                      : Math.round(phaseHours)} hrs
                                  </span>
                                );
                              }
                              const phaseDays = Math.ceil((endTime - startTime) / (1000 * 60 * 60 * 24)) + 1;
                              const phaseWeeks = phaseDays / 7;
                              const hoursPerWeek = phaseWeeks > 0 ? phaseHours / phaseWeeks : 0;
                              
                              return (
                                <span className="ml-1 opacity-90 font-semibold">
                                  {phaseHours >= 1000 
                                    ? `${(phaseHours / 1000).toFixed(1)}k` 
                                    : Math.round(phaseHours)} hrs
                                  {barStyle.width > 140 && hoursPerWeek > 0 && (
                                    <span className="ml-1 opacity-75 font-normal">
                                      ({Math.round(hoursPerWeek)}/wk)
                                    </span>
                                  )}
                                </span>
                              );
                            }
                            return null;
                          })()}
                          {barStyle.width > 100 && phase.description && (
                            <span className="ml-1 opacity-75">{phase.description}</span>
                          )}
                          {barStyle.width > 150 && !phase.description && (
                            <span className="ml-2 opacity-75">
                              {formatDate(barStyle.startDate)} - {formatDate(barStyle.endDate)}
                            </span>
                          )}
                        </div>
                        
                        {/* Right resize handle */}
                        <div
                          className="absolute right-0 top-0 bottom-0 w-3 cursor-ew-resize hover:bg-black/20 rounded-r-lg"
                          onMouseDown={(e) => handleDragStart(e, job, phase, 'resize-end')}
                        />
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {/* Labor Hours Heatmap */}
            <div 
              className="relative border-t-2 border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700/30"
              style={{ height: 60 }}
            >
              {/* Show message if no labor data */}
              {aggregatedHours.size === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400 dark:text-gray-500">
                  Set "Labor Cost Per Hour" in job Financials to see labor hours
                </div>
              )}
              <div className="absolute inset-0 flex items-end">
                {timelineHeaders.map((header, idx) => {
                  // Find hours for this period using the same key format
                  const periodKey = getPeriodKey(header.date);
                  
                  const periodData = aggregatedHours.get(periodKey);
                  const hours = periodData?.hours || 0;
                  const jobsList = periodData?.jobs || [];
                  
                  // Calculate capacity utilization or relative intensity
                  let capacityPercent: number | null = null;
                  let intensity: number;
                  
                  if (weeklyCapacity && weeklyCapacity > 0) {
                    // Calculate period capacity based on zoom level
                    let periodCapacity = weeklyCapacity;
                    if (zoomLevel === 'month') {
                      periodCapacity = weeklyCapacity * 4.33; // ~4.33 weeks per month
                    } else if (zoomLevel === 'quarter') {
                      periodCapacity = weeklyCapacity * 13; // 13 weeks per quarter
                    }
                    capacityPercent = (hours / periodCapacity) * 100;
                    intensity = Math.min(capacityPercent / 100, 1.5); // Cap at 150% for bar height
                  } else {
                    // Fall back to relative intensity if no capacity configured
                    intensity = maxHours > 0 ? hours / maxHours : 0;
                  }
                  
                  // Color based on capacity % (if available) or relative intensity
                  let bgColor = 'bg-gray-200 dark:bg-gray-600';
                  if (hours > 0) {
                    if (capacityPercent !== null) {
                      // Capacity-based coloring
                      if (capacityPercent > 100) bgColor = 'bg-red-500'; // Over capacity
                      else if (capacityPercent > 80) bgColor = 'bg-orange-500'; // Near capacity
                      else if (capacityPercent > 60) bgColor = 'bg-amber-400'; // Healthy
                      else if (capacityPercent > 40) bgColor = 'bg-blue-400'; // Available
                      else bgColor = 'bg-emerald-400'; // Underutilized
                    } else {
                      // Relative coloring (fallback)
                      if (intensity > 0.8) bgColor = 'bg-red-500';
                      else if (intensity > 0.6) bgColor = 'bg-orange-500';
                      else if (intensity > 0.4) bgColor = 'bg-amber-400';
                      else if (intensity > 0.2) bgColor = 'bg-blue-400';
                      else bgColor = 'bg-blue-300';
                    }
                  }
                  
                  // Build tooltip with job breakdown
                  const tooltipLines = [
                    `${header.label}: ${Math.round(hours).toLocaleString()} hrs`,
                    capacityPercent !== null ? `${Math.round(capacityPercent)}% of capacity` : '',
                    '',
                    ...jobsList
                      .sort((a, b) => b.hours - a.hours)
                      .slice(0, 8) // Show top 8 jobs
                      .map(j => `${j.jobNo}: ${Math.round(j.hours)} hrs`),
                    jobsList.length > 8 ? `+${jobsList.length - 8} more jobs` : ''
                  ].filter(Boolean).join('\n');
                  
                  return (
                    <div
                      key={idx}
                      className="relative flex flex-col items-center justify-end h-full group"
                      style={{ width: header.width * pxPerDay }}
                    >
                      {hours > 0 && (
                        <div 
                          className={`relative w-[90%] ${bgColor} rounded-t-sm transition-all flex items-end justify-center pb-1 cursor-pointer`}
                          style={{ 
                            height: `${Math.max(25, Math.min(intensity, 1) * 100)}%`,
                            minHeight: '25px',
                          }}
                          title={tooltipLines}
                        >
                          <span className="text-[10px] font-bold text-white drop-shadow-md">
                            {capacityPercent !== null 
                              ? `${Math.round(capacityPercent)}%`
                              : (hours >= 1000 ? `${(hours / 1000).toFixed(1)}k` : Math.round(hours))
                            }
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {/* Today marker in workload */}
              {(() => {
                const today = new Date();
                const todayOffset = (today.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24);
                if (todayOffset >= 0 && todayOffset <= totalDays) {
                  return (
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                      style={{ left: todayOffset * pxPerDay }}
                    />
                  );
                }
                return null;
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* Footer with Legend */}
      <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex justify-between items-center">
          <span>
            Timeline: {timelineStart.toLocaleDateString()} — {timelineEnd.toLocaleDateString()}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Today
          </span>
        </div>
        
        {/* Capacity Legend */}
        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-600 dark:text-gray-300">
              Labor Hours ({zoomLevel === 'week' ? 'Weekly' : zoomLevel === 'month' ? 'Monthly' : 'Quarterly'})
              {weeklyCapacity && (
                <span className="ml-2 text-gray-400">
                  Capacity: {weeklyCapacity.toLocaleString()} hrs/week
                </span>
              )}
            </span>
            
            {/* Color Legend */}
            <div className="flex items-center gap-3">
              {weeklyCapacity ? (
                // Capacity-based legend
                <>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-emerald-400" /> &lt;40%
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-blue-400" /> 40-60%
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-amber-400" /> 60-80%
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-orange-500" /> 80-100%
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-red-500" /> &gt;100%
                  </span>
                </>
              ) : (
                // Relative legend (no capacity set)
                <>
                  <span className="text-gray-400 italic">
                    Set up Capacity in Settings for % utilization
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-blue-300" /> Low
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-amber-400" /> Med
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-red-500" /> High
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GanttView;

