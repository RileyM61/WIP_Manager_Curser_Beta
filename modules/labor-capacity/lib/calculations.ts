// ============================================================================
// LABOR CAPACITY CALCULATIONS
// ============================================================================

import {
  Employee,
  DepartmentAllocation,
  EmployeeMetrics,
  DepartmentSummary,
  MonthlyProjection,
  Department,
} from '../types';
import {
  HOURS_PER_YEAR,
  HOURS_PER_DAY,
  WORKING_DAYS_PER_MONTH,
} from '../constants';

/**
 * Calculate loaded cost per hour (base rate × burden multiplier)
 */
export function calculateLoadedCostPerHour(
  hourlyRate: number,
  burdenMultiplier: number
): number {
  return hourlyRate * burdenMultiplier;
}

/**
 * Calculate annual available hours (adjusted for FTE and PTO)
 */
export function calculateAnnualAvailableHours(
  fte: number,
  annualPtoHours: number
): number {
  return Math.max(0, HOURS_PER_YEAR * fte - annualPtoHours);
}

/**
 * Calculate annual loaded cost
 */
export function calculateAnnualLoadedCost(
  hourlyRate: number,
  burdenMultiplier: number,
  fte: number,
  annualPtoHours: number
): number {
  const loadedRate = calculateLoadedCostPerHour(hourlyRate, burdenMultiplier);
  const availableHours = calculateAnnualAvailableHours(fte, annualPtoHours);
  return loadedRate * availableHours;
}

/**
 * Calculate years of service from hire date
 */
export function calculateYearsOfService(hireDate: string | null): number {
  if (!hireDate) return 0;
  const hire = new Date(hireDate);
  const now = new Date();
  const years = (now.getTime() - hire.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  return Math.max(0, Math.floor(years * 10) / 10); // Round to 1 decimal
}

/**
 * Get working days for a specific month
 */
export function getWorkingDaysInMonth(year: number, month: number): number {
  // Calculate actual working days (Mon-Fri, excluding holidays)
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  let workingDays = 0;
  
  for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
    const dayOfWeek = d.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      workingDays++;
    }
  }
  
  return workingDays;
}

/**
 * Calculate monthly available hours for an employee
 */
export function calculateMonthlyAvailableHours(
  fte: number,
  annualPtoHours: number,
  year: number,
  month: number
): number {
  const workingDays = getWorkingDaysInMonth(year, month);
  const monthlyHours = workingDays * HOURS_PER_DAY * fte;
  // Distribute PTO evenly across months
  const monthlyPto = annualPtoHours / 12;
  return Math.max(0, monthlyHours - monthlyPto);
}

/**
 * Calculate all metrics for an employee
 */
export function calculateEmployeeMetrics(employee: Employee): EmployeeMetrics {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const loadedCostPerHour = calculateLoadedCostPerHour(
    employee.hourlyRate,
    employee.burdenMultiplier
  );

  const annualAvailableHours = calculateAnnualAvailableHours(
    employee.fte,
    employee.annualPtoHours
  );

  const annualLoadedCost = loadedCostPerHour * annualAvailableHours;

  const monthlyAvailableHours = calculateMonthlyAvailableHours(
    employee.fte,
    employee.annualPtoHours,
    year,
    month
  );

  const monthlyLoadedCost = loadedCostPerHour * monthlyAvailableHours;

  const billableHours = monthlyAvailableHours * employee.utilizationTarget;

  const yearsOfService = calculateYearsOfService(employee.hireDate);

  return {
    loadedCostPerHour,
    annualAvailableHours,
    annualLoadedCost,
    monthlyAvailableHours,
    monthlyLoadedCost,
    billableHours,
    yearsOfService,
  };
}

/**
 * Calculate department summary from employees and their allocations
 * Only includes employees who are currently hired (not future hires)
 */
