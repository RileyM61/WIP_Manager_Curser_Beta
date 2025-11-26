import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { Job, JobStatus } from '../../types';

interface GanttViewProps {
  jobs: Job[];
  onUpdateJob: (job: Job) => void;
  onEditJob: (job: Job) => void;
}

type ZoomLevel = 'week' | 'month' | 'quarter';

const GanttView: React.FC<GanttViewProps> = ({ jobs, onUpdateJob, onEditJob }) => {
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('month');
  const [dragState, setDragState] = useState<{
    jobId: string;
    type: 'move' | 'resize-start' | 'resize-end';
    startX: number;
    originalStart: Date;
    originalEnd: Date;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter jobs: only show Future, Active, On Hold (not Completed/Archived)
  const activeJobs = useMemo(() => 
    jobs.filter(j => 
      j.status !== JobStatus.Completed && 
      j.status !== JobStatus.Archived &&
      j.startDate && 
      j.startDate !== 'TBD' &&
      j.endDate &&
      j.endDate !== 'TBD'
    ).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()),
    [jobs]
  );

  // Calculate timeline bounds
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

    const dates = activeJobs.flatMap(j => [new Date(j.startDate), new Date(j.endDate)]);
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
    
    // Add padding
    const start = new Date(minDate);
    start.setDate(start.getDate() - 14);
    const end = new Date(maxDate);
    end.setDate(end.getDate() + 30);
    
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

  // Calculate job bar position and width
  const getJobBarStyle = useCallback((job: Job) => {
    const start = new Date(job.startDate);
    const end = new Date(job.endDate);
    const startOffset = Math.max(0, (start.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24));
    const duration = Math.max(1, (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      left: startOffset * pxPerDay,
      width: Math.max(duration * pxPerDay, 30), // Minimum 30px width
    };
  }, [timelineStart, pxPerDay]);

  // Get status color
  const getStatusColor = (status: JobStatus) => {
    switch (status) {
      case JobStatus.Future: return 'bg-blue-500 hover:bg-blue-600';
      case JobStatus.Active: return 'bg-emerald-500 hover:bg-emerald-600';
      case JobStatus.OnHold: return 'bg-amber-500 hover:bg-amber-600';
      default: return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  // Handle drag start
  const handleDragStart = (
    e: React.MouseEvent,
    job: Job,
    type: 'move' | 'resize-start' | 'resize-end'
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setDragState({
      jobId: job.id,
      type,
      startX: e.clientX,
      originalStart: new Date(job.startDate),
      originalEnd: new Date(job.endDate),
    });
  };

  // Handle drag move
  useEffect(() => {
    if (!dragState) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragState.startX;
      const deltaDays = Math.round(deltaX / pxPerDay);
      
      const job = jobs.find(j => j.id === dragState.jobId);
      if (!job) return;

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

      // Update job with new dates
      onUpdateJob({
        ...job,
        startDate: newStart.toISOString().split('T')[0],
        endDate: newEnd.toISOString().split('T')[0],
      });
    };

    const handleMouseUp = () => {
      setDragState(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, jobs, pxPerDay, onUpdateJob]);

  // Calculate workload density for overlap visualization
  const workloadByDay = useMemo(() => {
    const workload: Map<string, number> = new Map();
    
    activeJobs.forEach(job => {
      const start = new Date(job.startDate);
      const end = new Date(job.endDate);
      const current = new Date(start);
      
      while (current <= end) {
        const key = current.toISOString().split('T')[0];
        workload.set(key, (workload.get(key) || 0) + 1);
        current.setDate(current.getDate() + 1);
      }
    });
    
    return workload;
  }, [activeJobs]);

  const maxWorkload = useMemo(() => 
    Math.max(...Array.from(workloadByDay.values()), 1),
    [workloadByDay]
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
        <span className="text-gray-500 dark:text-gray-400">Status:</span>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-blue-500"></span>
          <span className="text-gray-600 dark:text-gray-400">Future</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-emerald-500"></span>
          <span className="text-gray-600 dark:text-gray-400">Active</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-amber-500"></span>
          <span className="text-gray-600 dark:text-gray-400">On Hold</span>
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
          {/* Workload row */}
          <div
            className="flex items-center px-4 border-t-2 border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700/50"
            style={{ height: 60 }}
          >
            <div className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
              Workload
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
              const barStyle = getJobBarStyle(job);
              const isDragging = dragState?.jobId === job.id;
              
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
                  
                  {/* Job Bar */}
                  <div
                    className={`absolute top-2 bottom-2 rounded-lg shadow-md flex items-center transition-shadow ${
                      getStatusColor(job.status)
                    } ${isDragging ? 'shadow-xl ring-2 ring-orange-400 z-20' : 'z-10'}`}
                    style={{
                      left: barStyle.left,
                      width: barStyle.width,
                      cursor: dragState?.type === 'move' ? 'grabbing' : 'grab',
                    }}
                    onMouseDown={(e) => handleDragStart(e, job, 'move')}
                    onDoubleClick={() => onEditJob(job)}
                  >
                    {/* Left resize handle */}
                    <div
                      className="absolute left-0 top-0 bottom-0 w-3 cursor-ew-resize hover:bg-black/20 rounded-l-lg"
                      onMouseDown={(e) => handleDragStart(e, job, 'resize-start')}
                    />
                    
                    {/* Bar content */}
                    <div className="flex-1 px-3 truncate text-white text-xs font-medium">
                      {barStyle.width > 80 && (
                        <span>{job.jobNo}</span>
                      )}
                      {barStyle.width > 150 && (
                        <span className="ml-2 opacity-75">
                          {formatDate(job.startDate)} - {formatDate(job.endDate)}
                        </span>
                      )}
                    </div>
                    
                    {/* Right resize handle */}
                    <div
                      className="absolute right-0 top-0 bottom-0 w-3 cursor-ew-resize hover:bg-black/20 rounded-r-lg"
                      onMouseDown={(e) => handleDragStart(e, job, 'resize-end')}
                    />
                  </div>
                </div>
              );
            })}

            {/* Workload Heatmap */}
            <div 
              className="relative border-t-2 border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700/30"
              style={{ height: 60 }}
            >
              <div className="absolute inset-0 flex">
                {Array.from({ length: totalDays }).map((_, dayIdx) => {
                  const date = new Date(timelineStart);
                  date.setDate(date.getDate() + dayIdx);
                  const key = date.toISOString().split('T')[0];
                  const count = workloadByDay.get(key) || 0;
                  const intensity = count / maxWorkload;
                  
                  // Color based on intensity
                  let bgColor = 'bg-transparent';
                  if (count > 0) {
                    if (intensity > 0.8) bgColor = 'bg-red-500';
                    else if (intensity > 0.6) bgColor = 'bg-orange-500';
                    else if (intensity > 0.4) bgColor = 'bg-amber-400';
                    else if (intensity > 0.2) bgColor = 'bg-yellow-300';
                    else bgColor = 'bg-green-300';
                  }
                  
                  return (
                    <div
                      key={dayIdx}
                      className={`${bgColor} opacity-60`}
                      style={{ 
                        width: pxPerDay,
                        height: count > 0 ? `${Math.max(20, intensity * 100)}%` : 0,
                        alignSelf: 'flex-end',
                      }}
                      title={`${date.toLocaleDateString()}: ${count} job${count !== 1 ? 's' : ''}`}
                    />
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
                      className="absolute top-0 bottom-0 w-0.5 bg-red-500"
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

      {/* Footer */}
      <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-xs text-gray-500 dark:text-gray-400 flex justify-between">
        <span>
          Timeline: {timelineStart.toLocaleDateString()} — {timelineEnd.toLocaleDateString()}
        </span>
        <span>
          🔴 Today | Workload: 🟢 Low → 🔴 High
        </span>
      </div>
    </div>
  );
};

export default GanttView;

