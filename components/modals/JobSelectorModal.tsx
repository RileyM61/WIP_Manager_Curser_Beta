import React, { useState, useMemo } from 'react';
import { Job, JobStatus } from '../../types';

interface JobSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectJob: (job: Job) => void;
  jobs: Job[];
  title?: string;
  description?: string;
}

const JobSelectorModal: React.FC<JobSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelectJob,
  jobs,
  title = 'Select a Job',
  description = 'Choose the job you want to work with.',
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter to only active jobs and apply search
  const filteredJobs = useMemo(() => {
    const activeJobs = jobs.filter(
      job => job.status === JobStatus.Active || job.status === JobStatus.OnHold
    );

    if (!searchQuery.trim()) {
      return activeJobs;
    }

    const query = searchQuery.toLowerCase();
    return activeJobs.filter(
      job =>
        job.jobName.toLowerCase().includes(query) ||
        job.jobNumber.toLowerCase().includes(query) ||
        (job.projectManager && job.projectManager.toLowerCase().includes(query))
    );
  }, [jobs, searchQuery]);

  const handleSelect = (job: Job) => {
    onSelectJob(job);
    setSearchQuery('');
    onClose();
  };

  const handleClose = () => {
    setSearchQuery('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div 
          className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-2xl transform transition-all animate-in fade-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {title}
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {description}
                </p>
              </div>
              <button
                onClick={handleClose}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Search */}
            <div className="mt-4 relative">
              <svg 
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by job name, number, or PM..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-wip-gold/50 focus:border-wip-gold transition-all"
                autoFocus
              />
            </div>
          </div>

          {/* Job List */}
          <div className="max-h-80 overflow-y-auto px-2 py-2">
            {filteredJobs.length === 0 ? (
              <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                {searchQuery ? 'No jobs match your search.' : 'No active jobs available.'}
              </div>
            ) : (
              <div className="space-y-1">
                {filteredJobs.map((job) => (
                  <button
                    key={job.id}
                    onClick={() => handleSelect(job)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
                  >
                    {/* Status indicator */}
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                      job.status === JobStatus.Active 
                        ? 'bg-green-500' 
                        : 'bg-wip-gold'
                    }`} />
                    
                    {/* Job info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 dark:text-gray-100 truncate group-hover:text-wip-gold-dark dark:group-hover:text-wip-gold transition-colors">
                          {job.jobName}
                        </span>
                        <span className="text-xs font-mono text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                          #{job.jobNumber}
                        </span>
                      </div>
                      {job.projectManager && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          PM: {job.projectManager}
                        </div>
                      )}
                    </div>

                    {/* Arrow */}
                    <svg 
                      className="w-5 h-5 text-gray-300 dark:text-gray-600 group-hover:text-wip-gold group-hover:translate-x-0.5 transition-all" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''} available
              </span>
              <button
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobSelectorModal;

