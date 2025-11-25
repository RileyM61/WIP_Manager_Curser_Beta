import { Job, CostBreakdown } from '../types';

/**
 * Sums the labor, material, and other fields of a CostBreakdown
 */
const sumBreakdown = (breakdown: CostBreakdown): number => 
  breakdown.labor + breakdown.material + breakdown.other;

/**
 * Formats a number as currency (no symbol, with commas)
 */
const formatCurrency = (value: number): string => 
  value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * Formats a date string for CSV export
 */
const formatDate = (dateStr: string | undefined): string => {
  if (!dateStr || dateStr === 'TBD') return 'TBD';
  try {
    return new Date(dateStr).toLocaleDateString('en-US');
  } catch {
    return dateStr;
  }
};

/**
 * Escapes a string for CSV (handles commas, quotes, newlines)
 */
const escapeCSV = (value: string | number | undefined): string => {
  if (value === undefined || value === null) return '';
  const str = String(value);
  // If the value contains comma, quote, or newline, wrap in quotes and escape internal quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

/**
 * Converts jobs array to CSV string
 */
export function jobsToCSV(jobs: Job[]): string {
  // Define headers
  const headers = [
    'Job #',
    'Job Name',
    'Client',
    'Project Manager',
    'Status',
    'Start Date',
    'End Date',
    'Contract (Labor)',
    'Contract (Material)',
    'Contract (Other)',
    'Contract (Total)',
    'Cost to Date (Labor)',
    'Cost to Date (Material)',
    'Cost to Date (Other)',
    'Cost to Date (Total)',
    'Budget (Labor)',
    'Budget (Material)',
    'Budget (Other)',
    'Budget (Total)',
    'Invoiced (Total)',
    'Cost to Complete (Total)',
    'Forecasted Budget',
    'Original Profit',
    'Original Margin %',
    'Forecasted Profit',
    'Forecasted Margin %',
    'Profit Variance',
    'Earned Revenue',
    'Over/Under Billed',
    'Last Updated',
  ];

  // Convert each job to a row
  const rows = jobs.map(job => {
    const totalContract = sumBreakdown(job.contract);
    const totalCost = sumBreakdown(job.costs);
    const totalBudget = sumBreakdown(job.budget);
    const totalInvoiced = sumBreakdown(job.invoiced);
    const totalCostToComplete = sumBreakdown(job.costToComplete);
    
    const forecastedBudget = totalCost + totalCostToComplete;
    const originalProfit = totalContract - totalBudget;
    const originalMargin = totalContract > 0 ? (originalProfit / totalContract) * 100 : 0;
    const forecastedProfit = totalContract - forecastedBudget;
    const forecastedMargin = totalContract > 0 ? (forecastedProfit / totalContract) * 100 : 0;
    const profitVariance = forecastedProfit - originalProfit;
    
    const percentComplete = totalBudget > 0 ? totalCost / totalBudget : 0;
    const earnedRevenue = totalContract * percentComplete;
    const overUnderBilled = totalInvoiced - earnedRevenue;

    return [
      escapeCSV(job.jobNo),
      escapeCSV(job.jobName),
      escapeCSV(job.client),
      escapeCSV(job.projectManager),
      escapeCSV(job.status),
      escapeCSV(formatDate(job.startDate)),
      escapeCSV(formatDate(job.endDate)),
      formatCurrency(job.contract.labor),
      formatCurrency(job.contract.material),
      formatCurrency(job.contract.other),
      formatCurrency(totalContract),
      formatCurrency(job.costs.labor),
      formatCurrency(job.costs.material),
      formatCurrency(job.costs.other),
      formatCurrency(totalCost),
      formatCurrency(job.budget.labor),
      formatCurrency(job.budget.material),
      formatCurrency(job.budget.other),
      formatCurrency(totalBudget),
      formatCurrency(totalInvoiced),
      formatCurrency(totalCostToComplete),
      formatCurrency(forecastedBudget),
      formatCurrency(originalProfit),
      originalMargin.toFixed(1),
      formatCurrency(forecastedProfit),
      forecastedMargin.toFixed(1),
      formatCurrency(profitVariance),
      formatCurrency(earnedRevenue),
      formatCurrency(overUnderBilled),
      escapeCSV(formatDate(job.lastUpdated)),
    ].join(',');
  });

  // Combine headers and rows
  return [headers.join(','), ...rows].join('\n');
}

/**
 * Triggers a download of the CSV file
 */
export function downloadCSV(csvContent: string, filename: string): void {
  // Add BOM for Excel compatibility with special characters
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // Create download link
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the URL object
  URL.revokeObjectURL(url);
}

/**
 * Exports jobs to a CSV file and triggers download
 */
export function exportJobsToCSV(jobs: Job[], filenamePrefix: string = 'wip-jobs'): void {
  const csvContent = jobsToCSV(jobs);
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const filename = `${filenamePrefix}-${timestamp}.csv`;
  downloadCSV(csvContent, filename);
}