export function calculateDepartmentSummary(
  department: Department,
  employees: Employee[],
  allocations: DepartmentAllocation[]
): DepartmentSummary {
  // Filter allocations for this department
  const deptAllocations = allocations.filter(a => a.departmentId === department.id);
  
  // Get unique employees allocated to this department - ONLY those currently active (not future hires)
  const employeeIds = new Set(deptAllocations.map(a => a.employeeId));
  const deptEmployees = employees.filter(e => 
    employeeIds.has(e.id) && isEmployeeCurrentlyActive(e)
  );

  let totalFte = 0;
  let totalHours = 0;
  let totalCost = 0;
  let totalLoadedRate = 0;

  deptEmployees.forEach(employee => {
    const allocation = deptAllocations.find(a => a.employeeId === employee.id);
    if (!allocation) return;

    const allocationFactor = allocation.allocationPercent / 100;
    const metrics = calculateEmployeeMetrics(employee);

    totalFte += employee.fte * allocationFactor;
    totalHours += metrics.annualAvailableHours * allocationFactor;
    totalCost += metrics.annualLoadedCost * allocationFactor;
    totalLoadedRate += metrics.loadedCostPerHour;
  });

  const employeeCount = deptEmployees.length;
  const averageLoadedRate = employeeCount > 0 ? totalLoadedRate / employeeCount : 0;

  return {
    departmentId: department.id,
    departmentName: department.name,
    isProductive: department.isProductive,
    employeeCount,
    totalFte,
    totalHours,
    totalCost,
    averageLoadedRate,
  };
}

/**
 * Extract year, month (1-12), and day from a date string
 * Returns null if parsing fails
 */
function extractDateParts(dateStr: string | null): { year: number; month: number; day: number } | null {
  if (!dateStr) return null;
  if (typeof dateStr !== 'string') return null;
  
  // Try YYYY-MM-DD format first (ISO date)
  const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return {
      year: parseInt(isoMatch[1], 10),
      month: parseInt(isoMatch[2], 10), // Keep as 1-12
      day: parseInt(isoMatch[3], 10),
    };
  }
  
  // Try MM/DD/YYYY format (US format)
  const usMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (usMatch) {
    return {
      year: parseInt(usMatch[3], 10),
      month: parseInt(usMatch[1], 10), // Keep as 1-12
      day: parseInt(usMatch[2], 10),
    };
  }
  
  // Fallback: try to parse with Date constructor
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return {
      year: parsed.getFullYear(),
      month: parsed.getMonth() + 1, // Convert to 1-12
      day: parsed.getDate(),
    };
  }
  
  return null;
}

/**
 * Parse a date string safely (handles YYYY-MM-DD format to avoid timezone issues)
 * Always returns a date at midnight LOCAL time
 */
function parseDate(dateStr: string | null): Date | null {
  const parts = extractDateParts(dateStr);
  if (!parts) return null;
  
  // Create date at local midnight using year, month (converted to 0-11), day
  return new Date(parts.year, parts.month - 1, parts.day);
}

/**
 * Check if an employee is currently active (hired and not terminated)
 */
export function isEmployeeCurrentlyActive(employee: Employee): boolean {
  if (!employee.isActive) return false;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Check hire date - if in the future, not yet active
  if (employee.hireDate) {
    const hireDate = parseDate(employee.hireDate);
    if (hireDate) {
      hireDate.setHours(0, 0, 0, 0);
      if (hireDate > today) return false;
    }
  }
  
  // Check termination date - if in the past, no longer active
  if (employee.terminationDate) {
    const termDate = parseDate(employee.terminationDate);
    if (termDate) {
      termDate.setHours(0, 0, 0, 0);
      if (termDate <= today) return false;
    }
  }
  
  return true;
}

/**
 * Convert year and month to YYYYMM number for easy comparison
 * month is 1-12 (calendar month)
 */
function toYearMonth(year: number, month: number): number {
  return year * 100 + month;
}

