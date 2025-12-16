/**
 * Category Badge Component
 * 
 * Displays a colored badge for change log entry categories.
 */

import React from 'react';
import { ChangeCategory, CATEGORY_CONFIG } from '../../types/changelog';

interface CategoryBadgeProps {
  category: ChangeCategory;
  size?: 'sm' | 'md';
}

const CategoryBadge: React.FC<CategoryBadgeProps> = ({ category, size = 'md' }) => {
  const config = CATEGORY_CONFIG[category];
  
  const sizeClasses = size === 'sm' 
    ? 'px-2 py-0.5 text-xs' 
    : 'px-2.5 py-1 text-xs';
  
  return (
    <span
      className={`
        inline-flex items-center gap-1 rounded-full font-medium
        ${config.bgColor} ${config.darkBgColor} ${config.color}
        ${sizeClasses}
      `}
    >
      <span className="font-semibold">{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
};

export default CategoryBadge;

