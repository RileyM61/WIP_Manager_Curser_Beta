import React, { useState, useRef, useEffect } from 'react';
import { JobStatus } from '../../../types';
import { ChevronDownIcon } from '../../../components/shared/icons';

interface StatusChangerProps {
  jobId: string;
  currentStatus: JobStatus;
  onUpdateStatus: (jobId: string, status: JobStatus) => void;
}

const getStatusButtonColorClasses = (status: JobStatus) => {
  switch (status) {
    case JobStatus.Draft:
      return 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300 border-dashed';
    case JobStatus.Future:
      return 'bg-purple-100 text-purple-800 hover:bg-purple-200 border-purple-200';
    case JobStatus.Active:
      return 'bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200';
    case JobStatus.OnHold:
      return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200';
    case JobStatus.Completed:
      return 'bg-green-100 text-green-800 hover:bg-green-200 border-green-200';
    case JobStatus.Archived:
      return 'bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-200';
    default:
      return 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300';
  }
};


const StatusChanger: React.FC<StatusChangerProps> = ({ jobId, currentStatus, onUpdateStatus }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const allStatuses = Object.values(JobStatus);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleStatusChange = (newStatus: JobStatus) => {
    if (newStatus !== currentStatus) {
      onUpdateStatus(jobId, newStatus);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <div>
        <button
          type="button"
          className={`inline-flex items-center justify-between w-36 rounded-md border shadow-sm px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue transition-colors ${getStatusButtonColorClasses(currentStatus)}`}
          onClick={() => setIsOpen(!isOpen)}
        >
          <span>{currentStatus}</span>
          <ChevronDownIcon />
        </button>
      </div>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
          <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
            {allStatuses.map((status) => (
              <button
                key={status}
                onClick={() => handleStatusChange(status)}
                disabled={status === currentStatus}
                className={`block w-full text-left px-4 py-2 text-sm ${status === currentStatus
                    ? 'text-gray-400 cursor-not-allowed bg-gray-100'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                role="menuitem"
              >
                {status === currentStatus ? `${status} (Current)` : `Move to ${status}`}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StatusChanger;