/**
 * Check if an employee is active during a specific month
 * Accounts for both hire date and termination date
 * 
 * Rules:
 * - Employee is active starting from their hire month (inclusive)
 * - Employee is active up to and including their termination month
 * - Termination date = LAST day of employment, they work that full day/month
 * - Example: Hired Jan 15, Terminated Aug 1 → Active in Jan-Aug (Aug prorated to 1 day)
 */
export function isEmployeeActiveInMonth(
  employee: Employee,
  year: number,
  month: number // 0-11 (JavaScript month index)
): boolean {
  if (!employee.isActive) return false;
  
  // Convert JS month (0-11) to calendar month (1-12) and create YYYYMM
  const targetYM = toYearMonth(year, month + 1);
  
  // DEBUG: Log all employee data for troubleshooting
  if (targetYM === 202607 || targetYM === 202608) { // July or August 2026
    console.log(`[ACTIVE CHECK] ${employee.name} for ${targetYM}: terminationDate="${employee.terminationDate}", hireDate="${employee.hireDate}"`);
  }
  
  // Check hire date - employee must be hired by this month or earlier
  if (employee.hireDate) {
    const hireParts = extractDateParts(employee.hireDate);
    if (hireParts) {
      const hireYM = toYearMonth(hireParts.year, hireParts.month);
      // Target month is before hire month - not yet hired
      if (targetYM < hireYM) {
        return false;
      }
    }
  }
  
  // Check termination date - employee works through their termination month
  if (employee.terminationDate) {
    const termParts = extractDateParts(employee.terminationDate);
    if (termParts) {
      const termYM = toYearMonth(termParts.year, termParts.month);
      
      // DEBUG: Log the comparison (remove after debugging)
      console.log(`[DEBUG] ${employee.name}: targetYM=${targetYM}, termYM=${termYM}, termDate=${employee.terminationDate}, termParts=`, termParts);
      
      // Target month is AFTER termination month - already gone
      if (targetYM > termYM) {
        console.log(`[DEBUG] ${employee.name}: EXCLUDED from ${targetYM} (after termYM ${termYM})`);
        return false;
      }
    }
  }
  
  return true;
}

/**
 * Calculate prorated hours for a partial month (when hired mid-month or terminated mid-month)
 * 
 * Rules:
 * - If hired mid-month, prorate from hire day to end of month
 * - If terminated mid-month, prorate from start of month to termination day (inclusive)
 * - If both apply in same month, prorate from hire day to termination day
 */
export function calculateProratedMonthlyHours(
  employee: Employee,
  year: number,
  month: number // 0-11 (JavaScript month index)
): number {
  const fullMonthHours = calculateMonthlyAvailableHours(
    employee.fte,
    employee.annualPtoHours,
    year,
    month
  );
  
  const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
  const targetYM = toYearMonth(year, month + 1); // Convert JS month to calendar month
  
  let startDay = 1;
  let endDay = lastDayOfMonth;
  
  // Check hire date proration
  if (employee.hireDate) {
    const hireParts = extractDateParts(employee.hireDate);
    if (hireParts) {
      const hireYM = toYearMonth(hireParts.year, hireParts.month);
      
      // Not yet hired in this month - no hours
      if (targetYM < hireYM) {
        return 0;
      }
      
      // Hired this exact month - start from hire day
      if (targetYM === hireYM) {
        startDay = hireParts.day;
      }
      // If hired before this month, startDay stays at 1 (full month start)
    }
  }
  
  // Check termination date proration
  if (employee.terminationDate) {
    const termParts = extractDateParts(employee.terminationDate);
    if (termParts) {
      const termYM = toYearMonth(termParts.year, termParts.month);
      
      // DEBUG: Log proration check
      if (targetYM >= 202607 && targetYM <= 202609) {
        console.log(`[PRORATE] ${employee.name} for ${targetYM}: termYM=${termYM}, check=${targetYM > termYM ? 'EXCLUDE' : 'INCLUDE'}`);
      }
      
      // Already terminated before this month - no hours
      if (targetYM > termYM) {
        return 0;
      }
      
      // Terminated this exact month - end on termination day (inclusive)
      if (targetYM === termYM) {
        endDay = termParts.day;
        console.log(`[PRORATE] ${employee.name}: termination month! endDay=${endDay}`);
      }
      // If terminated after this month, endDay stays at lastDayOfMonth (full month end)
    }
  }
  
  // Calculate prorated fraction
  const daysWorking = Math.max(0, endDay - startDay + 1);
  const fractionOfMonth = daysWorking / lastDayOfMonth;
  const result = fullMonthHours * fractionOfMonth;
  
  // DEBUG: Log result for July-Sep 2026
  if (targetYM >= 202607 && targetYM <= 202609) {
    console.log(`[PRORATE RESULT] ${employee.name} for ${targetYM}: startDay=${startDay}, endDay=${endDay}, days=${daysWorking}, fraction=${fractionOfMonth.toFixed(2)}, hours=${result.toFixed(1)}`);
  }
  
  return result;
}

