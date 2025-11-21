import React from 'react';

interface ProgressBarProps {
  percentage: number;
  label: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ percentage, label }) => {
  const bgColor = percentage < 30 ? 'bg-red-500' : percentage < 70 ? 'bg-yellow-500' : 'bg-green-500';
  
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-xs font-medium text-brand-dark-gray dark:text-gray-300">{label}</span>
        <span className="text-xs font-medium text-brand-dark-gray dark:text-gray-300">{percentage}%</span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
        <div 
          className={`h-2.5 rounded-full transition-all duration-500 ${bgColor}`} 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default ProgressBar;