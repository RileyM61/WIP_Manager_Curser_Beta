/**
 * WIP Manager Module
 * 
 * Core module for Work-in-Progress tracking, job management,
 * Gantt scheduling, and backlog forecasting.
 */

// Components
export * from './components';

// Calculations
export * from './lib/jobCalculations';

// Module metadata
export const WIP_MODULE = {
  id: 'wip' as const,
  name: 'WIP Manager',
  description: 'Work-in-Progress tracking, job management, Gantt scheduling, and backlog forecasting',
};

