import { Job, CostBreakdown } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { sumBreakdown as sumBreakdownUtil, calculateEarnedRevenue, calculateBillingDifference, calculateForecastedProfit } from './jobCalculations';

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
 * Formats a number as currency with dollar sign
 */
const formatCurrencyWithSymbol = (value: number): string => 
  value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

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
    'Estimator',
    'Job Type',
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
    const isTM = job.jobType === 'time-material';
    const totalContract = sumBreakdown(job.contract);
    const totalCost = sumBreakdown(job.costs);
    const totalBudget = sumBreakdown(job.budget);
    const totalInvoiced = sumBreakdown(job.invoiced);
    const totalCostToComplete = sumBreakdown(job.costToComplete);
    
    // Use shared calculation functions
    const earnedRevenue = calculateEarnedRevenue(job);
    const billingInfo = calculateBillingDifference(job);
    const forecastedProfit = calculateForecastedProfit(job);
    
    const forecastedBudget = totalCost + totalCostToComplete;
    const originalProfit = isTM ? 0 : (totalContract - totalBudget);
    const originalMargin = isTM ? 0 : (totalContract > 0 ? (originalProfit / totalContract) * 100 : 0);
    
    // For T&M, margin is based on earned revenue
    const forecastedMargin = isTM 
      ? (earnedRevenue.total > 0 ? (forecastedProfit / earnedRevenue.total) * 100 : 0)
      : (totalContract > 0 ? (forecastedProfit / totalContract) * 100 : 0);
    
    const profitVariance = isTM ? forecastedProfit : (forecastedProfit - originalProfit);

    return [
      escapeCSV(job.jobNo),
      escapeCSV(job.jobName),
      escapeCSV(job.client),
      escapeCSV(job.projectManager),
      escapeCSV(job.estimator || ''),
      escapeCSV(isTM ? 'T&M' : 'Fixed Price'),
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
      formatCurrency(earnedRevenue.total),
      formatCurrency(billingInfo.difference),
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

// ============================================================================
// PDF EXPORT FUNCTIONS
// ============================================================================

interface PDFExportOptions {
  companyName?: string;
  title?: string;
}

/**
 * Exports jobs to a professional PDF report
 */
export function exportJobsToPDF(
  jobs: Job[], 
  filenamePrefix: string = 'wip-report',
  options: PDFExportOptions = {}
): void {
  const { companyName = 'WIP Report', title = 'Work-in-Progress Report' } = options;
  
  // Create PDF in landscape for better table fit
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  
  // Colors
  const primaryColor: [number, number, number] = [249, 115, 22]; // Orange-500
  const darkColor: [number, number, number] = [30, 41, 59]; // Slate-800
  const grayColor: [number, number, number] = [100, 116, 139]; // Slate-500

  // ========== HEADER ==========
  // Orange accent bar
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 3, 'F');
  
  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...darkColor);
  doc.text('WIP-Insights', margin, 15);
  
  // Subtitle / Company Name
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(...grayColor);
  doc.text(companyName, margin, 22);
  
  // Report title and date (right aligned)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...darkColor);
  doc.text(title, pageWidth - margin, 15, { align: 'right' });
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...grayColor);
  const exportDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  doc.text(`Generated: ${exportDate}`, pageWidth - margin, 22, { align: 'right' });

  // ========== SUMMARY STATS ==========
  const totalContract = jobs.reduce((sum, job) => sum + sumBreakdown(job.contract), 0);
  const totalCost = jobs.reduce((sum, job) => sum + sumBreakdown(job.costs), 0);
  const totalBudget = jobs.reduce((sum, job) => sum + sumBreakdown(job.budget), 0);
  const totalCostToComplete = jobs.reduce((sum, job) => sum + sumBreakdown(job.costToComplete), 0);
  const totalForecastedBudget = totalCost + totalCostToComplete;
  const totalOriginalProfit = totalContract - totalBudget;
  const totalForecastedProfit = totalContract - totalForecastedBudget;
  
  // Summary box
  const summaryY = 30;
  doc.setFillColor(248, 250, 252); // Slate-50
  doc.roundedRect(margin, summaryY, pageWidth - (margin * 2), 18, 2, 2, 'F');
  
  // Summary stats
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...darkColor);
  
  const statsX = [margin + 10, margin + 60, margin + 120, margin + 180, margin + 235];
  const statsLabels = ['Total Jobs', 'Contract Value', 'Cost to Date', 'Original Profit', 'Forecasted Profit'];
  const statsValues = [
    jobs.length.toString(),
    formatCurrencyWithSymbol(totalContract),
    formatCurrencyWithSymbol(totalCost),
    formatCurrencyWithSymbol(totalOriginalProfit),
    formatCurrencyWithSymbol(totalForecastedProfit)
  ];
  
  statsLabels.forEach((label, i) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...grayColor);
    doc.text(label, statsX[i], summaryY + 6);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...darkColor);
    // Color profit values
    if (i === 3 || i === 4) {
      const value = i === 3 ? totalOriginalProfit : totalForecastedProfit;
      doc.setTextColor(value >= 0 ? 22 : 239, value >= 0 ? 163 : 68, value >= 0 ? 74 : 68); // Green or Red
    }
    doc.text(statsValues[i], statsX[i], summaryY + 13);
  });

  // ========== JOBS TABLE ==========
  const tableData = jobs.map(job => {
    const isTM = job.jobType === 'time-material';
    const contract = sumBreakdown(job.contract);
    const cost = sumBreakdown(job.costs);
    const budget = sumBreakdown(job.budget);
    
    // Use shared calculation functions
    const earnedRevenue = calculateEarnedRevenue(job);
    const billingInfo = calculateBillingDifference(job);
    const forecastProfit = calculateForecastedProfit(job);
    
    // For T&M, margin is based on earned revenue; for fixed price, based on contract
    const forecastMargin = isTM 
      ? (earnedRevenue.total > 0 ? (forecastProfit / earnedRevenue.total) * 100 : 0)
      : (contract > 0 ? (forecastProfit / contract) * 100 : 0);
    
    // % Complete only meaningful for fixed price
    const pctComplete = isTM ? 'N/A' : (budget > 0 ? `${((cost / budget) * 100).toFixed(0)}%` : '0%');

    return [
      job.jobNo,
      job.jobName.length > 25 ? job.jobName.substring(0, 22) + '...' : job.jobName,
      job.projectManager,
      isTM ? 'T&M' : job.status,
      isTM ? formatCurrencyWithSymbol(earnedRevenue.total) : formatCurrencyWithSymbol(contract),
      formatCurrencyWithSymbol(cost),
      pctComplete,
      formatCurrencyWithSymbol(forecastProfit),
      `${forecastMargin.toFixed(1)}%`,
      formatCurrencyWithSymbol(billingInfo.difference),
    ];
  });

  autoTable(doc, {
    startY: summaryY + 24,
    head: [[
      'Job #',
      'Job Name',
      'PM',
      'Status',
      'Contract',
      'Cost to Date',
      '% Complete',
      'Forecast Profit',
      'Margin',
      'Over/Under'
    ]],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: 3,
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 2.5,
      textColor: darkColor,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // Slate-50
    },
    columnStyles: {
      0: { cellWidth: 22 }, // Job #
      1: { cellWidth: 45 }, // Job Name
      2: { cellWidth: 25 }, // PM
      3: { cellWidth: 20 }, // Status
      4: { cellWidth: 28, halign: 'right' }, // Contract
      5: { cellWidth: 28, halign: 'right' }, // Cost to Date
      6: { cellWidth: 20, halign: 'center' }, // % Complete
      7: { cellWidth: 28, halign: 'right' }, // Forecast Profit
      8: { cellWidth: 18, halign: 'center' }, // Margin
      9: { cellWidth: 25, halign: 'right' }, // Over/Under
    },
    didParseCell: (data) => {
      // Color the Forecast Profit column based on value
      if (data.section === 'body' && data.column.index === 7) {
        const value = parseFloat(data.cell.raw?.toString().replace(/[$,]/g, '') || '0');
        if (value < 0) {
          data.cell.styles.textColor = [239, 68, 68]; // Red
        } else {
          data.cell.styles.textColor = [22, 163, 74]; // Green
        }
      }
      // Color the Over/Under column
      if (data.section === 'body' && data.column.index === 9) {
        const value = parseFloat(data.cell.raw?.toString().replace(/[$,]/g, '') || '0');
        if (value < 0) {
          data.cell.styles.textColor = [239, 68, 68]; // Red (Under-billed)
        } else if (value > 0) {
          data.cell.styles.textColor = [22, 163, 74]; // Green (Over-billed)
        }
      }
    },
    margin: { left: margin, right: margin },
  });

  // ========== FOOTER ==========
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    
    // Footer line
    doc.setDrawColor(...grayColor);
    doc.setLineWidth(0.2);
    doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);
    
    // Footer text
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...grayColor);
    doc.text('WIP-Insights | Work-in-Progress Management', margin, pageHeight - 5);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 5, { align: 'right' });
  }

  // ========== SAVE ==========
  const timestamp = new Date().toISOString().split('T')[0];
  doc.save(`${filenamePrefix}-${timestamp}.pdf`);
}

