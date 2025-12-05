import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants';

interface DashboardNavButtonProps {
  className?: string;
  label?: string;
  floating?: boolean;
  iconOnly?: boolean;
  offsetTop?: number;
  offsetLeft?: number;
}

const DashboardNavButton: React.FC<DashboardNavButtonProps> = ({
  className = '',
  label = 'Dashboard',
  floating = false,
  iconOnly = false,
  offsetTop = 16,
  offsetLeft = 16,
}) => {
  const baseClass =
    'inline-flex items-center gap-2 rounded-full border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300 shadow-sm hover:border-orange-400 hover:text-orange-500 dark:hover:text-orange-300 hover:shadow-lg hover:shadow-orange-500/10 transition-colors backdrop-blur';
  const floatingClass = floating ? `fixed z-50` : '';
  const inlineStyle = floating ? { top: offsetTop, left: offsetLeft } : undefined;

  return (
    <Link
      to={ROUTES.dashboard}
      className={[baseClass, floatingClass, className].filter(Boolean).join(' ')}
      aria-label="Back to dashboard"
      style={inlineStyle}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2a2 2 0 012-2z"
        />
      </svg>
      {!iconOnly && <span>{label}</span>}
    </Link>
  );
};

export default DashboardNavButton;

