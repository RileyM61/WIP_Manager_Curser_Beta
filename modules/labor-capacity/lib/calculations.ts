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
 * Check if an employee is currently active (hired and not in the future)
 */
export function isEmployeeCurrentlyActive(employee: Employee): boolean {
  if (!employee.isActive) return false;
  
  // If no hire date, assume they're active
  if (!employee.hireDate) return true;
  
  // Check if hire date is in the past or today
  const hireDate = new Date(employee.hireDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return hireDate <= today;
}

/**
 * Check if an employee is active during a specific month
 * Accounts for hire date (employee must be hired by the month)
 */
export function isEmployeeActiveInMonth(
  employee: Employee,
  year: number,
  month: number
): boolean {
  if (!employee.isActive) return false;
  
  // If no hire date, assume they're active
  if (!employee.hireDate) return true;
  
  // Parse the hire date and get the first of that month
  const hireDate = new Date(employee.hireDate);
  const hireYear = hireDate.getFullYear();
  const hireMonth = hireDate.getMonth();
  
  // Employee is active if the target month is >= hire month
  if (year > hireYear) return true;
  if (year === hireYear && month >= hireMonth) return true;
  
  return false;
}

/**
 * Calculate prorated hours for a partial month (when hired mid-month)
 */
export function calculateProratedMonthlyHours(
  employee: Employee,
  year: number,
  month: number
): number {
  const fullMonthHours = calculateMonthlyAvailableHours(
    employee.fte,
    employee.annualPtoHours,
    year,
    month
  );
  
  if (!employee.hireDate) return fullMonthHours;
  
  const hireDate = new Date(employee.hireDate);
  const hireYear = hireDate.getFullYear();
  const hireMonth = hireDate.getMonth();
  
  // If hired before this month, full hours
  if (year > hireYear || (year === hireYear && month > hireMonth)) {
    return fullMonthHours;
  }
  
  // If hired in this month, prorate based on days remaining
  if (year === hireYear && month === hireMonth) {
    const hireDay = hireDate.getDate();
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
    const daysWorking = lastDayOfMonth - hireDay + 1;
    const workingDays = getWorkingDaysInMonth(year, month);
    
    // Calculate what fraction of working days they're available
    // Simple approximation: (days remaining / total days) * working days
    const fractionOfMonth = daysWorking / lastDayOfMonth;
    return fullMonthHours * fractionOfMonth;
  }
  
  // Hired after this month, no hours
  return 0;
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

