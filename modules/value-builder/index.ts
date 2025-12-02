/**
 * Value Builder Module Exports
 */

// Components
export { default as ValueBuilderPage } from './components/ValueBuilderPage';
export { default as ValuationDashboard } from './components/ValuationDashboard';
export { default as ScenarioList } from './components/ScenarioList';
export { default as ScenarioForm } from './components/ScenarioForm';
export { default as ScenarioComparison } from './components/ScenarioComparison';
export { default as ValueTrendChart } from './components/ValueTrendChart';
export { default as ValueDriverQuestionnaire } from './components/ValueDriverQuestionnaire';

// Hooks
export { useValuations } from './hooks/useValuations';
export { useValueHistory } from './hooks/useValueHistory';
export { useValueDriverAssessment } from './hooks/useValueDriverAssessment';

// Types
export * from './types';

// Constants
export * from './constants';

// Calculations
export * from './lib/calculations';

// Questionnaire & Strategic Actions
export * from './lib/questionnaire';
export * from './lib/strategicActions';

