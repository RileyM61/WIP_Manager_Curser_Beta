// ============================================================================
// LABOR CAPACITY MODULE - Main Exports
// ============================================================================

// Types
export * from './types';

// Constants
export * from './constants';

// Calculations
export * from './lib/calculations';

// Hooks
export { useEmployees } from './hooks/useEmployees';
export { useDepartments } from './hooks/useDepartments';
export { useProjections } from './hooks/useProjections';

// Components
export { default as LaborCapacityPage } from './components/LaborCapacityPage';
export { default as EmployeeRoster } from './components/EmployeeRoster';
export { default as EmployeeFormModal } from './components/EmployeeFormModal';
export { default as DepartmentManager } from './components/DepartmentManager';
export { default as AllocationEditor } from './components/AllocationEditor';
export { default as CostProjectionChart } from './components/CostProjectionChart';

