import { TourStep } from '../components/help/GuidedTour';

/**
 * Guided tour steps for first-time users
 */
export const tourSteps: TourStep[] = [
  {
    target: '[data-tour="header-logo"]',
    title: 'Welcome to WIP-Insights! 🎉',
    content: 'This is your Work-in-Progress management tool. It helps you track job profitability, billing status, and overall company performance. Let\'s take a quick tour!',
    placement: 'bottom',
  },
  {
    target: '[data-tour="add-job-button"]',
    title: 'Adding Jobs',
    content: 'Click here to add a new job. You can choose between Fixed Price (lump sum contracts) or Time & Material (cost plus markup) job types.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="status-filters"]',
    title: 'Filter by Status',
    content: 'Use these tabs to filter jobs by their status: Future (upcoming), Active (in progress), On Hold, Completed, or Archived. The Company view shows your overall performance.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="view-toggle"]',
    title: 'Change Your View',
    content: 'Use these toggle buttons to switch between Grid view (cards), Table view (spreadsheet), or Gantt view (timeline). Grid is great for a quick overview, whilst Table is better for detailed editing.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="export-button"]',
    title: 'Export Your Data',
    content: 'Export your WIP data to CSV or PDF format. Great for sharing with stakeholders, accountants, or for your own records.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="role-selector"]',
    title: 'Role-Based Views',
    content: 'Switch between Owner, Project Manager, and Estimator views. Each role sees relevant information and has appropriate permissions.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="settings-button"]',
    title: 'Settings & Configuration',
    content: 'Configure your company settings, add project managers and estimators, and customize your WIP experience.',
    placement: 'left',
  },
  {
    target: '[data-tour="help-button"]',
    title: 'Need Help?',
    content: 'Click the help button anytime to restart this tour, open the glossary, or get quick tips. Look for (i) icons next to fields for instant explanations!',
    placement: 'left',
  },
];

/**
 * Check if user has completed the tour
 */
export const hasCompletedTour = (): boolean => {
  return localStorage.getItem('wip-tour-completed') === 'true';
};

/**
 * Mark tour as completed
 */
export const markTourCompleted = (): void => {
  localStorage.setItem('wip-tour-completed', 'true');
};

/**
 * Reset tour completion status
 */
export const resetTourCompletion = (): void => {
  localStorage.removeItem('wip-tour-completed');
};

