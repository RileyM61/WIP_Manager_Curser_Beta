import React, { useState } from 'react';
import { PlusIcon } from '../shared/icons';

interface FloatingActionButtonProps {
  onClick: () => void;
  label?: string;
  show?: boolean;
}

/**
 * Floating Action Button (FAB) for primary actions like "Add Job"
 * Follows Material Design principles for mobile-first interaction
 */
const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onClick,
  label = 'Add Job',
  show = true,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  if (!show) return null;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsPressed(false);
      }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      className={`
        fixed bottom-6 right-6 z-40
        flex items-center gap-2
        px-4 py-3
        bg-gradient-to-r from-orange-500 to-amber-500
        text-white font-semibold
        rounded-full
        shadow-lg shadow-orange-500/30
        transition-all duration-300 ease-out
        hover:shadow-xl hover:shadow-orange-500/40
        hover:scale-105
        focus:outline-none focus:ring-4 focus:ring-orange-500/30
        ${isPressed ? 'scale-95' : ''}
        group
      `}
      aria-label={label}
      data-tour="add-job-button"
    >
      {/* Icon with rotation animation on hover */}
      <span className={`transition-transform duration-300 ${isHovered ? 'rotate-90' : ''}`}>
        <PlusIcon />
      </span>
      
      {/* Label - always visible on desktop, hidden on mobile */}
      <span className="hidden sm:inline pr-1">{label}</span>
      
      {/* Ripple effect on click */}
      {isPressed && (
        <span className="absolute inset-0 rounded-full bg-white/20 animate-ping" />
      )}
    </button>
  );
};

export default FloatingActionButton;