/**
 * Generate monthly projections for a given period
 */
export function generateMonthlyProjections(
  employees: Employee[],
  departments: Department[],
  allocations: DepartmentAllocation[],
  monthsAhead: number = 12
): MonthlyProjection[] {
  const projections: MonthlyProjection[] = [];
  const now = new Date();
  const startYear = now.getFullYear();
  const startMonth = now.getMonth();

  for (let i = 0; i < monthsAhead; i++) {
    const targetDate = new Date(startYear, startMonth + i, 1);
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();
    const monthStr = targetDate.toISOString().slice(0, 10);

    const departmentData: MonthlyProjection['departments'] = [];
    let totalHours = 0;
    let totalCost = 0;
    let totalEmployees = 0;

    departments.forEach(dept => {
      const deptAllocations = allocations.filter(a => a.departmentId === dept.id);
      const employeeIds = new Set(deptAllocations.map(a => a.employeeId));
      
      // Filter employees by allocation AND check if they're active in this specific month
      const deptEmployees = employees.filter(e => 
        employeeIds.has(e.id) && isEmployeeActiveInMonth(e, year, month)
      );

      let deptHours = 0;
      let deptCost = 0;

      deptEmployees.forEach(employee => {
        const allocation = deptAllocations.find(a => a.employeeId === employee.id);
        if (!allocation) return;

        const allocationFactor = allocation.allocationPercent / 100;
        
        // Use prorated hours for new hires
        const monthlyHours = calculateProratedMonthlyHours(employee, year, month);
        const loadedRate = calculateLoadedCostPerHour(
          employee.hourlyRate,
          employee.burdenMultiplier
        );

        deptHours += monthlyHours * allocationFactor;
        deptCost += monthlyHours * allocationFactor * loadedRate;
      });

      departmentData.push({
        departmentId: dept.id,
        departmentName: dept.name,
        hours: Math.round(deptHours),
        cost: Math.round(deptCost),
        employeeCount: deptEmployees.length,
      });

      totalHours += deptHours;
      totalCost += deptCost;
      totalEmployees += deptEmployees.length;
    });

    projections.push({
      month: monthStr,
      departments: departmentData,
      totalHours: Math.round(totalHours),
      totalCost: Math.round(totalCost),
      totalEmployees,
    });
  }

  return projections;
}

/**
 * Validate that employee allocations total 100%
 */
export function validateAllocations(allocations: AllocationFormData[]): {
  isValid: boolean;
  total: number;
  message: string;
} {
  const total = allocations.reduce((sum, a) => sum + a.allocationPercent, 0);
  
  if (total === 0) {
    return {
      isValid: true,
      total,
      message: 'No allocations set',
    };
  }
  
  if (Math.abs(total - 100) < 0.01) {
    return {
      isValid: true,
      total: 100,
      message: 'Allocations total 100%',
    };
  }

  return {
    isValid: false,
    total,
    message: `Allocations total ${total.toFixed(1)}% (must be 100%)`,
  };
}

interface AllocationFormData {
  departmentId: string;
  allocationPercent: number;
}

